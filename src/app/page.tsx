import { StartForm } from "@/components/StartForm";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Aprenda Engenharia de Dados jogando</h1>
        <p className="max-w-prose text-lg text-muted">
          Responda 10 perguntas, veja na hora se acertou e entenda o porquê de cada resposta. Escolha o tema e o nível
          e entre para o ranking.
        </p>
      </div>
      <StartForm />
    </div>
  );
}
