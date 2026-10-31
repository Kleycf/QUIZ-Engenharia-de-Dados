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
- **Session flow:** `POST /api/sessions` draws questions and stores their order in `quiz_sessions.question_ids` → `GET /api/sessions/:id` returns state for resume-after-reload (RF13) → `POST .../answers` (409 on a duplicate answer, enforced by the `(session_id, question_id)` PK) → `POST .../finish` (idempotent; sets score, `finished_at`, `duration_ms`).
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
