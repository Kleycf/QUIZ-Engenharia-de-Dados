import { describe, expect, it } from "vitest";
import { buildRanking, isRankable, type RankingSession } from "@/lib/quiz/ranking";

let counter = 0;
function session(overrides: Partial<RankingSession> = {}): RankingSession {
  counter++;
  return {
    id: `s-${String(counter).padStart(3, "0")}`,
    playerName: `Jogador ${counter}`,
    score: 5,
    total: 10,
    durationMs: 60_000,
    finishedAt: "2026-10-01T12:00:00.000Z",
    isRetry: false,
    ...overrides,
  };
}

describe("isRankable (RF21)", () => {
  it("aceita rodada concluída, completa e que não é refazer", () => {
    expect(isRankable(session())).toBe(true);
  });

  it.each([
    ["não concluída", { finishedAt: null, score: null, durationMs: null }],
    ["refazer erradas", { isRetry: true }],
    ["com menos de 10 perguntas", { total: 6, score: 6 }],
  ] as const)("rejeita rodada %s", (_, overrides) => {
    expect(isRankable(session(overrides))).toBe(false);
  });
});

describe("buildRanking: ordem (RF20)", () => {
  it("ordena por maior percentual", () => {
    const low = session({ score: 6 });
    const high = session({ score: 9 });
    const mid = session({ score: 8 });
    expect(buildRanking([low, high, mid]).top.map((e) => e.sessionId)).toEqual([high.id, mid.id, low.id]);
  });

  it("no empate de percentual, a menor duração vence", () => {
    const slow = session({ score: 8, durationMs: 90_000 });
    const fast = session({ score: 8, durationMs: 45_000 });
    expect(buildRanking([slow, fast]).top.map((e) => e.sessionId)).toEqual([fast.id, slow.id]);
  });

  it("no empate de percentual e duração, a data mais antiga vence", () => {
    const later = session({ score: 8, finishedAt: "2026-10-02T10:00:00.000Z" });
    const earlier = session({ score: 8, finishedAt: "2026-10-01T10:00:00.000Z" });
    expect(buildRanking([later, earlier]).top.map((e) => e.sessionId)).toEqual([earlier.id, later.id]);
  });

  it("o percentual pesa mais que a duração", () => {
    const fastButWorse = session({ score: 7, durationMs: 10_000 });
    const slowButBetter = session({ score: 8, durationMs: 500_000 });
    expect(buildRanking([fastButWorse, slowButBetter]).top[0]?.sessionId).toBe(slowButBetter.id);
  });

  it("é estável quando tudo empata", () => {
    const a = session({ id: "a" });
    const b = session({ id: "b" });
    expect(buildRanking([b, a]).top.map((e) => e.sessionId)).toEqual(["a", "b"]);
  });

  it("ignora as rodadas que não entram no ranking", () => {
    const valid = session({ score: 3 });
    const retry = session({ score: 10, isRetry: true });
    const unfinished = session({ score: null, finishedAt: null, durationMs: null });
    expect(buildRanking([retry, unfinished, valid]).top.map((e) => e.sessionId)).toEqual([valid.id]);
  });
});

describe("buildRanking: Top 10 e posição do jogador (RF19/RF22)", () => {
  const sessions = Array.from({ length: 15 }, (_, i) => session({ score: 10 - Math.floor(i / 2), durationMs: 1000 * (i + 1) }));

  it("limita a 10 e numera as posições a partir de 1", () => {
    const { top } = buildRanking(sessions);
    expect(top).toHaveLength(10);
    expect(top.map((e) => e.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(top[0]).toMatchObject({ score: 10, total: 10, percent: 100 });
  });

  it("devolve a posição do jogador quando está no Top 10", () => {
    const target = sessions[2] as RankingSession;
    expect(buildRanking(sessions, { sessionId: target.id }).me).toMatchObject({ position: 3, sessionId: target.id });
  });

  it("devolve a posição do jogador quando está fora do Top 10", () => {
    const target = sessions[12] as RankingSession;
    const result = buildRanking(sessions, { sessionId: target.id });
    expect(result.top.some((e) => e.sessionId === target.id)).toBe(false);
    expect(result.me).toMatchObject({ position: 13, sessionId: target.id });
  });

  it("omite `me` para sessão desconhecida ou fora do ranking", () => {
    const retry = session({ isRetry: true });
    expect(buildRanking([...sessions, retry], { sessionId: retry.id })).not.toHaveProperty("me");
    expect(buildRanking(sessions, { sessionId: "nao-existe" })).not.toHaveProperty("me");
  });

  it("devolve listas vazias sem sessões", () => {
    expect(buildRanking([])).toEqual({ top: [] });
  });
});
