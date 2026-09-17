/**
 * The reply as it streams in, in the same serif card as the final answer so the
 * swap to <Answer> does not shift layout. aria-hidden: the live region should
 * announce the finished reflection once (on focus), not every token.
 */
export function StreamingReply({ text }: { text: string }) {
  return (
    <div
      aria-hidden
      className="rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <p className="whitespace-pre-line font-serif text-lg leading-relaxed text-ink">
        {text}
        <span className="ml-0.5 inline-block h-5 w-0.5 translate-y-0.5 bg-accent align-middle motion-safe:animate-pulse" />
      </p>
    </div>
  );
}
