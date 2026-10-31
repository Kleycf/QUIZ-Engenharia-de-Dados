import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { QuizRunner } from "@/components/QuizRunner";
import { loadSessionStateOrNotFound } from "@/lib/server/pages";

export const metadata: Metadata = { title: "Rodada" };

export default function QuizPage({ params }: PageProps<"/quiz/[sessionId]">) {
  return (
    <Suspense fallback={<QuizSkeleton />}>
      <QuizLoader params={params} />
    </Suspense>
  );
}

async function QuizLoader({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const state = await loadSessionStateOrNotFound(sessionId);
  if (state.session.finished) redirect(`/resultado/${sessionId}`);
  return <QuizRunner initial={state} />;
}

function QuizSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <p className="text-sm text-muted">Carregando sua rodada…</p>
      <div className="h-2 rounded-full bg-border" />
      <div className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-8">
        <div className="h-6 w-3/4 rounded bg-border motion-safe:animate-pulse" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-border/60 motion-safe:animate-pulse" />
        ))}
      </div>
    </div>
  );
}
