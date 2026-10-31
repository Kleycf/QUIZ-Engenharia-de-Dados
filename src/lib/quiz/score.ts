import { THEMES, type Theme } from "./domain";

export interface ScoreResult {
  score: number;
  total: number;
  percent: number;
}

/** Percentual inteiro de 0 a 100. */
export function percentOf(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

/** Pontuação da rodada a partir das respostas gravadas (a fonte é sempre `session_answers`, no servidor). */
export function computeScore(answers: readonly { isCorrect: boolean }[], total: number): ScoreResult {
  if (answers.length > total) {
    throw new Error(`Mais respostas (${answers.length}) do que perguntas (${total}) na rodada`);
  }
  const score = answers.filter((a) => a.isCorrect).length;
  return { score, total, percent: percentOf(score, total) };
}

export type PerformanceBand = "excelente" | "bom_caminho" | "continue_praticando";

/** Faixa de desempenho (RF14): ≥ 80% excelente, 50–79% bom caminho, < 50% continue praticando. */
export function performanceBand(percent: number): PerformanceBand {
  if (percent >= 80) return "excelente";
  if (percent >= 50) return "bom_caminho";
  return "continue_praticando";
}

export interface ThemeScore extends ScoreResult {
  theme: Theme;
}

/** Desempenho por tema (RF15), na ordem canônica dos temas e só com os temas presentes. */
export function scoreByTheme(items: readonly { theme: Theme; isCorrect: boolean }[]): ThemeScore[] {
  return THEMES.flatMap((theme) => {
    const ofTheme = items.filter((i) => i.theme === theme);
    if (ofTheme.length === 0) return [];
    return [{ theme, ...computeScore(ofTheme, ofTheme.length) }];
  });
}
