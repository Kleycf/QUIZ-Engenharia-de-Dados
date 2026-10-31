-- Esquema inicial do quiz (PRD §7.3).
-- Acesso só pelo servidor com a service_role: RLS habilitado e nenhuma policy para anon/authenticated.

create type quiz_theme as enum ('fundamentos_sql', 'pipelines', 'armazenamento', 'big_data_cloud');
create type quiz_level as enum ('iniciante', 'intermediario');

create table questions (
  id            uuid primary key default gen_random_uuid(),
  theme         quiz_theme  not null,
  level         quiz_level  not null,
  statement     text        not null check (char_length(btrim(statement)) > 0),   -- aceita Markdown simples / bloco de código
  options       text[]      not null check (array_ndims(options) = 1
                                            and array_length(options, 1) = 4
                                            and array_position(options, null) is null),
  correct_index smallint    not null check (correct_index between 0 and 3),
  explanation   text        not null check (char_length(btrim(explanation)) > 0),
  active        boolean     not null default true,
  created_at    timestamptz not null default now()
);
create index questions_theme_level_active_idx on questions (theme, level) where active;

create table quiz_sessions (
  id            uuid primary key default gen_random_uuid(),
  player_name   text        not null check (char_length(player_name) between 2 and 30),
  theme         quiz_theme,                         -- null = "Todos os temas"
  level         quiz_level  not null,
  question_ids  uuid[]      not null,               -- ordem sorteada da rodada
  is_retry      boolean     not null default false, -- "refazer erradas": fora do ranking
  score         smallint,                           -- preenchido ao concluir
  total         smallint    not null check (total between 1 and 10),
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  duration_ms   integer     check (duration_ms >= 0),
  constraint quiz_sessions_total_matches_questions check (cardinality(question_ids) = total),
  constraint quiz_sessions_score_range check (score between 0 and total),
  constraint quiz_sessions_finished_consistent check (
    (finished_at is null and score is null and duration_ms is null)
    or (finished_at is not null and score is not null and duration_ms is not null)
  )
);
create index quiz_sessions_ranking_idx on quiz_sessions (theme, level, finished_at)
  where finished_at is not null and not is_retry;

create table session_answers (
  session_id     uuid        not null references quiz_sessions(id) on delete cascade,
  question_id    uuid        not null references questions(id),
  selected_index smallint    not null check (selected_index between 0 and 3),
  is_correct     boolean     not null,
  answered_at    timestamptz not null default now(),
  primary key (session_id, question_id)             -- impede responder duas vezes
);

alter table questions       enable row level security;
alter table quiz_sessions   enable row level security;
alter table session_answers enable row level security;

-- Sem policies para anon/authenticated. Revogar os grants padrão do Supabase é defesa em profundidade:
-- mesmo que alguém crie uma policy por engano, essas roles continuam sem acesso às tabelas.
revoke all on questions, quiz_sessions, session_answers from anon, authenticated;
