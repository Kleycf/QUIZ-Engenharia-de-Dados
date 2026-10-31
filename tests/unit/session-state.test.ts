import { describe, expect, it } from "vitest";
import {
  buildSessionState,
  gradeAnswer,
  type AnswerRecord,
  type QuestionRecord,
  type SessionRecord,
} from "@/lib/quiz/session-state";

const question = (id: string, theme: QuestionRecord["theme"], correctIndex = 0): QuestionRecord => ({
  id,
  theme,
  statement: `Enunciado ${id}`,
  options: [`${id}-A`, `${id}-B`, `${id}-C`, `${id}-D`],
  correctIndex,
  explanation: `SEGREDO-${id}: explicação da ${id}.`,
});

const questions = [question("q1", "pipelines", 2), question("q2", "armazenamento", 1), question("q3", "pipelines", 3)];

const session = (overrides: Partial<SessionRecord> = {}): SessionRecord => ({
  id: "sessao-1",
  playerName: "Ana",
  theme: null,
  level: "iniciante",
  questionIds: ["q2", "q1", "q3"],
  isRetry: false,
  score: null,
  total: 3,
  startedAt: "2026-10-30T10:00:00.000Z",
  finishedAt: null,
  durationMs: null,
  ...overrides,
});

const answers: AnswerRecord[] = [{ questionId: "q2", selectedIndex: 1, isCorrect: true }];

describe("buildSessionState: gabarito protegido (RNF03)", () => {
  it("não envia correctIndex nem explicação de perguntas não respondidas", () => {
    const state = buildSessionState(session(), questions, answers);
    const unanswered = JSON.stringify(state.questions) + JSON.stringify(state.session);
    expect(unanswered).not.toMatch(/correct|explanation|SEGREDO/i);

    const everything = JSON.stringify(state);
    expect(everything).toContain("SEGREDO-q2"); // respondida: explicação liberada
    expect(everything).not.toContain("SEGREDO-q1");
    expect(everything).not.toContain("SEGREDO-q3");
  });

  it("só revela o gabarito em `answers`, para as respondidas", () => {
    const state = buildSessionState(session(), questions, answers);
    expect(state.answers).toEqual([
      { questionId: "q2", selectedIndex: 1, isCorrect: true, correctIndex: 1, explanation: "SEGREDO-q2: explicação da q2." },
    ]);
  });

  it("sem respostas, não revela nada", () => {
    const state = buildSessionState(session(), questions, []);
    expect(state.answers).toEqual([]);
    expect(JSON.stringify(state)).not.toMatch(/correct|explanation|SEGREDO/i);
  });

  it("cada pergunta pública tem só id, tema, enunciado e alternativas", () => {
    for (const q of buildSessionState(session(), questions, []).questions) {
      expect(Object.keys(q).sort()).toEqual(["id", "options", "statement", "theme"]);
      for (const option of q.options) expect(Object.keys(option).sort()).toEqual(["index", "text"]);
    }
  });
});

describe("buildSessionState: ordem e alternativas", () => {
  it("segue a ordem sorteada da rodada", () => {
    expect(buildSessionState(session(), questions, []).questions.map((q) => q.id)).toEqual(["q2", "q1", "q3"]);
  });

  it("embaralha as alternativas preservando o índice original", () => {
    for (const q of buildSessionState(session(), questions, []).questions) {
      for (const option of q.options) expect(option.text).toBe(`${q.id}-${"ABCD"[option.index]}`);
    }
  });

  it("mantém a ordem das alternativas ao recarregar e muda em outra rodada (RF08/RF13)", () => {
    const order = (id: string) =>
      buildSessionState(session({ id }), questions, []).questions.map((q) => q.options.map((o) => o.index).join());
    expect(order("sessao-1")).toEqual(order("sessao-1"));
    const others = new Set(Array.from({ length: 20 }, (_, i) => order(`sessao-${i}`).join("|")));
    expect(others.size).toBeGreaterThan(1);
  });

  it("ignora ids que não existem mais no banco", () => {
    const state = buildSessionState(session({ questionIds: ["q1", "apagada"] }), questions, []);
    expect(state.questions.map((q) => q.id)).toEqual(["q1"]);
  });
});

describe("buildSessionState: resultado", () => {
  it("não tem resultado enquanto a rodada não termina", () => {
    const state = buildSessionState(session(), questions, answers);
    expect(state.session.finished).toBe(false);
    expect(state.session).not.toHaveProperty("result");
  });

  it("monta pontuação, faixa e desempenho por tema quando termina", () => {
    const all: AnswerRecord[] = [
      { questionId: "q1", selectedIndex: 2, isCorrect: true },
      { questionId: "q2", selectedIndex: 0, isCorrect: false },
      { questionId: "q3", selectedIndex: 3, isCorrect: true },
    ];
    const state = buildSessionState(
      session({ score: 2, finishedAt: "2026-10-30T10:05:00.000Z", durationMs: 300_000 }),
      questions,
      all,
    );
    expect(state.session.finished).toBe(true);
    expect(state.session.result).toEqual({
      score: 2,
      total: 3,
      percent: 67,
      band: "bom_caminho",
      durationMs: 300_000,
      finishedAt: "2026-10-30T10:05:00.000Z",
      byTheme: [
        { theme: "pipelines", score: 2, total: 2, percent: 100 },
        { theme: "armazenamento", score: 0, total: 1, percent: 0 },
      ],
    });
    expect(state.answers).toHaveLength(3);
  });

  it("não expõe dados internos da sessão", () => {
    const keys = Object.keys(buildSessionState(session(), questions, []).session).sort();
    expect(keys).toEqual(["finished", "id", "isRetry", "level", "playerName", "startedAt", "theme", "total"]);
  });
});

describe("gradeAnswer", () => {
  it("compara com o índice original", () => {
    const q = question("q", "pipelines", 2);
    expect(gradeAnswer(q, 2)).toEqual({ isCorrect: true, correctIndex: 2, explanation: q.explanation });
    expect(gradeAnswer(q, 0)).toMatchObject({ isCorrect: false, correctIndex: 2 });
  });
});
