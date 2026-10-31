// Chamadas do navegador à nossa API (nunca ao Supabase). Erros viram ApiClientError com mensagem em pt-BR.

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const NETWORK_ERROR = "Não foi possível falar com o servidor. Verifique sua conexão e tente novamente.";

export async function apiFetch<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: init.method ?? "GET",
      headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
  } catch {
    throw new ApiClientError(0, "NETWORK_ERROR", NETWORK_ERROR);
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (data as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiClientError(response.status, error?.code ?? "UNKNOWN", error?.message ?? NETWORK_ERROR);
  }
  return data as T;
}
