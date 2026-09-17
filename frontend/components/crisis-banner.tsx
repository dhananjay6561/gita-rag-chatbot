import type { CrisisResource } from "@/lib/contract";

/**
 * Shown when the backend safety screen flags distress. It sits alongside the
 * guidance (not a hard stop), so it is supportive, not alarming. Flat, marked by
 * a vermillion rule. role="alert" surfaces it to assistive tech immediately.
 */
export function CrisisBanner({ resources }: { resources: CrisisResource[] }) {
  if (resources.length === 0) return null;

  return (
    <section role="alert" className="border-l-2 border-accent pl-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
        If it helps
      </p>
      <p className="mt-2 max-w-[54ch] font-serif text-lg leading-relaxed text-ink">
        You do not have to sit with this alone. These lines are free and
        confidential, and a person is there right now.
      </p>
      <ul className="mt-3 grid gap-1.5">
        {resources.map((r) => (
          <li
            key={`${r.name}-${r.contact}`}
            className="flex flex-wrap items-baseline gap-x-2 font-sans text-sm text-ink"
          >
            <span className="font-medium">{r.name}</span>
            <span className="text-ink-soft">{r.contact}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
