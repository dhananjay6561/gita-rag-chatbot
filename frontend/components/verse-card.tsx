"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CaretDown, Check, Copy } from "@phosphor-icons/react";

import type { Verse } from "@/lib/contract";

/**
 * A verse as an interactive artifact of a critical edition. The rubric numeral
 * hangs in the left margin; the translation reads in Garamond. The seeker can
 * reveal the Sanskrit apparatus (Devanagari + transliteration) and copy the
 * verse. Rendered strictly from backend metadata, never the model's prose
 * (the UI half of the grounding guarantee, ARCHITECTURE.md 4.3).
 */
export function VerseCard({ verse }: { verse: Verse }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const reduce = useReducedMotion();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `Bhagavad Gita ${verse.id}\n${verse.translation}`,
      );
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable; leave state unchanged
    }
  }

  return (
    <article className="grid grid-cols-1 gap-x-5 border-t border-rule pt-5 sm:grid-cols-[3.5rem_1fr]">
      <div className="rubric mb-2 text-sm sm:mb-0 sm:pt-1 sm:text-right">{verse.id}</div>

      <div>
        <p className="font-serif text-lg leading-relaxed text-ink">
          {verse.translation}
        </p>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduce ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <p lang="sa" className="mt-4 font-serif text-lg leading-relaxed text-ink">
                {verse.sanskrit}
              </p>
              <p className="mt-1.5 font-serif text-base italic leading-relaxed text-ink-soft">
                {verse.transliteration}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex items-center gap-5">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 font-sans text-xs text-ink-soft transition-colors hover:text-ink"
          >
            <CaretDown
              weight="bold"
              className={`size-3 transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
            {open ? "Hide the Sanskrit" : "Show the Sanskrit"}
          </button>

          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 font-sans text-xs text-ink-soft transition-colors hover:text-ink"
          >
            {copied ? (
              <Check weight="bold" className="size-3 text-accent" aria-hidden />
            ) : (
              <Copy weight="bold" className="size-3" aria-hidden />
            )}
            {copied ? "Copied" : "Copy verse"}
          </button>
        </div>

        <p className="mt-4 font-mono text-[11px] leading-relaxed text-ink-soft">
          Translation {verse.translation_source}. Sanskrit {verse.sanskrit_source}.
        </p>
      </div>
    </article>
  );
}
