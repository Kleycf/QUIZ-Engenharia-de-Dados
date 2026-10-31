"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { InlineText, RichText } from "@/components/RichText";
import { ApiClientError, apiFetch } from "@/lib/client/api";
import { optionLetter } from "@/lib/format";
import { THEME_LABELS } from "@/lib/labels";
import type { GradedAnswer, PublicQuestion, RevealedAnswer, SessionState } from "@/lib/quiz/session-state";

type OptionState = "idle" | "selected" | "correct" | "incorrect" | "neutral";

const OPTION_STYLES: Record<OptionState, string> = {
  idle: "border-control-border bg-card hover:border-accent cursor-pointer",
  selected: "border-accent bg-accent-soft ring-2 ring-accent cursor-pointer",
  correct: "border-success-border bg-success-soft",
  incorrect: "border-danger-border bg-danger-soft",
  neutral: "border-border bg-card text-muted",
};

const SHORTCUT_KEYS = ["1", "2", "3", "4", "a", "b", "c", "d"];

function toAnswerMap(answers: readonly RevealedAnswer[]): Record<string, RevealedAnswer> {
  return Object.fromEntries(answers.map((a) => [a.questionId, a]));
}

export function QuizRunner({ initial }: { initial: SessionState }) {
  const router = useRouter();
  const { session, questions } = initial;
  const [answers, setAnswers] = useState(() => toAnswerMap(initial.answers));
  // RF13: ao recarregar, retoma na primeira pergunta ainda não respondida.
  const [current, setCurrent] = useState(() => {
    const firstOpen = questions.findIndex((q) => !initial.answers.some((a) => a.questionId === q.id));
    return firstOpen === -1 ? questions.length - 1 : firstOpen;
  });
  const [selected, setSelected] = useState<number | null>(null);
  const [answering, setAnswering] = useState(false);
  // Concluir navega para o resultado: como transição, o "ocupado" volta sozinho se a página for restaurada.
  const [finishing, startFinish] = useTransition();
  const busy = answering ? "answer" : finishing ? "finish" : null;
  const [error, setError] = useState<string | null>(null);

  const headingRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const mounted = useRef(false);

  const question = questions[current] as PublicQuestion;
  const answer = answers[question.id];
  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const allAnswered = answeredCount === questions.length;

  async function confirm() {
    if (selected === null || answer || busy) return;
    setAnswering(true);
    setError(null);
    try {
      const graded = await apiFetch<GradedAnswer>(`/api/sessions/${session.id}/answers`, {
        method: "POST",
        body: { questionId: question.id, selectedIndex: selected },
      });
      setAnswers((prev) => ({ ...prev, [question.id]: { questionId: question.id, selectedIndex: selected, ...graded } }));
    } catch (e) {
      if (e instanceof ApiClientError && e.code === "SESSION_FINISHED") {
        router.replace(`/resultado/${session.id}`);
        return;
      }
      if (e instanceof ApiClientError && e.code === "ALREADY_ANSWERED") {
        // Respondida em outra aba: sincroniza com o servidor em vez de mostrar erro.
        const state = await apiFetch<SessionState>(`/api/sessions/${session.id}`).catch(() => null);
        if (state) setAnswers(toAnswerMap(state.answers));
      } else {
        setError(e instanceof ApiClientError ? e.message : "Não foi possível enviar sua resposta. Tente novamente.");
      }
    } finally {
      setAnswering(false);
    }
  }

  function finish() {
    setError(null);
    startFinish(async () => {
      try {
        await apiFetch(`/api/sessions/${session.id}/finish`, { method: "POST" });
        router.push(`/resultado/${session.id}`);
      } catch (e) {
        setError(e instanceof ApiClientError ? e.message : "Não foi possível concluir a rodada. Tente novamente.");
      }
    });
  }

  function next() {
    if (!answer || busy) return;
    if (allAnswered) {
      finish();
      return;
    }
    const nextOpen = questions.findIndex((q) => !answers[q.id]);
    setCurrent(nextOpen);
    setSelected(null);
    setError(null);
  }

  // Foco: depois de confirmar, vai para "Próxima"; ao trocar de pergunta, vai para o enunciado.
  useEffect(() => {
    if (mounted.current && answer) nextRef.current?.focus();
  }, [answer]);
  useEffect(() => {
    if (mounted.current) headingRef.current?.focus();
  }, [current]);
  useEffect(() => {
    mounted.current = true;
  }, []);

  // RF12: 1–4 ou A–D selecionam; Enter confirma e avança.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      const tag = target.tagName;
      const isRadio = tag === "INPUT" && (target as HTMLInputElement).type === "radio";
      if ((tag === "INPUT" && !isRadio) || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;

      const key = event.key.toLowerCase();
      const shortcut = SHORTCUT_KEYS.indexOf(key);
      if (shortcut !== -1) {
        const option = question.options[shortcut % 4];
        if (!answer && option) {
          event.preventDefault();
          setSelected(option.index);
        }
        return;
      }

      // Em botões, links e radios o Enter já tem ação nativa (clicar ou enviar o formulário).
      if (event.key === "Enter" && !["BUTTON", "A", "INPUT"].includes(tag)) {
        event.preventDefault();
        if (answer) next();
        else void confirm();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function optionState(index: number): OptionState {
    if (!answer) return selected === index ? "selected" : "idle";
    if (index === answer.correctIndex) return "correct";
    if (index === answer.selectedIndex) return "incorrect";
    return "neutral";
  }

  const correctPosition = answer ? question.options.findIndex((o) => o.index === answer.correctIndex) : -1;
  const correctOption = question.options[correctPosition];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <h1 className="font-medium">
            Pergunta {current + 1} de {questions.length}
          </h1>
          <div className="flex flex-wrap gap-2">
            {session.isRetry && (
              <span className="rounded-full border border-border px-3 py-1 text-muted">Revisão das erradas</span>
            )}
            <span className="rounded-full bg-accent-soft px-3 py-1 font-medium">{THEME_LABELS[question.theme]}</span>
          </div>
        </div>
        <div
          role="progressbar"
          aria-label="Progresso da rodada"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={answeredCount}
          aria-valuetext={`${answeredCount} de ${questions.length} respondidas`}
          className="h-2 overflow-hidden rounded-full bg-border"
        >
          <div
            className="h-full rounded-full bg-accent motion-safe:transition-[width] motion-safe:duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void confirm();
        }}
        className="space-y-6 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-8"
      >
        {/* Recebe o foco ao trocar de pergunta, para o leitor de tela ler o novo enunciado. */}
        <div ref={headingRef} tabIndex={-1} className="rounded-md">
          <RichText text={question.statement} className="text-lg leading-relaxed font-semibold sm:text-xl" />
        </div>

        <fieldset disabled={Boolean(answer) || busy !== null} className="space-y-3">
          <legend className="sr-only">Alternativas</legend>
          {question.options.map((option, position) => {
            const state = optionState(option.index);
            return (
              <label
                key={option.index}
                className={`flex min-h-11 items-start gap-3 rounded-lg border-2 px-4 py-3 motion-safe:transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${OPTION_STYLES[state]}`}
              >
                <input
                  type="radio"
                  name={`resposta-${question.id}`}
                  value={option.index}
                  checked={selected === option.index || answer?.selectedIndex === option.index}
                  onChange={() => setSelected(option.index)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full border border-current text-sm font-semibold"
                >
                  {state === "correct" ? "✓" : state === "incorrect" ? "✗" : optionLetter(position)}
                </span>
                <span className="flex-1 pt-0.5">
                  <span className="sr-only">Alternativa {optionLetter(position)}: </span>
                  <InlineText text={option.text} />
                  {state === "correct" && (
                    <span className="mt-1 block text-sm font-semibold text-success">
                      Resposta correta{answer?.selectedIndex === option.index ? " · sua resposta" : ""}
                    </span>
                  )}
                  {state === "incorrect" && (
                    <span className="mt-1 block text-sm font-semibold text-danger">Sua resposta</span>
                  )}
                </span>
              </label>
            );
          })}
        </fieldset>

        <div aria-live="polite">
          {answer && (
            <div
              className={`space-y-3 rounded-lg border-l-4 p-4 ${answer.isCorrect ? "border-success-border bg-success-soft" : "border-danger-border bg-danger-soft"}`}
            >
              <p className={`text-lg font-bold ${answer.isCorrect ? "text-success" : "text-danger"}`}>
                {answer.isCorrect ? "✓ Correto!" : "✗ Incorreto"}
              </p>
              {!answer.isCorrect && correctOption && (
                <p>
                  A resposta correta é a alternativa <strong>{optionLetter(correctPosition)}</strong>:{" "}
                  <InlineText text={correctOption.text} />
                </p>
              )}
              <h2 className="font-semibold">Por que esta é a resposta correta?</h2>
              <RichText text={answer.explanation} className="leading-relaxed" />
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-danger">
            ✗ {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="hidden text-sm text-muted sm:block">
            Atalhos: <kbd className="font-mono">1</kbd>–<kbd className="font-mono">4</kbd> ou{" "}
            <kbd className="font-mono">A</kbd>–<kbd className="font-mono">D</kbd> escolhem,{" "}
            <kbd className="font-mono">Enter</kbd> confirma e avança.
          </p>
          {answer ? (
            <button
              ref={nextRef}
              type="button"
              onClick={next}
              disabled={busy !== null}
              className="min-h-11 rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground disabled:opacity-50"
            >
              {busy === "finish" ? "Calculando resultado…" : allAnswered ? "Ver resultado" : "Próxima"}
            </button>
          ) : (
            <button
              type="submit"
              disabled={selected === null || busy !== null}
              className="min-h-11 rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "answer" ? "Enviando…" : "Confirmar"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
