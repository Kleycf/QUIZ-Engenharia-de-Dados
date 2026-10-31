import { defineConfig, devices } from "@playwright/test";

// Os testes leem o gabarito e limpam os dados direto no Supabase (só no processo de teste, nunca no app).
try {
  process.loadEnvFile(".env.local");
} catch {
  // Sem .env.local (ex.: CI com variáveis já definidas): segue com o ambiente atual.
}

// IP aleatório por execução: o limite de 30 rodadas/hora por IP (RNF07) não acumula entre execuções.
const runIp = `198.18.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  timeout: 90_000,
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
    extraHTTPHeaders: { "x-forwarded-for": runIp },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Build de produção: é o que vai para a Vercel (prerender, Suspense e streaming como em produção).
    command: "npm run build && npm run start -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
