import { ROUND_SIZE, type Theme } from "./domain";
import { shuffle, type Random } from "./shuffle";

/** Pergunta ativa elegível para o sorteio (já filtrada por nível na consulta). */
export interface DrawCandidate {
  id: string;
  theme: Theme;
}

export interface DrawOptions {
  size?: number;
  random?: Random;
}

/**
 * Sorteia os ids da rodada, sem repetição (RF05).
 * - Com um tema: até `size` perguntas daquele tema.
 * - Com `theme = null` ("Todos os temas"): distribui as vagas em rodízio entre os temas, em ordem
 *   aleatória, o que dá 2 ou 3 por tema com 4 temas e 10 vagas. Se um tema não tiver perguntas
 *   suficientes, as vagas dele passam para os outros.
 * Com menos de `size` perguntas disponíveis, devolve todas (RF06).
 */
export function drawQuestions(
  pool: readonly DrawCandidate[],
  theme: Theme | null,
  { size = ROUND_SIZE, random = Math.random }: DrawOptions = {},
): string[] {
  const unique = [...new Map(pool.map((q) => [q.id, q])).values()];

  if (theme !== null) {
    return shuffle(
      unique.filter((q) => q.theme === theme),
      random,
    )
      .slice(0, size)
      .map((q) => q.id);
  }

  const byTheme = new Map<Theme, DrawCandidate[]>();
  for (const q of shuffle(unique, random)) {
    byTheme.set(q.theme, [...(byTheme.get(q.theme) ?? []), q]);
  }

  const themes = shuffle([...byTheme.keys()], random);
  const quota = new Map<Theme, number>(themes.map((t) => [t, 0]));
  let allocated = 0;
  let progressed = true;
  while (allocated < size && progressed) {
    progressed = false;
    for (const t of themes) {
      const current = quota.get(t) ?? 0;
      if (allocated < size && current < (byTheme.get(t)?.length ?? 0)) {
        quota.set(t, current + 1);
        allocated++;
        progressed = true;
      }
    }
  }

  const picked = themes.flatMap((t) => (byTheme.get(t) ?? []).slice(0, quota.get(t) ?? 0));
  return shuffle(picked, random).map((q) => q.id);
}
