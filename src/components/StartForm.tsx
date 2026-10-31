"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useSyncExternalStore, useTransition } from "react";
import { ApiClientError, apiFetch } from "@/lib/client/api";
import { ALL_THEMES, LEVELS, THEMES, type Level, type Theme } from "@/lib/quiz/domain";
import { ALL_THEMES_LABEL, LEVEL_LABELS, THEME_LABELS } from "@/lib/labels";
import { PLAYER_NAME_MAX, PLAYER_NAME_MIN, playerNameSchema } from "@/lib/validation";

const LAST_NAME_KEY = "quiz:ultimo-nome";

type ThemeChoice = Theme | typeof ALL_THEMES;

const THEME_CHOICES: { value: ThemeChoice; label: string }[] = [
  { value: ALL_THEMES, label: ALL_THEMES_LABEL },
  ...THEMES.map((t) => ({ value: t, label: THEME_LABELS[t] })),
];

const choiceCard =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-control-border bg-card px-4 py-3 transition-colors " +
  "hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:font-medium " +
  "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus";

function readSavedName(): string {
  try {
    return localStorage.getItem(LAST_NAME_KEY) ?? "";
  } catch {
    return ""; // localStorage indisponível (modo privado, bloqueio): o campo só começa vazio.
  }
}

const noSubscription = () => () => {};

export function StartForm() {
  const router = useRouter();
  const nameId = useId();
  // RF01: pré-preenche com o último nome usado. No servidor (página pré-renderizada) o valor é "",
  // e o React troca pelo salvo na hidratação sem divergência. `draft` só existe depois que a pessoa digita.
  const savedName = useSyncExternalStore(noSubscription, readSavedName, () => "");
  const [draft, setDraft] = useState<string | null>(null);
  const name = draft ?? savedName;
  const [touched, setTouched] = useState(false);
  const [theme, setTheme] = useState<ThemeChoice>(ALL_THEMES);
  const [level, setLevel] = useState<Level>("iniciante");
  // Transição: fica pendente durante a chamada e a navegação, e volta sozinha ao terminar. Um booleano
  // manual ficaria preso em true, porque o Next 16 preserva a página anterior (<Activity>) ao voltar para ela.
  const [submitting, startSubmit] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const parsed = playerNameSchema.safeParse(name);
  const nameError = parsed.success ? null : (parsed.error.issues[0]?.message ?? null);
  const showNameError = touched && name.length > 0 && nameError;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!parsed.success || submitting) return;
    const playerName = parsed.data;

    setError(null);
    startSubmit(async () => {
      try {
        const { sessionId } = await apiFetch<{ sessionId: string }>("/api/sessions", {
          method: "POST",
          body: { playerName, theme: theme === ALL_THEMES ? null : theme, level },
        });
        try {
          localStorage.setItem(LAST_NAME_KEY, playerName);
        } catch {
          // sem persistência: tudo bem
        }
        router.push(`/quiz/${sessionId}`);
      } catch (e) {
        setError(e instanceof ApiClientError ? e.message : "Não foi possível começar a rodada. Tente novamente.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      <div className="space-y-2">
        <label htmlFor={nameId} className="block font-medium">
          Seu nome
        </label>
        <input
          id={nameId}
          name="playerName"
          type="text"
          autoComplete="nickname"
          maxLength={60}
          value={name}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={showNameError ? true : undefined}
          aria-describedby={`${nameId}-hint${showNameError ? ` ${nameId}-error` : ""}`}
          className="block min-h-11 w-full rounded-lg border border-control-border bg-card px-4 py-2 text-base aria-[invalid=true]:border-danger-border"
        />
        <p id={`${nameId}-hint`} className="text-sm text-muted">
          De {PLAYER_NAME_MIN} a {PLAYER_NAME_MAX} caracteres. Ele aparece no ranking.
        </p>
        {showNameError && (
          <p id={`${nameId}-error`} className="text-sm font-medium text-danger">
            ✗ {nameError}
          </p>
        )}
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-3 font-medium">Tema</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {THEME_CHOICES.map((choice) => (
            <label key={choice.value} className={choiceCard}>
              <input
                type="radio"
                name="theme"
                value={choice.value}
                checked={theme === choice.value}
                onChange={() => setTheme(choice.value)}
                className="size-4 accent-accent"
              />
              {choice.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-3 font-medium">Nível</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {LEVELS.map((value) => (
            <label key={value} className={choiceCard}>
              <input
                type="radio"
                name="level"
                value={value}
                checked={level === value}
                onChange={() => setLevel(value)}
                className="size-4 accent-accent"
              />
              {LEVEL_LABELS[value]}
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="rounded-lg border border-danger-border bg-danger-soft px-4 py-3 text-danger">
          ✗ {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={!parsed.success || submitting}
          className="min-h-11 rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Preparando sua rodada…" : "Começar"}
        </button>
        <Link href="/ranking" className="flex min-h-11 items-center justify-center rounded-lg px-4 text-accent underline-offset-4 hover:underline">
          Ver ranking
        </Link>
      </div>
    </form>
  );
}
