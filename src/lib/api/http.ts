import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import { sessionIdSchema } from "@/lib/validation";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_JSON"
  | "SESSION_NOT_FOUND"
  | "NO_QUESTIONS"
  | "NOTHING_TO_RETRY"
  | "RETRY_SOURCE_NOT_FINISHED"
  | "SESSION_FINISHED"
  | "QUESTION_NOT_IN_SESSION"
  | "ALREADY_ANSWERED"
  | "NOT_ALL_ANSWERED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

/** Erro esperado da API: vira `{ error: { code, message } }` com o status dado. Mensagem em pt-BR, para o usuário. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly headers: Record<string, string>;

  constructor(status: number, code: ApiErrorCode, message: string, headers: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.headers = headers;
  }
}

export const sessionNotFound = () => new ApiError(404, "SESSION_NOT_FOUND", "Rodada não encontrada.");

/** Resposta JSON da API. `no-store`: estado de rodada e ranking nunca podem vir de cache. */
export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

/**
 * Converte qualquer erro em resposta JSON. Erros inesperados são logados e não vazam detalhes.
 * Erros internos do Next (ex.: o sinal de "sair do prerender" ao ler request.url) são relançados, não tratados.
 */
export function toErrorResponse(error: unknown): Response {
  unstable_rethrow(error);
  if (error instanceof ApiError) {
    return json({ error: { code: error.code, message: error.message } }, error.status, error.headers);
  }
  if (error instanceof ZodError) {
    const message = error.issues[0]?.message ?? "Dados inválidos.";
    return json({ error: { code: "VALIDATION_ERROR", message } }, 400);
  }
  console.error("[api] erro inesperado:", error);
  return json(
    { error: { code: "INTERNAL_ERROR", message: "Algo deu errado do nosso lado. Tente novamente em instantes." } },
    500,
  );
}

/** Lê o corpo como JSON, com erro 400 em pt-BR se não for JSON válido. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "O corpo da requisição precisa ser um JSON válido.");
  }
}

/** Valida o `:id` da rota. Um id malformado é tratado como rodada inexistente (404), não como erro de entrada. */
export function parseSessionId(id: string): string {
  const parsed = sessionIdSchema.safeParse(id);
  if (!parsed.success) throw sessionNotFound();
  return parsed.data;
}

/** IP do cliente para o limite de abuso. Atrás de proxy (Vercel), o primeiro item de x-forwarded-for. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "desconhecido";
}
