import "server-only";
import { ApiError, sessionNotFound } from "@/lib/api/http";
import { ROUND_SIZE, type Level, type Theme } from "@/lib/quiz/domain";
import { drawQuestions } from "@/lib/quiz/draw";
import { isRankable, RANKING_SIZE } from "@/lib/quiz/ranking";
import { computeScore, percentOf, performanceBand, type PerformanceBand } from "@/lib/quiz/score";
import {
  buildSessionState,
  gradeAnswer,
  type AnswerRecord,
  type GradedAnswer,
  type QuestionRecord,
  type SessionRecord,
  type SessionState,
} from "@/lib/quiz/session-state";
import { shuffle } from "@/lib/quiz/shuffle";
import { getDb } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { AnswerInput, CreateSessionInput, RankingQuery } from "@/lib/validation";

type SessionRow = Database["public"]["Tables"]["quiz_sessions"]["Row"];

const SESSION_COLUMNS =
  "id, player_name, theme, level, question_ids, is_retry, score, total, started_at, finished_at, duration_ms";
// Nunca selecione `correct_index`/`explanation` para algo que vá direto ao cliente: passe por session-state.ts.
const QUESTION_COLUMNS = "id, theme, statement, options, correct_index, explanation";

/** Violação de unicidade no Postgres: aqui, a PK (session_id, question_id) de session_answers. */
const UNIQUE_VIOLATION = "23505";

function dbError(context: string, error: { message: string; code?: string }): Error {
  return new Error(`[db] ${context}: ${error.message}${error.code ? ` (${error.code})` : ""}`);
}

function toSessionRecord(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    playerName: row.player_name,
    theme: row.theme,
    level: row.level,
    questionIds: row.question_ids,
    isRetry: row.is_retry,
    score: row.score,
    total: row.total,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    durationMs: row.duration_ms,
  };
}

async function loadSession(id: string): Promise<SessionRecord> {
  const { data, error } = await getDb().from("quiz_sessions").select(SESSION_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw dbError("carregar rodada", error);
  if (!data) throw sessionNotFound();
  return toSessionRecord(data);
}

async function loadQuestions(ids: readonly string[]): Promise<QuestionRecord[]> {
  if (ids.length === 0) return [];
  const { data, error } = await getDb().from("questions").select(QUESTION_COLUMNS).in("id", [...ids]);
  if (error) throw dbError("carregar perguntas", error);
  return data.map((q) => ({
    id: q.id,
    theme: q.theme,
    statement: q.statement,
    options: q.options,
    correctIndex: q.correct_index,
    explanation: q.explanation,
  }));
}

async function loadAnswers(sessionId: string): Promise<AnswerRecord[]> {
  const { data, error } = await getDb()
    .from("session_answers")
    .select("question_id, selected_index, is_correct")
    .eq("session_id", sessionId);
  if (error) throw dbError("carregar respostas", error);
  return data.map((a) => ({ questionId: a.question_id, selectedIndex: a.selected_index, isCorrect: a.is_correct }));
}

// ---------------------------------------------------------------------------------------------
// POST /api/sessions

export async function createSession(input: CreateSessionInput): Promise<{ sessionId: string }> {
  const { theme, level, questionIds, isRetry } = input.retryOf
    ? await retryPlan(input.retryOf)
    : { theme: input.theme, level: input.level, questionIds: await drawForRound(input.theme, input.level), isRetry: false };

  const { data, error } = await getDb()
    .from("quiz_sessions")
    .insert({
      player_name: input.playerName,
      theme,
      level,
      question_ids: questionIds,
      is_retry: isRetry,
      total: questionIds.length,
    })
    .select("id")
    .single();
  if (error) throw dbError("criar rodada", error);
  return { sessionId: data.id };
}

/** Sorteio de uma rodada normal (RF05/RF06). */
async function drawForRound(theme: Theme | null, level: Level): Promise<string[]> {
  let query = getDb().from("questions").select("id, theme").eq("active", true).eq("level", level);
  if (theme !== null) query = query.eq("theme", theme);
  const { data, error } = await query;
  if (error) throw dbError("listar perguntas", error);

  const ids = drawQuestions(data, theme);
  if (ids.length === 0) {
    throw new ApiError(404, "NO_QUESTIONS", "Ainda não há perguntas para esse tema e nível. Escolha outra combinação.");
  }
  return ids;
}

/** "Refazer só as erradas" (RF18): mesmas configurações, só as perguntas erradas, fora do ranking. */
async function retryPlan(sourceId: string) {
  const source = await loadSession(sourceId);
  if (source.finishedAt === null) {
    throw new ApiError(409, "RETRY_SOURCE_NOT_FINISHED", "Termine a rodada antes de refazer as perguntas erradas.");
  }
  const wrong = new Set((await loadAnswers(source.id)).filter((a) => !a.isCorrect).map((a) => a.questionId));
  const questionIds = shuffle(source.questionIds.filter((id) => wrong.has(id)));
  if (questionIds.length === 0) {
    throw new ApiError(409, "NOTHING_TO_RETRY", "Você não errou nenhuma pergunta nessa rodada.");
  }
  return { theme: source.theme, level: source.level, questionIds, isRetry: true };
}

// ---------------------------------------------------------------------------------------------
// GET /api/sessions/:id

export async function getSessionState(sessionId: string): Promise<SessionState> {
  const session = await loadSession(sessionId);
  const [questions, answers] = await Promise.all([loadQuestions(session.questionIds), loadAnswers(session.id)]);
  return buildSessionState(session, questions, answers);
}

// ---------------------------------------------------------------------------------------------
// POST /api/sessions/:id/answers

export async function submitAnswer(sessionId: string, { questionId, selectedIndex }: AnswerInput): Promise<GradedAnswer> {
  const session = await loadSession(sessionId);
  if (session.finishedAt !== null) {
    throw new ApiError(409, "SESSION_FINISHED", "Esta rodada já foi concluída.");
  }
  if (!session.questionIds.includes(questionId)) {
    throw new ApiError(400, "QUESTION_NOT_IN_SESSION", "Essa pergunta não faz parte desta rodada.");
  }

  const [question] = await loadQuestions([questionId]);
  if (!question) throw new ApiError(400, "QUESTION_NOT_IN_SESSION", "Essa pergunta não faz parte desta rodada.");

  const graded = gradeAnswer(question, selectedIndex);
  const { error } = await getDb().from("session_answers").insert({
    session_id: session.id,
    question_id: questionId,
    selected_index: selectedIndex,
    is_correct: graded.isCorrect,
  });
  if (error?.code === UNIQUE_VIOLATION) {
    throw new ApiError(409, "ALREADY_ANSWERED", "Você já respondeu esta pergunta.");
  }
  if (error) throw dbError("gravar resposta", error);
  return graded;
}

// ---------------------------------------------------------------------------------------------
// POST /api/sessions/:id/finish

export interface FinishResult {
  score: number;
  total: number;
  percent: number;
  band: PerformanceBand;
  /** Posição no ranking do tema e nível; ausente se a rodada não entra no ranking (RF21). */
  rank?: number;
}

/** Conclui a rodada (RF17). Idempotente: chamar de novo devolve o mesmo resultado. */
export async function finishSession(sessionId: string): Promise<FinishResult> {
  let session = await loadSession(sessionId);

  if (session.finishedAt === null) {
    const answers = await loadAnswers(session.id);
    if (answers.length < session.total) {
      throw new ApiError(409, "NOT_ALL_ANSWERED", "Responda todas as perguntas antes de ver o resultado.");
    }
    // A pontuação sai só de session_answers, nunca de algo enviado pelo cliente (RNF03).
    const { score } = computeScore(answers, session.total);
    const finishedAt = new Date();

    const { data, error } = await getDb()
      .from("quiz_sessions")
      .update({
        score,
        finished_at: finishedAt.toISOString(),
        duration_ms: Math.max(0, finishedAt.getTime() - Date.parse(session.startedAt)),
      })
      .eq("id", session.id)
      .is("finished_at", null) // se outra requisição concluiu antes, não sobrescreve
      .select(SESSION_COLUMNS);
    if (error) throw dbError("concluir rodada", error);
    session = data[0] ? toSessionRecord(data[0]) : await loadSession(session.id);
  }

  const score = session.score ?? 0;
  const percent = percentOf(score, session.total);
  const rank = await rankingPosition(session);
  const result: FinishResult = { score, total: session.total, percent, band: performanceBand(percent) };
  return rank === undefined ? result : { ...result, rank };
}

// ---------------------------------------------------------------------------------------------
// GET /api/ranking
//
// Mesma ordem de compareRanking (lib/quiz/ranking.ts), feita no banco para não depender de carregar todas as
// rodadas. Como só entram rodadas com total = ROUND_SIZE, ordenar por score equivale a ordenar por percentual.

export interface PublicRankingEntry {
  position: number;
  playerName: string;
  score: number;
  total: number;
  percent: number;
  durationMs: number;
  finishedAt: string;
  /** A linha é da rodada `sessionId` informada (RF22). Ids de outras rodadas nunca são expostos. */
  isMe: boolean;
}

export interface RankingResponse {
  top: PublicRankingEntry[];
  me?: PublicRankingEntry;
}

/** Filtros comuns às consultas do ranking: rodadas concluídas, completas e fora do "refazer" (RF21). */
function rankingBucket(theme: Theme | null, level: Level, columns: string, head = false) {
  let query = getDb()
    .from("quiz_sessions")
    .select(columns, head ? { count: "exact", head: true } : undefined)
    .eq("level", level)
    .eq("is_retry", false)
    .eq("total", ROUND_SIZE)
    .not("finished_at", "is", null);
  query = theme === null ? query.is("theme", null) : query.eq("theme", theme);
  return query;
}

type RankingRow = Pick<SessionRow, "id" | "player_name" | "score" | "total" | "duration_ms" | "finished_at">;

function toRankingEntry(row: RankingRow, position: number, sessionId?: string): PublicRankingEntry {
  const score = row.score ?? 0;
  return {
    position,
    playerName: row.player_name,
    score,
    total: row.total,
    percent: percentOf(score, row.total),
    durationMs: row.duration_ms ?? 0,
    finishedAt: row.finished_at ?? "",
    isMe: row.id === sessionId,
  };
}

/** Posição de uma rodada no ranking dela: 1 + quantas rodadas do mesmo grupo vêm antes (RF20). */
async function rankingPosition(session: SessionRecord): Promise<number | undefined> {
  if (!isRankable(session)) return undefined;
  const { score, durationMs, finishedAt, id, theme, level } = session;

  const ahead = await Promise.all([
    rankingBucket(theme, level, "id", true).gt("score", score),
    rankingBucket(theme, level, "id", true).eq("score", score).lt("duration_ms", durationMs),
    rankingBucket(theme, level, "id", true).eq("score", score).eq("duration_ms", durationMs).lt("finished_at", finishedAt),
    rankingBucket(theme, level, "id", true)
      .eq("score", score)
      .eq("duration_ms", durationMs)
      .eq("finished_at", finishedAt)
      .lt("id", id),
  ]);
  let count = 0;
  for (const { count: n, error } of ahead) {
    if (error) throw dbError("calcular posição no ranking", error);
    count += n ?? 0;
  }
  return count + 1;
}

export async function getRanking({ theme, level, sessionId }: RankingQuery): Promise<RankingResponse> {
  const { data, error } = await rankingBucket(theme, level, "id, player_name, score, total, duration_ms, finished_at")
    .order("score", { ascending: false })
    .order("duration_ms", { ascending: true })
    .order("finished_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(RANKING_SIZE)
    .overrideTypes<RankingRow[], { merge: false }>();
  if (error) throw dbError("carregar ranking", error);

  const top = data.map((row, i) => toRankingEntry(row, i + 1, sessionId));
  if (!sessionId) return { top };

  const inTop = top.find((e) => e.isMe);
  if (inTop) return { top, me: inTop };

  // Fora do Top 10: busca a rodada e calcula a posição, se ela for deste mesmo tema e nível.
  const { data: own, error: ownError } = await getDb()
    .from("quiz_sessions")
    .select(SESSION_COLUMNS)
    .eq("id", sessionId)
    .maybeSingle();
  if (ownError) throw dbError("carregar rodada do ranking", ownError);
  if (!own || own.theme !== theme || own.level !== level) return { top };

  const position = await rankingPosition(toSessionRecord(own));
  return position === undefined ? { top } : { top, me: toRankingEntry(own, position, sessionId) };
}
