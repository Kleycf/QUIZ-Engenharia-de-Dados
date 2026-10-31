import { describe, expect, it } from "vitest";
import { seededRandom, shuffle, shuffleOptions } from "@/lib/quiz/shuffle";

const OPTIONS = ["certa", "distrator 1", "distrator 2", "distrator 3"];

describe("shuffle", () => {
  it("devolve uma permutação sem alterar o original", () => {
    const items = [1, 2, 3, 4, 5, 6];
    const result = shuffle(items, seededRandom("a"));
    expect(result.sort()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(items).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("produz todas as 24 ordens possíveis de 4 itens", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) seen.add(shuffle(OPTIONS, seededRandom(`p-${i}`)).join("|"));
    expect(seen.size).toBe(24);
  });

  it("lida com listas vazias e de um item", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(["x"])).toEqual(["x"]);
  });
});

describe("shuffleOptions", () => {
  it("preserva o mapeamento para o índice original", () => {
    for (let i = 0; i < 200; i++) {
      const presented = shuffleOptions(OPTIONS, seededRandom(`m-${i}`));
      expect(presented.map((o) => o.index).sort()).toEqual([0, 1, 2, 3]);
      for (const option of presented) expect(OPTIONS[option.index]).toBe(option.text);
    }
  });

  it("coloca a correta em cada posição com frequência parecida", () => {
    const positions = [0, 0, 0, 0];
    const runs = 4000;
    for (let i = 0; i < runs; i++) {
      const position = shuffleOptions(OPTIONS, seededRandom(`f-${i}`)).findIndex((o) => o.index === 0);
      positions[position] = (positions[position] ?? 0) + 1;
    }
    for (const count of positions) {
      expect(count / runs).toBeGreaterThan(0.2);
      expect(count / runs).toBeLessThan(0.3);
    }
  });

  it("mantém a ordem para a mesma sessão e pergunta, e muda entre sessões (RF08/RF13)", () => {
    const order = (seed: string) => shuffleOptions(OPTIONS, seededRandom(seed)).map((o) => o.index);
    expect(order("sessao-1:pergunta-1")).toEqual(order("sessao-1:pergunta-1"));

    const distinct = new Set(Array.from({ length: 50 }, (_, i) => order(`sessao-${i}:pergunta-1`).join()));
    expect(distinct.size).toBeGreaterThan(1);
  });
});

describe("seededRandom", () => {
  it("é determinístico e fica em [0, 1)", () => {
    const a = seededRandom("semente");
    const b = seededRandom("semente");
    for (let i = 0; i < 1000; i++) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("gera sequências diferentes para sementes diferentes", () => {
    expect(seededRandom("a")()).not.toBe(seededRandom("b")());
  });
});
