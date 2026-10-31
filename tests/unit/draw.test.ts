import { describe, expect, it } from "vitest";
import { THEMES, type Theme } from "@/lib/quiz/domain";
import { drawQuestions, type DrawCandidate } from "@/lib/quiz/draw";
import { seededRandom } from "@/lib/quiz/shuffle";

function makePool(counts: Partial<Record<Theme, number>>): DrawCandidate[] {
  return Object.entries(counts).flatMap(([theme, n]) =>
    Array.from({ length: n }, (_, i) => ({ id: `${theme}-${i}`, theme: theme as Theme })),
  );
}

const fullPool = makePool({ fundamentos_sql: 10, pipelines: 10, armazenamento: 10, big_data_cloud: 10 });
const themeOf = (id: string) => fullPool.find((q) => q.id === id)?.theme;
const seeds = Array.from({ length: 300 }, (_, i) => seededRandom(`seed-${i}`));

describe("drawQuestions com um tema", () => {
  it("sorteia 10 perguntas distintas, todas do tema pedido", () => {
    const pool = makePool({ pipelines: 15, armazenamento: 10 });
    for (const random of seeds) {
      const ids = drawQuestions(pool, "pipelines", { random });
      expect(ids).toHaveLength(10);
      expect(new Set(ids).size).toBe(10);
      expect(ids.every((id) => id.startsWith("pipelines-"))).toBe(true);
    }
  });

  it("usa todas as disponíveis quando há menos de 10 (RF06)", () => {
    const ids = drawQuestions(makePool({ pipelines: 6, armazenamento: 10 }), "pipelines");
    expect(ids.sort()).toEqual(makePool({ pipelines: 6 }).map((q) => q.id).sort());
  });

  it("devolve vazio se o tema não tem perguntas", () => {
    expect(drawQuestions(makePool({ armazenamento: 10 }), "pipelines")).toEqual([]);
  });
});

describe('drawQuestions com "Todos os temas"', () => {
  it("equilibra 2 ou 3 perguntas por tema, sem repetir", () => {
    for (const random of seeds) {
      const ids = drawQuestions(fullPool, null, { random });
      expect(ids).toHaveLength(10);
      expect(new Set(ids).size).toBe(10);
      for (const theme of THEMES) {
        const n = ids.filter((id) => themeOf(id) === theme).length;
        expect(n).toBeGreaterThanOrEqual(2);
        expect(n).toBeLessThanOrEqual(3);
      }
    }
  });

  it("varia quais temas recebem 3 perguntas", () => {
    const gotThree = new Set<Theme>();
    for (const random of seeds) {
      const ids = drawQuestions(fullPool, null, { random });
      for (const theme of THEMES) {
        if (ids.filter((id) => themeOf(id) === theme).length === 3) gotThree.add(theme);
      }
    }
    expect([...gotThree].sort()).toEqual([...THEMES].sort());
  });

  it("intercala os temas em vez de agrupá-los", () => {
    const ids = drawQuestions(fullPool, null, { random: seededRandom("intercala") });
    const firstFour = new Set(ids.slice(0, 4).map(themeOf));
    // Com os temas embaralhados juntos, é muito improvável que as 4 primeiras sejam de um só tema.
    expect(firstFour.size).toBeGreaterThan(1);
  });

  it("passa as vagas de um tema com poucas perguntas para os outros", () => {
    const pool = makePool({ fundamentos_sql: 1, pipelines: 10, armazenamento: 10, big_data_cloud: 10 });
    for (const random of seeds) {
      const ids = drawQuestions(pool, null, { random });
      expect(ids).toHaveLength(10);
      expect(ids.filter((id) => id.startsWith("fundamentos_sql-"))).toHaveLength(1);
      for (const theme of ["pipelines", "armazenamento", "big_data_cloud"] as const) {
        expect(ids.filter((id) => id.startsWith(`${theme}-`))).toHaveLength(3);
      }
    }
  });

  it("usa todas as disponíveis quando o total é menor que 10 (RF06)", () => {
    const pool = makePool({ fundamentos_sql: 1, pipelines: 2, armazenamento: 2, big_data_cloud: 2 });
    expect(drawQuestions(pool, null).sort()).toEqual(pool.map((q) => q.id).sort());
  });

  it("funciona quando só um tema tem perguntas", () => {
    expect(drawQuestions(makePool({ pipelines: 12 }), null)).toHaveLength(10);
  });
});

describe("drawQuestions (geral)", () => {
  it("ignora ids repetidos no pool", () => {
    const pool = [...makePool({ pipelines: 3 }), ...makePool({ pipelines: 3 })];
    const ids = drawQuestions(pool, "pipelines");
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
  });

  it("respeita o tamanho pedido e não altera o pool", () => {
    const pool = makePool({ pipelines: 10 });
    const before = structuredClone(pool);
    expect(drawQuestions(pool, "pipelines", { size: 4 })).toHaveLength(4);
    expect(pool).toEqual(before);
  });

  it("é reproduzível com a mesma semente", () => {
    const a = drawQuestions(fullPool, null, { random: seededRandom("x") });
    const b = drawQuestions(fullPool, null, { random: seededRandom("x") });
    expect(a).toEqual(b);
  });
});
