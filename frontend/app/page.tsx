import { SITE } from "@/lib/site";
import { Hero } from "@/components/hero";
import { Ask } from "@/components/ask";

// Static server shell. The Hero and Ask islands own the motion; the atmosphere
// (mounted in layout) sits behind everything.
export default function Home() {
  return (
    <>
      <main className="mx-auto w-full max-w-2xl px-5 py-20 sm:py-28">
        <Hero />
        <div className="mt-14">
          <Ask />
        </div>
      </main>

      <footer className="mx-auto w-full max-w-2xl px-5 pb-16">
        <p className="max-w-[60ch] font-sans text-xs leading-relaxed text-muted">
          {SITE.name} is an AI representation of Bhagavad Gita concepts. It is
          not scripture, not a person, and not a substitute for professional
          medical or mental-health advice.
        </p>
      </footer>
    </>
  );
}
