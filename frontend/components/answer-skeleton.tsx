/**
 * Loading placeholder shaped like a run of set text under a section mark, not a
 * spinner. Reserves height so the answer swap does not shift layout (CLS).
 * Subtle pulse only, disabled under reduced motion.
 */
export function AnswerSkeleton() {
  return (
    <div aria-hidden>
      <div className="flex items-center gap-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft/70">
          The reflection
        </span>
        <span className="h-px flex-1 bg-rule" aria-hidden />
      </div>
      <div className="mt-5 grid gap-3">
        <Line className="w-[96%]" />
        <Line className="w-full" />
        <Line className="w-[90%]" />
        <Line className="w-[62%]" />
      </div>
    </div>
  );
}

function Line({ className = "" }: { className?: string }) {
  return (
    <span className={`block h-3.5 rounded-edition bg-paper-2 motion-safe:animate-pulse ${className}`} />
  );
}
