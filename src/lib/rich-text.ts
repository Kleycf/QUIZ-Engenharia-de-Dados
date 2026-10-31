// Markdown mínimo usado nas perguntas: blocos ```sql, `código`, **negrito** e *itálico*.
// Gera tokens (e não HTML), então o conteúdo nunca passa por dangerouslySetInnerHTML.

export type Block = { type: "paragraph"; text: string } | { type: "code"; language: string; code: string };
export type Inline = { type: "text" | "code" | "strong" | "em"; text: string };

const FENCE = /```([a-z]*)\n([\s\S]*?)```/g;
const INLINE = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*/g;

export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  const pushParagraphs = (text: string) => {
    for (const paragraph of text.split(/\n{2,}/)) {
      if (paragraph.trim()) blocks.push({ type: "paragraph", text: paragraph.trim() });
    }
  };

  let last = 0;
  for (const match of source.matchAll(FENCE)) {
    pushParagraphs(source.slice(last, match.index));
    blocks.push({ type: "code", language: match[1] ?? "", code: (match[2] ?? "").replace(/\n$/, "") });
    last = match.index + match[0].length;
  }
  pushParagraphs(source.slice(last));
  return blocks;
}

export function parseInline(source: string): Inline[] {
  const tokens: Inline[] = [];
  let last = 0;
  for (const match of source.matchAll(INLINE)) {
    if (match.index > last) tokens.push({ type: "text", text: source.slice(last, match.index) });
    if (match[1] !== undefined) tokens.push({ type: "code", text: match[1] });
    else if (match[2] !== undefined) tokens.push({ type: "strong", text: match[2] });
    else tokens.push({ type: "em", text: match[3] ?? "" });
    last = match.index + match[0].length;
  }
  if (last < source.length) tokens.push({ type: "text", text: source.slice(last) });
  return tokens;
}

/** Texto puro, sem marcação (para aria-labels e afins). */
export function plainText(source: string): string {
  return parseInline(source)
    .map((t) => t.text)
    .join("");
}
