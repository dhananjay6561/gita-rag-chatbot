import Link from "next/link";

import { SITE } from "@/lib/site";
import { Masthead } from "@/components/masthead";
import { Ask } from "@/components/ask";
import { JsonLd } from "@/components/json-ld";
import { buildFaqJsonLd } from "@/lib/structured-data";

// Static server shell. The composer and answer islands own the interaction.
export default function Home() {
  return (
    <>
      <JsonLd data={buildFaqJsonLd()} />
      <main className="mx-auto w-full max-w-[44rem] px-6 py-16 sm:py-24">
        <Masthead />
        <div className="mt-14">
          <Ask />
        </div>
      </main>

      <footer className="recede mx-auto w-full max-w-[44rem] px-6 pb-16">
        <div className="h-px w-full bg-rule" aria-hidden />
        <p className="mt-6 max-w-[62ch] font-sans text-xs leading-relaxed text-ink-soft">
          {SITE.name} is an AI representation of Bhagavad Gita concepts. It is
          not scripture, not a person, and not a substitute for professional
          medical or mental-health advice.
        </p>
        <nav className="mt-4 flex gap-5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
          <Link href="/privacy" className="transition-colors hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-ink">
            Terms
          </Link>
        </nav>
      </footer>
    </>
  );
}
