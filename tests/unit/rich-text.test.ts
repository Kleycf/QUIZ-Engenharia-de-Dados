import { describe, expect, it } from "vitest";
import { parseBlocks, parseInline, plainText } from "@/lib/rich-text";
import { loadQuestions } from "../../scripts/build-seed";

describe("parseInline", () => {
  it("reconhece código, negrito e itálico", () => {
    expect(parseInline("Use `COUNT(*)` com **cuidado** e *calma*.")).toEqual([
      { type: "text", text: "Use " },
      { type: "code", text: "COUNT(*)" },
      { type: "text", text: " com " },
      { type: "strong", text: "cuidado" },
      { type: "text", text: " e " },
      { type: "em", text: "calma" },
      { type: "text", text: "." },
    ]);
  });

  it("não trata asteriscos dentro de código como itálico", () => {
    expect(parseInline("`SELECT *` e `COUNT(*)`").filter((t) => t.type !== "text")).toEqual([
      { type: "code", text: "SELECT *" },
      { type: "code", text: "COUNT(*)" },
    ]);
  });

  it("devolve texto puro sem marcação", () => {
    expect(plainText("O `LEFT JOIN` mantém *todas* as linhas")).toBe("O LEFT JOIN mantém todas as linhas");
  });

  it("nunca interpreta HTML: tags viram texto", () => {
    expect(parseInline("<script>alert(1)</script>")).toEqual([{ type: "text", text: "<script>alert(1)</script>" }]);
  });
});

describe("parseBlocks", () => {
  it("separa parágrafos e blocos de código", () => {
    expect(parseBlocks("O que faz a consulta?\n\n```sql\nSELECT 1\nFROM t;\n```")).toEqual([
      { type: "paragraph", text: "O que faz a consulta?" },
      { type: "code", language: "sql", code: "SELECT 1\nFROM t;" },
    ]);
  });
});

describe("conteúdo real do banco de perguntas", () => {
  const questions = loadQuestions();
  const texts = questions.flatMap((q) => [
    ...parseBlocks(q.statement)
      .filter((b) => b.type === "paragraph")
      .map((b) => b.text),
    ...q.options,
    ...parseBlocks(q.explanation)
      .filter((b) => b.type === "paragraph")
      .map((b) => b.text),
  ]);

  it("não sobra marcação solta (* ou `) em nenhum texto renderizado", () => {
    const leftovers = texts.flatMap((text) =>
      parseInline(text)
        .filter((t) => t.type === "text" && /[*`]/.test(t.text))
        .map((t) => `${text} → ${t.text}`),
    );
    expect(leftovers).toEqual([]);
  });

  it("todo enunciado com ``` vira um bloco de código", () => {
    for (const q of questions.filter((q) => q.statement.includes("```"))) {
      expect(parseBlocks(q.statement).some((b) => b.type === "code"), q.id).toBe(true);
    }
  });
});
