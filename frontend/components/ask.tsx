"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CircleNotch, PaperPlaneTilt } from "@phosphor-icons/react";

import { AskResponseSchema, MODES, type AskResponse, type Mode } from "@/lib/contract";
import { Answer } from "@/components/answer";
import { AnswerSkeleton } from "@/components/answer-skeleton";

type Status = "idle" | "loading" | "done" | "error";

const MAX = 2000;

const EXAMPLES = [
  "I am paralysed by a big decision and afraid of choosing wrong.",
  "I worked hard and still failed. What was the point of any of it?",
  "I cannot stop worrying about things that are out of my hands.",
];

const MODE_LABEL: Record<Mode, { label: string; hint: string }> = {
  guidance: { label: "Guidance", hint: "A short reflection" },
  verses: { label: "Verses", hint: "Reflection with the full verses" },
};

function messageForStatus(status: number): string {
  if (status === 504) return "This is taking longer than usual. Please try again.";
  if (status === 502 || status === 503)
    return "The guidance service is resting for a moment. Please try again shortly.";
  if (status === 400) return "That question could not be read. Try rephrasing it.";
  return "Something interrupted the reflection. Please try again.";
}

export function Ask() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("guidance");
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<AskResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [asked, setAsked] = useState("");

  const answerRef = useRef<HTMLElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const labelId = useId();
  const helpId = useId();

  const loading = status === "loading";
  const empty = query.trim().length === 0;

  useEffect(() => {
    if (status === "done") answerRef.current?.focus();
    if (status === "error") errorRef.current?.focus();
  }, [status]);

  async function submit() {
    const q = query.trim();
    if (!q || loading) return;
    setStatus("loading");
    setData(null);
    setErrorMsg(null);
    setAsked(q);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: q,
          mode,
          locale: typeof navigator !== "undefined" ? navigator.language : undefined,
        }),
      });
      if (!res.ok) {
        setErrorMsg(messageForStatus(res.status));
        setStatus("error");
        return;
      }
      const parsed = AskResponseSchema.safeParse(await res.json());
      if (!parsed.success) {
        setErrorMsg("The reply came back malformed. Please try again.");
        setStatus("error");
        return;
      }
      setData(parsed.data);
      setStatus("done");
    } catch {
      setErrorMsg("The connection dropped. Please try again.");
      setStatus("error");
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void submit();
    }
  }

  function fillExample(text: string) {
    setQuery(text);
    textareaRef.current?.focus();
  }

  return (
    <div className="grid gap-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="grid gap-3"
      >
        <label id={labelId} htmlFor="query" className="font-sans text-sm font-medium text-ink">
          What is weighing on you?
        </label>

        <textarea
          id="query"
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, MAX))}
          onKeyDown={onKeyDown}
          rows={4}
          maxLength={MAX}
          aria-labelledby={labelId}
          aria-describedby={helpId}
          placeholder="Describe the situation or the feeling you are sitting with."
          className="w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 font-sans text-base leading-relaxed text-ink placeholder:text-muted"
        />

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p id={helpId} className="font-sans text-xs text-muted">
            Press Cmd or Ctrl plus Enter to send. Nothing you write is stored.
          </p>
          <span className="font-sans text-xs tabular-nums text-muted" aria-hidden>
            {query.length} / {MAX}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
          <div
            role="radiogroup"
            aria-label="Answer style"
            className="inline-flex rounded-xl border border-border bg-surface p-1"
          >
            {MODES.map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMode(m)}
                  title={MODE_LABEL[m].hint}
                  className={`rounded-lg px-3 py-1.5 font-sans text-sm font-medium transition-colors ${
                    active
                      ? "bg-accent text-accent-ink"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {MODE_LABEL[m].label}
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={empty || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-sans text-sm font-semibold text-accent-ink transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
          >
            {loading ? (
              <CircleNotch weight="bold" className="size-4 motion-safe:animate-spin" aria-hidden />
            ) : (
              <PaperPlaneTilt weight="bold" className="size-4" aria-hidden />
            )}
            {loading ? "Reflecting" : "Reflect"}
          </button>
        </div>
      </form>

      <div aria-live="polite" aria-busy={loading} className="grid gap-5">
        {status === "idle" && (
          <div className="grid gap-3">
            <p className="font-sans text-sm text-muted">Not sure where to start? Try one of these.</p>
            <ul className="grid gap-2">
              {EXAMPLES.map((ex) => (
                <li key={ex}>
                  <button
                    type="button"
                    onClick={() => fillExample(ex)}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-left font-serif text-base leading-relaxed text-ink transition-colors hover:border-accent/50"
                  >
                    {ex}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {asked && status !== "idle" && (
          <blockquote className="border-l-2 border-accent/40 pl-4 font-sans text-sm italic text-muted">
            {asked}
          </blockquote>
        )}

        {loading && <AnswerSkeleton />}
        {status === "done" && data && <Answer ref={answerRef} data={data} />}
        {status === "error" && errorMsg && (
          <p
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 font-sans text-sm text-ink outline-none"
          >
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}
