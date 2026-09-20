# Sakha - Gita RAG frontend

Calm, contemplative chat UI for the Gita RAG backend. A seeker types what weighs
on them and receives a grounded verse plus a short reflection. Built with Next.js
(App Router), Tailwind v4, and a schema-first contract shared with the backend.

## Design

- Warm-paper palette with a single burnt-saffron accent, light and dark mode via
  `prefers-color-scheme`. Every text/background pair is verified WCAG AA.
- Outfit for interface text; Spectral serif reserved for verse and reflection
  reading content.
- Motion is restrained and always honors `prefers-reduced-motion`.

## Architecture

```
lib/contract.ts        Zod SSOT mirroring the backend /ask + /health contract
lib/api.ts             server-only backend client, validates every payload
lib/site.ts            site constants (name, url, contact) feeding metadata + JSON-LD
lib/structured-data.ts schema.org JSON-LD: site, FAQ and per-page builders (Zod-validated)
app/api/ask            proxy route; keeps BACKEND_URL server-side
app/page.tsx           static server shell + <Ask/> client island + FAQ JSON-LD
app/privacy, app/terms static UK privacy notice + terms, with WebPage/breadcrumb JSON-LD
components/            ask flow, answer, verse card, crisis banner, skeleton, legal-doc
scripts/gen-schema     emits schema/*.json from lib/contract.ts
```

The browser never calls the backend directly. It calls `/api/*` route handlers,
which call `lib/api.ts` server-side and validate the response against the Zod
contract before it reaches the UI, so a backend contract drift fails loudly.

## Setup

```bash
pnpm install
cp .env.example .env.local     # set BACKEND_URL to the running FastAPI app
```

## Run

```bash
pnpm dev                       # dev server on :3000
pnpm build && pnpm start       # production build
pnpm lint                      # eslint
pnpm gen:schema                # regenerate schema/*.json after editing the contract
```

## Environment

| Variable | Purpose |
|---|---|
| `BACKEND_URL` | FastAPI base URL, server-side only |
| `BACKEND_TIMEOUT_MS` | Abort a backend call after this many ms (default 35000) |
| `NEXT_PUBLIC_SITE_URL` | Canonical public URL for metadata, OG, sitemap, JSON-LD |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact shown on the privacy notice and in the Organization JSON-LD |

## Deploy

Deploys to Vercel as-is. Set `BACKEND_URL`, `NEXT_PUBLIC_SITE_URL`, and
`NEXT_PUBLIC_CONTACT_EMAIL` in the project environment. Security headers,
sitemap, robots, structured data, the privacy/terms pages, and a generated OG
image and favicon are built in.
