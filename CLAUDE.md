# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Setup done (PRD §10 step 1): scaffold only, no app code yet. `.llm/prd.md` is the full product spec (in pt-BR) for a Data Engineering quiz web app. **Read it before starting any work**; it is the source of truth for requirements (RF01–RF22, RNF01–RNF07), the data model, the API contract, and the delivery order (section 10). Replace the "Planned" architecture section below with the real one as the app gets built.

Stack: Next.js 16 (App Router, `src/` dir, `@/*` → `src/*`) + React 19 + TypeScript strict (with `noUncheckedIndexedAccess`) + Tailwind v4, Zod 4, Vitest 5, Playwright, ESLint 9 flat config. **Next 16 differs from older versions; read `AGENTS.md` and the docs in `node_modules/next/dist/docs/` before writing Next-specific code.** `next.config.ts` enables `cacheComponents`. `AGENTS.md` is (re)written by `next dev`; keep it committed.

## Commands

- `npm run dev`: dev server at http://localhost:3000
- `npm run build` / `npm start`: production build / serve
- `npm run lint`: ESLint
- `npm run typecheck`: `next typegen && tsc --noEmit` (typegen is required: globals like `LayoutProps`/`PageProps` come from `.next/types`)
- `npm test`: Vitest, runs `tests/unit/**/*.test.{ts,tsx}` and `tests/seed/**/*.test.ts` (node env; component tests would need jsdom)
  - single file: `npx vitest run tests/unit/draw.test.ts`; by name: `npx vitest run -t "nome do teste"`
- `npm run db:seed`: regenerates `supabase/seed.sql` from `supabase/questions/*.json` (run after editing questions; the seed test fails if they are out of sync)
- `npm run test:e2e`: Playwright (`tests/e2e`, Chromium only, starts `npm run dev` on port 3100 itself or reuses a running one there)
  - single spec: `npx playwright test tests/e2e/quiz.spec.ts`; first time on a machine: `npx playwright install chromium`

Environment (`.env.example`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. The service role key is server-only and must never get a `NEXT_PUBLIC_` prefix.

The user applies `supabase/migrations/*.sql` and `supabase/seed.sql` to their own Supabase project (CLI or SQL Editor); there is no local DB setup in scope.

## Planned architecture (from PRD §7)

- **Everything goes through the server.** The browser never talks to Supabase. Route Handlers under `src/app/api/` (or Server Actions) use the service-role client from `src/lib/supabase/server.ts` (`import 'server-only'`). RLS is enabled on all tables with **no** policies for anon/authenticated.
- **Cache Components is on** (`cacheComponents` + `partialPrefetching` in `next.config.ts`; Next 16 default, mandatory in the next major). All quiz data is per-request and must stay fresh: **never use `'use cache'`** for sessions, answers or ranking. Server Components that read Supabase must sit inside a `<Suspense>` boundary (otherwise `next build` fails with "uncached data accessed outside of <Suspense>"). GET Route Handlers that query the DB already run at request time; don't wrap their queries in cached helpers.
- **Answer-key integrity (RNF03):** `correct_index` and `explanation` must never appear in an API response for a question the session hasn't answered yet. Scoring is computed only on the server from `session_answers`. This is an acceptance criterion; check it in every API change.
- **Index semantics:** `selected_index` / `correct_index` always refer to the original order in `questions.options`. Shuffling is presentation-only: the client receives `{ index, text }` pairs in shuffled order and sends back the original `index`.
- **Pure logic is isolated** in `src/lib/quiz/` with no Next.js/Supabase imports (done, unit tested in `tests/unit/`):
  - `domain.ts`: `THEMES`, `LEVELS`, `ROUND_SIZE`, `ALL_THEMES` ("todos" in URLs/API = `theme null`). Single source of truth, also imported by `scripts/build-seed.ts` with an explicit `.ts` extension (hence `allowImportingTsExtensions`), so keep it free of path aliases and non-erasable TS syntax.
  - `draw.ts`: `drawQuestions(pool, theme, { random })` returns question ids; "Todos os temas" allocates round-robin so 4 themes × 10 slots → 2–3 each, with shortfall redistributed.
  - `shuffle.ts`: **option order is derived, not stored**: `shuffleOptions(options, seededRandom(`${sessionId}:${questionId}`))` gives a per-round order that survives reloads (RF13). Use exactly this seed everywhere options are presented.
  - `score.ts`: `computeScore`, `performanceBand` (≥80 / 50–79 / <50), `scoreByTheme`. `ranking.ts`: `isRankable` (RF21), `compareRanking` (RF20, exact fraction, id as final tiebreak), `buildRanking` → `{ top, me? }`.
  - All randomness is injectable (`random` param) for deterministic tests.
- Zod schemas (pt-BR messages) live in `src/lib/validation.ts`: `playerNameSchema` trims and counts code points like Postgres `char_length`; `createSessionSchema`, `answerSchema`, `rankingQuerySchema` (theme absent/"todos" → `null`). Display labels live in `src/lib/labels.ts`.
- **API (done):** Route Handlers in `src/app/api/` are thin (validate → call service → `json()`); all DB access lives in `src/lib/server/quiz.ts` (`server-only`). Helpers in `src/lib/api/http.ts`: `ApiError`, `toErrorResponse` (ZodError → 400 with the first pt-BR message, unknown → logged 500), `json()` (always `Cache-Control: no-store`), `parseSessionId` (malformed id → 404), `clientIp`. DB row types are hand-written in `src/lib/supabase/types.ts`; update them with every migration.
- **Session flow:** `POST /api/sessions` (201 `{ sessionId }`; draws, or with `retryOf` reuses the wrong answers of a finished session as `is_retry`) → `GET /api/sessions/:id` (`{ session, questions, answers }` built by `src/lib/quiz/session-state.ts`: questions never carry the key, `answers` reveals `correctIndex`/`explanation` only for answered ones, `session.result` only when finished) → `POST .../answers` (201 `{ isCorrect, correctIndex, explanation }`; 409 duplicate via PK `23505`, 409 finished, 400 foreign question) → `POST .../finish` (idempotent, guarded by `.is("finished_at", null)`; returns `{ score, total, percent, band, rank? }`).
- **Ranking in SQL:** `GET /api/ranking?theme=&level=&sessionId=` orders in the DB (score desc, duration asc, finished_at asc, id asc; equivalent to `compareRanking` because only `total = 10` rows qualify) and computes a position with 4 `count` queries, so it never loads a whole bucket (PostgREST caps rows at 1000). Entries expose `isMe`, never other sessions' ids (a session id is the only credential to answer it).
- **Any `try/catch` that can see Next internals** (Route Handlers, pages) must let them through: `toErrorResponse` starts with `unstable_rethrow(error)`. Without it, reading `request.url` during the build gets logged as an "erro inesperado" and `notFound()`/`redirect()` would be swallowed.
- **Screens (done):** `/` is static (`StartForm` client: name prefilled from `localStorage` via `useSyncExternalStore`, not an effect). `/quiz/[sessionId]`, `/resultado/[sessionId]` and `/ranking` read data in an async child inside `<Suspense>` (Cache Components) via `src/lib/server/pages.ts` (`loadSessionStateOrNotFound`) or `getRanking`; they redirect to each other based on `session.finished`. `QuizRunner` (client) holds round state, calls `/api/...` through `src/lib/client/api.ts`, renders options as real radios in a `<form>` (Enter on a radio submits = confirm), handles `1–4`/`A–D`/`Enter` globally except on buttons/links/inputs, and moves focus to "Próxima" after confirming and to the statement on the next question. Ranking filters are a plain GET form. Statements/explanations go through `src/lib/rich-text.ts` (tokens, never HTML) and `components/RichText.tsx`.
- **Design tokens** live in `src/app/globals.css` (`--accent`, `--success`, `--danger`, … with dark overrides) and are used as Tailwind colors (`bg-card`, `text-muted`, `border-success-border`). Feedback always pairs color with ✓/✗ and text. `border-border` is decorative only (cards); anything interactive (inputs, selects, option/radio cards) uses `border-control-border`, which keeps ≥ 3:1 non-text contrast (WCAG 1.4.11). axe does not check non-text contrast, so recheck ratios by hand when changing tokens.
- **Accessibility baseline (audited in step 6):** zero axe violations (WCAG 2.2 AA + best practices) on every screen/state at 360px and 1280px, light and dark; no horizontal scroll at 360px; all targets ≥ 44px; visible focus on every Tab stop; heading levels never skip (quiz: `h1` "Pergunta X de Y" → `h2` feedback). `notFound()` inside `<Suspense>` streams the 404 UI with HTTP 200 + `noindex` (expected with streaming); tests must wait for the text, not the status.
- **Rate limit (RNF07):** `src/lib/rate-limit.ts`, in memory per server instance, 30 session creations per IP per hour, applied after validation. Known limitation documented in the README.
- **Ranking rules:** only finished, full (10-question), non-retry sessions count (`is_retry = false`). Sort by percent desc → `duration_ms` asc → finish date asc. `theme = null` means "Todos os temas", which is its own ranking bucket.
- **Draw rules:** 10 questions per round with no repeats. "Todos os temas" draws 2–3 per theme. If fewer than 10 active questions exist for a combination, use all of them and the total reflects that.
- API errors use the shape `{ error: { code, message } }` with pt-BR messages.

## Content rules (seed questions)

**Source of truth: `supabase/questions/<theme>.json`** (keyed by level; each item has a stable slug `id`, `statement`, `answer`, 3 `distractors`, `explanation`). `scripts/build-seed.ts` (`npm run db:seed`) turns them into `supabase/seed.sql`: a UUID v5 derived from the slug (re-applying the seed upserts instead of duplicating, so never rename a slug) and the correct answer at a rotating position. Never edit `seed.sql` by hand.

The bank must hold 80 questions: 4 themes (`fundamentos_sql`, `pipelines`, `armazenamento`, `big_data_cloud`) × 2 levels (`iniciante`, `intermediario`) × 10. Each question has exactly 4 unique options with one correct answer; no "todas/nenhuma das anteriores", order-dependent options or letter references (options get shuffled); options of similar length (correct vs. distractors within 1.3×); a 2–5 sentence explanation; vendor-agnostic concepts; SQL snippets of at most 8 lines. `tests/seed/seed.test.ts` enforces all of this. See PRD §4.5 for the expected tone.

## Conventions

- All UI text and content is in Brazilian Portuguese, addressing the user as "você". Market-standard English terms (*pipeline*, *data lake*) are kept as-is.
- Accessibility is a requirement, not a nice-to-have: full keyboard support (`1`–`4`/`A`–`D` select, `Enter` confirms/advances), `aria-live="polite"` on feedback, never color alone (pair it with ✓/✗ and text), touch targets ≥ 44px, light/dark via `prefers-color-scheme`.
- Out of scope for v1: auth, admin panel, timers, other languages.
