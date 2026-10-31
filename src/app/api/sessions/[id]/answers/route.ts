import { json, parseSessionId, readJson, toErrorResponse } from "@/lib/api/http";
import { submitAnswer } from "@/lib/server/quiz";
import { answerSchema } from "@/lib/validation";

export async function POST(request: Request, ctx: RouteContext<"/api/sessions/[id]/answers">) {
  try {
    const sessionId = parseSessionId((await ctx.params).id);
    const input = answerSchema.parse(await readJson(request));
    return json(await submitAnswer(sessionId, input), 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
