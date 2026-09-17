import type { Metadata } from "next";

import { LegalDoc } from "@/components/legal-doc";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: `How ${SITE.name} handles what you share, under UK data-protection law.`,
};

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Notice" updated="17 September 2026">
      <p>
        This notice explains what happens to the words you type into {SITE.name}{" "}
        and how we handle them under the UK GDPR and the Data Protection Act
        2018. Please read it before you share anything personal.
      </p>

      <h2>What you share, and why it is sensitive</h2>
      <p>
        {SITE.name} works by reading a short message you write about what is on
        your mind. Because people often write about their feelings, health, or
        state of mind, that message may contain{" "}
        <strong>special category data</strong> (for example information about
        your mental or physical health). We only process it to generate a
        reflective response, on the basis of your <strong>explicit consent</strong>,
        which you give by choosing to submit the message. You do not have to
        provide any of this, and you should avoid including details that could
        identify you or others (names, addresses, contact details).
      </p>

      <h2>What we do — and do not — keep</h2>
      <ul>
        <li>
          <strong>No accounts, no history.</strong> {SITE.name} is stateless. We
          do not ask you to sign in, and we do not store your messages or the
          responses on our servers after your request is answered.
        </li>
        <li>
          <strong>No tracking.</strong> We use no analytics, no advertising, and
          no tracking cookies. Fonts are served from our own servers, so your
          browser makes no third-party font requests.
        </li>
        <li>
          <strong>Operational data.</strong> To keep the service available and
          prevent abuse, our server briefly uses your IP address for rate
          limiting and records anonymous, aggregate metrics (such as response
          time). These logs contain no message text.
        </li>
      </ul>

      <h2>Who else processes your message</h2>
      <p>
        To produce a grounded answer, the text of your message is sent to two AI
        providers acting as our processors:
      </p>
      <ul>
        <li>
          <strong>Anthropic</strong> — to classify the message and generate the
          reflection.
        </li>
        <li>
          <strong>OpenAI</strong> — to turn the message into a numerical
          embedding used to find relevant verses.
        </li>
      </ul>
      <p>
        Both providers are based in the <strong>United States</strong>, so your
        message is transferred outside the UK. That transfer is covered by
        standard data-protection safeguards (the UK International Data Transfer
        Agreement / Addendum to the EU Standard Contractual Clauses) under our
        agreements with them. Under their API terms, submissions sent through
        the API are not used to train their models. Their own handling is
        governed by their respective privacy policies.
      </p>

      <h2>Your rights</h2>
      <p>
        You have rights under UK data-protection law, including the right to
        access, correct, or erase your personal data, and to withdraw consent.
        Because we do not retain your messages, in practice there is nothing
        held about you for us to return or delete once a request is complete. If
        you have a question or a request, contact us at{" "}
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
      <p>
        You also have the right to complain to the{" "}
        <a href="https://ico.org.uk/make-a-complaint/">
          Information Commissioner&rsquo;s Office (ICO)
        </a>
        , the UK supervisory authority, at ico.org.uk or on 0303 123 1113.
      </p>

      <h2>This is not a crisis service</h2>
      <p>
        {SITE.name} is not a substitute for professional medical or
        mental-health advice, and it is not for emergencies. If you are in
        distress or in danger, contact your local emergency services (999 in the
        UK) or a helpline such as the{" "}
        <a href="https://www.samaritans.org/">Samaritans on 116 123</a>. Please
        see our <a href="/terms">Terms of Use</a> for the full picture.
      </p>
    </LegalDoc>
  );
}
