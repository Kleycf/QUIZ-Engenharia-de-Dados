import { json, toErrorResponse } from "@/lib/api/http";
import { getRanking } from "@/lib/server/quiz";
import { rankingQuerySchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const query = rankingQuerySchema.parse({
      theme: params.get("theme") || undefined,
      level: params.get("level") ?? undefined,
      sessionId: params.get("sessionId") || undefined,
    });
    return json(await getRanking(query));
  } catch (error) {
    return toErrorResponse(error);
  }
}
