# PRD — Quiz Web de Engenharia de Dados

> Documento de requisitos para ser consumido pelo Claude Code na construção do projeto.
> Idioma da interface e do conteúdo: **português do Brasil**.

---

## 1. Visão geral

Aplicação web de quiz para **aprendizado de Engenharia de Dados**, do nível **iniciante ao intermediário**. Cada pergunta tem **quatro alternativas, sendo apenas uma correta**. Depois de responder, o usuário vê na hora se acertou. Se errou, vê a **alternativa correta**. Em ambos os casos, recebe uma **explicação** do porquê aquela é a resposta certa. O foco é aprender, não só medir conhecimento.

O usuário informa apenas o **nome**. O nome e a pontuação de cada rodada são gravados no **Supabase** e alimentam um **ranking Top 10** por tema e nível.

## 2. Objetivos

| # | Objetivo |
|---|----------|
| O1 | Ensinar conceitos de Engenharia de Dados com feedback imediato e explicativo. |
| O2 | Permitir estudo direcionado, com escolha de tema e nível. |
| O3 | Engajar com pontuação e um ranking público e simples, sem fricção de cadastro. |
| O4 | Permitir que o conteúdo (perguntas) seja mantido no banco sem novo deploy. |

### Fora de escopo (v1)

- Login, senha, cadastro ou contas de usuário (só o nome é pedido).
- Painel administrativo para editar perguntas (a edição é feita direto no Supabase ou por seed SQL).
- Cronômetro ou tempo limite por pergunta. O tempo total é **registrado** só como critério de desempate.
- Outros idiomas além de pt-BR.
- Aplicativo mobile nativo (o site deve ser responsivo).

## 3. Público-alvo

- **Estudantes** e pessoas migrando de carreira para Engenharia de Dados.
- **Profissionais juniores** se preparando para entrevistas e certificações.

A linguagem deve ser acessível, com termos técnicos em inglês quando forem o uso de mercado (ex.: *pipeline*, *data lake*), explicados quando necessário.

## 4. Conteúdo

### 4.1 Temas

| Código (`theme`) | Nome exibido | Exemplos de assunto |
|---|---|---|
| `fundamentos_sql` | Fundamentos e SQL | Modelagem relacional, chaves, normalização, JOINs, agregações, *window functions*, OLTP vs OLAP, índices |
| `pipelines` | Pipelines (ETL/ELT) | ETL vs ELT, batch vs streaming, orquestração (Airflow), idempotência, CDC, qualidade de dados, *backfill* |
| `armazenamento` | Data Warehouse, Lake e Lakehouse | Modelagem dimensional (Kimball: fato/dimensão, *star*/*snowflake*, SCD), data lake, lakehouse, arquitetura medalhão, Parquet/Avro/Delta/Iceberg |
| `big_data_cloud` | Big Data e Cloud | Spark (transformações vs ações, *lazy evaluation*, *shuffle*), particionamento, Kafka (tópicos, partições, *consumer groups*), serviços gerenciados de nuvem, custo e escalabilidade |

Além dos quatro temas, o usuário pode escolher **"Todos os temas"**, que sorteia perguntas de forma equilibrada entre eles.

### 4.2 Níveis

| Código (`level`) | Nome exibido | Critério |
|---|---|---|
| `iniciante` | Iniciante | Definições, conceitos básicos, "o que é", diferenças diretas entre dois conceitos. |
| `intermediario` | Intermediário | Aplicação em cenários, escolha da melhor abordagem, trade-offs, interpretação de SQL ou de saídas. |

### 4.3 Banco inicial de perguntas

- **80 perguntas**: 4 temas × 2 níveis × **10 perguntas** por combinação.
- Entregues como **seed SQL** versionado no repositório (`supabase/seed.sql`).

### 4.4 Diretrizes de redação das perguntas

1. Exatamente **4 alternativas** e **apenas 1 correta**, sem ambiguidade.
2. Os distratores devem ser **plausíveis**: erros comuns ou confusões típicas, não opções absurdas.
3. Proibido usar "todas as anteriores", "nenhuma das anteriores" ou alternativas que dependam da ordem (as alternativas são embaralhadas).
4. As alternativas devem ter tamanho e estilo parecidos, para que a correta não se destaque por ser a mais longa.
5. **Explicação** de 2 a 5 frases: por que a correta está certa e, se possível, por que o principal distrator está errado.
6. Preferir conceitos **agnósticos de fornecedor**. Quando citar uma ferramenta (Airflow, Spark, Kafka), cobrar o conceito, não um detalhe de versão.
7. Código SQL dentro do enunciado deve ser curto (até cerca de 8 linhas) e exibido em bloco monoespaçado.
8. Português correto, sem gírias.

### 4.5 Exemplos (tom e formato esperados)

**Fundamentos e SQL · Iniciante**
> Qual a principal diferença entre sistemas OLTP e OLAP?
> - A) OLTP é otimizado para muitas transações curtas de leitura/escrita; OLAP, para consultas analíticas sobre grandes volumes ✅
> - B) OLTP armazena dados em colunas; OLAP armazena dados em linhas
> - C) OLTP só funciona na nuvem; OLAP só funciona on-premises
> - D) OLTP não suporta SQL; OLAP suporta SQL
>
> **Explicação:** sistemas OLTP (ex.: o banco de um e-commerce) atendem a muitas operações pequenas e concorrentes, como inserir um pedido. Sistemas OLAP (ex.: um data warehouse) são feitos para agregações sobre milhões de linhas. A alternativa B inverte a realidade: o armazenamento colunar é típico de OLAP.

**Pipelines · Intermediário**
> Um job diário de carga falhou no meio da execução e será reexecutado. Qual propriedade garante que a reexecução não duplique registros no destino?
> - A) Idempotência ✅
> - B) Paralelismo
> - C) Particionamento
> - D) Compressão
>
> **Explicação:** um pipeline idempotente produz o mesmo resultado não importa quantas vezes seja executado com a mesma entrada, por exemplo com *MERGE/upsert* ou sobrescrevendo a partição do dia. Paralelismo e particionamento melhoram desempenho, mas sozinhos não evitam duplicidade.

## 5. Jornada do usuário e requisitos funcionais

### 5.1 Fluxo

```
[Início] → nome + tema + nível → [Quiz: 10 perguntas] → [Resultado + revisão] → [Ranking]
                                                         ↘ Jogar novamente / Refazer
```

### 5.2 Requisitos

**Tela Inicial (`/`)**
- RF01: campo **Nome** obrigatório, com 2 a 30 caracteres depois de `trim`, sem caracteres de controle nem HTML. Pré-preenchido com o último nome usado (salvo em `localStorage`).
- RF02: seleção de **Tema**: os 4 temas ou "Todos os temas".
- RF03: seleção de **Nível**: Iniciante ou Intermediário.
- RF04: botão **"Começar"**, habilitado só com o nome válido. Link para a tela de **Ranking**.

**Tela do Quiz (`/quiz/[sessionId]`)**
- RF05: cada rodada tem **10 perguntas** sorteadas no servidor, **sem repetição** na rodada, conforme tema e nível. Com "Todos os temas", o sorteio é equilibrado (2 ou 3 por tema).
- RF06: se a combinação tiver menos de 10 perguntas ativas, a rodada usa todas as disponíveis e o total exibido reflete isso.
- RF07: mostrar o progresso ("Pergunta 3 de 10"), o tema da pergunta e o enunciado.
- RF08: as 4 alternativas são exibidas em **ordem embaralhada** a cada rodada e rotuladas A–D.
- RF09: o usuário seleciona uma alternativa e clica em **"Confirmar"**. A resposta não pode ser alterada depois de confirmada.
- RF10: **feedback imediato** depois de confirmar:
  - Acerto: alternativa destacada em verde, mensagem "Correto!" e **explicação**.
  - Erro: alternativa escolhida em vermelho, **alternativa correta em verde**, mensagem "Incorreto" e **explicação**.
- RF11: botão **"Próxima"** (na última pergunta, **"Ver resultado"**).
- RF12: atalhos de teclado: `1`–`4` ou `A`–`D` selecionam, `Enter` confirma e avança.
- RF13: se a página for recarregada no meio da rodada, ela retoma a partir da próxima pergunta não respondida, com o estado vindo do servidor.

**Tela de Resultado (`/resultado/[sessionId]`)**
- RF14: mostrar a pontuação (`acertos/total`), o percentual e uma mensagem de desempenho por faixa (ex.: ≥ 80% "Excelente", 50–79% "Bom caminho", < 50% "Continue praticando").
- RF15: com "Todos os temas", mostrar o desempenho **por tema**.
- RF16: **revisão completa** com cada pergunta, a resposta do usuário, a correta e a explicação, com filtro "Mostrar só as erradas".
- RF17: a pontuação é **gravada automaticamente** no Supabase ao concluir a rodada (sem ação extra do usuário).
- RF18: botões **"Jogar novamente"** (mesmo tema e nível, novo sorteio), **"Refazer só as erradas"** (nova rodada com as perguntas erradas, **não entra no ranking**), **"Ver ranking"** e **"Início"**.

**Tela de Ranking (`/ranking`)**
- RF19: **Top 10** filtrável por **tema** (incluindo "Todos os temas") e **nível**. Mostra posição, nome, pontuação, percentual e data.
- RF20: ordem: maior percentual de acerto → menor duração da rodada → data mais antiga.
- RF21: só entram rodadas **concluídas**, completas (10 perguntas) e que não sejam "refazer erradas".
- RF22: se o usuário acabou de jogar, destacar a linha dele quando estiver no Top 10. Se não estiver, mostrar a posição dele abaixo da tabela.

## 6. Requisitos não funcionais

- RNF01 **Responsivo** e *mobile-first* (de 360px a desktop). Botões de alternativa com área de toque ≥ 44px.
- RNF02 **Acessibilidade**: navegação completa por teclado, foco visível, `aria-live="polite"` no feedback, contraste AA, cor nunca como único indicador (usar ícone ✓/✗ e texto).
- RNF03 **Integridade da pontuação**: o gabarito (`correct_index`) **nunca** é enviado ao cliente antes da confirmação da resposta, e a pontuação é calculada **somente no servidor**.
- RNF04 **Segurança**: a chave `service_role` do Supabase só existe no servidor. RLS fica habilitado em todas as tabelas.
- RNF05 **Desempenho**: carregamento inicial abaixo de 2s em 4G, e transição entre perguntas sem recarregar a página.
- RNF06 **Tema claro e escuro**, seguindo `prefers-color-scheme`.
- RNF07 Limite simples de abuso: no máximo 30 rodadas iniciadas por IP a cada hora (em memória ou tabela). Se não for viável na v1, documentar como pendência.

## 7. Arquitetura técnica

### 7.1 Stack

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js** (versão estável mais recente, **App Router**) |
| Linguagem | **TypeScript** (`strict: true`) |
| Estilo | **Tailwind CSS** |
| Banco | **Supabase** (Postgres) |
| Cliente do banco | `@supabase/supabase-js`, usado **apenas no servidor** |
| Validação | `zod` |
| Testes unitários | **Vitest** |
| Testes E2E | **Playwright** (fluxo principal) |
| Hospedagem | **Vercel** (premissa; qualquer host compatível com Next.js serve) |

### 7.2 Decisão de arquitetura: tudo pelo servidor

O navegador **não acessa o Supabase diretamente**. Todas as operações passam por **Route Handlers** do Next.js (`app/api/...`) ou **Server Actions**, que usam a `service_role`. Com isso:

- o gabarito fica protegido até a confirmação de cada resposta;
- ninguém consegue inserir pontuações forjadas no ranking;
- o RLS pode ficar fechado para `anon` (nenhuma policy pública).

### 7.3 Modelo de dados (Supabase / Postgres)

```sql
create type quiz_theme as enum ('fundamentos_sql', 'pipelines', 'armazenamento', 'big_data_cloud');
create type quiz_level as enum ('iniciante', 'intermediario');

create table questions (
  id            uuid primary key default gen_random_uuid(),
  theme         quiz_theme  not null,
  level         quiz_level  not null,
  statement     text        not null,           -- enunciado (aceita Markdown simples / bloco de código)
  options       text[]      not null check (array_length(options, 1) = 4),
  correct_index smallint    not null check (correct_index between 0 and 3),
  explanation   text        not null,
  active        boolean     not null default true,
  created_at    timestamptz not null default now()
);
create index on questions (theme, level) where active;

create table quiz_sessions (
  id            uuid primary key default gen_random_uuid(),
  player_name   text        not null check (char_length(player_name) between 2 and 30),
  theme         quiz_theme,                     -- null = "Todos os temas"
  level         quiz_level  not null,
  question_ids  uuid[]      not null,           -- ordem sorteada da rodada
  is_retry      boolean     not null default false, -- "refazer erradas": fora do ranking
  score         smallint,                       -- preenchido ao concluir
  total         smallint    not null,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  duration_ms   integer
);
create index on quiz_sessions (theme, level, finished_at) where finished_at is not null and not is_retry;

create table session_answers (
  session_id     uuid     not null references quiz_sessions(id) on delete cascade,
  question_id    uuid     not null references questions(id),
  selected_index smallint not null check (selected_index between 0 and 3),
  is_correct     boolean  not null,
  answered_at    timestamptz not null default now(),
  primary key (session_id, question_id)         -- impede responder duas vezes
);

alter table questions       enable row level security;
alter table quiz_sessions   enable row level security;
alter table session_answers enable row level security;
-- Sem policies para anon/authenticated: acesso só via service_role no servidor.
```

O ranking pode ser servido por uma **view** (`ranking_view`) ou por uma consulta no servidor que aplique as regras RF20 e RF21.

`selected_index` e `correct_index` se referem sempre à **ordem original** armazenada em `options`. O embaralhamento é só de apresentação: o cliente recebe as alternativas com o índice original e envia esse índice de volta.

### 7.4 API (Route Handlers)

| Método e rota | Entrada | Saída | Regras |
|---|---|---|---|
| `POST /api/sessions` | `{ playerName, theme \| null, level, retryOf?: sessionId }` | `{ sessionId }` | Valida com zod, sorteia as perguntas (RF05/RF06) ou, com `retryOf`, usa as erradas daquela sessão (`is_retry = true`). |
| `GET /api/sessions/:id` | — | `{ session, questions: [{ id, theme, statement, options: [{ index, text }] }], answers: [...] }` | **Sem `correct_index`** nas perguntas ainda não respondidas. Nas já respondidas, devolve `correctIndex` e `explanation` (para RF13). |
| `POST /api/sessions/:id/answers` | `{ questionId, selectedIndex }` | `{ isCorrect, correctIndex, explanation }` | Rejeita se a sessão estiver concluída, se a pergunta não for da sessão ou se já tiver sido respondida (409). |
| `POST /api/sessions/:id/finish` | — | `{ score, total, percent, rank? }` | Exige todas respondidas. Calcula `score` a partir de `session_answers`, grava `finished_at` e `duration_ms`. Idempotente. |
| `GET /api/ranking?theme=&level=` | filtros | `{ top: [...], me?: { position, ... } }` | Top 10 conforme RF20/RF21. `me` é calculado a partir de um `sessionId` opcional. |

Erros retornam JSON `{ error: { code, message } }` com status HTTP adequado (400, 404, 409, 429, 500), e as mensagens ao usuário ficam em pt-BR.

### 7.5 Estrutura de pastas sugerida

```
Quiz/
├─ .llm/prd.md
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                       # Início
│  │  ├─ quiz/[sessionId]/page.tsx      # Quiz
│  │  ├─ resultado/[sessionId]/page.tsx # Resultado + revisão
│  │  ├─ ranking/page.tsx               # Ranking
│  │  └─ api/...                        # Route Handlers (seção 7.4)
│  ├─ components/                       # QuestionCard, OptionButton, Feedback, ProgressBar, RankingTable...
│  ├─ lib/
│  │  ├─ supabase/server.ts             # cliente com service_role (import 'server-only')
│  │  ├─ quiz/                          # lógica pura, SEM dependência de Next/Supabase
│  │  │  ├─ draw.ts                     # sorteio equilibrado (RF05/RF06)
│  │  │  ├─ shuffle.ts                  # embaralhamento de alternativas
│  │  │  ├─ score.ts                    # pontuação, percentual, faixa de desempenho
│  │  │  └─ ranking.ts                  # ordenação/desempate (RF20)
│  │  ├─ validation.ts                  # schemas zod (nome, tema, nível, payloads)
│  │  └─ labels.ts                      # nomes exibidos de temas/níveis em pt-BR
│  └─ types/
├─ supabase/
│  ├─ migrations/0001_init.sql          # seção 7.3
│  └─ seed.sql                          # 80 perguntas (seção 4)
├─ tests/
│  ├─ unit/                             # Vitest: lib/quiz e validation
│  ├─ seed/                             # Vitest: valida integridade do seed
│  └─ e2e/                              # Playwright: fluxo completo
├─ .env.example
└─ CLAUDE.md                            # gerar ao final com comandos e arquitetura
```

### 7.6 Variáveis de ambiente

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=   # somente servidor; nunca prefixar com NEXT_PUBLIC_
```

### 7.7 Testes obrigatórios

- **Unitários (`lib/quiz`)**: o sorteio não repete perguntas, respeita tema e nível, equilibra "Todos os temas" e lida com menos de 10 perguntas disponíveis. O embaralhamento preserva o mapeamento para o índice original. A pontuação e as faixas de desempenho são calculadas corretamente. A ordenação do ranking com desempate segue RF20.
- **Validação**: o nome é rejeitado com menos de 2 caracteres, mais de 30, só espaços ou HTML.
- **Integridade do seed**: um teste que lê `seed.sql` (ou um JSON-fonte que o gera) e verifica que há 10 perguntas por tema e nível, 4 alternativas únicas por pergunta, `correct_index` entre 0 e 3, explicação não vazia e nenhuma alternativa do tipo "todas as anteriores".
- **E2E (Playwright)**: informar o nome, escolher tema e nível, responder 10 perguntas (vendo o feedback e a explicação), ver o resultado, a revisão e o ranking. Inclui um caso de erro em que a alternativa correta aparece destacada.

## 8. UX e interface

- Visual limpo, com foco em leitura: card central com o enunciado e quatro botões grandes de alternativa.
- Estados do botão de alternativa: normal, selecionado, correto (verde + ✓), incorreto (vermelho + ✗) e desabilitado depois de confirmar.
- Painel de explicação logo abaixo das alternativas depois de confirmar, com o título "Por que esta é a resposta correta?".
- Barra de progresso no topo da tela do quiz.
- Ranking em tabela com os filtros no topo. No mobile, vira lista.
- Microcopy em pt-BR, tratando o usuário por "você".

## 9. Métricas de sucesso

- Taxa de conclusão da rodada (iniciadas → concluídas) ≥ 70%.
- Percentual médio de rodadas "Jogar novamente" ou "Refazer só as erradas" ≥ 30%.
- Nenhum registro no ranking com pontuação inconsistente com `session_answers`.

## 10. Plano de entrega (ordem sugerida para o Claude Code)

1. **Setup**: projeto Next.js + TS + Tailwind, ESLint, Vitest, Playwright, `.env.example`.
2. **Banco**: migration (7.3) e seed com as 80 perguntas seguindo as diretrizes da seção 4.4, mais o teste de integridade do seed.
3. **Lógica pura** (`lib/quiz`, `validation`) com testes unitários.
4. **API** (7.4) usando o cliente Supabase do servidor.
5. **Telas**: Início → Quiz → Resultado → Ranking.
6. **Acessibilidade, responsividade, tema escuro e atalhos de teclado.**
7. **E2E** e um `CLAUDE.md` com comandos e visão da arquitetura.

## 11. Critérios de aceite (v1)

- [ ] O usuário consegue jogar uma rodada de 10 perguntas informando só o nome, o tema e o nível.
- [ ] Toda pergunta mostra a explicação depois de confirmar. No erro, a alternativa correta aparece destacada.
- [ ] O resultado exibe a pontuação e a revisão completa, e a rodada fica salva no Supabase.
- [ ] O ranking Top 10 funciona por tema e nível, com o desempate correto.
- [ ] O gabarito não aparece em nenhuma resposta da API antes da confirmação (verificável no DevTools).
- [ ] O seed contém 80 perguntas válidas (10 por tema e nível), e todos os testes passam.

## 12. Premissas e pontos em aberto

- **Hospedagem na Vercel** e **projeto Supabase** criados pelo usuário. O Claude Code entrega a migration e o seed, e o usuário os aplica (via Supabase CLI ou SQL Editor).
- Não há moderação de nomes ofensivos na v1. Possível evolução: lista de bloqueio.
- Possíveis evoluções: painel admin de perguntas, mais níveis (avançado), modo estudo sem pontuação, compartilhamento do resultado, ampliação do banco para 160 perguntas.
