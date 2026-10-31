import "server-only";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/http";
import type { SessionState } from "@/lib/quiz/session-state";
import { getSessionState } from "@/lib/server/quiz";
import { sessionIdSchema } from "@/lib/validation";

/** Estado da rodada para páginas server-side; id inválido ou inexistente vira a página 404. */
export async function loadSessionStateOrNotFound(id: string): Promise<SessionState> {
  const parsed = sessionIdSchema.safeParse(id);
  if (!parsed.success) notFound();
  try {
    return await getSessionState(parsed.data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}
