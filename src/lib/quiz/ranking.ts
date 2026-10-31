import { ROUND_SIZE } from "./domain";
import { percentOf } from "./score";

/** Top N do ranking (RF19). */
export const RANKING_SIZE = 10;

/** Campos de `quiz_sessions` que importam para o ranking. */
export interface RankingSession {
  id: string;
  playerName: string;
  score: number | null;
  total: number;
  durationMs: number | null;
  /** ISO 8601, como vem do Supabase. */
  finishedAt: string | null;
  isRetry: boolean;
}

type FinishedSession = RankingSession & { score: number; durationMs: number; finishedAt: string };

export interface RankingEntry {
  position: number;
  sessionId: string;
  playerName: string;
  score: number;
  total: number;
  percent: number;
  durationMs: number;
  finishedAt: string;
}

/** RF21: só rodadas concluídas, completas (10 perguntas) e que não sejam "refazer erradas". */
export function isRankable(session: RankingSession): session is FinishedSession {
  return (
    session.finishedAt !== null &&
    session.score !== null &&
    session.durationMs !== null &&
    !session.isRetry &&
    session.total === ROUND_SIZE
  );
}

/**
 * RF20: maior percentual → menor duração → data mais antiga.
 * O percentual é comparado pela fração exata (sem arredondar), e o id desempata o resto para a ordem ser estável.
 */
export function compareRanking(a: FinishedSession, b: FinishedSession): number {
  return (
    b.score * a.total - a.score * b.total ||
    a.durationMs - b.durationMs ||
    Date.parse(a.finishedAt) - Date.parse(b.finishedAt) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

export interface RankingResult {
  top: RankingEntry[];
  /** Posição da sessão pedida, esteja ela no Top N ou não (RF22). Ausente se a sessão não entra no ranking. */
  me?: RankingEntry;
}

/** Ordena as sessões de um mesmo tema e nível e monta o Top N, mais a posição de `sessionId`. */
export function buildRanking(
  sessions: readonly RankingSession[],
  { limit = RANKING_SIZE, sessionId }: { limit?: number; sessionId?: string } = {},
): RankingResult {
  const ranked: RankingEntry[] = sessions
    .filter(isRankable)
    .sort(compareRanking)
    .map((s, i) => ({
      position: i + 1,
      sessionId: s.id,
      playerName: s.playerName,
      score: s.score,
      total: s.total,
      percent: percentOf(s.score, s.total),
      durationMs: s.durationMs,
      finishedAt: s.finishedAt,
    }));

  const me = sessionId === undefined ? undefined : ranked.find((e) => e.sessionId === sessionId);
  return me ? { top: ranked.slice(0, limit), me } : { top: ranked.slice(0, limit) };
}
