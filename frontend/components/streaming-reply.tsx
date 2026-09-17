/**
 * The reflection as it streams in, in the same Garamond run as the final answer
 * so the swap to <Answer> does not shift layout. A blinking ink caret marks the
 * writing point. aria-hidden: the live region announces the finished reflection
 * once (on focus), not every token.
 */
export function StreamingReply({ text }: { text: string }) {
  return (
    <div aria-hidden>
      <div className="flex items-center gap-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          The reflection
        </span>
        <span className="h-px flex-1 bg-rule" aria-hidden />
      </div>
      <p className="mt-4 whitespace-pre-line font-serif text-xl leading-[1.7] text-ink">
        {text}
        <span className="ml-0.5 inline-block h-5 w-2 translate-y-0.5 bg-accent align-middle motion-safe:animate-pulse" />
      </p>
    </div>
  );
}
