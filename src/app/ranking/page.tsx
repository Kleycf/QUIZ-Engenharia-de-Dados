import type { Metadata } from "next";
import { Suspense } from "react";
import { formatDate, formatDuration } from "@/lib/format";
import { ALL_THEMES_LABEL, LEVEL_LABELS, THEME_LABELS, themeLabel } from "@/lib/labels";
import { ALL_THEMES, LEVELS, THEMES } from "@/lib/quiz/domain";
import { getRanking, type PublicRankingEntry } from "@/lib/server/quiz";
import { rankingQuerySchema, sessionIdSchema, type RankingQuery } from "@/lib/validation";

export const metadata: Metadata = { title: "Ranking" };

export default function RankingPage({ searchParams }: PageProps<"/ranking">) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Ranking</h1>
        <p className="text-muted">
          Top 10 por tema e nível. Desempate: maior percentual, depois menor tempo, depois quem terminou primeiro.
        </p>
      </div>
      <Suspense fallback={<p className="text-muted">Carregando o ranking…</p>}>
        <RankingContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const first = (value: string | string[] | undefined) => (typeof value === "string" && value ? value : undefined);

function parseQuery(params: Record<string, string | string[] | undefined>): RankingQuery {
  const filters = rankingQuerySchema.safeParse({ theme: first(params.theme), level: first(params.level) ?? "iniciante" });
  const sessionId = sessionIdSchema.safeParse(first(params.sessionId));
  return {
    ...(filters.success ? filters.data : { theme: null, level: "iniciante" }),
    ...(sessionId.success ? { sessionId: sessionId.data } : {}),
  };
}

async function RankingContent({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseQuery(await searchParams);
  const { top, me } = await getRanking(query);
  const caption = `Top 10: ${themeLabel(query.theme)} · ${LEVEL_LABELS[query.level]}`;

  return (
    <div className="space-y-6">
      <RankingFilters query={query} />

      {top.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6">
          Ainda não há rodadas concluídas neste ranking. Jogue uma e seja a primeira pessoa da lista!
        </p>
      ) : (
        <>
          {/* Desktop: tabela */}
          <table className="hidden w-full overflow-hidden rounded-xl border border-border bg-card text-left sm:table">
            <caption className="sr-only">{caption}</caption>
            <thead className="border-b border-border text-sm text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Posição</th>
                <th scope="col" className="px-4 py-3 font-medium">Nome</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Pontuação</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">%</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Tempo</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {top.map((entry) => (
                <tr
                  key={entry.position}
                  aria-current={entry.isMe ? "true" : undefined}
                  className={`border-t border-border ${entry.isMe ? "bg-accent-soft font-semibold" : ""}`}
                >
                  <td className="px-4 py-3 tabular-nums">{entry.position}º</td>
                  <th scope="row" className="px-4 py-3 font-[inherit]">
                    {entry.playerName}
                    {entry.isMe && <YouBadge />}
                  </th>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {entry.score}/{entry.total}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{entry.percent}%</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatDuration(entry.durationMs)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatDate(entry.finishedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile: lista */}
          <ol aria-label={caption} className="space-y-2 sm:hidden">
            {top.map((entry) => (
              <li
                key={entry.position}
                aria-current={entry.isMe ? "true" : undefined}
                className={`flex items-center gap-4 rounded-xl border border-border p-4 ${entry.isMe ? "bg-accent-soft font-semibold" : "bg-card"}`}
              >
                <span className="w-10 text-xl font-bold tabular-nums">{entry.position}º</span>
                <span className="flex-1">
                  <span className="block">
                    {entry.playerName}
                    {entry.isMe && <YouBadge />}
                  </span>
                  <span className="block text-sm font-normal text-muted tabular-nums">
                    {entry.score}/{entry.total} · {entry.percent}% · {formatDuration(entry.durationMs)} ·{" "}
                    {formatDate(entry.finishedAt)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </>
      )}

      {me && !me.isMe && <OwnPosition entry={me} />}
    </div>
  );
}

function YouBadge() {
  return (
    <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">você</span>
  );
}

/** RF22: fora do Top 10, mostra a posição de quem acabou de jogar abaixo da lista. */
function OwnPosition({ entry }: { entry: PublicRankingEntry }) {
  return (
    <p className="rounded-xl border-2 border-accent bg-accent-soft p-4">
      Sua posição: <strong className="tabular-nums">{entry.position}º lugar</strong>, com {entry.score}/{entry.total} (
      {entry.percent}%) em {formatDuration(entry.durationMs)}.
    </p>
  );
}

function RankingFilters({ query }: { query: RankingQuery }) {
  const select =
    "block min-h-11 w-full rounded-lg border border-control-border bg-card px-3 py-2 text-base";
  return (
    <form method="get" action="/ranking" className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="space-y-1">
        <span className="block text-sm font-medium">Tema</span>
        <select name="theme" defaultValue={query.theme ?? ALL_THEMES} className={select}>
          <option value={ALL_THEMES}>{ALL_THEMES_LABEL}</option>
          {THEMES.map((t) => (
            <option key={t} value={t}>
              {THEME_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="block text-sm font-medium">Nível</span>
        <select name="level" defaultValue={query.level} className={select}>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {LEVEL_LABELS[l]}
            </option>
          ))}
        </select>
      </label>
      {query.sessionId && <input type="hidden" name="sessionId" value={query.sessionId} />}
      <button type="submit" className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-accent-foreground">
        Filtrar
      </button>
    </form>
  );
}
