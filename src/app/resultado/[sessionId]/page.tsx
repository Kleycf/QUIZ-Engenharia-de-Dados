import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ResultActions } from "@/components/ResultActions";
import { ReviewList } from "@/components/ReviewList";
import { formatDuration } from "@/lib/format";
import { LEVEL_LABELS, PERFORMANCE_LABELS, PERFORMANCE_MESSAGES, THEME_LABELS, themeLabel } from "@/lib/labels";
import { loadSessionStateOrNotFound } from "@/lib/server/pages";

export const metadata: Metadata = { title: "Resultado" };

export default function ResultPage({ params }: PageProps<"/resultado/[sessionId]">) {
  return (
    <Suspense fallback={<p className="text-muted">Carregando seu resultado…</p>}>
      <ResultLoader params={params} />
    </Suspense>
  );
}

async function ResultLoader({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const { session, questions, answers } = await loadSessionStateOrNotFound(sessionId);
  const result = session.result;
  // Rodada ainda aberta: volta para o quiz, que retoma de onde parou (e conclui ao final).
  if (!result) redirect(`/quiz/${sessionId}`);

  const wrongCount = answers.filter((a) => !a.isCorrect).length;
  const bandTone = result.band === "excelente" ? "text-success" : result.band === "bom_caminho" ? "text-accent" : "text-foreground";

  return (
    <div className="space-y-10">
      <section aria-labelledby="resultado-titulo" className="space-y-6 rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="space-y-1">
          <h1 id="resultado-titulo" className="text-2xl font-bold sm:text-3xl">
            Seu resultado, {session.playerName}
          </h1>
          <p className="text-muted">
            {themeLabel(session.theme)} · {LEVEL_LABELS[session.level]}
            {session.isRetry && " · Revisão das erradas (fora do ranking)"}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <p>
            <span className="block text-5xl font-bold tabular-nums">
              {result.score}/{result.total}
            </span>
            <span className="text-muted">acertos</span>
          </p>
          <p>
            <span className="block text-5xl font-bold tabular-nums">{result.percent}%</span>
            <span className="text-muted">de aproveitamento</span>
          </p>
          <p>
            <span className="block text-2xl font-semibold tabular-nums">{formatDuration(result.durationMs)}</span>
            <span className="text-muted">de duração</span>
          </p>
        </div>

        <div className="space-y-1">
          <p className={`text-xl font-bold ${bandTone}`}>{PERFORMANCE_LABELS[result.band]}!</p>
          <p>{PERFORMANCE_MESSAGES[result.band]}</p>
        </div>

        {session.theme === null && result.byTheme.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold">Desempenho por tema</h2>
            <table className="w-full text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th scope="col" className="py-2 font-medium">Tema</th>
                  <th scope="col" className="py-2 text-right font-medium">Acertos</th>
                  <th scope="col" className="py-2 text-right font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {result.byTheme.map((t) => (
                  <tr key={t.theme} className="border-t border-border">
                    <th scope="row" className="py-2 font-normal">{THEME_LABELS[t.theme]}</th>
                    <td className="py-2 text-right tabular-nums">
                      {t.score}/{t.total}
                    </td>
                    <td className="py-2 text-right tabular-nums">{t.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ResultActions
          sessionId={session.id}
          playerName={session.playerName}
          theme={session.theme}
          level={session.level}
          isRetry={session.isRetry}
          wrongCount={wrongCount}
        />
      </section>

      <ReviewList questions={questions} answers={answers} />
    </div>
  );
}
