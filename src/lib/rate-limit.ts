/**
 * Limite simples por chave em janela deslizante, em memória (RNF07).
 * Limitação conhecida: cada instância do servidor tem a própria contagem, então em hospedagem
 * serverless com várias instâncias o limite efetivo é maior. Suficiente para a v1; ver README.
 */
export interface RateLimiter {
  /** Registra uma tentativa e diz se ela está dentro do limite. */
  take(key: string): { allowed: boolean; retryAfterMs: number };
}

export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: {
  limit: number;
  windowMs: number;
  now?: () => number;
}): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    take(key) {
      const current = now();
      const recent = (hits.get(key) ?? []).filter((t) => current - t < windowMs);

      if (recent.length >= limit) {
        hits.set(key, recent);
        return { allowed: false, retryAfterMs: windowMs - (current - (recent[0] ?? current)) };
      }

      recent.push(current);
      hits.set(key, recent);
      // Evita crescer sem limite: de vez em quando, descarta chaves sem tentativas recentes.
      if (hits.size > 10_000) {
        for (const [k, times] of hits) if (times.every((t) => current - t >= windowMs)) hits.delete(k);
      }
      return { allowed: true, retryAfterMs: 0 };
    },
  };
}
