import { FlowerLotus } from "@phosphor-icons/react/dist/ssr";

import { SITE } from "@/lib/site";
import { Ask } from "@/components/ask";

// Static shell rendered on the server for fast LCP; the interactive island
// (<Ask/>) is the only client component on the page.
export default function Home() {
  return (
    <>
      <main className="mx-auto w-full max-w-2xl px-5 py-16 sm:py-24">
        <header>
          <div className="flex items-center gap-2 text-accent">
            <FlowerLotus weight="fill" className="size-6" aria-hidden />
            <span className="font-sans text-lg font-semibold tracking-tight text-ink">
              {SITE.name}
            </span>
          </div>

          <h1 className="mt-8 font-sans text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {SITE.tagline}
          </h1>
          <p className="mt-4 max-w-[58ch] font-serif text-lg leading-relaxed text-muted">
            Share what weighs on you. {SITE.name} offers a grounded verse and a
            short reflection to sit with.
          </p>
        </header>

        <div className="mt-12">
          <Ask />
        </div>
      </main>

      <footer className="mx-auto w-full max-w-2xl px-5 pb-14">
        <p className="max-w-[60ch] font-sans text-xs leading-relaxed text-muted">
          {SITE.name} is an AI representation of Bhagavad Gita concepts. It is
          not scripture, not a person, and not a substitute for professional
          medical or mental-health advice.
        </p>
      </footer>
    </>
  );
}
