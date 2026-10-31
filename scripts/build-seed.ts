// Gera supabase/seed.sql a partir de supabase/questions/<tema>.json.
// Uso: npm run db:seed  (o teste tests/seed/seed.test.ts falha se o seed.sql estiver desatualizado)
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
// Extensão .ts explícita: este script roda direto no Node, sem bundler para resolver o import.
import { LEVELS, THEMES, type Level, type Theme } from "../src/lib/quiz/domain.ts";

export { LEVELS, THEMES };

/** Formato de cada pergunta nos arquivos JSON. */
export interface SourceQuestion {
  id: string;
  statement: string;
  answer: string;
  distractors: string[];
  explanation: string;
}

/** Pergunta pronta para o banco: alternativas na ordem gravada em `options`. */
export interface SeedQuestion extends SourceQuestion {
  theme: Theme;
  level: Level;
  uuid: string;
  options: string[];
  correctIndex: number;
}

const SUPABASE_DIR = fileURLToPath(new URL("../supabase", import.meta.url));
export const QUESTIONS_DIR = join(SUPABASE_DIR, "questions");
export const SEED_PATH = join(SUPABASE_DIR, "seed.sql");

// Namespace fixo do UUID v5: o mesmo slug gera sempre o mesmo id, então reaplicar o seed atualiza em vez de duplicar.
const UUID_NAMESPACE = "6f1d3c2e-9a4b-4e7f-8c21-5b0d9e3a7f10";

export function uuidFromSlug(slug: string): string {
  const hash = createHash("sha1")
    .update(Buffer.from(UUID_NAMESPACE.replaceAll("-", ""), "hex"))
    .update(slug)
    .digest()
    .subarray(0, 16);
  hash.writeUInt8((hash.readUInt8(6) & 0x0f) | 0x50, 6); // versão 5
  hash.writeUInt8((hash.readUInt8(8) & 0x3f) | 0x80, 8); // variante RFC 4122
  const hex = hash.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function loadQuestions(): SeedQuestion[] {
  return THEMES.flatMap((theme) => {
    const byLevel = JSON.parse(readFileSync(join(QUESTIONS_DIR, `${theme}.json`), "utf8")) as Record<
      string,
      SourceQuestion[]
    >;
    const unknown = Object.keys(byLevel).filter((key) => !(LEVELS as readonly string[]).includes(key));
    if (unknown.length > 0) throw new Error(`${theme}.json: nível desconhecido: ${unknown.join(", ")}`);

    return LEVELS.flatMap((level) =>
      (byLevel[level] ?? []).map((q, i) => {
        // A posição da correta só equilibra o gabarito no banco; a tela embaralha as alternativas.
        const correctIndex = i % 4;
        const options = [...q.distractors];
        options.splice(correctIndex, 0, q.answer);
        return { ...q, theme, level, uuid: uuidFromSlug(q.id), options, correctIndex };
      }),
    );
  });
}

const sqlString = (value: string) => `'${value.replaceAll("'", "''")}'`;

export function buildSeedSql(questions: SeedQuestion[]): string {
  const rows = questions.map(
    (q) =>
      `  -- ${q.id}\n` +
      `  (${sqlString(q.uuid)}, ${sqlString(q.theme)}, ${sqlString(q.level)},\n` +
      `   ${sqlString(q.statement)},\n` +
      `   array[${q.options.map(sqlString).join(", ")}],\n` +
      `   ${q.correctIndex},\n` +
      `   ${sqlString(q.explanation)})`,
  );

  return [
    "-- Gerado por scripts/build-seed.ts a partir de supabase/questions/*.json. Não edite à mão: rode `npm run db:seed`.",
    `-- ${questions.length} perguntas. Pode ser reaplicado: ids fixos + upsert.`,
    "",
    "begin;",
    "",
    "insert into questions (id, theme, level, statement, options, correct_index, explanation) values",
    rows.join(",\n"),
    "on conflict (id) do update set",
    "  theme         = excluded.theme,",
    "  level         = excluded.level,",
    "  statement     = excluded.statement,",
    "  options       = excluded.options,",
    "  correct_index = excluded.correct_index,",
    "  explanation   = excluded.explanation;",
    "",
    "commit;",
    "",
  ].join("\n");
}

if (import.meta.main) {
  const questions = loadQuestions();
  writeFileSync(SEED_PATH, buildSeedSql(questions));
  console.log(`seed.sql gerado com ${questions.length} perguntas.`);
}
