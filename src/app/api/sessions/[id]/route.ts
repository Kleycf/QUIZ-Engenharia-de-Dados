import { json, parseSessionId, toErrorResponse } from "@/lib/api/http";
import { getSessionState } from "@/lib/server/quiz";

export async function GET(_request: Request, ctx: RouteContext<"/api/sessions/[id]">) {
  try {
    const sessionId = parseSessionId((await ctx.params).id);
    return json(await getSessionState(sessionId));
  } catch (error) {
    return toErrorResponse(error);
  }
}
