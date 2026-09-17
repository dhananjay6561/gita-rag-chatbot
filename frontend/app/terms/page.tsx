import type { Metadata } from "next";

import { LegalDoc } from "@/components/legal-doc";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `The terms on which you may use ${SITE.name}.`,
};

export default function TermsPage() {
  return (
    <LegalDoc title="Terms of Use" updated="17 September 2026">
      <p>
        By using {SITE.name} you agree to these terms. If you do not agree,
        please do not use the service.
      </p>

      <h2>What {SITE.name} is</h2>
      <p>
        {SITE.name} is an <strong>AI representation of concepts from the
        Bhagavad Gita</strong>. It retrieves verses and generates a short
        reflection in response to what you write. It is not scripture, not a
        person, not a religious authority, and not a source of professional
        advice.
      </p>

      <h2>Not professional or emergency advice</h2>
      <p>
        The responses are for reflection only. They are{" "}
        <strong>not medical, mental-health, legal, financial, or other
        professional advice</strong>, and you should not rely on them as such.
        Always seek a qualified professional for those matters.
      </p>
      <p>
        {SITE.name} <strong>is not an emergency service</strong>. If you are in
        crisis or in danger, contact your local emergency services (999 in the
        UK) or a helpline such as the{" "}
        <a href="https://www.samaritans.org/">Samaritans on 116 123</a> (or text
        SHOUT to 85258). The service may surface these details when it detects
        distress, but this is a supportive prompt, not a safety guarantee.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not use the service for any unlawful or harmful purpose.</li>
        <li>
          Do not attempt to disrupt, overload, reverse-engineer, or abuse the
          service or its rate limits.
        </li>
        <li>
          Do not submit personal data about other people, or content you do not
          have the right to share.
        </li>
      </ul>

      <h2>No warranty</h2>
      <p>
        The service is provided &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo;, without warranties of any kind. AI-generated responses
        may be inaccurate, incomplete, or unsuitable for your situation. We do
        not guarantee that the service will be uninterrupted or error-free.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, we are not liable for any loss
        or damage arising from your use of, or reliance on, {SITE.name}. Nothing
        in these terms excludes or limits liability that cannot be excluded or
        limited under law (including for death or personal injury caused by
        negligence, or for fraud). These terms do not affect your statutory
        rights as a consumer.
      </p>

      <h2>Privacy</h2>
      <p>
        Our <a href="/privacy">Privacy Notice</a> explains how we handle what
        you share, including transfers to our AI providers.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of England and Wales, and the
        courts of England and Wales have exclusive jurisdiction.
      </p>
    </LegalDoc>
  );
}
