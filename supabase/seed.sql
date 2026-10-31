-- Gerado por scripts/build-seed.ts a partir de supabase/questions/*.json. Não edite à mão: rode `npm run db:seed`.
-- 80 perguntas. Pode ser reaplicado: ids fixos + upsert.

begin;

insert into questions (id, theme, level, statement, options, correct_index, explanation) values
  -- fsql-ini-01
  ('b7b71d97-6d18-57d5-af4a-bcc1840eb9e7', 'fundamentos_sql', 'iniciante',
   'Qual a principal diferença entre sistemas OLTP e OLAP?',
   array['OLTP atende muitas transações curtas; OLAP atende consultas analíticas sobre grandes volumes', 'OLTP armazena os dados em colunas; OLAP armazena os dados sempre em linhas', 'OLTP só funciona em servidores locais; OLAP só funciona em serviços de nuvem', 'OLTP não aceita consultas em SQL; OLAP aceita consultas em SQL e em Python'],
   0,
   'Sistemas OLTP, como o banco de um e-commerce, atendem muitas operações pequenas e concorrentes, como inserir um pedido. Sistemas OLAP, como um data warehouse, são feitos para agregações sobre milhões de linhas. A opção sobre armazenamento inverte a realidade: o formato colunar é típico de OLAP.'),
  -- fsql-ini-02
  ('19278b78-8eb7-5036-b604-5432a76d2338', 'fundamentos_sql', 'iniciante',
   'Qual é o papel de uma chave primária (*primary key*) em uma tabela relacional?',
   array['Ligar a tabela a outra tabela, apontando para um registro dela', 'Identificar cada linha de forma única, sem valores nulos nem repetidos', 'Garantir que a tabela só possa ser lida por usuários autorizados', 'Acelerar as consultas que filtram por qualquer coluna da tabela'],
   1,
   'A chave primária garante unicidade e ausência de nulos, permitindo identificar cada registro sem ambiguidade. Apontar para um registro de outra tabela é o papel da chave estrangeira. Embora muitos bancos criem um índice para a chave primária, ela não acelera filtros em qualquer coluna.'),
  -- fsql-ini-03
  ('9705f76c-012e-53df-93f7-54d112d38905', 'fundamentos_sql', 'iniciante',
   'Em um modelo com as tabelas `clientes` e `pedidos`, para que serve a coluna `pedidos.cliente_id` declarada como chave estrangeira?',
   array['Garantir que cada cliente tenha no máximo um pedido registrado', 'Garantir que os pedidos sejam gravados na ordem de cadastro dos clientes', 'Garantir que cada pedido referencie um cliente que existe em `clientes`', 'Garantir que o identificador do pedido seja único na tabela `pedidos`'],
   2,
   'A chave estrangeira impõe integridade referencial: o banco rejeita um pedido cujo `cliente_id` não exista em `clientes`. Ela não limita quantos pedidos um cliente pode ter, pois a relação típica é de um para muitos. A unicidade do identificador do pedido é papel da chave primária de `pedidos`.'),
  -- fsql-ini-04
  ('70062a6a-040a-50b6-8d30-86462d5d17c2', 'fundamentos_sql', 'iniciante',
   'Qual a diferença entre `INNER JOIN` e `LEFT JOIN`?',
   array['O `LEFT JOIN` retorna apenas as linhas da esquerda que não têm correspondência', 'O `INNER JOIN` mantém todas as linhas das duas tabelas, com ou sem correspondência', 'O `INNER JOIN` exige que as duas tabelas tenham exatamente as mesmas colunas', 'O `LEFT JOIN` mantém todas as linhas da tabela da esquerda, mesmo sem correspondência'],
   3,
   'O `INNER JOIN` retorna só as linhas com correspondência nas duas tabelas. O `LEFT JOIN` preserva todas as linhas da tabela da esquerda e preenche com `NULL` as colunas da direita quando não há correspondência. Retornar só as linhas sem correspondência exige um filtro extra, como `WHERE direita.id IS NULL`.'),
  -- fsql-ini-05
  ('0c793a37-1bec-53aa-94fb-d314399bfc8f', 'fundamentos_sql', 'iniciante',
   'Qual a diferença entre `WHERE` e `HAVING` em uma consulta com `GROUP BY`?',
   array['`WHERE` filtra linhas antes do agrupamento; `HAVING` filtra grupos depois da agregação', '`WHERE` filtra grupos depois da agregação; `HAVING` filtra linhas antes do agrupamento', '`WHERE` só aceita colunas numéricas; `HAVING` aceita colunas de qualquer tipo de dado', '`WHERE` e `HAVING` são sinônimos, e a escolha entre eles é só uma questão de estilo'],
   0,
   'O `WHERE` é aplicado linha a linha, antes de o `GROUP BY` formar os grupos, por isso não pode usar funções de agregação. O `HAVING` é avaliado depois da agregação e serve para condições como `HAVING COUNT(*) > 10`. A opção que inverte os dois descreve a ordem contrária da execução lógica.'),
  -- fsql-ini-06
  ('32f770c7-eb14-5550-bdd8-2ccf1fceaffa', 'fundamentos_sql', 'iniciante',
   'Uma tabela tem 100 linhas, e a coluna `email` está nula em 20 delas. O que retornam `COUNT(*)` e `COUNT(email)`?',
   array['`COUNT(*)` retorna 80 e `COUNT(email)` retorna 100', '`COUNT(*)` retorna 100 e `COUNT(email)` retorna 80', 'Os dois retornam 100, pois contam todas as linhas', 'Os dois retornam 80, pois ignoram as linhas nulas'],
   1,
   '`COUNT(*)` conta linhas, independentemente do conteúdo das colunas. `COUNT(coluna)` conta apenas os valores não nulos daquela coluna. Por isso, as 20 linhas com `email` nulo ficam de fora só no segundo caso.'),
  -- fsql-ini-07
  ('e2c9200f-0b46-5d44-bf9b-e5e9b3e31fd1', 'fundamentos_sql', 'iniciante',
   'Qual é o principal objetivo da normalização em um modelo relacional?',
   array['Acelerar as consultas analíticas que agregam dados de muitas tabelas', 'Converter as colunas de texto em colunas numéricas mais compactas', 'Reduzir redundância e evitar anomalias de inserção, atualização e exclusão', 'Juntar todos os dados em uma tabela larga para simplificar as consultas'],
   2,
   'A normalização separa os dados em tabelas para que cada fato fique registrado em um só lugar. Assim, alterar o endereço de um cliente exige mudar uma linha, e não centenas. Juntar tudo em uma tabela larga é desnormalizar, prática comum em modelos analíticos, mas que aumenta a redundância.'),
  -- fsql-ini-08
  ('c7072040-bf63-5289-975c-372dbf5a2df9', 'fundamentos_sql', 'iniciante',
   'Para que serve um índice em uma tabela de banco de dados?',
   array['Garantir que nenhuma coluna da tabela aceite valores nulos ou repetidos', 'Compactar a tabela inteira para que ela ocupe menos espaço em disco', 'Registrar o histórico de todas as alterações feitas em cada linha', 'Acelerar buscas por certas colunas, ao custo de mais espaço e escritas mais lentas'],
   3,
   'Um índice é uma estrutura auxiliar, geralmente uma árvore B, que permite localizar linhas sem varrer a tabela inteira. Em troca, ocupa espaço e torna inserções e atualizações um pouco mais lentas, pois o índice também precisa ser mantido. Ele não impõe restrições de nulidade; isso é papel de `NOT NULL` e das chaves.'),
  -- fsql-ini-09
  ('27aaaffa-6eda-5026-8ab9-7574485c4143', 'fundamentos_sql', 'iniciante',
   'O que faz a consulta abaixo?

```sql
SELECT DISTINCT cidade
FROM clientes;
```',
   array['Lista cada cidade uma única vez, sem repetições', 'Lista apenas as cidades que aparecem uma única vez', 'Conta quantos clientes existem em cada uma das cidades', 'Lista as cidades em ordem alfabética, com repetições'],
   0,
   '`DISTINCT` elimina linhas duplicadas do resultado, então cada cidade aparece uma vez, não importa quantos clientes morem nela. Listar só as cidades que aparecem uma vez exigiria `GROUP BY cidade HAVING COUNT(*) = 1`. O `DISTINCT` também não garante ordenação; para isso é preciso `ORDER BY`.'),
  -- fsql-ini-10
  ('1f6ccc9a-643b-5f95-b040-07c258780dbb', 'fundamentos_sql', 'iniciante',
   'Qual condição seleciona corretamente as linhas em que a coluna `data_cancelamento` não foi preenchida?',
   array['`WHERE data_cancelamento = NULL`', '`WHERE data_cancelamento IS NULL`', '`WHERE data_cancelamento = ''''`', '`WHERE data_cancelamento = 0`'],
   1,
   'Em SQL, `NULL` representa a ausência de valor, e qualquer comparação com `=` contra `NULL` resulta em desconhecido, nunca em verdadeiro. Por isso `= NULL` não retorna nenhuma linha. O operador correto é `IS NULL`, ou `IS NOT NULL` para o caso contrário.'),
  -- fsql-int-01
  ('6d3a4854-af00-5053-8287-474d1d59d2d8', 'fundamentos_sql', 'intermediario',
   'Três vendedores empatam com o maior valor de vendas. Qual a diferença entre `ROW_NUMBER()` e `RANK()` ordenando por vendas decrescentes?',
   array['`RANK()` dá 1 aos três e pula para 4; `ROW_NUMBER()` numera 1, 2 e 3', '`ROW_NUMBER()` dá 1 aos três e pula para 4; `RANK()` numera 1, 2 e 3', '`RANK()` dá 1 aos três e segue em 2; `ROW_NUMBER()` numera 1, 2 e 3', 'As duas funções geram erro quando há empate no critério de ordem'],
   0,
   '`ROW_NUMBER()` sempre gera números sequenciais e únicos, desempatando de forma arbitrária. `RANK()` dá a mesma posição aos empatados e pula as posições seguintes, então o próximo recebe 4. Quem continua em 2 depois do empate é `DENSE_RANK()`.'),
  -- fsql-int-02
  ('a1d349bf-4696-5992-8037-de05ee6d2b48', 'fundamentos_sql', 'intermediario',
   'Você precisa da venda mais recente de **cada** cliente. Qual abordagem resolve isso?',
   array['`ORDER BY data DESC` seguido de `LIMIT 1` sobre a tabela de vendas inteira', '`ROW_NUMBER()` particionado por cliente, por data decrescente, mantendo o número 1', '`GROUP BY cliente` selecionando todas as colunas da venda junto com `MAX(data)`', '`DISTINCT` sobre cliente e data, mantendo a primeira linha que for retornada'],
   1,
   '`ROW_NUMBER() OVER (PARTITION BY cliente ORDER BY data DESC)` numera as vendas de cada cliente separadamente, e o filtro `= 1` mantém só a mais recente. `LIMIT 1` sobre a tabela inteira traz uma única venda no total. Selecionar colunas fora do `GROUP BY` junto com `MAX(data)` é inválido na maioria dos bancos ou mistura valores de linhas diferentes.'),
  -- fsql-int-03
  ('62513353-b6e6-5b35-a238-47df53a16113', 'fundamentos_sql', 'intermediario',
   'O que a coluna `acumulado` calcula na consulta abaixo?

```sql
SELECT data, valor,
  SUM(valor) OVER (ORDER BY data) AS acumulado
FROM vendas_diarias;
```',
   array['A soma de `valor` de todas as datas, repetida em todas as linhas', 'A soma de `valor` só da data da linha atual e da data anterior', 'A soma de `valor` desde a primeira data até a data da linha atual', 'A média de `valor` desde a primeira data até a data da linha atual'],
   2,
   'Com `ORDER BY` dentro do `OVER`, a janela padrão vai do início da partição até a linha atual, o que produz um total acumulado. Sem o `ORDER BY`, o `SUM` usaria a partição inteira e repetiria o total geral em todas as linhas. Uma janela de duas linhas exigiria `ROWS BETWEEN 1 PRECEDING AND CURRENT ROW`.'),
  -- fsql-int-04
  ('a0476f2b-7918-5a33-90a2-ef200a15cda1', 'fundamentos_sql', 'intermediario',
   'A consulta abaixo deveria listar todos os clientes, mas os clientes sem pedidos sumiram. Por quê?

```sql
SELECT c.nome, p.valor
FROM clientes c
LEFT JOIN pedidos p ON p.cliente_id = c.id
WHERE p.status = ''pago'';
```',
   array['O `LEFT JOIN` só mantém os clientes que têm ao menos um pedido', 'A condição do `ON` deveria comparar `c.id` com a coluna `p.id`', 'O `SELECT` precisa incluir `p.cliente_id` para manter os clientes', 'O filtro no `WHERE` descarta as linhas em que `p.status` é `NULL`'],
   3,
   'Para clientes sem pedidos, o `LEFT JOIN` preenche as colunas de `pedidos` com `NULL`, e `NULL = ''pago''` não é verdadeiro, então o `WHERE` remove essas linhas. Na prática, o `LEFT JOIN` vira um `INNER JOIN`. A correção é mover a condição para o `ON`: `ON p.cliente_id = c.id AND p.status = ''pago''`.'),
  -- fsql-int-05
  ('bd79403a-b5c6-58e4-8ddd-9eecf8cc2580', 'fundamentos_sql', 'intermediario',
   'Ao juntar `pedidos` (uma linha por pedido) com `itens_pedido` (várias linhas por pedido) e somar `pedidos.valor_frete`, o total de frete ficou maior que o real. Qual a causa?',
   array['O join repete cada pedido uma vez por item, e o frete é somado várias vezes', 'O join deveria ser um `LEFT JOIN` para não somar o frete a mais', 'O `SUM` ignora os nulos e compensa somando os valores restantes', 'A soma de valores decimais perde precisão com muitas linhas'],
   0,
   'Em uma relação de um para muitos, cada linha de `pedidos` aparece tantas vezes quanto o número de itens, e a coluna de frete é duplicada junto. Somá-la depois do join multiplica o valor. A solução é agregar os itens antes do join ou somar o frete direto da tabela de pedidos. Trocar por `LEFT JOIN` não resolve, pois a duplicação continua.'),
  -- fsql-int-06
  ('6eb74a06-ccc9-5198-86f3-b60889ba4ce8', 'fundamentos_sql', 'intermediario',
   'A tabela `funcionarios(id, nome, depto_id, depto_nome)` viola a terceira forma normal (3FN). Por quê?',
   array['`nome` pode se repetir entre funcionários diferentes da tabela', '`depto_nome` depende de `depto_id`, e não diretamente da chave `id`', 'A tabela tem mais de uma coluna com o sufixo `_id` no nome', '`id` deveria formar uma chave composta junto com `depto_id`'],
   1,
   'Na 3FN, toda coluna que não é chave deve depender só da chave primária, sem dependências transitivas. Aqui, `id` determina `depto_id`, que determina `depto_nome`, então o nome do departamento se repete para cada funcionário. A correção é mover `depto_nome` para uma tabela `departamentos`.'),
  -- fsql-int-07
  ('1fb48b66-c6d3-5522-8f43-b94165c595f4', 'fundamentos_sql', 'intermediario',
   'Uma consulta soma uma única coluna de uma tabela com 200 colunas e bilhões de linhas. Por que um banco colunar tende a ser mais rápido nesse caso?',
   array['Ele mantém automaticamente um índice em cada uma das 200 colunas', 'Ele guarda as linhas já ordenadas pela coluna que será somada', 'Ele lê do disco só a coluna usada, em vez de ler as linhas inteiras', 'Ele dispensa a leitura do disco por manter tudo sempre em memória'],
   2,
   'No armazenamento colunar, os valores de cada coluna ficam juntos, então a consulta lê apenas a coluna somada e ignora as outras 199. Valores de uma mesma coluna também comprimem melhor, o que reduz ainda mais a leitura. Bancos orientados a linhas precisam ler cada linha inteira mesmo que só uma coluna interesse.'),
  -- fsql-int-08
  ('135fd877-0d27-5a25-b10c-8fb65087d283', 'fundamentos_sql', 'intermediario',
   'Existe um índice na coluna `data_pedido`, mas a consulta abaixo continua lenta. Qual a causa mais provável?

```sql
SELECT *
FROM pedidos
WHERE EXTRACT(YEAR FROM data_pedido) = 2024;
```',
   array['Índices só funcionam em colunas numéricas, e não em datas', 'O `SELECT *` sempre impede o uso de qualquer índice', 'A comparação com um número inteiro desativa o índice', 'Aplicar uma função à coluna impede o uso direto do índice'],
   3,
   'O índice guarda os valores de `data_pedido`, e não o ano extraído deles, então o banco precisa calcular a função em todas as linhas. Reescrever o filtro como intervalo, `data_pedido >= ''2024-01-01'' AND data_pedido < ''2025-01-01''`, permite usar o índice. O `SELECT *` pode aumentar o custo de leitura, mas não impede a busca pelo índice.'),
  -- fsql-int-09
  ('ce11db73-9836-59a2-b782-1822da493183', 'fundamentos_sql', 'intermediario',
   'A subconsulta abaixo retorna alguns valores `NULL`. O que acontece com o resultado?

```sql
SELECT nome
FROM clientes
WHERE id NOT IN (
  SELECT cliente_id FROM pedidos
);
```',
   array['A consulta não retorna nenhuma linha', 'A consulta ignora os nulos e funciona normalmente', 'A consulta retorna todos os clientes da tabela', 'A consulta falha com um erro de tipo de dado'],
   0,
   '`id NOT IN (1, 2, NULL)` equivale a `id <> 1 AND id <> 2 AND id <> NULL`, e a comparação com `NULL` resulta em desconhecido. Assim, nenhuma linha satisfaz a condição. Usar `NOT EXISTS` ou filtrar `cliente_id IS NOT NULL` na subconsulta evita o problema.'),
  -- fsql-int-10
  ('b9fa0800-692e-5cf7-b500-40ab8ddd450f', 'fundamentos_sql', 'intermediario',
   'Você vai empilhar as vendas de 2023 e de 2024, que nunca se sobrepõem. Por que preferir `UNION ALL` a `UNION`?',
   array['`UNION ALL` garante que o resultado venha ordenado pela primeira coluna', '`UNION ALL` não remove duplicatas, então evita uma ordenação ou hash caro', '`UNION` só funciona quando as duas consultas leem da mesma tabela', '`UNION ALL` remove as duplicatas de forma mais eficiente que o `UNION`'],
   1,
   '`UNION` elimina linhas duplicadas, o que exige comparar todo o resultado, geralmente com ordenação ou hash. Como os dois anos não se sobrepõem, essa etapa é desperdício. `UNION ALL` apenas concatena os resultados e, sozinho, não garante nenhuma ordem.'),
  -- pipe-ini-01
  ('2ba06f5f-b906-5dc4-b99c-c1b643d2e6f2', 'pipelines', 'iniciante',
   'Qual a diferença entre ETL e ELT?',
   array['No ELT, os dados são carregados brutos no destino e transformados lá dentro', 'No ELT, os dados são transformados antes de sair do sistema de origem', 'No ETL, os dados são carregados no destino sem nenhuma transformação', 'ETL e ELT são nomes diferentes para o mesmo processo, sem distinção'],
   0,
   'No ETL, a transformação acontece antes da carga, em um servidor ou ferramenta intermediária. No ELT, os dados brutos são carregados primeiro, e a transformação roda dentro do próprio destino, como um data warehouse em nuvem. O ELT ganhou força porque esses destinos têm poder de processamento elástico.'),
  -- pipe-ini-02
  ('99e4f66a-7dfc-59ad-8e78-af8bdc97f65e', 'pipelines', 'iniciante',
   'Qual cenário é mais adequado para processamento em *streaming*?',
   array['Gerar o relatório financeiro consolidado do fechamento de cada mês', 'Detectar fraudes em transações de cartão segundos após cada compra', 'Recalcular uma vez por noite as métricas de vendas do dia anterior', 'Migrar uma única vez o histórico de dez anos para um novo banco'],
   1,
   '*Streaming* processa eventos continuamente, à medida que chegam, e é indicado quando a latência precisa ser de segundos. Detectar uma fraude depois que o cartão já foi usado várias vezes teria pouco valor. Relatórios mensais, cargas noturnas e migrações pontuais toleram horas de atraso e são casos típicos de *batch*.'),
  -- pipe-ini-03
  ('93563634-a8a1-5bf0-8030-5f56f186cb83', 'pipelines', 'iniciante',
   'Um job diário de carga falhou no meio da execução e será reexecutado. Qual propriedade garante que a reexecução não duplique registros no destino?',
   array['Paralelismo', 'Particionamento', 'Idempotência', 'Compressão'],
   2,
   'Um pipeline idempotente produz o mesmo resultado não importa quantas vezes seja executado com a mesma entrada, por exemplo com *MERGE/upsert* ou sobrescrevendo a partição do dia. Paralelismo e particionamento melhoram o desempenho, mas sozinhos não evitam duplicidade.'),
  -- pipe-ini-04
  ('fffb9ab2-2350-5df1-9b8d-a72e65275863', 'pipelines', 'iniciante',
   'No contexto de orquestração de *pipelines*, como no Airflow, o que é uma DAG?',
   array['Um banco de dados especializado em guardar os resultados de cada tarefa', 'Uma linguagem de consulta usada para transformar os dados no pipeline', 'Um gatilho que executa todas as tarefas ao mesmo tempo, sem nenhuma ordem', 'Um grafo de tarefas com dependências, sem ciclos, que define a ordem de execução'],
   3,
   'DAG significa *Directed Acyclic Graph*, ou grafo acíclico dirigido. Cada nó é uma tarefa, e cada aresta indica que uma tarefa só começa depois da outra. A ausência de ciclos garante que a execução sempre tenha começo e fim.'),
  -- pipe-ini-05
  ('69d8c303-6c3f-5c73-ba16-c6f54db8e75e', 'pipelines', 'iniciante',
   'O que é CDC (*Change Data Capture*)?',
   array['Uma técnica que captura inserções, atualizações e exclusões da origem para replicá-las', 'Uma técnica que compacta os dados alterados para reduzir o custo de armazenamento', 'Uma técnica que valida a qualidade dos dados antes de liberá-los para consumo', 'Uma técnica que copia a tabela inteira da origem a cada execução do pipeline'],
   0,
   'O CDC identifica só o que mudou na origem, muitas vezes lendo o log de transações do banco, e envia essas mudanças ao destino. Isso evita copiar a tabela inteira a cada execução, que é justamente a abordagem de carga completa. Também permite capturar exclusões, que uma consulta por data de atualização não enxerga.'),
  -- pipe-ini-06
  ('aa166096-3548-506f-9568-9c2bc2c646b1', 'pipelines', 'iniciante',
   'Qual a principal vantagem de uma carga incremental em relação a uma carga completa (*full load*)?',
   array['Garantir que as exclusões na origem sempre sejam refletidas no destino', 'Processar apenas os registros novos ou alterados desde a última execução', 'Dispensar o controle de qual foi o último registro já processado', 'Recriar a tabela de destino do zero, eliminando inconsistências'],
   1,
   'A carga incremental lê só o que mudou, usando por exemplo uma coluna de data de atualização como marca d''água. Isso reduz tempo e custo à medida que a tabela cresce. Em troca, exige guardar até onde o processamento já foi, e exclusões na origem podem passar despercebidas sem técnicas como CDC.'),
  -- pipe-ini-07
  ('0872d251-e7b5-546f-acf2-1c8143d8d5bf', 'pipelines', 'iniciante',
   'Qual destes é um exemplo de verificação de qualidade de dados em um pipeline?',
   array['Aumentar o número de máquinas quando o volume de dados cresce muito', 'Agendar a execução do pipeline para o horário de menor uso do banco', 'Falhar a execução se a coluna `id_pedido` tiver valores nulos ou duplicados', 'Compactar os arquivos de saída para reduzir o espaço ocupado em disco'],
   2,
   'Verificações de qualidade testam se os dados atendem a expectativas, como unicidade, ausência de nulos, faixas de valores e volume esperado. Parar o pipeline ao detectar uma chave nula evita que dados ruins cheguem aos relatórios. As demais opções tratam de escalabilidade, agendamento e custo, e não de qualidade.'),
  -- pipe-ini-08
  ('3258c730-2744-5d06-9904-a9a4a98baa88', 'pipelines', 'iniciante',
   'O que significa fazer um *backfill* em um pipeline?',
   array['Apagar os dados antigos do destino para liberar espaço de armazenamento', 'Desfazer a última execução e restaurar o estado anterior do destino', 'Processar os dados em tempo real assim que chegam ao sistema de origem', 'Reprocessar períodos passados, por exemplo após corrigir um bug ou criar um campo'],
   3,
   '*Backfill* é executar o pipeline para datas que já passaram, preenchendo ou corrigindo o histórico. É comum depois de corrigir uma regra de negócio ou ao incluir uma nova coluna que precisa de valores retroativos. Pipelines idempotentes e particionados por data tornam o *backfill* seguro.'),
  -- pipe-ini-09
  ('53887a61-c8f9-592d-826f-9ea17fa395ee', 'pipelines', 'iniciante',
   'Uma tarefa falha por instabilidade momentânea na rede ao chamar uma API. Qual recurso do orquestrador ajuda nesse caso?',
   array['Novas tentativas automáticas (*retries*), com um intervalo entre elas', 'Execução paralela da mesma tarefa em várias máquinas diferentes', 'Particionamento da tabela de destino pela data de processamento', 'Remoção da tarefa do fluxo para que as seguintes possam rodar'],
   0,
   'Falhas transitórias, como timeouts de rede, costumam desaparecer em segundos ou minutos. Configurar *retries* com espera, de preferência crescente, deixa o pipeline se recuperar sozinho. Para isso funcionar sem efeitos colaterais, a tarefa precisa ser idempotente.'),
  -- pipe-ini-10
  ('eb7e7c28-cb22-5f57-b6a7-69e2c34d9460', 'pipelines', 'iniciante',
   'O que é a linhagem de dados (*data lineage*)?',
   array['O registro de quais usuários consultaram cada tabela e em que horário', 'O mapeamento de onde cada dado veio e por quais transformações passou', 'A ordem cronológica em que as linhas foram inseridas em uma tabela', 'A lista de versões do código do pipeline no controle de versão'],
   1,
   'A linhagem mostra o caminho do dado da origem até o relatório, passando por cada tabela e transformação intermediária. Ela ajuda a investigar números errados e a medir o impacto de mudar uma coluna. O registro de quem consultou cada tabela é auditoria de acesso, um tema diferente.'),
  -- pipe-int-01
  ('7c6db28e-cedd-520d-b658-a919a75fd68d', 'pipelines', 'intermediario',
   'Um job diário grava as vendas de cada dia em uma tabela particionada por data. Qual estratégia torna segura a reexecução de um dia?',
   array['Sobrescrever a partição do dia processado, em vez de acrescentar linhas', 'Acrescentar as linhas e remover as duplicatas uma vez por mês', 'Acrescentar as linhas e confiar que o job nunca será reexecutado', 'Gravar cada execução em uma tabela nova, com o horário no nome'],
   0,
   'Sobrescrever a partição torna a carga idempotente: reprocessar o dia substitui os dados em vez de duplicá-los. Remover duplicatas mensalmente deixa os relatórios errados durante semanas. Criar uma tabela por execução evita a duplicação, mas espalha os dados e complica o consumo.'),
  -- pipe-int-02
  ('01b00222-664b-5389-86ff-f1539294f39e', 'pipelines', 'intermediario',
   'Uma carga incremental usa `WHERE atualizado_em > ultima_execucao`. Alguns registros chegam à origem com atraso, já com um `atualizado_em` antigo. O que acontece com eles?',
   array['São capturados duas vezes, gerando duplicidade no destino', 'Nunca são capturados, pois já ficaram abaixo da marca d''água', 'São rejeitados pelo banco de origem por violação de chave', 'Fazem a carga falhar, e o orquestrador refaz o período'],
   1,
   'A marca d''água só avança, então registros que aparecem depois com um timestamp anterior a ela ficam fora de todas as execuções seguintes. Uma mitigação comum é reprocessar uma janela de segurança, como as últimas 48 horas, com carga idempotente. Outra opção é usar CDC, que captura as mudanças pela ordem do log, e não pelo timestamp da linha.'),
  -- pipe-int-03
  ('cd8e948b-72e1-570c-b112-753a65350385', 'pipelines', 'intermediario',
   'Um consumidor de eventos garante entrega *at-least-once*. Como evitar que eventos reprocessados dupliquem dados no destino?',
   array['Aumentar o número de partições do tópico de eventos', 'Desativar as novas tentativas em caso de falha no consumo', 'Gravar com *upsert* usando um identificador único do evento', 'Processar os eventos em lotes maiores e menos frequentes'],
   2,
   'Com *at-least-once*, o mesmo evento pode chegar mais de uma vez, por exemplo após uma falha antes de confirmar o *offset*. Usar o ID do evento como chave de um *upsert* torna o processamento idempotente, e a repetição não altera o resultado. Desativar as novas tentativas troca duplicidade por perda de dados.'),
  -- pipe-int-04
  ('5e0a8f42-d147-5888-881f-452a15d243da', 'pipelines', 'intermediario',
   'Um pipeline diário filtra os dados pela data do relógio no momento da execução. Que problema isso causa em um *backfill* de janeiro feito em março?',
   array['As execuções de janeiro rodam em paralelo e travam o banco de origem', 'O orquestrador recusa execuções com datas anteriores à data atual', 'As partições de janeiro são apagadas antes de serem reprocessadas', 'Todas as execuções processam os dados de março, e não os dias de janeiro'],
   3,
   'Se o filtro usa a hora real da execução, rodar o pipeline para 5 de janeiro em março processa os dados de março. Orquestradores fornecem uma data lógica, o intervalo a que aquela execução se refere, justamente para isso. Parametrizar o pipeline por essa data torna o *backfill* reproduzível.'),
  -- pipe-int-05
  ('eb11e1fd-b271-5f70-b80c-dc80fe2bdffa', 'pipelines', 'intermediario',
   'A origem passou a enviar uma coluna nova, e o pipeline quebrou ao gravar no destino. Qual prática reduz esse risco?',
   array['Validar o esquema na entrada e definir como tratar colunas novas ou removidas', 'Converter todas as colunas para texto antes de gravá-las no destino', 'Desativar as verificações de qualidade para não bloquear as cargas', 'Recriar a tabela de destino do zero a cada execução do pipeline'],
   0,
   'Mudanças de esquema na origem são inevitáveis, então o pipeline precisa detectá-las e aplicar uma política explícita, como aceitar colunas novas e alertar sobre remoções. Contratos de dados com os times de origem ajudam a antecipar essas mudanças. Converter tudo para texto esconde o problema e empurra erros de tipo para quem consome os dados.'),
  -- pipe-int-06
  ('32c2e730-e4cc-5795-829f-a2e7878d9f66', 'pipelines', 'intermediario',
   'Em um pipeline de *streaming* que conta cliques por janela de 5 minutos, para que serve uma *watermark*?',
   array['Garantir que cada evento seja entregue exatamente uma vez', 'Definir até quando eventos atrasados ainda são aceitos na janela', 'Dividir os eventos entre os consumidores de forma equilibrada', 'Comprimir os eventos antes de enviá-los ao armazenamento'],
   1,
   'Eventos podem chegar fora de ordem, depois do fim da janela a que pertencem pelo horário em que ocorreram. A *watermark* estima até onde o tempo dos eventos já avançou e determina quanto atraso tolerar antes de fechar a janela. Um limite maior aceita mais atrasos, mas aumenta a latência e o estado mantido em memória.'),
  -- pipe-int-07
  ('d42cff01-d380-5e2b-8a38-9a32d4cb0b7f', 'pipelines', 'intermediario',
   'Um app de celular envia eventos com horas de atraso quando o aparelho fica sem conexão. Para relatórios por dia em que a ação aconteceu, qual horário usar?',
   array['O horário de processamento, quando o pipeline leu o evento da fila', 'O horário de ingestão, quando o servidor recebeu o evento do app', 'O horário do evento, registrado pelo aparelho quando a ação ocorreu', 'O horário da última atualização da tabela de destino do relatório'],
   2,
   'O horário do evento (*event time*) indica quando a ação realmente aconteceu, que é o que o relatório quer medir. Os horários de ingestão e de processamento refletem quando o dado chegou, e com o aparelho sem conexão podem estar horas ou dias depois. Usar o horário do evento exige lidar com eventos atrasados, mas evita atribuir ações ao dia errado.'),
  -- pipe-int-08
  ('2f9c58af-4e6a-5547-80c2-1cbfc49cb248', 'pipelines', 'intermediario',
   'Hoje a carga de pedidos trouxe 90% menos linhas que a média, sem nenhum erro técnico. Qual verificação teria detectado o problema?',
   array['Um teste de unicidade sobre a chave primária da tabela de pedidos', 'Um teste de tipo que confirma que as datas estão em formato válido', 'Um teste de integridade entre os pedidos e a tabela de clientes', 'Um teste de volume que compara a contagem com o histórico recente'],
   3,
   'Falhas silenciosas, como uma origem que entrega dados parciais, não geram erro, então só um teste de volume ou de atualidade as percebe. Comparar a contagem com a média dos últimos dias e alertar abaixo de um limite é uma prática simples e eficaz. Os testes de unicidade, tipo e integridade passariam, pois as poucas linhas carregadas estavam corretas.'),
  -- pipe-int-09
  ('7b1b0c3b-9899-5397-98fd-77b3d5cefe4a', 'pipelines', 'intermediario',
   'O pipeline B depende da tabela gerada pelo pipeline A, que às vezes atrasa. Qual abordagem é mais robusta?',
   array['Fazer B esperar um sinal de conclusão de A antes de começar', 'Agendar B para uma hora depois do horário de início de A', 'Agendar B no mesmo horário de A, para ganhar tempo', 'Fazer B ler a tabela de A no estado em que ela estiver'],
   0,
   'Uma dependência explícita, por meio de um sensor, de um evento ou de uma DAG que encadeia os dois, garante que B só rode com os dados de A prontos. Uma folga fixa de uma hora funciona até o dia em que A atrasa mais que isso, e B processa dados incompletos sem avisar. Ler a tabela no estado em que estiver tem o mesmo problema.'),
  -- pipe-int-10
  ('8a51053d-7471-558b-b879-6199f392562c', 'pipelines', 'intermediario',
   'Por que o CDC baseado em log costuma ser preferido ao CDC baseado em consultas por data de atualização?',
   array['Ele dispensa qualquer acesso ou permissão no banco de dados de origem', 'Ele captura também as exclusões e gera pouca carga no banco de origem', 'Ele garante que o destino seja atualizado antes da própria origem', 'Ele funciona mesmo quando a origem não mantém nenhum tipo de log'],
   1,
   'O CDC baseado em log lê o log de transações do banco, onde ficam registradas inserções, atualizações e exclusões, sem executar consultas pesadas nas tabelas. Já a consulta por `atualizado_em` não enxerga linhas apagadas e depende de a coluna ser mantida corretamente. Em troca, o CDC por log exige permissões e configuração no banco de origem.'),
  -- arm-ini-01
  ('2000ca21-2649-5695-8805-ecd89e3397df', 'armazenamento', 'iniciante',
   'Em um modelo dimensional, qual a diferença entre uma tabela fato e uma tabela dimensão?',
   array['A fato guarda eventos e métricas; a dimensão guarda o contexto descritivo deles', 'A fato guarda o contexto descritivo; a dimensão guarda os eventos e as métricas', 'A fato guarda os dados brutos; a dimensão guarda os dados já agregados', 'A fato guarda os dados atuais; a dimensão guarda o histórico de alterações'],
   0,
   'A tabela fato registra eventos do negócio, como vendas, com métricas numéricas e chaves para as dimensões. As dimensões, como cliente, produto e data, trazem os atributos usados para filtrar e agrupar. Uma consulta típica soma métricas da fato agrupando por atributos das dimensões.'),
  -- arm-ini-02
  ('fed6717f-56ca-5df8-96ec-4ca451e7f386', 'armazenamento', 'iniciante',
   'O que caracteriza um esquema estrela (*star schema*)?',
   array['Várias tabelas fato ligadas entre si, sem nenhuma tabela de dimensão', 'Uma tabela fato central ligada diretamente a dimensões desnormalizadas', 'Dimensões normalizadas em várias tabelas, ligadas em cadeia à fato', 'Uma única tabela com todos os fatos e atributos do negócio juntos'],
   1,
   'No esquema estrela, a fato fica no centro, e cada dimensão é uma única tabela ligada a ela, lembrando uma estrela. Dimensões normalizadas em várias tabelas em cadeia caracterizam o esquema floco de neve (*snowflake*). A estrela exige menos joins e é mais simples de consultar.'),
  -- arm-ini-03
  ('acf26692-3919-519a-9500-c9752e57f904', 'armazenamento', 'iniciante',
   'O que é um data lake?',
   array['Um banco relacional que só aceita dados já limpos e modelados em tabelas', 'Uma ferramenta de visualização para montar painéis a partir de vários bancos', 'Um repositório que guarda dados brutos, estruturados ou não, a baixo custo', 'Um sistema que replica um banco transacional para dar alta disponibilidade'],
   2,
   'Um data lake armazena arquivos em seu formato original, como CSV, JSON, imagens e Parquet, geralmente em armazenamento de objetos barato. O esquema é aplicado na leitura (*schema-on-read*), e não na escrita. Um data warehouse, por outro lado, exige dados estruturados e modelados antes da carga.'),
  -- arm-ini-04
  ('322b831a-49d2-5111-a291-71138e4fde51', 'armazenamento', 'iniciante',
   'Qual é o principal propósito de um data warehouse?',
   array['Registrar as transações do dia a dia de um sistema de vendas on-line', 'Guardar arquivos brutos de qualquer formato, sem nenhuma estrutura', 'Servir dados em tempo real para o aplicativo de celular dos clientes', 'Centralizar dados integrados e históricos para análises e relatórios'],
   3,
   'O data warehouse reúne dados de várias fontes, já limpos e modelados, e mantém o histórico para análise. Ele é otimizado para consultas analíticas, e não para muitas transações pequenas, que são o papel dos sistemas OLTP. Guardar arquivos brutos de qualquer formato descreve melhor um data lake.'),
  -- arm-ini-05
  ('ac486103-2ef4-5696-9d45-942e33d08421', 'armazenamento', 'iniciante',
   'Por que o formato Parquet é tão usado em cargas analíticas?',
   array['Ele é colunar e comprimido, permitindo ler só as colunas necessárias', 'Ele é um formato de texto legível, fácil de abrir em qualquer editor', 'Ele guarda cada linha como um documento JSON independente e completo', 'Ele permite atualizar uma linha no lugar, sem reescrever o arquivo'],
   0,
   'O Parquet organiza os dados por coluna e aplica compressão e codificação eficientes a cada uma. Assim, uma consulta que usa três colunas de cem lê apenas essas três. Por ser binário e imutável, ele não é legível em editores de texto nem permite alterar uma linha no lugar.'),
  -- arm-ini-06
  ('9f22cd85-2366-5435-9e58-89c65105e343', 'armazenamento', 'iniciante',
   'Na arquitetura medalhão, o que normalmente fica na camada *bronze*?',
   array['Os dados limpos, deduplicados e padronizados, prontos para a integração', 'Os dados brutos, como chegaram da origem, com pouca ou nenhuma transformação', 'As tabelas agregadas por regra de negócio, prontas para os painéis', 'Os dados descartados por falharem nas verificações de qualidade'],
   1,
   'A camada *bronze* preserva os dados da forma como chegaram, o que permite reprocessar tudo se uma regra mudar. A *silver* contém os dados limpos e padronizados, e a *gold* traz as tabelas agregadas e orientadas ao negócio. Essa progressão melhora a qualidade a cada etapa.'),
  -- arm-ini-07
  ('1e603ad2-7d55-5beb-9c9e-e5db505ed385', 'armazenamento', 'iniciante',
   'Por que é comum criar uma dimensão de data (*dim_data*) em um data warehouse?',
   array['Para guardar a data e a hora exata de cada carga feita no data warehouse', 'Para impedir que a tabela fato tenha mais de uma linha para o mesmo dia', 'Para oferecer atributos prontos, como mês, trimestre e feriado, sem cálculos', 'Para substituir as colunas de data da tabela fato por textos legíveis'],
   2,
   'A dimensão de data tem uma linha por dia, com atributos como dia da semana, mês, trimestre, ano fiscal e indicador de feriado. Assim, analistas filtram e agrupam por esses atributos com um simples join, sem reescrever cálculos de calendário. Ela também padroniza regras como o início do ano fiscal.'),
  -- arm-ini-08
  ('76a91859-c85a-5e58-8f34-7f9cdc2f7066', 'armazenamento', 'iniciante',
   'O que é a granularidade (*grain*) de uma tabela fato?',
   array['A quantidade máxima de linhas que a tabela fato pode armazenar', 'O número de dimensões ligadas diretamente à tabela fato', 'O intervalo de tempo entre duas cargas seguidas da tabela', 'O nível de detalhe que cada linha representa, como um item de pedido'],
   3,
   'A granularidade define o que uma linha da fato significa, por exemplo um item de pedido, um pedido inteiro ou o total diário por loja. Ela deve ser declarada antes de escolher dimensões e métricas. Misturar granularidades na mesma tabela leva a somas erradas.'),
  -- arm-ini-09
  ('911b3fc6-ac9b-540c-a1d7-e9f048fc0eba', 'armazenamento', 'iniciante',
   'Qual a diferença entre *schema-on-write* e *schema-on-read*?',
   array['No *schema-on-read*, a estrutura é aplicada só quando os dados são lidos', 'No *schema-on-read*, os dados são validados antes de serem gravados', 'No *schema-on-write*, o esquema muda a cada consulta feita aos dados', 'Os termos indicam se o arquivo está aberto para leitura ou escrita'],
   0,
   'No *schema-on-write*, típico dos data warehouses, os dados precisam seguir um esquema definido no momento da carga. No *schema-on-read*, comum em data lakes, os arquivos são guardados como estão, e a estrutura é interpretada na leitura. Isso dá flexibilidade na entrada, mas transfere a responsabilidade pela qualidade para quem consome.'),
  -- arm-ini-10
  ('44eccacb-7b5f-514e-8885-8743056ebd0c', 'armazenamento', 'iniciante',
   'O que é um lakehouse?',
   array['Um data warehouse tradicional instalado nos servidores da própria empresa', 'Uma arquitetura que leva recursos de data warehouse, como transações, ao data lake', 'Um data lake dividido em várias pastas, uma para cada área de negócio', 'Uma cópia do data warehouse mantida no data lake para fins de backup'],
   1,
   'O lakehouse usa o armazenamento barato do data lake e adiciona, por meio de formatos de tabela como Delta Lake e Apache Iceberg, recursos antes exclusivos do data warehouse. Entre eles estão transações ACID, controle de esquema e consultas eficientes. Assim, BI e ciência de dados podem usar a mesma cópia dos dados.'),
  -- arm-int-01
  ('d4703aec-4582-5278-9c72-b97689ff9156', 'armazenamento', 'intermediario',
   'A empresa precisa saber em qual região cada cliente morava na data de cada venda, mesmo depois de mudanças de endereço. Qual tipo de SCD atende a esse requisito?',
   array['Tipo 2: uma nova linha a cada mudança, com datas de vigência', 'Tipo 1: sobrescrever o atributo com o valor mais recente', 'Tipo 0: manter para sempre o valor do primeiro cadastro', 'Tipo 3: uma coluna extra com o valor imediatamente anterior'],
   0,
   'A SCD tipo 2 cria uma nova versão do cliente a cada mudança, com datas de início e fim de vigência e uma chave substituta própria. Cada venda aponta para a versão vigente na data dela, preservando todo o histórico. O tipo 1 apaga o passado, e o tipo 3 guarda só uma mudança anterior.'),
  -- arm-int-02
  ('b309a2ff-5903-5380-be79-5a96a8f40b9c', 'armazenamento', 'intermediario',
   'Por que as dimensões costumam usar uma chave substituta (*surrogate key*) em vez da chave do sistema de origem?',
   array['Para que o identificador do cliente seja legível pelas áreas de negócio', 'Para permitir várias versões do mesmo registro e isolar mudanças da origem', 'Para garantir que a dimensão nunca tenha mais linhas do que a origem', 'Para dispensar o join entre a tabela fato e a tabela de dimensão'],
   1,
   'A chave substituta é um identificador gerado no próprio data warehouse, sem significado de negócio. Ela permite que um mesmo cliente tenha várias linhas, como exige a SCD tipo 2, e protege o modelo contra reuso ou mudança de códigos na origem. Também facilita integrar fontes que usam identificadores diferentes para a mesma entidade.'),
  -- arm-int-03
  ('66e6dbd3-5bda-528b-bcad-77ce3fe788aa', 'armazenamento', 'intermediario',
   'Uma tabela de eventos em um data lake é consultada quase sempre por intervalo de datas. Qual particionamento faz mais sentido?',
   array['Particionar pelo ID do usuário, que tem milhões de valores', 'Particionar pelo ID do evento, que é único em cada linha', 'Particionar pela data do evento, como em `dt=2024-05-01`', 'Não particionar e guardar tudo em um único arquivo grande'],
   2,
   'Particionar pela coluna usada nos filtros permite que o motor leia só as pastas do intervalo pedido, técnica chamada *partition pruning*. Particionar por colunas de alta cardinalidade, como ID de usuário ou de evento, cria milhões de pastas com arquivos minúsculos e piora o desempenho. Um único arquivo obriga a ler tudo em todas as consultas.'),
  -- arm-int-04
  ('6387d6ba-c492-5791-8d9e-99da4d679532', 'armazenamento', 'intermediario',
   'Um pipeline de *streaming* grava milhares de arquivos de poucos KB por hora no data lake, e as consultas ficaram lentas. Qual é a causa e a correção?',
   array['Arquivos grandes demais; dividir cada arquivo em partes ainda menores', 'Falta de índices; criar um índice em cada coluna das tabelas do lake', 'Compressão excessiva; gravar os arquivos em texto, sem compressão', 'Excesso de arquivos pequenos; compactá-los periodicamente em arquivos maiores'],
   3,
   'Cada arquivo tem um custo fixo para listar, abrir e ler metadados, então milhares de arquivos minúsculos dominam o tempo da consulta. A solução é um processo de compactação que junta os arquivos em tamanhos maiores, na faixa de centenas de MB. Formatos de tabela como Delta Lake e Iceberg oferecem comandos próprios para isso.'),
  -- arm-int-05
  ('4746dd38-b3c4-5370-ad0d-88a8ce2b53f0', 'armazenamento', 'intermediario',
   'Um job corrompeu ontem uma tabela em formato Delta Lake ou Iceberg. Qual recurso desses formatos ajuda a recuperar os dados?',
   array['*Time travel*: consultar ou restaurar uma versão anterior da tabela', '*Partition pruning*: ler apenas as partições afetadas pelo erro', '*Schema evolution*: aceitar colunas novas sem reescrever a tabela', '*Z-ordering*: reorganizar os dados para acelerar as consultas'],
   0,
   'Esses formatos mantêm um log de transações com os arquivos que compõem cada versão da tabela. Com isso, é possível consultar a tabela como estava em uma versão ou data anterior e restaurá-la. Isso só funciona enquanto os arquivos antigos não forem removidos pela rotina de limpeza.'),
  -- arm-int-06
  ('2464f27a-223f-5c2c-a73e-284ed4cad287', 'armazenamento', 'intermediario',
   'Em que situação normalizar uma dimensão no formato *snowflake* pode valer a pena?',
   array['Quando os analistas precisam escrever consultas com menos joins', 'Quando a dimensão é enorme e tem hierarquias com muita repetição', 'Quando a tabela fato precisa de mais métricas numéricas por linha', 'Quando a dimensão é pequena e raramente sofre qualquer alteração'],
   1,
   'Normalizar uma dimensão, como separar produto, subcategoria e categoria, reduz a repetição de atributos e facilita manter hierarquias muito grandes. O custo é exigir mais joins e deixar as consultas mais complexas. Por isso, a recomendação geral de Kimball é preferir a estrela e normalizar só quando há um ganho claro.'),
  -- arm-int-07
  ('7a1f91b3-f1f7-5d26-9963-50427b90e295', 'armazenamento', 'intermediario',
   'Para trafegar eventos individuais em um sistema de mensageria com evolução de esquema, qual formato costuma ser mais adequado?',
   array['Parquet, orientado a colunas e otimizado para lotes', 'CSV, por ser simples, legível e aceito em qualquer lugar', 'Avro, orientado a linhas e com esquema que pode evoluir', 'ORC, colunar e com índices leves para consultas analíticas'],
   2,
   'O Avro grava registro a registro, o que combina com mensagens individuais, e tem regras claras de compatibilidade para evoluir o esquema. Formatos colunares como Parquet e ORC são ótimos para ler grandes volumes de poucas colunas, mas são pensados para arquivos em lote. O CSV não carrega tipos nem esquema, o que dificulta uma evolução segura.'),
  -- arm-int-08
  ('e262cc99-a477-5fe5-9ae5-c8f568f11942', 'armazenamento', 'intermediario',
   'Você precisa acompanhar o saldo de estoque de cada produto ao fim de cada dia. Que tipo de tabela fato é mais adequado?',
   array['Fato transacional, com uma linha por movimentação de estoque', 'Fato sem métricas (*factless*), com uma linha por produto', 'Fato de *snapshot* acumulado, com uma linha por pedido', 'Fato de *snapshot* periódico, com uma linha por produto por dia'],
   3,
   'O *snapshot* periódico registra o estado de algo em intervalos regulares, ideal para saldos como estoque ou conta bancária. Uma fato transacional guarda cada movimentação, e calcular o saldo diário exigiria somar todo o histórico. O *snapshot* acumulado acompanha processos com etapas definidas, como o ciclo de um pedido.'),
  -- arm-int-09
  ('fd056315-f6a4-5fbb-8b6e-3c5d5d1daf91', 'armazenamento', 'intermediario',
   'Por que não faz sentido somar o saldo bancário de uma tabela de *snapshot* diário ao longo dos dias de um mês?',
   array['O saldo é semiaditivo: soma entre contas, mas não ao longo do tempo', 'O saldo é não aditivo: não pode ser somado em nenhuma dimensão', 'O saldo é aditivo, mas a soma exige convertê-lo para inteiros', 'O saldo é derivado, então deve ser recalculado na camada de BI'],
   0,
   'Somar os saldos de 30 dias conta o mesmo dinheiro repetidas vezes, então ao longo do tempo usa-se o último saldo ou a média. Entre contas ou agências, porém, a soma faz sentido, por isso a métrica é chamada de semiaditiva. Métricas não aditivas, como percentuais, não podem ser somadas em nenhuma dimensão.'),
  -- arm-int-10
  ('ff971787-9089-5292-a8f6-ed3e8ac617d1', 'armazenamento', 'intermediario',
   'Por que é difícil fazer um `UPDATE` ou `MERGE` confiável sobre arquivos Parquet puros em um data lake, sem um formato de tabela como Delta Lake ou Iceberg?',
   array['O Parquet não aceita colunas numéricas com casas decimais de precisão', 'Não há log de transações para tornar atômica a troca dos arquivos alterados', 'O armazenamento de objetos não permite apagar arquivos já gravados', 'O Parquet só pode ser lido por um único motor de consulta por vez'],
   1,
   'Arquivos Parquet são imutáveis, então um `UPDATE` precisa reescrever arquivos inteiros e trocá-los. Sem um log de transações, um leitor pode ver parte dos arquivos novos e parte dos antigos, e uma falha no meio pode deixar a tabela inconsistente. Delta Lake e Iceberg registram cada versão em um log, tornando essas operações atômicas.'),
  -- bdc-ini-01
  ('0d1e5d0c-6f2a-5a74-9f27-78f187975499', 'big_data_cloud', 'iniciante',
   'No Spark, qual a diferença entre uma transformação e uma ação?',
   array['Transformações só descrevem o plano; ações disparam a execução e retornam resultados', 'Transformações executam na hora; ações só são executadas no fim do programa', 'Transformações leem os dados do disco; ações gravam os dados de volta no disco', 'Transformações rodam no *driver*; ações rodam nos *executors* do cluster'],
   0,
   'Operações como `filter`, `select` e `join` são transformações: o Spark apenas registra o que deve ser feito. Quando uma ação como `count`, `collect` ou `write` é chamada, ele otimiza o plano inteiro e executa o processamento. Esse comportamento é chamado de avaliação preguiçosa (*lazy evaluation*).'),
  -- bdc-ini-02
  ('5d34ecdb-2b28-5b1c-b2d8-56c8e6d10830', 'big_data_cloud', 'iniciante',
   'Qual é uma vantagem da avaliação preguiçosa (*lazy evaluation*) no Spark?',
   array['Guardar automaticamente em memória o resultado de todas as transformações', 'Otimizar o plano completo antes de executar, por exemplo aplicando filtros cedo', 'Executar cada transformação assim que é escrita, para mostrar erros antes', 'Dispensar a distribuição dos dados entre as máquinas do cluster'],
   1,
   'Como nada é executado até uma ação, o Spark enxerga todas as etapas e pode reorganizá-las, por exemplo aplicando filtros logo na leitura para ler menos dados. Um efeito colateral é que erros de lógica só aparecem quando a ação é chamada. O cache em memória, por sua vez, precisa ser pedido explicitamente.'),
  -- bdc-ini-03
  ('f9f19b24-3960-5a1f-98c1-0b82350824c5', 'big_data_cloud', 'iniciante',
   'Por que frameworks como o Spark dividem os dados em partições?',
   array['Para garantir que os dados fiquem ordenados em todas as etapas', 'Para impedir que duas tarefas leiam o mesmo arquivo de origem', 'Para processar partes dos dados em paralelo em várias máquinas', 'Para criptografar cada parte com uma chave de segurança própria'],
   2,
   'Cada partição é processada por uma tarefa, e as tarefas rodam em paralelo nos *executors* do cluster. Assim, um volume que levaria horas em uma máquina é dividido entre dezenas delas. O número e o tamanho das partições afetam diretamente o desempenho.'),
  -- bdc-ini-04
  ('520c7c92-0f52-5a2f-9533-4503bd64a80e', 'big_data_cloud', 'iniciante',
   'No Kafka, o que é um tópico?',
   array['Um banco relacional que guarda o estado atual de cada consumidor', 'Um servidor do cluster responsável por armazenar as mensagens', 'Uma consulta contínua que filtra as mensagens recebidas pelo cluster', 'Um fluxo nomeado de mensagens, no qual produtores gravam e consumidores leem'],
   3,
   'Um tópico é uma categoria de mensagens, como `pedidos` ou `cliques`, que funciona como um log em que só se acrescentam registros. Produtores publicam mensagens nele, e consumidores as leem no próprio ritmo. O servidor que armazena as mensagens é chamado de *broker*.'),
  -- bdc-ini-05
  ('338401a1-376a-5d98-a244-94b13a82ba56', 'big_data_cloud', 'iniciante',
   'Diferente de uma fila tradicional, o que acontece com uma mensagem no Kafka depois de lida por um consumidor?',
   array['Ela continua no tópico até expirar pelo período de retenção configurado', 'Ela é apagada assim que o primeiro consumidor confirma a leitura', 'Ela é movida para um tópico de arquivo morto do próprio cluster', 'Ela fica bloqueada para a leitura de qualquer outro consumidor'],
   0,
   'O Kafka guarda as mensagens por um tempo ou tamanho configurado, independentemente de terem sido lidas. Cada consumidor controla a própria posição de leitura, chamada *offset*. Por isso, vários sistemas podem ler o mesmo tópico, e é possível reprocessar mensagens antigas voltando o *offset*.'),
  -- bdc-ini-06
  ('c1b6274e-d8ac-5b76-83fa-7662cb260957', 'big_data_cloud', 'iniciante',
   'Por que o armazenamento de objetos em nuvem é a base comum de data lakes?',
   array['Oferece transações ACID nativas entre vários arquivos ao mesmo tempo', 'Tem custo baixo por GB, alta durabilidade e cresce sem gerenciar discos', 'Permite alterar poucos bytes no meio de um arquivo com baixa latência', 'Funciona como um banco relacional com índices em todas as colunas'],
   1,
   'O armazenamento de objetos cobra pouco por GB, replica os dados para alta durabilidade e escala praticamente sem limite. Em troca, os objetos são imutáveis e não há transações entre arquivos, por isso surgiram formatos como Delta Lake e Iceberg. Ele também separa o armazenamento do processamento, que pode ser ligado só quando necessário.'),
  -- bdc-ini-07
  ('b6c17f32-6fbc-548a-95d9-a9e037611131', 'big_data_cloud', 'iniciante',
   'O que significa separar armazenamento e processamento (*compute*) em uma plataforma de dados na nuvem?',
   array['Cada tabela fica em uma região diferente da nuvem para reduzir riscos', 'O processamento só lê dados que estejam no disco local da máquina', 'Os dados ficam em um serviço, e o processamento escala ou desliga à parte', 'Os dados brutos e os tratados precisam ficar em provedores diferentes'],
   2,
   'Com armazenamento e processamento separados, os dados ficam em um serviço durável, e os clusters ou motores de consulta são ligados conforme a demanda. Isso permite desligar o processamento à noite sem perder dados e usar vários motores sobre a mesma cópia. No modelo acoplado, aumentar o armazenamento obrigava a comprar processamento junto, e vice-versa.'),
  -- bdc-ini-08
  ('6d210f53-8aec-592c-9660-b9419437fd18', 'big_data_cloud', 'iniciante',
   'Qual é a principal vantagem de usar um serviço de dados gerenciado na nuvem em vez de manter o mesmo software em servidores próprios?',
   array['O serviço gerenciado sempre custa menos, para qualquer volume de uso', 'O serviço gerenciado elimina a necessidade de modelar os dados', 'O serviço gerenciado dá acesso direto ao sistema operacional', 'O provedor cuida de instalação, atualizações e escala, reduzindo a operação'],
   3,
   'Em um serviço gerenciado, tarefas como provisionar máquinas, aplicar atualizações, fazer backup e escalar ficam com o provedor. O time foca nos dados, e não na infraestrutura. Em troca, há menos controle sobre configurações, e o custo pode ser maior em alguns padrões de uso.'),
  -- bdc-ini-09
  ('1782ee8a-9a97-5c91-8969-8372bbc7ed8a', 'big_data_cloud', 'iniciante',
   'Qual a diferença entre escalar vertical e horizontalmente?',
   array['Vertical é usar uma máquina mais potente; horizontal é adicionar mais máquinas', 'Vertical é adicionar mais máquinas; horizontal é usar uma máquina mais potente', 'Vertical é aumentar o disco; horizontal é aumentar a memória da mesma máquina', 'Vertical vale para bancos de dados; horizontal vale só para servidores web'],
   0,
   'Escalar verticalmente significa trocar por uma máquina com mais CPU, memória ou disco, o que tem um limite físico e de custo. Escalar horizontalmente distribui o trabalho entre mais máquinas, que é o modelo de Spark e Kafka. A escala horizontal exige que o sistema saiba dividir os dados e coordenar as tarefas.'),
  -- bdc-ini-10
  ('4a0258c9-d72c-5d47-9bd5-e349fa721293', 'big_data_cloud', 'iniciante',
   'Para que servem as partições de um tópico no Kafka?',
   array['Para separar as mensagens já lidas das mensagens que ainda não foram lidas', 'Para distribuir as mensagens e permitir que vários consumidores leiam em paralelo', 'Para guardar cópias de segurança das mensagens em outro data center', 'Para ordenar todas as mensagens do tópico pelo horário de chegada'],
   1,
   'Um tópico é dividido em partições, que podem ficar em *brokers* diferentes e ser lidas por consumidores diferentes ao mesmo tempo. Isso permite escalar a leitura e a escrita. A ordem das mensagens é garantida apenas dentro de cada partição, e não no tópico inteiro.'),
  -- bdc-int-01
  ('50c064f5-f5a7-5d32-a8e3-0323b144c251', 'big_data_cloud', 'intermediario',
   'Quais operações no Spark normalmente causam *shuffle*, a redistribuição de dados entre as máquinas?',
   array['`groupBy` e `join`, que precisam juntar registros com a mesma chave', '`filter` e `select`, que leem as colunas de cada partição', '`withColumn` e `cast`, que alteram o tipo de uma coluna', '`limit` e `show`, que retornam poucas linhas ao *driver*'],
   0,
   'Para agrupar ou juntar por uma chave, todos os registros com a mesma chave precisam estar na mesma partição, o que exige movê-los pela rede. Esse é o *shuffle*, uma das etapas mais caras de um job. `filter`, `select` e `withColumn` atuam dentro de cada partição, sem trocar dados entre máquinas.'),
  -- bdc-int-02
  ('fa0f6149-b669-5dab-a73c-3876130a7775', 'big_data_cloud', 'intermediario',
   'Em um join, uma tarefa do Spark leva 40 minutos enquanto as outras terminam em 1 minuto. Qual é a causa mais provável?',
   array['Falta de memória no *driver* para coletar o resultado final do join', '*Skew*: uma chave concentra boa parte dos registros em uma partição', 'Excesso de partições pequenas criadas na leitura dos arquivos', 'Uso de um formato colunar, como Parquet, na tabela de entrada'],
   1,
   'Quando uma chave, como um cliente genérico ou um valor nulo, aparece muito mais que as outras, a partição dela fica enorme e a tarefa correspondente vira o gargalo. Técnicas comuns são o *salting*, que espalha a chave quente em várias partições, e a execução adaptativa, que divide partições desbalanceadas. Excesso de partições pequenas gera sobrecarga geral, e não uma única tarefa lenta.'),
  -- bdc-int-03
  ('cdc30899-04dd-564f-8326-49db34e786f9', 'big_data_cloud', 'intermediario',
   'Você vai juntar uma tabela de 2 TB com uma tabela de países de 200 linhas. Qual estratégia de join evita o *shuffle* da tabela grande?',
   array['*Sort-merge join*: ordenar as duas tabelas pela chave de junção', '*Cross join*: combinar todas as linhas das duas tabelas entre si', '*Broadcast join*: enviar a tabela pequena a todos os *executors*', '*Shuffle hash join*: redistribuir as duas tabelas pela chave'],
   2,
   'No *broadcast join*, a tabela pequena é copiada inteira para cada *executor*, e cada partição da tabela grande é juntada localmente. Assim, os 2 TB não precisam ser movidos pela rede. *Sort-merge* e *shuffle hash join* redistribuem as duas tabelas, o que é muito mais caro nesse cenário.'),
  -- bdc-int-04
  ('a55b8766-f270-54be-b052-9d5a43eef4b1', 'big_data_cloud', 'intermediario',
   'Um tópico do Kafka tem 6 partições, e um *consumer group* tem 8 consumidores. O que acontece?',
   array['Os oito consumidores dividem as seis partições em partes iguais', 'Cada mensagem é entregue a todos os oito consumidores do grupo', 'O Kafka cria duas partições extras para atender a todo o grupo', 'Seis consumidores recebem uma partição cada, e dois ficam ociosos'],
   3,
   'Dentro de um *consumer group*, cada partição é lida por no máximo um consumidor, para preservar a ordem. Com 6 partições, só 6 consumidores trabalham, e os outros ficam de reserva caso algum falhe. Para ganhar paralelismo, é preciso aumentar o número de partições do tópico.'),
  -- bdc-int-05
  ('252de7ca-fc12-545e-af8d-9ec62f1b2ffc', 'big_data_cloud', 'intermediario',
   'Os eventos de cada pedido precisam ser processados na ordem em que ocorreram. Como garantir isso no Kafka sem abrir mão do paralelismo?',
   array['Usar o ID do pedido como chave, levando os eventos à mesma partição', 'Usar um tópico com uma partição para cada consumidor do grupo', 'Usar chaves aleatórias para distribuir melhor a carga entre partições', 'Usar a data do evento como chave, agrupando os eventos do mesmo dia'],
   0,
   'O Kafka garante ordem apenas dentro de uma partição, e mensagens com a mesma chave vão sempre para a mesma partição. Usar o ID do pedido como chave mantém todos os eventos daquele pedido em ordem, enquanto pedidos diferentes são processados em paralelo. Chaves aleatórias espalham os eventos de um mesmo pedido e quebram a ordem.'),
  -- bdc-int-06
  ('92c78fbf-0073-5589-bbc9-f485b733e543', 'big_data_cloud', 'intermediario',
   'Antes de gravar o resultado, você quer reduzir de 2.000 para 50 partições sem um *shuffle* completo. Qual operação usar no Spark?',
   array['`repartition(50)`, que redistribui os dados de forma uniforme', '`coalesce(50)`, que junta partições existentes sem redistribuir tudo', '`cache()`, que guarda as partições em memória antes da escrita', '`distinct()`, que elimina as partições com dados repetidos'],
   1,
   'O `coalesce` reduz o número de partições combinando as que já existem, evitando um *shuffle* completo. O `repartition` faz um *shuffle* e gera partições equilibradas, útil quando os dados estão desbalanceados ou quando é preciso aumentar o número de partições. Reduzir de 2.000 para 50 partições também evita milhares de arquivos pequenos na saída.'),
  -- bdc-int-07
  ('154fd5f6-b9b0-5b75-8d4f-884792eee49c', 'big_data_cloud', 'intermediario',
   'Em qual situação faz sentido usar `cache()` ou `persist()` em um DataFrame do Spark?',
   array['Quando o DataFrame será usado uma única vez, em uma ação de escrita', 'Sempre que o DataFrame for lido de arquivos no formato Parquet', 'Quando o mesmo DataFrame será reutilizado por várias ações seguidas', 'Sempre, pois o cache acelera qualquer job sem nenhum custo extra'],
   2,
   'Sem cache, cada ação recalcula toda a cadeia de transformações desde a leitura. Guardar o resultado intermediário compensa quando ele alimenta várias ações, como diferentes agregações. Em uso único, o cache só consome memória, que pode faltar para outras etapas.'),
  -- bdc-int-08
  ('3525532d-49fb-59f5-8e7b-f223d6e671fa', 'big_data_cloud', 'intermediario',
   'Um motor de consulta em nuvem cobra pelo volume de dados lido. Qual medida reduz mais o custo de uma consulta frequente?',
   array['Converter os dados para CSV, que é mais simples de ler pelo motor de consulta', 'Usar `SELECT *` e descartar as colunas desnecessárias depois, na ferramenta de BI', 'Guardar todos os dados em um único arquivo grande para reduzir a listagem', 'Usar formato colunar, particionar pelos filtros e selecionar só as colunas usadas'],
   3,
   'Quando a cobrança é por dado lido, cada byte evitado é economia. Formatos colunares permitem ler só as colunas pedidas, e o particionamento descarta arquivos fora do filtro. `SELECT *` e CSV fazem o motor ler tudo, mesmo que a maior parte seja descartada depois.'),
  -- bdc-int-09
  ('6d83d3df-3ade-5cfa-8819-87135dc31ca0', 'big_data_cloud', 'intermediario',
   'Um job de *batch* noturno pode ser reiniciado se falhar e não tem prazo apertado. Qual opção de nuvem tende a reduzir mais o custo?',
   array['Instâncias *spot* ou preemptivas, com desconto e risco de interrupção', 'Instâncias reservadas por três anos, para um uso de poucas horas por dia', 'Instâncias sob demanda de maior porte, para terminar o job mais rápido', 'Um cluster dedicado e sempre ligado, para evitar o tempo de inicialização'],
   0,
   'Instâncias *spot* usam capacidade ociosa do provedor com grandes descontos, mas podem ser retomadas a qualquer momento. Um job tolerante a falhas e sem prazo apertado aproveita bem esse modelo. Reservas longas e clusters sempre ligados pagam pela capacidade mesmo nas horas em que o job não roda.'),
  -- bdc-int-10
  ('6a6a2cf5-6895-508f-a34b-811219b34ac7', 'big_data_cloud', 'intermediario',
   'Por que um filtro como `WHERE dt = ''2024-05-01''` pode deixar muito mais rápida, no Spark, a leitura de dados particionados por `dt`?',
   array['O Spark ordena os dados por data antes de aplicar o filtro', 'O Spark lê só a pasta daquela partição e ignora as demais', 'O Spark cria um índice temporário em `dt` antes da leitura', 'O Spark guarda o resultado em cache para as próximas leituras'],
   1,
   'Quando os dados estão gravados em pastas como `dt=2024-05-01`, o Spark usa o filtro para descartar as outras pastas antes de ler qualquer arquivo, técnica chamada *partition pruning*. Em vez de ler meses de dados, ele lê um único dia. Isso só funciona se o filtro for aplicado diretamente sobre a coluna de partição.')
on conflict (id) do update set
  theme         = excluded.theme,
  level         = excluded.level,
  statement     = excluded.statement,
  options       = excluded.options,
  correct_index = excluded.correct_index,
  explanation   = excluded.explanation;

commit;
