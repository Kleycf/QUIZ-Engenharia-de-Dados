import { parseBlocks, parseInline } from "@/lib/rich-text";

export function InlineText({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((token, i) => {
        switch (token.type) {
          case "code":
            return (
              <code key={i} className="rounded bg-code px-1 py-0.5 font-mono text-[0.9em]">
                {token.text}
              </code>
            );
          case "strong":
            return <strong key={i}>{token.text}</strong>;
          case "em":
            return <em key={i}>{token.text}</em>;
          default:
            return <span key={i}>{token.text}</span>;
        }
      })}
    </>
  );
}

/** Enunciados e explicações: parágrafos e blocos de código em fonte monoespaçada (PRD §4.4). */
export function RichText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {parseBlocks(text).map((block, i) =>
        block.type === "code" ? (
          <pre
            key={i}
            className="overflow-x-auto rounded-lg border border-border bg-code p-4 font-mono text-sm leading-relaxed"
          >
            <code>{block.code}</code>
          </pre>
        ) : (
          <p key={i}>
            <InlineText text={block.text} />
          </p>
        ),
      )}
    </div>
  );
}
