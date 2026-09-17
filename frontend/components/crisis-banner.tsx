import { Lifebuoy } from "@phosphor-icons/react";

import type { CrisisResource } from "@/lib/contract";

/**
 * Shown when the backend safety screen flags distress. It sits alongside the
 * guidance (not a hard stop), so it is supportive, not alarming. role="alert"
 * ensures assistive tech surfaces it immediately.
 */
export function CrisisBanner({ resources }: { resources: CrisisResource[] }) {
  if (resources.length === 0) return null;

  return (
    <section
      role="alert"
      className="rounded-xl border border-accent/40 bg-crisis p-5 backdrop-blur-md shadow-[0_0_50px_-20px_var(--accent-glow)]"
    >
      <div className="flex items-center gap-2 text-accent">
        <Lifebuoy weight="bold" className="size-5 shrink-0" aria-hidden />
        <h2 className="font-sans text-sm font-semibold">
          You do not have to sit with this alone
        </h2>
      </div>
      <p className="mt-2 font-sans text-sm leading-relaxed text-ink">
        If things feel heavy right now, reaching a person can help. These lines
        are free and confidential.
      </p>
      <ul className="mt-3 grid gap-2">
        {resources.map((r) => (
          <li
            key={`${r.name}-${r.contact}`}
            className="flex flex-wrap items-baseline gap-x-2 font-sans text-sm text-ink"
          >
            <span className="font-medium">{r.name}</span>
            <span className="text-muted">{r.contact}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
