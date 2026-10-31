// Formatação para exibição em pt-BR. Fuso fixo de Brasília: o servidor roda em UTC e a data
// da rodada não pode "virar o dia" para quem joga à noite no Brasil.
const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

/** "45 s", "2 min 05 s". */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} s`;
  return `${minutes} min ${String(seconds).padStart(2, "0")} s`;
}

/** Letra exibida da alternativa pela posição na tela (A–D). */
export const optionLetter = (position: number) => "ABCD"[position] ?? "?";
