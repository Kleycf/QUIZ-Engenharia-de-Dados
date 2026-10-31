import { z } from "zod";
import { ALL_THEMES, LEVELS, OPTION_COUNT, THEMES } from "@/lib/quiz/domain";

export const PLAYER_NAME_MIN = 2;
export const PLAYER_NAME_MAX = 30;

const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/;
const HTML_CHARS = /[<>]/;

/** Conta caracteres como o Postgres (`char_length`), e não unidades UTF-16: um emoji conta 1. */
const charLength = (value: string) => Array.from(value).length;

/** RF01: 2 a 30 caracteres depois de `trim`, sem caracteres de controle nem HTML. Devolve o nome já aparado. */
export const playerNameSchema = z
  .string({ error: "Informe seu nome." })
  .trim()
  .refine((s) => !CONTROL_CHARS.test(s), { error: "O nome não pode ter caracteres de controle.", abort: true })
  .refine((s) => !HTML_CHARS.test(s), { error: "O nome não pode conter os caracteres < ou >.", abort: true })
  .refine((s) => charLength(s) >= PLAYER_NAME_MIN, {
    error: `O nome precisa ter pelo menos ${PLAYER_NAME_MIN} caracteres.`,
    abort: true,
  })
  .refine((s) => charLength(s) <= PLAYER_NAME_MAX, {
    error: `O nome pode ter no máximo ${PLAYER_NAME_MAX} caracteres.`,
  });

export const themeSchema = z.enum(THEMES, { error: "Tema inválido." });
export const levelSchema = z.enum(LEVELS, { error: "Nível inválido." });
export const sessionIdSchema = z.uuid({ error: "Rodada não encontrada." });

/** POST /api/sessions. `theme: null` = "Todos os temas"; `retryOf` cria a rodada "refazer só as erradas". */
export const createSessionSchema = z.object({
  playerName: playerNameSchema,
  theme: themeSchema.nullable(),
  level: levelSchema,
  retryOf: sessionIdSchema.optional(),
});

/** POST /api/sessions/:id/answers. `selectedIndex` é a posição original em `questions.options`. */
export const answerSchema = z.object({
  questionId: z.uuid({ error: "Pergunta inválida." }),
  selectedIndex: z
    .number({ error: "Escolha uma alternativa." })
    .int({ error: "Alternativa inválida." })
    .min(0, { error: "Alternativa inválida." })
    .max(OPTION_COUNT - 1, { error: "Alternativa inválida." }),
});

/** GET /api/ranking?theme=&level=&sessionId=. `theme` ausente ou "todos" vira `null` ("Todos os temas"). */
export const rankingQuerySchema = z.object({
  theme: z
    .union([themeSchema, z.literal(ALL_THEMES)], { error: "Tema inválido." })
    .default(ALL_THEMES)
    .transform((theme) => (theme === ALL_THEMES ? null : theme)),
  level: levelSchema,
  sessionId: sessionIdSchema.optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type AnswerInput = z.infer<typeof answerSchema>;
export type RankingQuery = z.infer<typeof rankingQuerySchema>;
