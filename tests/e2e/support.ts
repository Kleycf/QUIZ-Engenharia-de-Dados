import AxeBuilder from "@axe-core/playwright";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Pula a suíte quando não há Supabase configurado (os testes usam o banco real). */
export function requireDatabase() {
  test.skip(!SUPABASE_URL || !SERVICE_KEY, "Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.env.local) para rodar o E2E.");
}

async function rest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY ?? "", Authorization: `Bearer ${SERVICE_KEY}`, ...init.headers },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res;
}

/** Gabarito lido do banco. Só o teste conhece: o navegador nunca recebe isso antes de responder. */
export async function correctIndexOf(questionId: string): Promise<number> {
  const rows = (await (await rest(`questions?select=correct_index&id=eq.${questionId}`)).json()) as {
    correct_index: number;
  }[];
  const row = rows[0];
  if (!row) throw new Error(`Pergunta ${questionId} não encontrada`);
  return row.correct_index;
}

/** Apaga as rodadas (e, em cascata, as respostas) criadas por um teste. */
export async function deleteSessionsOf(playerName: string) {
  await rest(`quiz_sessions?player_name=eq.${encodeURIComponent(playerName)}`, { method: "DELETE" });
}

/** Nome único por teste (≤ 30 caracteres), para isolar e limpar os dados. */
export const uniqueName = (prefix: string) => `E2E ${prefix} ${Math.random().toString(36).slice(2, 8)}`;

/** Id da pergunta exibida: vem do `name` dos radios (`resposta-<id>`). */
export async function currentQuestionId(page: Page): Promise<string> {
  const name = await page.getByRole("radio").first().getAttribute("name");
  return (name ?? "").replace("resposta-", "");
}

/** Clica na alternativa cujo índice original é `index` (a posição na tela é embaralhada). */
export async function chooseOption(page: Page, index: number) {
  await page.locator("label", { has: page.locator(`input[type=radio][value="${index}"]`) }).click();
}

/** Posição na tela (0–3) da alternativa com índice original `index`. */
export async function positionOf(page: Page, index: number): Promise<number> {
  const values = await page.getByRole("radio").evaluateAll((els) => els.map((el) => Number((el as HTMLInputElement).value)));
  return values.indexOf(index);
}

/** Zero violações de WCAG 2.2 AA (e boas práticas) do axe. */
export async function expectAccessible(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
    .analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

// --- Atalhos pela API (para preparar cenários sem clicar em tudo) ------------------------------

interface ApiQuestion {
  id: string;
}

export async function createSessionViaApi(
  request: APIRequestContext,
  body: { playerName: string; theme: string | null; level: string; retryOf?: string },
): Promise<string> {
  const res = await request.post("/api/sessions", { data: body });
  expect(res.status(), await res.text()).toBe(201);
  return ((await res.json()) as { sessionId: string }).sessionId;
}

export async function questionsViaApi(request: APIRequestContext, sessionId: string): Promise<ApiQuestion[]> {
  const res = await request.get(`/api/sessions/${sessionId}`);
  expect(res.ok()).toBe(true);
  return ((await res.json()) as { questions: ApiQuestion[] }).questions;
}

/** Responde pela API, acertando ou errando de propósito (com o gabarito lido do banco). */
export async function answerViaApi(request: APIRequestContext, sessionId: string, questionId: string, correct: boolean) {
  const right = await correctIndexOf(questionId);
  const selectedIndex = correct ? right : (right + 1) % 4;
  const res = await request.post(`/api/sessions/${sessionId}/answers`, { data: { questionId, selectedIndex } });
  expect(res.status()).toBe(201);
}
