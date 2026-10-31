# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Data Engineering quiz web app in pt-BR (beginner → intermediate): 10 questions per round, immediate feedback with explanation, score saved to Supabase, Top 10 ranking per theme and level. **`.llm/prd.md` is the spec and source of truth** (RF01–RF22, RNF01–RNF07, data model, API contract, acceptance criteria in §11). All 7 delivery steps of PRD §10 are done; read the PRD before changing behavior.

Stack: Next.js 16 (App Router, `src/` dir, `@/*` → `src/*`) + React 19 + TypeScript strict (with `noUncheckedIndexedAccess`) + Tailwind v4, Supabase (Postgres, via `@supabase/supabase-js` on the server only), Zod 4, Vitest 5, Playwright + axe, ESLint 9 flat config. **Next 16 differs from older versions: read `AGENTS.md` and `node_modules/next/dist/docs/` before writing Next-specific code** (see "Next 16 pitfalls" below). `AGENTS.md` is (re)written by `next dev`; keep it committed.

## Commands

- `npm run dev`: dev server at http://localhost:3000
- `npm run build` / `npm start`: production build / serve
- `npm run lint`: ESLint
- `npm run typecheck`: `next typegen && tsc --noEmit` (typegen is required: globals like `LayoutProps`/`PageProps`/`RouteContext` come from `.next/types`). `next build` also typechecks test files.
- `npm test`: Vitest, runs `tests/unit/**/*.test.{ts,tsx}` and `tests/seed/**/*.test.ts` (node env; component tests would need jsdom)
  - single file: `npx vitest run tests/unit/draw.test.ts`; by name: `npx vitest run -t "nome do teste"`
- `npm run test:e2e`: Playwright against a **production build** on port 3100 (`build` + `start`, or reuses a server already there). Needs `.env.local`: the tests read the answer key and delete their own rounds through the Supabase REST API (test process only); without it the suite is skipped.
  - single spec/test: `npx playwright test tests/e2e/quiz.spec.ts` / `npx playwright test -g "refazer"`; first time on a machine: `npx playwright install chromium`
  - On Windows, Playwright/`npx` may leave the `next start` child alive on 3100; if the webServer "was not able to start", check that port.
- `npm run db:seed`: regenerates `supabase/seed.sql` from `supabase/questions/*.json` (run after editing questions; the seed test fails if they are out of sync)

Environment (`.env.example` → `.env.local`): `SUPABASE_URL` (base URL, no `/rest/v1`), `SUPABASE_SERVICE_ROLE_KEY` (server-only, never `NEXT_PUBLIC_`). The user applies `supabase/migrations/*.sql` then `supabase/seed.sql` to their own Supabase project (SQL Editor or CLI); there is no local DB. Migration `0001` is recorded in `supabase_migrations.schema_migrations`, so a future `supabase db push` won't reapply it.

## Architecture

### Data and security
- **Everything goes through the server.** The browser never talks to Supabase: it calls our `/api/...` Route Handlers (`src/lib/client/api.ts`), and Server Components read through `src/lib/server/*` with the service-role client from `src/lib/supabase/server.ts` (`import "server-only"`). RLS is on for all tables with **no** policies, and grants are revoked from `anon`/`authenticated`.
- **Answer-key integrity (RNF03, acceptance criterion):** `correct_index`/`explanation` never reach the client for an unanswered question. Everything sent about a round goes through `src/lib/quiz/session-state.ts` (`buildSessionState`): questions never carry the key; `answers` reveals `correctIndex`/`explanation` only for answered ones; `session.result` only when finished. Scoring is computed only on the server from `session_answers`. Check this in every API or page change.
- **Index semantics:** `selected_index`/`correct_index` always refer to the original order in `questions.options`. **Option order is derived, not stored:** `shuffleOptions(options, seededRandom(\`${sessionId}:${questionId}\`))` (via `optionOrderSeed`), so it is stable across reloads (RF13) and different per round (RF08). The client gets `{ index, text }` in shuffled order and sends back the original `index`.
- DB row types are hand-written in `src/lib/supabase/types.ts`; update them with every migration.

### Pure logic (`src/lib/quiz/`, no Next/Supabase imports, unit tested)
- `domain.ts`: `THEMES`, `LEVELS`, `ROUND_SIZE`, `OPTION_COUNT`, `ALL_THEMES` ("todos" in URLs/API = `theme null` = "Todos os temas", its own ranking bucket). Also imported by `scripts/build-seed.ts` with an explicit `.ts` extension (hence `allowImportingTsExtensions`): keep it free of path aliases and non-erasable TS syntax.
- `draw.ts`: no repeats; "Todos os temas" allocates round-robin (2–3 per theme), redistributing a short theme's slots; fewer than 10 available → use all (RF05/RF06).
- `score.ts`: `computeScore`, `performanceBand` (≥80 / 50–79 / <50), `scoreByTheme`. `ranking.ts`: `isRankable` (finished, `total = 10`, not retry; RF21), `compareRanking` (percent desc → duration asc → finished_at asc → id; RF20), `buildRanking`.
- All randomness is injectable (`random` param) for deterministic tests.
- `src/lib/validation.ts`: zod schemas with pt-BR messages, one issue at a time (`abort`). `playerNameSchema` trims and counts code points like Postgres `char_length`. `src/lib/labels.ts`: pt-BR display labels and band messages. `src/lib/rate-limit.ts`: in-memory sliding window.

### API (`src/app/api/`)
- Handlers are thin (validate → call `src/lib/server/quiz.ts` → `json()`). `src/lib/api/http.ts`: `ApiError`, `toErrorResponse` (first line `unstable_rethrow`; ZodError → 400 with the first pt-BR message; unknown → logged 500), `json()` (always `Cache-Control: no-store`), `parseSessionId` (malformed id → 404), `clientIp`. Errors: `{ error: { code, message } }`.
- `POST /api/sessions` → 201 `{ sessionId }` (draws; with `retryOf`, the wrong answers of a finished session as `is_retry`; rate limit 30/IP/hour after validation, in memory per instance, see README) → `GET /api/sessions/:id` → `POST .../answers` → 201 `{ isCorrect, correctIndex, explanation }` (409 duplicate via PK `23505`, 409 finished, 400 foreign question) → `POST .../finish` (idempotent via `.is("finished_at", null)`; `{ score, total, percent, band, rank? }`).
- `GET /api/ranking?theme=&level=&sessionId=` orders **in SQL** (same order as `compareRanking`, valid because only `total = 10` qualifies) and computes a position with 4 `count` queries, never loading a whole bucket (PostgREST caps at 1000 rows). Entries expose `isMe`, never other sessions' ids (a session id is the only credential to answer a round).

### Screens
- `/` is static; `StartForm` (client) prefills the last name from `localStorage` via `useSyncExternalStore`.
- `/quiz/[sessionId]`, `/resultado/[sessionId]`, `/ranking` read data in an async child inside `<Suspense>` via `src/lib/server/pages.ts` (`loadSessionStateOrNotFound`) or `getRanking`, and redirect to each other based on `session.finished`.
- `QuizRunner` (client) holds round state; options are real radios in a `<form>` (Enter on a radio submits = confirm); `1–4`/`A–D`/`Enter` are handled globally except on buttons/links/inputs; focus moves to "Próxima" after confirming and to the statement on the next question; feedback is `aria-live="polite"`.
- Ranking filters are a plain GET form (works without JS); table on desktop, list on mobile.
- Statements/explanations/options go through `src/lib/rich-text.ts` (tokens, never HTML) and `components/RichText.tsx`.

### Design and accessibility
- Tokens live in `src/app/globals.css` (light + `prefers-color-scheme: dark`) and are used as Tailwind colors (`bg-card`, `text-muted`, `border-success-border`…). `border-border` is decorative only; anything interactive uses `border-control-border` (≥ 3:1 non-text contrast, WCAG 1.4.11). axe does not check non-text contrast: recheck ratios by hand when changing tokens.
- Baseline (step 6 audit, and asserted by the E2E with axe): zero axe violations (WCAG 2.2 AA + best practices) on every screen/state at 360px and 1280px, light and dark; no horizontal scroll at 360px; targets ≥ 44px; visible focus on every Tab stop; no skipped heading levels (quiz: `h1` "Pergunta X de Y" → `h2` feedback); color never alone (✓/✗ + text).

## Next 16 pitfalls (all hit during the build)
- **Cache Components is on** (`cacheComponents` + `partialPrefetching`). Data is per-request: **never `'use cache'`** for sessions, answers or ranking. Anything reading Supabase, `params` or `searchParams` must sit in an async child inside `<Suspense>`, or `next build` fails ("blocking-route").
- **`try/catch` must let Next internals through:** call `unstable_rethrow(error)` first, or build-time bail-outs get logged as errors and `notFound()`/`redirect()` get swallowed.
- **Client navigation preserves previous pages hidden but mounted (React `<Activity>`), state included.** A manual `submitting`/`busy` flag set before `router.push` stays `true` when the user comes back. Wrap "call API then navigate" in `useTransition` (`isPending` resets itself). In tests, hidden copies of the previous page are still in the DOM: filter with `{ visible: true }`.
- `notFound()` inside `<Suspense>` streams the 404 UI with HTTP 200 + `noindex`: tests must wait for the text, not the status.
- No `setState` inside effects (React Compiler lint rule `react-hooks/set-state-in-effect`); read external state with `useSyncExternalStore`.

## Tests
- `tests/unit/`: pure logic, validation, session-state (RNF03), rate limit, rich-text (run against all 80 real questions).
- `tests/seed/seed.test.ts`: content rules below, plus `seed.sql` in sync with the JSON.
- `tests/e2e/quiz.spec.ts` (+ `support.ts`): full PRD flow with a **deterministic wrong answer** (the test reads `correct_index` from the DB and picks another option), keyboard, RNF03 checks, result/review/filter, ranking "você", retry-wrong round, resume after reload, home validation and prefill, stuck-form regression, 404. Each test uses a unique player name and deletes its rounds; each run uses a random `x-forwarded-for` so the rate limit doesn't accumulate.

## Content rules (seed questions)

**Source of truth: `supabase/questions/<theme>.json`** (keyed by level; each item has a stable slug `id`, `statement`, `answer`, 3 `distractors`, `explanation`). `npm run db:seed` turns them into `supabase/seed.sql`: UUID v5 from the slug (re-applying the seed upserts instead of duplicating, so never rename a slug) and the correct answer at a rotating position. Never edit `seed.sql` by hand.

80 questions: 4 themes (`fundamentos_sql`, `pipelines`, `armazenamento`, `big_data_cloud`) × 2 levels (`iniciante`, `intermediario`) × 10. Exactly 4 unique options with one correct answer; no "todas/nenhuma das anteriores", order-dependent options or letter references (options get shuffled); options of similar length (correct vs. distractors within 1.3×); a 2–5 sentence explanation; vendor-agnostic concepts; SQL snippets of at most 8 lines; markdown limited to ```` ```sql ````, `` `code` ``, `**bold**`, `*italic*`. See PRD §4.5 for tone.

## Conventions

- All UI text and content is in Brazilian Portuguese, addressing the user as "você". Market-standard English terms (*pipeline*, *data lake*) are kept as-is.
- Accessibility is a requirement, not a nice-to-have (see baseline above).
- Out of scope for v1: auth, admin panel, timers, other languages.
