import { ApiError, clientIp, json, readJson, toErrorResponse } from "@/lib/api/http";
import { createRateLimiter } from "@/lib/rate-limit";
import { createSession } from "@/lib/server/quiz";
import { createSessionSchema } from "@/lib/validation";

// RNF07: no máximo 30 rodadas iniciadas por IP por hora (em memória, por instância).
const limiter = createRateLimiter({ limit: 30, windowMs: 60 * 60 * 1000 });

export async function POST(request: Request) {
  try {
    const input = createSessionSchema.parse(await readJson(request));

    const { allowed, retryAfterMs } = limiter.take(clientIp(request));
    if (!allowed) {
      throw new ApiError(429, "RATE_LIMITED", "Você iniciou muitas rodadas na última hora. Tente novamente mais tarde.", {
        "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
      });
    }

    return json(await createSession(input), 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
