// Monta o que a API devolve sobre uma rodada. É aqui que o gabarito é protegido (RNF03):
// `correctIndex` e `explanation` só aparecem em `answers`, e só para perguntas já respondidas.
import type { Level, Theme } from "./domain";
import { percentOf, performanceBand, scoreByTheme, type PerformanceBand, type ThemeScore } from "./score";
import { seededRandom, shuffleOptions, type PresentedOption } from "./shuffle";

export interface SessionRecord {
  id: string;
  playerName: string;
  theme: Theme | null;
  level: Level;
  questionIds: string[];
  isRetry: boolean;
  score: number | null;
  total: number;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
}

export interface QuestionRecord {
  id: string;
  theme: Theme;
  statement: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AnswerRecord {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
}

/** Pergunta como o cliente a vê: sem gabarito, com as alternativas na ordem desta rodada. */
export interface PublicQuestion {
  id: string;
  theme: Theme;
  statement: string;
  options: PresentedOption[];
}

export interface GradedAnswer {
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
}

export interface RevealedAnswer extends GradedAnswer {
  questionId: string;
  selectedIndex: number;
}

export interface SessionResult {
  score: number;
  total: number;
  percent: number;
  band: PerformanceBand;
  durationMs: number;
  finishedAt: string;
  byTheme: ThemeScore[];
}

export interface PublicSession {
  id: string;
  playerName: string;
  theme: Theme | null;
  level: Level;
  isRetry: boolean;
  total: number;
  startedAt: string;
  finished: boolean;
  result?: SessionResult;
}

export interface SessionState {
  session: PublicSession;
  questions: PublicQuestion[];
  answers: RevealedAnswer[];
}

/** Semente da ordem das alternativas: estável dentro da rodada, diferente entre rodadas. */
export const optionOrderSeed = (sessionId: string, questionId: string) => `${sessionId}:${questionId}`;

export function toPublicQuestion(sessionId: string, question: QuestionRecord): PublicQuestion {
  return {
    id: question.id,
    theme: question.theme,
    statement: question.statement,
    options: shuffleOptions(question.options, seededRandom(optionOrderSeed(sessionId, question.id))),
  };
}

export function gradeAnswer(question: QuestionRecord, selectedIndex: number): GradedAnswer {
  return {
    isCorrect: selectedIndex === question.correctIndex,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
  };
}

export function buildSessionState(
  session: SessionRecord,
  questions: readonly QuestionRecord[],
  answers: readonly AnswerRecord[],
): SessionState {
  const questionById = new Map(questions.map((q) => [q.id, q]));
  const answerById = new Map(answers.map((a) => [a.questionId, a]));
  // Respeita a ordem sorteada da rodada; ignora ids que não existam mais no banco.
  const ordered = session.questionIds.flatMap((id) => questionById.get(id) ?? []);

  const revealed: RevealedAnswer[] = ordered.flatMap((q) => {
    const answer = answerById.get(q.id);
    if (!answer) return [];
    // isCorrect vem do banco: foi decidido no momento da resposta e não muda se o gabarito for editado depois.
    return [{ questionId: q.id, selectedIndex: answer.selectedIndex, isCorrect: answer.isCorrect, correctIndex: q.correctIndex, explanation: q.explanation }];
  });

  const finished = session.finishedAt !== null && session.score !== null && session.durationMs !== null;
  const publicSession: PublicSession = {
    id: session.id,
    playerName: session.playerName,
    theme: session.theme,
    level: session.level,
    isRetry: session.isRetry,
    total: session.total,
    startedAt: session.startedAt,
    finished,
  };

  if (finished) {
    const score = session.score as number;
    const percent = percentOf(score, session.total);
    publicSession.result = {
      score,
      total: session.total,
      percent,
      band: performanceBand(percent),
      durationMs: session.durationMs as number,
      finishedAt: session.finishedAt as string,
      byTheme: scoreByTheme(revealed.map((a) => ({ theme: questionById.get(a.questionId)?.theme as Theme, isCorrect: a.isCorrect }))),
    };
  }

  return {
    session: publicSession,
    questions: ordered.map((q) => toPublicQuestion(session.id, q)),
    answers: revealed,
  };
}
