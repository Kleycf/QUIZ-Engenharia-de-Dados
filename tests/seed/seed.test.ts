import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildSeedSql, LEVELS, loadQuestions, SEED_PATH, THEMES } from "../../scripts/build-seed";

const questions = loadQuestions();

// Diretrizes de redação: PRD §4.4.
const FORBIDDEN_OPTION = [
  /\b(todas|nenhuma)\s+(as|das)\s+(anteriores|alternativas|acima|opções)\b/i,
  /\b(ambas|todas)\s+(estão|são)\s+corretas\b/i,
  /\b[A-D]\s+e\s+[A-D]\b/, // "A e B": depende da ordem, que é embaralhada
];
const LETTER_REFERENCE = /\b(alternativa|opção|letra)\s+[A-D]\b/i;
const MAX_SQL_LINES = 8;
// A correta não pode se destacar por ser bem mais longa ou bem mais curta que os distratores.
const MAX_LENGTH_RATIO = 1.3;

const normalize = (text: string) => text.trim().replace(/\s+/g, " ").toLowerCase();

function countSentences(text: string): number {
  // Ignora pontos dentro de `código` (ex.: p.status) antes de dividir.
  const prose = text.replace(/`[^`]*`/g, "CODE");
  return prose.split(/[.!?](?=\s|$)/).filter((part) => part.trim().length > 0).length;
}

function codeBlocks(text: string): string[] {
  return [...text.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1] ?? "");
}

const label = (q: (typeof questions)[number]) => `${q.id} (${q.theme}/${q.level})`;

describe("banco de perguntas (seed)", () => {
  it("tem 80 perguntas, 10 por tema e nível", () => {
    expect(questions).toHaveLength(80);
    for (const theme of THEMES) {
      for (const level of LEVELS) {
        const count = questions.filter((q) => q.theme === theme && q.level === level).length;
        expect(count, `${theme}/${level}`).toBe(10);
      }
    }
  });

  it("não repete ids, uuids nem enunciados", () => {
    for (const key of ["id", "uuid"] as const) {
      expect(new Set(questions.map((q) => q[key])).size, key).toBe(questions.length);
    }
    expect(new Set(questions.map((q) => normalize(q.statement))).size).toBe(questions.length);
  });

  it.each(questions.map((q) => [label(q), q] as const))("%s: 4 alternativas únicas e 1 correta", (_, q) => {
    expect(q.distractors).toHaveLength(3);
    expect(q.options).toHaveLength(4);
    expect(new Set(q.options.map(normalize)).size).toBe(4);
    expect(q.correctIndex).toBeGreaterThanOrEqual(0);
    expect(q.correctIndex).toBeLessThanOrEqual(3);
    expect(q.options[q.correctIndex]).toBe(q.answer);
    for (const option of q.options) expect(option.trim()).not.toBe("");
  });

  it.each(questions.map((q) => [label(q), q] as const))("%s: segue as diretrizes de redação", (_, q) => {
    expect(q.statement.trim()).not.toBe("");

    for (const option of q.options) {
      for (const pattern of FORBIDDEN_OPTION) expect(option, `alternativa proibida`).not.toMatch(pattern);
      expect(option).not.toMatch(LETTER_REFERENCE);
    }
    expect(q.statement).not.toMatch(LETTER_REFERENCE);
    expect(q.explanation).not.toMatch(LETTER_REFERENCE);

    const sentences = countSentences(q.explanation);
    expect(sentences, "explicação com 2 a 5 frases").toBeGreaterThanOrEqual(2);
    expect(sentences, "explicação com 2 a 5 frases").toBeLessThanOrEqual(5);

    for (const block of codeBlocks(q.statement)) {
      expect(block.trimEnd().split("\n").length, "bloco de código com até 8 linhas").toBeLessThanOrEqual(
        MAX_SQL_LINES,
      );
    }
    expect((q.statement.match(/```/g) ?? []).length % 2, "blocos de código fechados").toBe(0);
  });

  it.each(questions.map((q) => [label(q), q] as const))("%s: alternativas de tamanho parecido", (_, q) => {
    const lengths = q.distractors.map((d) => d.length);
    const longest = Math.max(...lengths);
    const shortest = Math.min(...lengths);
    expect(q.answer.length, "correta muito mais longa").toBeLessThanOrEqual(longest * MAX_LENGTH_RATIO);
    expect(q.answer.length, "correta muito mais curta").toBeGreaterThanOrEqual(shortest / MAX_LENGTH_RATIO);
  });

  it("supabase/seed.sql está em sincronia com os JSON (rode `npm run db:seed`)", () => {
    const onDisk = readFileSync(SEED_PATH, "utf8").replaceAll("\r\n", "\n");
    expect(onDisk).toBe(buildSeedSql(questions));
  });
});
