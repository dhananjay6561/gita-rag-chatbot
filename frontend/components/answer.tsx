import { forwardRef } from "react";
import { BookOpen } from "@phosphor-icons/react";

import type { AskResponse } from "@/lib/contract";
import { CrisisBanner } from "@/components/crisis-banner";
import { VerseCard } from "@/components/verse-card";

/**
 * Presentational answer. Order is deliberate: support first (crisis), then the
 * reflection, then the sourced verses, then the standing disclaimer. The heading
 * is focus-target for screen readers after a reply lands (see ask.tsx).
 */
export const Answer = forwardRef<HTMLElement, { data: AskResponse }>(
  function Answer({ data }, ref) {
    const verses = data.verses ?? [];
    const crisis = data.crisis_resources ?? [];

    return (
      <section
        ref={ref}
        tabIndex={-1}
        aria-label="Reflection"
        className="rise-in grid gap-5 outline-none"
      >
        {crisis.length > 0 && <CrisisBanner resources={crisis} />}

        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          {data.out_of_scope && (
            <p className="mb-3 font-sans text-xs font-medium uppercase tracking-wide text-muted">
              Outside the Gita
            </p>
          )}
          <p className="whitespace-pre-line font-serif text-lg leading-relaxed text-ink">
            {data.reply}
          </p>
        </div>

        {verses.length > 0 && (
          <div className="grid gap-3">
            <h3 className="flex items-center gap-2 font-sans text-sm font-semibold text-muted">
              <BookOpen weight="bold" className="size-4 shrink-0" aria-hidden />
              {verses.length === 1 ? "The verse" : "The verses"}
            </h3>
            {verses.map((verse) => (
              <VerseCard key={verse.id} verse={verse} />
            ))}
          </div>
        )}

        <p className="font-sans text-xs leading-relaxed text-muted">
          {data.disclaimer}
        </p>
      </section>
    );
  },
);
