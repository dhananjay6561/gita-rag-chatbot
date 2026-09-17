"use client";

import { forwardRef } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { BookOpen } from "@phosphor-icons/react";

import type { AskResponse } from "@/lib/contract";
import { CrisisBanner } from "@/components/crisis-banner";
import { VerseCard } from "@/components/verse-card";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Presentational answer. Support first (crisis), then the reflection lit by a
 * soft glow, then the sourced verses, then the disclaimer, each rising in
 * sequence. The heading is the focus target for screen readers after a reply
 * lands (see ask.tsx). Reduced motion shows everything at once.
 */
export const Answer = forwardRef<HTMLElement, { data: AskResponse }>(
  function Answer({ data }, ref) {
    const reduce = useReducedMotion();
    const verses = data.verses ?? [];
    const crisis = data.crisis_resources ?? [];

    const group: Variants = {
      hidden: {},
      show: { transition: { staggerChildren: reduce ? 0 : 0.12 } },
    };
    const rise: Variants = reduce
      ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
      : {
          hidden: { opacity: 0, y: 16 },
          show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
        };

    return (
      <motion.section
        ref={ref}
        tabIndex={-1}
        aria-label="Reflection"
        variants={group}
        initial="hidden"
        animate="show"
        className="grid gap-5 outline-none"
      >
        {crisis.length > 0 && (
          <motion.div variants={rise}>
            <CrisisBanner resources={crisis} />
          </motion.div>
        )}

        <motion.div
          variants={rise}
          className="glass rounded-2xl p-6 shadow-[0_0_70px_-20px_var(--accent-glow)] sm:p-8"
        >
          {data.out_of_scope && (
            <p className="mb-3 font-sans text-xs font-medium uppercase tracking-wide text-muted">
              Outside the Gita
            </p>
          )}
          <p className="whitespace-pre-line font-serif text-lg leading-relaxed text-ink">
            {data.reply}
          </p>
        </motion.div>

        {verses.length > 0 && (
          <motion.div variants={rise} className="grid gap-3">
            <h3 className="flex items-center gap-2 font-sans text-sm font-semibold text-muted">
              <BookOpen weight="bold" className="size-4 shrink-0" aria-hidden />
              {verses.length === 1 ? "The verse" : "The verses"}
            </h3>
            {verses.map((verse) => (
              <VerseCard key={verse.id} verse={verse} />
            ))}
          </motion.div>
        )}

        <motion.p
          variants={rise}
          className="font-sans text-xs leading-relaxed text-muted"
        >
          {data.disclaimer}
        </motion.p>
      </motion.section>
    );
  },
);
