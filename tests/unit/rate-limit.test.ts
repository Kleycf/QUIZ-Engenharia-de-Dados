import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

const HOUR = 60 * 60 * 1000;

function setup(limit = 3) {
  let time = 0;
  const limiter = createRateLimiter({ limit, windowMs: HOUR, now: () => time });
  return { limiter, advance: (ms: number) => (time += ms) };
}

describe("createRateLimiter (RNF07)", () => {
  it("permite até o limite e bloqueia a seguinte", () => {
    const { limiter } = setup(3);
    expect([1, 2, 3].map(() => limiter.take("ip").allowed)).toEqual([true, true, true]);
    expect(limiter.take("ip").allowed).toBe(false);
  });

  it("conta cada chave separadamente", () => {
    const { limiter } = setup(1);
    expect(limiter.take("ip-a").allowed).toBe(true);
    expect(limiter.take("ip-b").allowed).toBe(true);
    expect(limiter.take("ip-a").allowed).toBe(false);
  });

  it("libera de novo quando a tentativa mais antiga sai da janela", () => {
    const { limiter, advance } = setup(2);
    limiter.take("ip");
    advance(10 * 60 * 1000);
    limiter.take("ip");
    expect(limiter.take("ip").allowed).toBe(false);

    advance(50 * 60 * 1000); // a primeira tentativa completa 1 hora
    expect(limiter.take("ip").allowed).toBe(true);
    expect(limiter.take("ip").allowed).toBe(false);
  });

  it("informa quanto falta para liberar", () => {
    const { limiter, advance } = setup(1);
    limiter.take("ip");
    advance(15 * 60 * 1000);
    expect(limiter.take("ip")).toEqual({ allowed: false, retryAfterMs: 45 * 60 * 1000 });
  });

  it("tentativas bloqueadas não estendem o bloqueio", () => {
    const { limiter, advance } = setup(1);
    limiter.take("ip");
    for (let i = 0; i < 5; i++) {
      advance(10 * 60 * 1000);
      limiter.take("ip");
    }
    advance(10 * 60 * 1000); // 60 min desde a única tentativa aceita
    expect(limiter.take("ip").allowed).toBe(true);
  });
});
