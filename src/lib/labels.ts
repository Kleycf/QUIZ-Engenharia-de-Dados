import type { Level, Theme } from "@/lib/quiz/domain";
import type { PerformanceBand } from "@/lib/quiz/score";

export const THEME_LABELS: Record<Theme, string> = {
  fundamentos_sql: "Fundamentos e SQL",
  pipelines: "Pipelines (ETL/ELT)",
  armazenamento: "Data Warehouse, Lake e Lakehouse",
  big_data_cloud: "Big Data e Cloud",
};

export const ALL_THEMES_LABEL = "Todos os temas";

export const LEVEL_LABELS: Record<Level, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
};

export const PERFORMANCE_LABELS: Record<PerformanceBand, string> = {
  excelente: "Excelente",
  bom_caminho: "Bom caminho",
  continue_praticando: "Continue praticando",
};

/** Nome exibido do tema; `null` é "Todos os temas". */
export function themeLabel(theme: Theme | null): string {
  return theme === null ? ALL_THEMES_LABEL : THEME_LABELS[theme];
}
