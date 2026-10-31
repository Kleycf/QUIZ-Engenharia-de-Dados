# Quiz de Engenharia de Dados

Quiz web para aprender Engenharia de Dados, do nível iniciante ao intermediário. Cada pergunta tem quatro alternativas e uma explicação depois da resposta. A pontuação alimenta um ranking Top 10 por tema e nível.

A especificação completa está em [`.llm/prd.md`](.llm/prd.md).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres) · Zod · Vitest · Playwright

## Requisitos

- Node.js 24 ou superior e npm
- Um projeto no [Supabase](https://supabase.com)

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env.local` e preencha com os dados do seu projeto Supabase (*Project Settings → API*):

   ```
   SUPABASE_URL=https://<seu-projeto>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service role key>
   ```

   A `service_role` é usada **somente no servidor**. Nunca use o prefixo `NEXT_PUBLIC_` nela.

3. Aplique o banco no Supabase, pela CLI ou colando no *SQL Editor*, nesta ordem:
   1. `supabase/migrations/*.sql` (tabelas, tipos e RLS)
   2. `supabase/seed.sql` (80 perguntas; pode ser reaplicado sem duplicar)

4. Rode o servidor de desenvolvimento e abra http://localhost:3000:

   ```bash
   npm run dev
   ```

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | Gera os tipos de rota do Next e roda o `tsc` |
| `npm test` | Testes unitários e de integridade do seed (Vitest) |
| `npm run db:seed` | Gera `supabase/seed.sql` a partir de `supabase/questions/*.json` |
| `npm run test:e2e` | Testes E2E (Playwright, porta 3100) |

Antes do primeiro `npm run test:e2e` numa máquina nova, instale o navegador:

```bash
npx playwright install chromium
```

## Estrutura

```
src/app/            páginas e Route Handlers (api/)
src/lib/quiz/       lógica pura: sorteio, embaralhamento, pontuação, ranking
src/lib/supabase/   cliente Supabase do servidor
supabase/           migrations, seed.sql e questions/ (fonte das perguntas)
scripts/            build-seed.ts (gera o seed.sql)
tests/              unit/, seed/ e e2e/
```
