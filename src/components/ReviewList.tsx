"use client";

import { useId, useState } from "react";
import { InlineText, RichText } from "@/components/RichText";
import { optionLetter } from "@/lib/format";
import { THEME_LABELS } from "@/lib/labels";
import type { PublicQuestion, RevealedAnswer } from "@/lib/quiz/session-state";

/** RF16: revisão completa, com filtro "Mostrar só as erradas". */
export function ReviewList({ questions, answers }: { questions: PublicQuestion[]; answers: RevealedAnswer[] }) {
  const filterId = useId();
  const [onlyWrong, setOnlyWrong] = useState(false);
  const answerById = new Map(answers.map((a) => [a.questionId, a]));
  const wrongCount = answers.filter((a) => !a.isCorrect).length;

  const items = questions
    .map((question, i) => ({ question, number: i + 1, answer: answerById.get(question.id) }))
    .filter((item) => !onlyWrong || (item.answer && !item.answer.isCorrect));

  return (
    <section aria-labelledby={`${filterId}-title`} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${filterId}-title`} className="text-xl font-bold">
          Revisão
        </h2>
        <label className="flex min-h-11 cursor-pointer items-center gap-2">
          <input
            id={filterId}
            type="checkbox"
            checked={onlyWrong}
            onChange={(e) => setOnlyWrong(e.target.checked)}
            className="size-5 accent-accent"
          />
          Mostrar só as erradas ({wrongCount})
        </label>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-4">Você acertou todas as perguntas desta rodada.</p>
      ) : (
        <ol className="space-y-4">
          {items.map(({ question, number, answer }) => (
            <li key={question.id} className="space-y-4 rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">
                  Pergunta {number} · {THEME_LABELS[question.theme]}
                </span>
                {answer && (
                  <span className={`font-semibold ${answer.isCorrect ? "text-success" : "text-danger"}`}>
                    {answer.isCorrect ? "✓ Você acertou" : "✗ Você errou"}
                  </span>
                )}
              </div>
              <RichText text={question.statement} className="font-semibold" />

              <ul className="space-y-2">
                {question.options.map((option, position) => {
                  const isCorrect = option.index === answer?.correctIndex;
                  const isChosen = option.index === answer?.selectedIndex;
                  const tone = isCorrect
                    ? "border-success-border bg-success-soft"
                    : isChosen
                      ? "border-danger-border bg-danger-soft"
                      : "border-border text-muted";
                  return (
                    <li key={option.index} className={`flex items-start gap-3 rounded-lg border-2 px-4 py-2 ${tone}`}>
                      <span aria-hidden="true" className="w-5 shrink-0 font-semibold">
                        {isCorrect ? "✓" : isChosen ? "✗" : optionLetter(position)}
                      </span>
                      <span className="flex-1">
                        <InlineText text={option.text} />
                        {(isCorrect || isChosen) && (
                          <span className={`block text-sm font-semibold ${isCorrect ? "text-success" : "text-danger"}`}>
                            {isCorrect && isChosen
                              ? "Resposta correta · sua resposta"
                              : isCorrect
                                ? "Resposta correta"
                                : "Sua resposta"}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {answer && (
                <div className="space-y-2 rounded-lg bg-code p-4">
                  <h3 className="font-semibold">Por que esta é a resposta correta?</h3>
                  <RichText text={answer.explanation} className="leading-relaxed" />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
