import { test, expect, type Page } from "@playwright/test";

// A canned SSE body: two token frames then the grounded done frame. Fulfilled by
// route interception, so the Next server never calls the real backend.
const SSE = [
  'data: {"token":"Act with care, "}',
  "",
  'data: {"token":"then release the outcome. [2.47]"}',
  "",
  "event: done",
  'data: {"verse_refs":["2.47"],"verses":[{"id":"2.47","sanskrit":"कर्मण्येवाधिकारस्ते","transliteration":"karmany evadhikaras te","translation":"Your right is to action alone, never to its fruits.","translation_source":"Ganguli","sanskrit_source":"GRETIL"}],"crisis_resources":null,"out_of_scope":false,"disclaimer":"AI representation of Bhagavad Gita concepts."}',
  "",
  "",
].join("\n");

// The page is a controlled React form. Playwright can fill before hydration
// attaches, after which React resets the value to empty. Re-fill until the value
// sticks, which also confirms the island is interactive.
async function askQuestion(page: Page, text: string) {
  const field = page.getByLabel("What is weighing on you?");
  await expect(field).toBeVisible();
  await expect(async () => {
    await field.fill(text);
    await expect(field).toHaveValue(text);
  }).toPass({ timeout: 10_000 });
}

test("streams a grounded reflection with the verse panel", async ({ page }) => {
  await page.route("**/api/ask/stream", async (route) => {
    await route.fulfill({ status: 200, contentType: "text/event-stream", body: SSE });
  });

  await page.goto("/");
  await askQuestion(page, "I fear failing at everything.");
  await page.getByRole("radio", { name: "Verses" }).click();

  const submit = page.getByRole("button", { name: "Reflect" });
  await expect(submit).toBeEnabled();
  await submit.click();

  // Streamed reply text lands in the reflection.
  await expect(page.getByText("then release the outcome.")).toBeVisible();
  // Verse renders from the done-frame metadata, not the reply text.
  await expect(
    page.getByText("Your right is to action alone, never to its fruits."),
  ).toBeVisible();

  // The Sanskrit apparatus is revealed on demand (real interaction).
  const transliteration = page.getByText("karmany evadhikaras te");
  await expect(transliteration).toBeHidden();
  await page.getByRole("button", { name: "Show the Sanskrit" }).click();
  await expect(transliteration).toBeVisible();
});

test("shows an inline error when the stream route fails", async ({ page }) => {
  await page.route("**/api/ask/stream", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "upstream_unavailable" }),
    });
  });

  await page.goto("/");
  await askQuestion(page, "test");

  const submit = page.getByRole("button", { name: "Reflect" });
  await expect(submit).toBeEnabled();
  await submit.click();

  // Target the message text: the polite results region is also a live region,
  // so getByRole("alert") is not unique here.
  await expect(page.getByText("resting for a moment")).toBeVisible();
});
