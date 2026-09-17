import { SITE } from "@/lib/site";
import { Masthead } from "@/components/masthead";
import { Ask } from "@/components/ask";

// Static server shell. The composer and answer islands own the interaction.
export default function Home() {
  return (
    <>
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
      </footer>
    </>
  );
}
