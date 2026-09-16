import type { Verse } from "@/lib/contract";

/**
 * Renders a verse strictly from backend metadata (never the model's prose).
 * This is the UI half of the grounding guarantee in ARCHITECTURE.md 4.3: even a
 * correct-id / wrong-gloss hallucination cannot reach the reader here, because
 * the Sanskrit and translation come from our own data, not the reply text.
 */
export function VerseCard({ verse }: { verse: Verse }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="rounded-md bg-accent-soft px-2 py-0.5 font-sans text-sm font-medium text-accent">
          {verse.id}
        </span>
      </div>

      <p
        lang="sa"
        className="mt-4 font-serif text-lg leading-relaxed text-ink"
      >
        {verse.sanskrit}
      </p>
      <p className="mt-2 font-serif text-base italic leading-relaxed text-muted">
        {verse.transliteration}
      </p>
      <p className="mt-3 font-serif text-lg leading-relaxed text-ink">
        {verse.translation}
      </p>

      <p className="mt-4 font-sans text-xs leading-relaxed text-muted">
        Translation: {verse.translation_source}. Sanskrit: {verse.sanskrit_source}.
      </p>
    </article>
  );
}
