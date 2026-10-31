import { describe, expect, it } from "vitest";
import { computeScore, percentOf, performanceBand, scoreByTheme } from "@/lib/quiz/score";

const answers = (correct: number, wrong: number) => [
  ...Array.from({ length: correct }, () => ({ isCorrect: true })),
  ...Array.from({ length: wrong }, () => ({ isCorrect: false })),
];

describe("computeScore", () => {
  it("conta os acertos e calcula o percentual", () => {
    expect(computeScore(answers(7, 3), 10)).toEqual({ score: 7, total: 10, percent: 70 });
    expect(computeScore(answers(10, 0), 10)).toEqual({ score: 10, total: 10, percent: 100 });
    expect(computeScore(answers(0, 10), 10)).toEqual({ score: 0, total: 10, percent: 0 });
  });

  it("usa o total da rodada, não o número de respostas", () => {
    expect(computeScore(answers(3, 0), 6)).toEqual({ score: 3, total: 6, percent: 50 });
  });

  it("rejeita mais respostas do que perguntas", () => {
    expect(() => computeScore(answers(5, 6), 10)).toThrow();
  });
});

describe("percentOf", () => {
  it("arredonda para o inteiro mais próximo", () => {
    expect(percentOf(2, 3)).toBe(67);
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(1, 8)).toBe(13);
  });

  it("devolve 0 quando o total é 0", () => {
    expect(percentOf(0, 0)).toBe(0);
  });
});

describe("performanceBand (RF14)", () => {
  it.each([
    [100, "excelente"],
    [80, "excelente"],
    [79, "bom_caminho"],
    [50, "bom_caminho"],
    [49, "continue_praticando"],
    [0, "continue_praticando"],
  ] as const)("%i%% → %s", (percent, band) => {
    expect(performanceBand(percent)).toBe(band);
  });
});

describe("scoreByTheme (RF15)", () => {
  it("agrupa por tema na ordem canônica e omite temas ausentes", () => {
    const result = scoreByTheme([
      { theme: "big_data_cloud", isCorrect: true },
      { theme: "pipelines", isCorrect: false },
      { theme: "big_data_cloud", isCorrect: false },
      { theme: "pipelines", isCorrect: true },
      { theme: "pipelines", isCorrect: true },
    ]);
    expect(result).toEqual([
      { theme: "pipelines", score: 2, total: 3, percent: 67 },
      { theme: "big_data_cloud", score: 1, total: 2, percent: 50 },
    ]);
  });

  it("devolve vazio sem respostas", () => {
    expect(scoreByTheme([])).toEqual([]);
  });
});
