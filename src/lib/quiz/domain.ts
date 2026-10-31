// Valores do domínio, espelhando os enums do banco (supabase/migrations/0001_init.sql).
// Sem dependências de Next/Supabase: também é importado por scripts/build-seed.ts, que roda direto no Node.

export const THEMES = ["fundamentos_sql", "pipelines", "armazenamento", "big_data_cloud"] as const;
export const LEVELS = ["iniciante", "intermediario"] as const;

export type Theme = (typeof THEMES)[number];
export type Level = (typeof LEVELS)[number];

/** Perguntas por rodada (RF05). */
export const ROUND_SIZE = 10;

/** Alternativas por pergunta. */
export const OPTION_COUNT = 4;

/** Valor de `theme` na URL/API que representa "Todos os temas" (`theme = null` no banco). */
export const ALL_THEMES = "todos";
