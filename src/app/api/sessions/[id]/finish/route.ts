import { json, parseSessionId, toErrorResponse } from "@/lib/api/http";
import { finishSession } from "@/lib/server/quiz";

export async function POST(_request: Request, ctx: RouteContext<"/api/sessions/[id]/finish">) {
  try {
    const sessionId = parseSessionId((await ctx.params).id);
    return json(await finishSession(sessionId));
  } catch (error) {
    return toErrorResponse(error);
  }
}
