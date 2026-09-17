"use client";

import { forwardRef } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import type { AskResponse } from "@/lib/contract";
import { CrisisBanner } from "@/components/crisis-banner";
import { VerseCard } from "@/components/verse-card";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * The answer, typeset like a page of the edition: support first (crisis), the
 * reflection as a run of Garamond under a section mark, then the sourced verses.
 * No cards or glow; sections are grouped with rules and space (skill 4.4). Each
 * block settles in on arrival (motivated: content appearing). The heading is
 * the screen-reader focus target after a reply lands (see ask.tsx).
 */
export const Answer = forwardRef<HTMLElement, { data: AskResponse }>(
  function Answer({ data }, ref) {
    const reduce = useReducedMotion();
    const verses = data.verses ?? [];
    const crisis = data.crisis_resources ?? [];

    const group: Variants = {
      hidden: {},
      show: { transition: { staggerChildren: reduce ? 0 : 0.1 } },
    };
    const rise: Variants = reduce
      ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
      : {
          hidden: { opacity: 0, y: 12 },
          show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
        };

    return (
      <motion.section
        ref={ref}
        tabIndex={-1}
        aria-label="Reflection"
        variants={group}
        initial="hidden"
        animate="show"
        className="grid gap-8 outline-none"
      >
        {crisis.length > 0 && (
          <motion.div variants={rise}>
            <CrisisBanner resources={crisis} />
          </motion.div>
        )}

        <motion.div variants={rise}>
          <SectionMark>
            {data.out_of_scope ? "Outside the Gita" : "The reflection"}
          </SectionMark>
          <p className="mt-4 whitespace-pre-line font-serif text-xl leading-[1.7] text-ink">
            {data.reply}
          </p>
        </motion.div>

        {verses.length > 0 && (
          <motion.div variants={rise}>
            <SectionMark>{verses.length === 1 ? "The verse" : "The verses"}</SectionMark>
            <div className="mt-5 grid gap-5">
              {verses.map((verse) => (
                <VerseCard key={verse.id} verse={verse} />
              ))}
            </div>
          </motion.div>
        )}

        <motion.p
          variants={rise}
          className="font-sans text-xs leading-relaxed text-ink-soft"
        >
          {data.disclaimer}
        </motion.p>
      </motion.section>
    );
  },
);

function SectionMark({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
        {children}
      </span>
      <span className="h-px flex-1 bg-rule" aria-hidden />
    </div>
  );
}
