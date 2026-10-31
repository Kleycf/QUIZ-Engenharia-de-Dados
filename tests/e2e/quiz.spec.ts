import { expect, test } from "@playwright/test";
import {
  answerViaApi,
  chooseOption,
  correctIndexOf,
  createSessionViaApi,
  currentQuestionId,
  deleteSessionsOf,
  expectAccessible,
  positionOf,
  questionsViaApi,
  requireDatabase,
  uniqueName,
} from "./support";

requireDatabase();

const reviewItems = (page: import("@playwright/test").Page) => page.locator("section ol > li");

test("fluxo completo: início, 10 perguntas com erro e acertos, resultado, revisão e ranking", async ({ page }) => {
  const name = uniqueName("fluxo");
  try {
    // --- Início ------------------------------------------------------------------------------
    await page.goto("/");
    await expectAccessible(page);
    const start = page.getByRole("button", { name: "Começar" });
    await expect(start).toBeDisabled();
    await page.getByLabel("Seu nome").fill(name);
    await page.getByRole("radio", { name: "Pipelines (ETL/ELT)" }).check();
    await page.getByRole("radio", { name: "Intermediário" }).check();
    await start.click();

    // --- Quiz --------------------------------------------------------------------------------
    await page.waitForURL(/\/quiz\//);
    const sessionId = page.url().split("/quiz/")[1] ?? "";
    await expect(page.getByRole("heading", { level: 1, name: "Pergunta 1 de 10" })).toBeVisible();
    // Next 16 mantém a página anterior montada e oculta (<Activity>): filtre pelo que está visível.
    await expect(page.getByText("Pipelines (ETL/ELT)").filter({ visible: true })).toBeVisible();
    // RNF03: o gabarito não está na página antes de responder.
    expect(await page.content()).not.toMatch(/correctIndex|"explanation"/);
    await expectAccessible(page);

    const feedback = page.locator('[aria-live="polite"]');
    for (let n = 1; n <= 10; n++) {
      await expect(page.getByRole("heading", { level: 1, name: `Pergunta ${n} de 10` })).toBeVisible();
      const questionId = await currentQuestionId(page);
      const right = await correctIndexOf(questionId);

      if (n === 1) {
        // Caso de erro do PRD: escolhe uma errada de propósito e confere o destaque da correta.
        const wrong = (right + 1) % 4;
        await chooseOption(page, wrong);
        await page.getByRole("button", { name: "Confirmar" }).click();
        await expect(feedback).toContainText("✗ Incorreto");
        const letter = "ABCD"[await positionOf(page, right)];
        await expect(feedback).toContainText(`A resposta correta é a alternativa ${letter}`);
        await expect(page.locator("label", { has: page.locator(`input[value="${right}"]`) })).toContainText("Resposta correta");
        await expect(page.locator("label", { has: page.locator(`input[value="${wrong}"]`) })).toContainText("Sua resposta");
        await expectAccessible(page);
      } else if (n === 2) {
        // RF12: teclado (número da posição + Enter).
        await page.locator("body").press(String((await positionOf(page, right)) + 1));
        await page.keyboard.press("Enter");
        await expect(feedback).toContainText("✓ Correto!");
      } else {
        await chooseOption(page, right);
        await page.getByRole("button", { name: "Confirmar" }).click();
        await expect(feedback).toContainText("✓ Correto!");
      }

      await expect(feedback).toContainText("Por que esta é a resposta correta?");
      await expect(page.getByRole("radio").first()).toBeDisabled(); // RF09: não dá para mudar

      if (n === 5) {
        // RNF03 pela API: com 5 respondidas, só elas trazem gabarito.
        const state = await (await page.request.get(`/api/sessions/${sessionId}`)).json();
        expect(state.answers).toHaveLength(5);
        expect(JSON.stringify(state.questions)).not.toMatch(/correct|explanation/i);
      }

      await page.getByRole("button", { name: n === 10 ? "Ver resultado" : "Próxima" }).click();
    }

    // --- Resultado e revisão ----------------------------------------------------------------
    await page.waitForURL(/\/resultado\//);
    await expect(page.getByText("9/10", { exact: true })).toBeVisible();
    await expect(page.getByText("90%", { exact: true })).toBeVisible();
    await expect(page.getByText("Excelente!")).toBeVisible();
    await expect(reviewItems(page)).toHaveCount(10);
    await page.getByLabel("Mostrar só as erradas (1)").check();
    await expect(reviewItems(page)).toHaveCount(1);
    await expect(reviewItems(page).first()).toContainText("✗ Você errou");
    await expect(reviewItems(page).first()).toContainText("Por que esta é a resposta correta?");
    await expectAccessible(page);

    // --- Ranking -----------------------------------------------------------------------------
    await page.getByRole("link", { name: "Ver ranking" }).click();
    await page.waitForURL(/\/ranking\?theme=pipelines&level=intermediario/);
    const mine = page.locator('tr[aria-current="true"]').or(page.getByText(/Sua posição:/));
    await expect(mine).toBeVisible();
    await expect(mine).toContainText(/você|Sua posição/);
    await expectAccessible(page);
  } finally {
    await deleteSessionsOf(name);
  }
});

test("refazer só as erradas: rodada só com as erradas, marcada como revisão", async ({ page, request }) => {
  const name = uniqueName("refazer");
  try {
    const sessionId = await createSessionViaApi(request, { playerName: name, theme: "fundamentos_sql", level: "iniciante" });
    const questions = await questionsViaApi(request, sessionId);
    const wrongIds = questions.slice(0, 2).map((q) => q.id);
    for (const [i, q] of questions.entries()) await answerViaApi(request, sessionId, q.id, i >= 2);
    expect((await request.post(`/api/sessions/${sessionId}/finish`)).ok()).toBe(true);

    await page.goto(`/resultado/${sessionId}`);
    await expect(page.getByText("8/10", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Refazer só as erradas (2)" }).click();

    await page.waitForURL((url) => url.pathname.startsWith("/quiz/") && !url.pathname.endsWith(sessionId));
    await expect(page.getByText("Revisão das erradas")).toBeVisible();
    const seen: string[] = [];
    for (let n = 1; n <= 2; n++) {
      await expect(page.getByRole("heading", { level: 1, name: `Pergunta ${n} de 2` })).toBeVisible();
      const questionId = await currentQuestionId(page);
      seen.push(questionId);
      await chooseOption(page, await correctIndexOf(questionId));
      await page.getByRole("button", { name: "Confirmar" }).click();
      await page.getByRole("button", { name: n === 2 ? "Ver resultado" : "Próxima" }).click();
    }
    expect(seen.sort()).toEqual([...wrongIds].sort());

    await page.waitForURL(/\/resultado\//);
    await expect(page.getByText("2/2", { exact: true })).toBeVisible();
    await expect(page.getByText(/Revisão das erradas \(fora do ranking\)/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Refazer só as erradas/ })).toHaveCount(0);
  } finally {
    await deleteSessionsOf(name);
  }
});

test("recarregar no meio da rodada retoma da próxima pergunta não respondida (RF13)", async ({ page, request }) => {
  const name = uniqueName("retomar");
  try {
    const sessionId = await createSessionViaApi(request, { playerName: name, theme: null, level: "intermediario" });
    const questions = await questionsViaApi(request, sessionId);
    for (const q of questions.slice(0, 3)) await answerViaApi(request, sessionId, q.id, true);

    await page.goto(`/quiz/${sessionId}`);
    await expect(page.getByRole("heading", { level: 1, name: "Pergunta 4 de 10" })).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
    const before = await page.getByRole("radio").allTextContents();

    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Pergunta 4 de 10" })).toBeVisible();
    expect(await page.getByRole("radio").allTextContents()).toEqual(before);
  } finally {
    await deleteSessionsOf(name);
  }
});

test("voltar ao início depois de começar não deixa o formulário travado", async ({ page }) => {
  const name = uniqueName("voltar");
  try {
    await page.goto("/");
    await page.getByLabel("Seu nome").fill(name);
    await page.getByRole("button", { name: "Começar" }).click();
    await page.waitForURL(/\/quiz\//);
    await expect(page.getByRole("heading", { level: 1, name: "Pergunta 1 de 10" })).toBeVisible();

    // Navegação no cliente (sem recarregar): o Next pode restaurar o formulário com o estado preservado.
    await page.getByRole("link", { name: "Quiz de Engenharia de Dados" }).click();
    await page.waitForURL((url) => url.pathname === "/");
    await expect(page.getByRole("button", { name: "Começar" })).toBeEnabled();
    await expect(page.getByLabel("Seu nome")).toHaveValue(name);
  } finally {
    await deleteSessionsOf(name);
  }
});

test("início valida o nome e lembra o último usado (RF01/RF04)", async ({ page }) => {
  await page.goto("/");
  const name = page.getByLabel("Seu nome");
  const start = page.getByRole("button", { name: "Começar" });

  await name.fill("A");
  await name.blur();
  await expect(page.getByText("O nome precisa ter pelo menos 2 caracteres.")).toBeVisible();
  await expect(start).toBeDisabled();

  await name.fill("<b>Ana</b>");
  await expect(page.getByText("O nome não pode conter os caracteres < ou >.")).toBeVisible();
  await expect(start).toBeDisabled();

  await name.fill("  Ana  ");
  await expect(start).toBeEnabled();

  await page.evaluate(() => localStorage.setItem("quiz:ultimo-nome", "Maria"));
  await page.reload();
  await expect(page.getByLabel("Seu nome")).toHaveValue("Maria");
});

test("rodada inexistente mostra a página 404 em pt-BR", async ({ page }) => {
  await page.goto("/resultado/00000000-0000-4000-8000-000000000000");
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Começar uma nova rodada" })).toBeVisible();
});
