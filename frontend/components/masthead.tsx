import { SITE } from "@/lib/site";

/**
 * Editorial masthead, styled like the head of a printed critical edition:
 * a running head with the colophon mark and a rule, the title set in Garamond,
 * and an italic epigraph. Deliberately static; the motion lives in the
 * interactions below, not in a decorative intro.
 */
export function Masthead() {
  return (
    <header className="recede">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
          <span className="size-1.5 bg-accent" aria-hidden />
          {SITE.name}
        </span>
        <span className="h-px flex-1 bg-rule-strong" aria-hidden />
      </div>

      <h1 className="mt-10 max-w-[19ch] font-serif text-[2rem] font-medium leading-[1.06] tracking-tight text-ink sm:text-[2.75rem]">
        {SITE.tagline}
      </h1>

      <p className="mt-6 max-w-[46ch] font-serif text-lg italic leading-relaxed text-ink-soft">
        Tell me what weighs on you. I answer with a verse from the Gita, and a
        small way to hold it.
      </p>
    </header>
  );
}
