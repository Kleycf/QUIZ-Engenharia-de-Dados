import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export type Db = SupabaseClient<Database>;

let client: Db | undefined;

/**
 * Cliente Supabase com a service_role. Só existe no servidor: o `import "server-only"` quebra o build
 * se este módulo for importado por um componente cliente. O navegador nunca fala com o Supabase.
 */
export function getDb(): Db {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidas (veja .env.example).");
  }

  client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
