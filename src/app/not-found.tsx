import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="text-muted">
        Não encontramos o que você procurava. Se era uma rodada, o link pode estar incompleto.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 font-semibold text-accent-foreground"
      >
        Começar uma nova rodada
      </Link>
    </div>
  );
}
