/** Fonte de aleatoriedade no intervalo [0, 1), como `Math.random`. Injetável para testes. */
export type Random = () => number;

/** Fisher–Yates: devolve uma cópia embaralhada, sem alterar o array original. */
export function shuffle<T>(items: readonly T[], random: Random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

/**
 * Gerador determinístico a partir de uma string (hash xmur3 + mulberry32).
 * Com a semente `${sessionId}:${questionId}`, a ordem das alternativas muda a cada rodada (RF08)
 * mas se mantém igual quando a página é recarregada no meio da rodada (RF13). Não é criptográfico.
 */
export function seededRandom(seed: string): Random {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  let state = (h ^ (h >>> 16)) >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Alternativa como o cliente a recebe: `index` é sempre a posição original em `questions.options`. */
export interface PresentedOption {
  index: number;
  text: string;
}

/** Embaralha só a apresentação; a resposta enviada de volta é o `index` original. */
export function shuffleOptions(options: readonly string[], random: Random = Math.random): PresentedOption[] {
  return shuffle(
    options.map((text, index) => ({ index, text })),
    random,
  );
}
