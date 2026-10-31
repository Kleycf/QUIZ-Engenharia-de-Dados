import { describe, expect, it } from "vitest";
import { answerSchema, createSessionSchema, playerNameSchema, rankingQuerySchema } from "@/lib/validation";

const UUID = "b7b71d97-6d18-57d5-af4a-bcc1840eb9e7";
const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe("playerNameSchema (RF01)", () => {
  it.each(["Ana", "Zé", "Maria da Silva", "José Ñúñez", "a".repeat(30), "😀😀"])("aceita %j", (name) => {
    expect(playerNameSchema.safeParse(name).success).toBe(true);
  });

  it("devolve o nome sem espaços nas pontas", () => {
    expect(playerNameSchema.parse("  Ana Paula  ")).toBe("Ana Paula");
  });

  it("conta emoji como um caractere, como o Postgres", () => {
    expect(playerNameSchema.safeParse("😀".repeat(30)).success).toBe(true);
    expect(playerNameSchema.safeParse("😀".repeat(31)).success).toBe(false);
  });

  it.each([
    ["vazio", ""],
    ["só espaços", "     "],
    ["1 caractere", "A"],
    ["1 caractere com espaços", "  A  "],
    ["31 caracteres", "a".repeat(31)],
    ["tag HTML", "<b>Ana</b>"],
    ["script", "Ana<script>"],
    ["sinal de maior", "Ana > Bia"],
    ["caractere de controle", "Ana\u0007"],
    ["quebra de linha no meio", "Ana\nBia"],
    ["tabulação no meio", "Ana\tBia"],
  ])("rejeita %s", (_, name) => {
    expect(playerNameSchema.safeParse(name).success).toBe(false);
  });

  it("rejeita valores que não são texto", () => {
    expect(playerNameSchema.safeParse(undefined).success).toBe(false);
    expect(playerNameSchema.safeParse(42).success).toBe(false);
  });

  it("explica o erro em português, um problema por vez", () => {
    expect(firstError(playerNameSchema.safeParse(" A "))).toBe("O nome precisa ter pelo menos 2 caracteres.");
    expect(firstError(playerNameSchema.safeParse("<"))).toBe("O nome não pode conter os caracteres < ou >.");
    expect(playerNameSchema.safeParse("<").error?.issues).toHaveLength(1);
  });
});

describe("createSessionSchema", () => {
  it('aceita um tema ou null ("Todos os temas")', () => {
    expect(createSessionSchema.parse({ playerName: " Ana ", theme: null, level: "iniciante" })).toEqual({
      playerName: "Ana",
      theme: null,
      level: "iniciante",
    });
    expect(createSessionSchema.safeParse({ playerName: "Ana", theme: "pipelines", level: "intermediario" }).success).toBe(true);
  });

  it("aceita retryOf com um uuid", () => {
    expect(createSessionSchema.safeParse({ playerName: "Ana", theme: null, level: "iniciante", retryOf: UUID }).success).toBe(true);
    expect(createSessionSchema.safeParse({ playerName: "Ana", theme: null, level: "iniciante", retryOf: "123" }).success).toBe(false);
  });

  it("rejeita tema, nível ou tema ausente inválidos", () => {
    expect(createSessionSchema.safeParse({ playerName: "Ana", theme: "python", level: "iniciante" }).success).toBe(false);
    expect(createSessionSchema.safeParse({ playerName: "Ana", theme: null, level: "avancado" }).success).toBe(false);
    expect(createSessionSchema.safeParse({ playerName: "Ana", level: "iniciante" }).success).toBe(false);
  });
});

describe("answerSchema", () => {
  it.each([0, 1, 2, 3])("aceita selectedIndex %i", (selectedIndex) => {
    expect(answerSchema.safeParse({ questionId: UUID, selectedIndex }).success).toBe(true);
  });

  it.each([-1, 4, 1.5, "1", null])("rejeita selectedIndex %j", (selectedIndex) => {
    expect(answerSchema.safeParse({ questionId: UUID, selectedIndex }).success).toBe(false);
  });

  it("rejeita questionId que não é uuid", () => {
    expect(answerSchema.safeParse({ questionId: "abc", selectedIndex: 0 }).success).toBe(false);
  });
});

describe("rankingQuerySchema", () => {
  it('trata tema ausente ou "todos" como null', () => {
    expect(rankingQuerySchema.parse({ level: "iniciante" }).theme).toBeNull();
    expect(rankingQuerySchema.parse({ theme: "todos", level: "iniciante" }).theme).toBeNull();
  });

  it("mantém um tema válido e o sessionId opcional", () => {
    expect(rankingQuerySchema.parse({ theme: "pipelines", level: "intermediario", sessionId: UUID })).toEqual({
      theme: "pipelines",
      level: "intermediario",
      sessionId: UUID,
    });
  });

  it("rejeita tema inválido ou nível ausente", () => {
    expect(rankingQuerySchema.safeParse({ theme: "python", level: "iniciante" }).success).toBe(false);
    expect(rankingQuerySchema.safeParse({ theme: "pipelines" }).success).toBe(false);
  });
});
