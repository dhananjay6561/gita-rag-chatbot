import Link from "next/link";
import type { ReactNode } from "react";

import { SITE } from "@/lib/site";

/**
 * Shared shell for the static legal pages (privacy, terms). Same letterpress
 * measure and rule as the main page, a running head that links home, and a
 * plain typographic hierarchy. Deliberately unstyled beyond the theme tokens —
 * these are read, not interacted with.
 */
export function LegalDoc({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-[44rem] px-6 py-16 sm:py-24">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-ink"
        >
          <span className="size-1.5 bg-accent" aria-hidden />
          {SITE.name}
        </Link>
        <span className="h-px flex-1 bg-rule-strong" aria-hidden />
      </div>

      <h1 className="mt-10 font-serif text-[2rem] font-medium leading-[1.06] tracking-tight text-ink sm:text-[2.5rem]">
        {title}
      </h1>
      <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-ink-soft">
        Last updated {updated}
      </p>

      <div className="legal-prose mt-12 max-w-[64ch] font-sans text-[0.95rem] leading-relaxed text-ink-soft">
        {children}
      </div>
    </main>
  );
}
