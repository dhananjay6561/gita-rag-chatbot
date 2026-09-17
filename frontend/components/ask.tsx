"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, CircleNotch } from "@phosphor-icons/react";

import {
  AskResponseSchema,
  MODES,
  StreamDoneSchema,
  StreamErrorSchema,
  StreamTokenSchema,
  type AskResponse,
  type Mode,
  type StreamDone,
} from "@/lib/contract";
import { parseSSE } from "@/lib/sse";
import { Answer } from "@/components/answer";
import { AnswerSkeleton } from "@/components/answer-skeleton";
import { StreamingReply } from "@/components/streaming-reply";

type Status = "idle" | "loading" | "done" | "error";

const MAX = 2000;

const EXAMPLES = [
  "I am paralysed by a decision, and afraid of choosing wrong.",
  "I worked hard and still failed. What was the point of it?",
  "I cannot stop worrying about what I cannot control.",
];

const MODE_LABEL: Record<Mode, string> = {
  guidance: "Guidance",
  verses: "Verses",
};

function messageForStatus(status: number): string {
  if (status === 504) return "This is taking longer than usual. Please try again.";
  if (status === 502 || status === 503)
    return "The guidance service is resting for a moment. Please try again shortly.";
  if (status === 400) return "That question could not be read. Try rephrasing it.";
  return "Something interrupted the reflection. Please try again.";
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function Ask() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("guidance");
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<AskResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [asked, setAsked] = useState("");
  const [partial, setPartial] = useState("");
  const [focused, setFocused] = useState(false);

  const answerRef = useRef<HTMLElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const labelId = useId();
  const helpId = useId();
  const reduce = useReducedMotion();

  const loading = status === "loading";
  const empty = query.trim().length === 0;

  useEffect(() => {
    if (status === "done") answerRef.current?.focus();
    if (status === "error") errorRef.current?.focus();
  }, [status]);

  // Recede the surrounding chrome while composing (see globals.css .recede).
  useEffect(() => {
    document.body.classList.toggle("composing", focused);
    return () => document.body.classList.remove("composing");
  }, [focused]);

  async function submit() {
    const q = query.trim();
    if (!q || loading) return;
    setStatus("loading");
    setData(null);
    setErrorMsg(null);
    setAsked(q);
    setPartial("");
    try {
      const res = await fetch("/api/ask/stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: q,
          mode,
          locale: typeof navigator !== "undefined" ? navigator.language : undefined,
        }),
      });
      if (!res.ok || !res.body) {
        setErrorMsg(messageForStatus(res.status));
        setStatus("error");
        return;
      }

      let reply = "";
      let done: StreamDone | null = null;
      let streamError: string | null = null;

      for await (const ev of parseSSE(res.body)) {
        const payload = safeJson(ev.data);
        if (payload === undefined) continue;
        if (ev.event === "done") {
          const parsed = StreamDoneSchema.safeParse(payload);
          if (parsed.success) done = parsed.data;
        } else if (ev.event === "error") {
          const parsed = StreamErrorSchema.safeParse(payload);
          streamError = parsed.success
            ? parsed.data.reply
            : "Something interrupted the reflection. Please try again.";
        } else {
          const parsed = StreamTokenSchema.safeParse(payload);
          if (parsed.success) {
            reply += parsed.data.token;
            setPartial(reply);
          }
        }
      }

      if (streamError) {
        setErrorMsg(streamError);
        setStatus("error");
        return;
      }
      const full = AskResponseSchema.safeParse({ reply, ...(done ?? {}) });
      if (!done || !full.success) {
        setErrorMsg("The reply came back incomplete. Please try again.");
        setStatus("error");
        return;
      }
      setData(full.data);
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

  const spring = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 34 };

  return (
    <div className="grid gap-10">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="grid gap-3"
      >
        <label
          id={labelId}
          htmlFor="query"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft"
        >
          What is weighing on you?
        </label>

        <div className="rounded-edition border border-rule-strong transition-colors focus-within:border-ink-soft/60">
          <textarea
            id="query"
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, MAX))}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={3}
            maxLength={MAX}
            aria-labelledby={labelId}
            aria-describedby={helpId}
            placeholder="Describe the situation, or the feeling you are sitting with."
            className="w-full resize-none bg-transparent px-4 py-4 font-serif text-lg leading-relaxed text-ink placeholder:text-ink-soft/70 focus:outline-none"
          />

          <div className="flex items-center justify-between gap-4 border-t border-rule px-3 py-2.5">
            <div
              role="radiogroup"
              aria-label="Answer style"
              className="flex items-center gap-1"
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
                    className="relative rounded-edition px-3 py-1.5 font-sans text-sm"
                  >
                    {active && (
                      <motion.span
                        layoutId="mode-indicator"
                        transition={spring}
                        className="absolute inset-0 rounded-edition bg-accent"
                        aria-hidden
                      />
                    )}
                    <span
                      className={`relative z-10 ${active ? "font-medium text-accent-ink" : "text-ink-soft"}`}
                    >
                      {MODE_LABEL[m]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <span id={helpId} className="font-mono text-xs tabular-nums text-ink-soft">
                {query.length}/{MAX}
              </span>
              <button
                type="submit"
                disabled={empty || loading}
                className="inline-flex items-center gap-1.5 rounded-edition bg-accent px-4 py-1.5 font-sans text-sm font-medium text-accent-ink transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <CircleNotch weight="bold" className="size-3.5 motion-safe:animate-spin" aria-hidden />
                ) : (
                  <ArrowRight weight="bold" className="size-3.5" aria-hidden />
                )}
                {loading ? "Reflecting" : "Reflect"}
              </button>
            </div>
          </div>
        </div>

        <p className="font-sans text-xs text-ink-soft">
          Press Cmd or Ctrl plus Enter to send. Nothing you write is stored.
        </p>
      </form>

      <div aria-live="polite" aria-busy={loading} className="grid gap-6">
        {status === "idle" && (
          <div className="recede grid gap-3">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                Openings
              </span>
              <span className="h-px flex-1 bg-rule" aria-hidden />
            </div>
            <ul className="grid">
              {EXAMPLES.map((ex) => (
                <li key={ex} className="border-b border-rule last:border-b-0">
                  <button
                    type="button"
                    onClick={() => fillExample(ex)}
                    className="group flex w-full items-baseline gap-3 py-3 text-left font-serif text-lg italic leading-snug text-ink-soft transition-colors hover:text-ink"
                  >
                    <ArrowRight
                      weight="bold"
                      className="size-3.5 shrink-0 translate-y-1.5 text-accent opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden
                    />
                    {ex}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {asked && status !== "idle" && (
          <div className="grid gap-1.5 border-l-2 border-accent pl-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
              You wrote
            </span>
            <p className="font-serif text-base italic leading-relaxed text-ink-soft">
              {asked}
            </p>
          </div>
        )}

        {loading && (partial ? <StreamingReply text={partial} /> : <AnswerSkeleton />)}
        {status === "done" && data && <Answer ref={answerRef} data={data} />}
        {status === "error" && errorMsg && (
          <p
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="border-l-2 border-accent py-1 pl-4 font-sans text-sm text-ink outline-none"
          >
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}
