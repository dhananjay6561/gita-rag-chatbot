"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { FlowerLotus } from "@phosphor-icons/react";

import { SITE } from "@/lib/site";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * The opening moment: brand, headline and intro rise and clarify in sequence,
 * lit by a soft accent bloom. Under reduced motion everything is present
 * immediately (no transform, no blur).
 */
export function Hero() {
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : 0.12,
        delayChildren: reduce ? 0 : 0.1,
      },
    },
  };

  const item: Variants = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.8, ease: EASE },
        },
      };

  return (
    <motion.header
      variants={container}
      initial="hidden"
      animate="show"
      className="relative"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-28 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
      />

      <motion.div variants={item} className="flex items-center gap-2 text-accent">
        <FlowerLotus weight="fill" className="size-6" aria-hidden />
        <span className="font-sans text-lg font-semibold tracking-tight text-ink">
          {SITE.name}
        </span>
      </motion.div>

      <motion.h1
        variants={item}
        className="mt-8 font-sans text-4xl font-semibold tracking-tight text-ink sm:text-5xl"
      >
        {SITE.tagline}
      </motion.h1>

      <motion.p
        variants={item}
        className="mt-5 max-w-[56ch] font-serif text-lg leading-relaxed text-muted"
      >
        Share what weighs on you. {SITE.name} offers a grounded verse and a short
        reflection to sit with.
      </motion.p>
    </motion.header>
  );
}
