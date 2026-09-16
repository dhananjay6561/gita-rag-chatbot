/**
 * Single source of truth for the API contract shared with the FastAPI backend
 * (see ../../app/main.py). Everything downstream is DERIVED from these Zod
 * schemas, never hand-duplicated:
 *   - TypeScript types            -> `z.infer` exports below
 *   - Runtime response validation -> `lib/api.ts` parses network JSON with these
 *   - JSON Schema artifacts        -> `scripts/gen-json-schema.ts` (z.toJSONSchema)
 *
 * If the backend contract changes, edit this file only. Do not redeclare these
 * shapes anywhere else in the frontend.
 */
import { z } from "zod";

/** Answer style the seeker can pick. Mirrors AskRequest.mode (main.py). */
export const MODES = ["guidance", "verses"] as const;
export type Mode = (typeof MODES)[number];

/** POST /ask request body. Bounds match the backend Field() constraints. */
export const AskRequestSchema = z.object({
  query: z.string().min(1).max(2000),
  locale: z.string().optional(),
  mode: z.enum(MODES).default("guidance"),
});
export type AskRequest = z.infer<typeof AskRequestSchema>;

/**
 * One retrieved verse, rendered from the backend's own metadata (never the
 * model's reproduction). This closes the right-id/wrong-gloss grounding blind
 * spot documented in ARCHITECTURE.md 4.3 / 205.
 */
export const VerseSchema = z.object({
  id: z.string(),
  sanskrit: z.string(),
  transliteration: z.string(),
  translation: z.string(),
  translation_source: z.string(),
  sanskrit_source: z.string(),
});
export type Verse = z.infer<typeof VerseSchema>;

/** Crisis helpline shown alongside guidance when the safety screen flags it. */
export const CrisisResourceSchema = z.object({
  name: z.string(),
  contact: z.string(),
  region: z.string(),
});
export type CrisisResource = z.infer<typeof CrisisResourceSchema>;

/**
 * POST /ask response. `verses` and `crisis_resources` are null (not []) when
 * absent, matching the backend's _response(): the panel is suppressed unless
 * mode is "verses" AND grounded refs exist.
 */
export const AskResponseSchema = z.object({
  reply: z.string(),
  verse_refs: z.array(z.string()),
  verses: z.array(VerseSchema).nullable(),
  crisis_resources: z.array(CrisisResourceSchema).nullable(),
  out_of_scope: z.boolean(),
  disclaimer: z.string(),
});
export type AskResponse = z.infer<typeof AskResponseSchema>;

/** GET /health payload (main.py health()). */
export const HealthSchema = z.object({
  status: z.string(),
  index_loaded: z.boolean(),
  corpus_size: z.number().int().nonnegative(),
});
export type Health = z.infer<typeof HealthSchema>;

/** Named registry so the JSON Schema generator stays in lockstep with exports. */
export const CONTRACT_SCHEMAS = {
  AskRequest: AskRequestSchema,
  AskResponse: AskResponseSchema,
  Verse: VerseSchema,
  CrisisResource: CrisisResourceSchema,
  Health: HealthSchema,
} as const;
