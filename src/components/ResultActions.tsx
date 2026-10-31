"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiClientError, apiFetch } from "@/lib/client/api";
import { ALL_THEMES, type Level, type Theme } from "@/lib/quiz/domain";

interface Props {
  sessionId: string;
  playerName: string;
  theme: Theme | null;
  level: Level;
  isRetry: boolean;
  wrongCount: number;
}

const primary =
  "flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 py-3 font-semibold text-accent-foreground disabled:opacity-50";
const secondary =
  "flex min-h-11 items-center justify-center rounded-lg border-2 border-accent px-5 py-3 font-semibold text-accent disabled:opacity-50";

/** RF18: Jogar novamente, Refazer só as erradas, Ver ranking e Início. */
export function ResultActions({ sessionId, playerName, theme, level, isRetry, wrongCount }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"again" | "retry" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(kind: "again" | "retry") {
    setBusy(kind);
    setError(null);
    try {
      const { sessionId: next } = await apiFetch<{ sessionId: string }>("/api/sessions", {
        method: "POST",
        body: { playerName, theme, level, ...(kind === "retry" ? { retryOf: sessionId } : {}) },
      });
      router.push(`/quiz/${next}`);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Não foi possível começar a rodada. Tente novamente.");
      setBusy(null);
    }
  }

  const rankingHref = `/ranking?theme=${theme ?? ALL_THEMES}&level=${level}${isRetry ? "" : `&sessionId=${sessionId}`}`;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" className={primary} disabled={busy !== null} onClick={() => start("again")}>
          {busy === "again" ? "Preparando…" : "Jogar novamente"}
        </button>
        {wrongCount > 0 && (
          <button type="button" className={secondary} disabled={busy !== null} onClick={() => start("retry")}>
            {busy === "retry" ? "Preparando…" : `Refazer só as erradas (${wrongCount})`}
          </button>
        )}
        <Link href={rankingHref} className={secondary}>
          Ver ranking
        </Link>
        <Link href="/" className={secondary}>
          Início
        </Link>
      </div>
      {wrongCount > 0 && (
        <p className="text-sm text-muted">&quot;Refazer só as erradas&quot; é uma rodada de revisão e não entra no ranking.</p>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-danger">
          ✗ {error}
        </p>
      )}
    </div>
  );
}
