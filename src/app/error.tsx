"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="space-y-4">
      <h1 className="text-2xl font-bold">Algo deu errado</h1>
      <p className="text-muted">Não conseguimos carregar esta página agora. Tente de novo em instantes.</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-accent-foreground"
        >
          Tentar novamente
        </button>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-lg border-2 border-accent px-5 font-semibold text-accent">
          Início
        </Link>
      </div>
    </div>
  );
}
