/**
 * Loading placeholder shaped like the real answer (reflection lines + a verse
 * block), not a generic spinner. Reserves height so the answer swap does not
 * shift layout (CLS). Shimmer is disabled under reduced motion.
 */
export function AnswerSkeleton() {
  return (
    <div aria-hidden className="rounded-2xl border border-border bg-surface p-6">
      <div className="grid gap-3">
        <Bar className="w-[92%]" />
        <Bar className="w-full" />
        <Bar className="w-[78%]" />
      </div>
      <div className="mt-6 rounded-xl border border-border bg-surface-2/60 p-5">
        <Bar className="h-5 w-16" />
        <div className="mt-4 grid gap-2">
          <Bar className="w-[85%]" />
          <Bar className="w-[70%]" />
        </div>
      </div>
    </div>
  );
}

function Bar({ className = "" }: { className?: string }) {
  return (
    <span
      className={`block h-4 rounded bg-surface-2 motion-safe:animate-pulse ${className}`}
    />
  );
}
