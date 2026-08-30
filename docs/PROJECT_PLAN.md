# Gita RAG Chatbot — Project Plan

## 1. Overview

A website-based chatbot that provides life guidance grounded in the Bhagavad Gita using Retrieval-Augmented Generation (RAG). Users describe personal problems (relationships, anger, career stress, anxiety, etc.), and the system retrieves the most relevant shlokas (verses) and generates a grounded, explained response — showing the original Sanskrit, translation, and practical application.

**Core principle:** Every piece of guidance must be traceable to an actual verse. No hallucinated shlokas, no invented chapter/verse numbers.

---

## Decisions Log (locked)

| Decision | Choice | Consequence |
|---|---|---|
| Target audience | **US / UK (English-speaking, Western)** | Drives language (English-only), crisis-resource region (US/UK), and privacy regime (UK GDPR + US CCPA/CPRA). |
| Base translation (English) | **Public-domain: Kisari Mohan Ganguli (prose), 1883–96** | Zero legal risk. Prose + cleanly verse-addressable (one entry per chapter.verse) → consistent tagging + per-verse grounding. Archaic → `plain_explanation` carries all modern readability (raises the bar on that field). Arnold's verse rendering rejected (doesn't map 1:1 to numbered verses). **Ganguli supplies `translation` only — NOT Sanskrit/transliteration (next row).** |
| Sanskrit + transliteration source | **Devanagari from a PD/CC0 digital edition (e.g. Wikisource / GRETIL — verify the specific file's terms); IAST transliteration auto-generated from it** | Ganguli is English-only. The Gita's Sanskrit is ancient → PD; only the *digitization* needs a clean licence. Transliteration is a deterministic script conversion (`indic-transliteration`), so no second sourced text — one Devanagari source feeds both `sanskrit` and `transliteration`. Verse numbering must be reconciled 1:1 with Ganguli's chapter.verse ids. |
| Persona | **Speaks as Krishna** | Grounding guardrail becomes **mandatory** (see §4). Add an "AI representation, not scripture" disclaimer for religious sensitivity. |
| Language | **English-only at MVP** | No Hindi → no parallel Hindi base text needed, halved tagging/eval burden, English embedding model is sufficient. |
| Embeddings | **`text-embedding-3-large` (3072-dim, English)** | Multilingual model no longer required once Hindi is dropped. |
| LLMs | **Generation: `claude-opus-4-8`; safety+classify: `claude-haiku-4-5`** | Opus for sensitive Krishna-persona tone (adaptive thinking, streamed, no `temperature`); one Haiku call does safety screen + classification (see ARCHITECTURE §7a). |
| Infra (vector store) | **In-memory (numpy/FAISS)** | 700 vectors ≈ 2MB, loaded at startup. No managed vector DB — no network hop, dependency, or cost. Revisit only if the corpus grows (commentaries/multiple translations). |
| Safety-screen order | **First, on raw input** | `input → safety screen → classify → retrieve → generate`. Regex tripwire (cheap floor) + LLM nuance, before any generation spend. |
| Safety response mode | **Resources + guidance (not a hard stop)** | On a distress signal, show crisis resources **alongside** the normal Gita response. Acute-crisis edge case (active self-harm/suicidal intent) flagged to revisit during safety testing (G2). |
| Crisis resources | **US/UK + intl fallback, locale-detected** | 988 (US), Samaritans 116 123 (UK), Crisis Text Line (text HOME→741741); default to findahelpline.com when locale unknown. |
| Retrieval strategy | **Classifier + metadata tag filter over the whole corpus** (+ full-corpus fallback) | Classify emotion/theme → cosine-rank verses whose tags overlap, with `fetch_k = corpus size` so the filter spans all 700 (not just the raw top-20 — see ARCHITECTURE §4.2). **Safety net:** if the filtered set yields < N candidates, fall back to unfiltered full-corpus search so a mis-tag degrades gracefully. |
| Privacy / retention | **Minimal, anonymous** | No accounts at MVP. No chat content persisted beyond session; only anonymized/aggregated metrics with a consent notice. Simplest path to UK GDPR + US CCPA/CPRA. |
| Interaction mode | **Two modes, user-toggled — default: guidance-only** | (A) Guidance-only: advice + a subtle "based on Gita 2.47" reference, no verse panel. (B) Guidance + verses: full Sanskrit/transliteration/translation shown. **Display-layer only** — retrieval, grounding guardrail, and safety run identically in both; Mode A hides the panel, it does not weaken grounding. Sanskrit source is needed only for Mode B. |

---

## 2. Architecture

```
User Query
   │
   ▼
[Safety Layer] ── FIRST. Regex tripwire (cheap floor) + LLM nuance
   │  screens distress signals: self-harm, abuse, severe distress
   │  ├─ if triggered → attach US/UK crisis resources, then CONTINUE to guidance
   │  │     (acute-crisis edge case: revisit during safety testing / G2)
   │  └─ always ↓
   ▼
[Theme/Emotion Classifier] ── (LLM call, lightweight)
   │  extracts: emotional_tags, life_situation, intensity
   ▼
[Retrieval Layer]
   │  1. Tag filter applied across the WHOLE corpus (fetch_k = corpus size)
   │  2. Cosine similarity rank within the tag-matching set (in-memory / FAISS)
   │  3. Fallback: if < N candidates, search full corpus unfiltered
   │  4. Top-k (2–4) results
   ▼
[Context Assembly]
   │  Top 2-4 shlokas with full metadata
   │  (if best similarity < threshold → out-of-scope fallback, no forced verse)
   ▼
[Generation Layer] ── (LLM call, grounded generation, Krishna persona)
   │  System prompt enforces: cite only retrieved verses,
   │  explain connection to user's situation, maintain tone
   ▼
[Grounding Guardrail] ── parse verse IDs, verify ⊆ retrieved set; regenerate if not
   ▼
Response (verse + transliteration + translation + explanation + guidance)
```

---

## 3. Dataset Design

### 3.1 Source Material
- **English translation (locked):** public-domain — **Kisari Mohan Ganguli (prose), 1883–96**. Supplies `translation` only. Do not let an LLM freely paraphrase — ground every entry in the established translation.
- **Sanskrit + transliteration (locked):** Devanagari from a **PD/CC0 digital edition** (Wikisource / GRETIL — verify the file's terms); **IAST transliteration auto-generated** from the Devanagari (`indic-transliteration`). Reconcile verse numbering 1:1 with Ganguli's ids.
- Total corpus: ~700 verses across 18 chapters. English (translation + guidance) only at MVP.

### 3.2 Schema (per verse)

Tags are drawn **only** from the fixed vocabularies in `TAXONOMY.md` (v1) — no free text.

```json
{
  "id": "2.47",
  "chapter": 2,
  "verse": 47,
  "sanskrit": "...",
  "transliteration": "...",
  "translation": "...",
  "translation_source": "Kisari Mohan Ganguli",
  "sanskrit_source": "GRETIL/Wikisource (PD/CC0)",
  "plain_explanation": "Modern, conversational restatement of the verse's practical meaning",
  "themes": ["detachment from outcomes", "duty & right action"],
  "emotional_tags": ["anxiety", "overwhelm", "fear"],
  "life_situations": ["career pressure", "exam/study stress"],
  "chapter_context": "One-line note on where this verse falls in Krishna's argument to Arjuna, for continuity"
}
```

### 3.3 Tagging Process
1. Taxonomy is **locked** — `TAXONOMY.md` (v1). Tag only from those closed lists.
2. LLM-assisted tagging (Haiku or Opus): feed each verse + Ganguli translation, generate `plain_explanation`, `themes`, `emotional_tags`, `life_situations` constrained to the taxonomy via structured output.
3. Manual review/correct every verse — especially philosophically nuanced ones; two-reviewer agreement check on a ≥20% sample.
4. Store as versioned JSONL in-repo (`data/verses.jsonl`); bump a dataset version on any correction so the index re-embed is traceable.

### 3.4 Embedding Strategy
- Embed a **composite string** per verse: `plain_explanation + themes + life_situations + emotional_tags` (not raw Sanskrit — poor semantic match to user queries). See ARCHITECTURE §3.
- Store `sanskrit`, `translation`, `translation_source`, tags, `chapter_context` as **metadata**, not embedded text.
- Single index at MVP. A second `translation`-only embedding for literal/philosophical queries is **post-MVP** — only if eval shows emotional-composite retrieval misses literal queries.

---

## 4. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Vector store | In-memory numpy/FAISS (cosine) — **locked** | 700 vectors loaded at startup, persisted via `save_local`. No managed vector DB at MVP. |
| Embeddings | `text-embedding-3-large` (OpenAI, 3072-dim) — **locked** | Same model at index + query time. |
| Generation LLM | `claude-opus-4-8` — **locked** | Adaptive thinking + `effort`, streamed; no `temperature` (400 on 4.8). Tone control for Krishna persona. |
| Safety + classifier LLM | `claude-haiku-4-5` — **locked** | One merged call returns `{crisis, tags, situation, intensity}`. |
| RAG orchestration | LangChain (`langchain-community` FAISS, `langchain-anthropic`, `langchain-openai`) | Direct/custom retrieval logic, not agentic. See ARCHITECTURE. |
| Backend | Python + FastAPI (async; FAISS calls in threadpool) | |
| Frontend | Next.js (React) | Deploy on Vercel. |
| Hosting (backend) | Railway / Render | Simple managed deploy. |
| Secrets | Platform env vars / secret manager | API keys never in repo or client. |

---

## 5. Build Phases

### Phase 0 — Setup
- Repo structure, environment config, secrets via env/secret manager (never hardcode)
- Translation source locked (Ganguli, public-domain — no rights to secure); CI skeleton

### Phase 1 — Foundations & Data
- Taxonomy locked → `TAXONOMY.md` (v1)
- **Build eval sets FIRST** (before tagging) → `EVAL_SPEC.md`: golden retrieval set (A) + adversarial safety set (B). Tagging then targets measurable retrieval quality.
- Assemble per-verse records: `translation` from Ganguli + `sanskrit` from the PD Devanagari edition + `transliteration` auto-generated (IAST); reconcile numbering 1:1 across sources
- LLM-assisted tagging constrained to taxonomy + manual review (≥20% two-reviewer sample)
- Finalize versioned `data/verses.jsonl`

### Phase 2 — Ingestion
- Script to embed dataset into an in-memory index (numpy array / FAISS), metadata held alongside
- Persist embeddings to disk (e.g. `.npy` + JSON) so startup just loads them; re-run on dataset corrections

### Phase 3 — Safety Screen (runs FIRST at request time)
- Regex/keyword tripwire for high-signal crisis phrases (cheap floor) + lightweight LLM pass for nuance
- On trigger: attach US/UK crisis resources (988, Samaritans 116 123, Crisis Text Line; findahelpline.com fallback) **and continue to the normal guidance response**
- Acute-crisis handling (active self-harm/suicidal intent) to be pressure-tested during safety testing (G2)
- Privacy-respecting logging of edge cases (anonymized) for review

### Phase 4 — Retrieval Pipeline
- Theme/emotion classifier (lightweight LLM call)
- Tag filter across the whole corpus (`fetch_k` = corpus size) → cosine rank within the matching set
- **Fallback:** if pre-filter yields < N candidates, search full corpus
- Re-ranking logic (top 2-4 verses returned); out-of-scope fallback if best similarity < threshold
- Test retrieval quality against an eval set built early (see Phase 7 metrics)

### Phase 5 — Generation Layer
- System prompt: grounded generation rules (only cite retrieved verses, explain connection to user's stated problem) + **Krishna persona** voice (compassionate, first-person as guide to Arjuna) with an "AI representation, not scripture" disclaimer surfaced in the UI
- **Grounding guardrail (mandatory):** parse every verse ID in the model output, assert each exists in the retrieved set; if any don't, reject and regenerate (bounded retries). Non-negotiable given the Krishna persona.
- Response formatting: show Sanskrit + transliteration + English translation + plain guidance

### Phase 6 — Frontend
- Chat UI (Next.js), no accounts at MVP (session-only, minimal retention)
- **Mode toggle:** guidance-only (default, shows a subtle "based on Gita X.Y" reference) ↔ guidance + verses
- Verse display component (Sanskrit/transliteration/translation), shown only in verses mode
- Consent notice + "AI representation, not scripture" disclaimer

### Phase 7 — Eval, Hardening & Launch
- **Run the harness** (built in Phase 1) against the real index:
  - **G1:** tune `SCOPE_THRESHOLD`/`k`/`min_candidates` to hit recall@4 ≥ 0.85, out-of-scope precision ≥ 0.9
  - **G2:** validate safety recall ≥ 0.95, **acute-tier recall = 1.0** (hard bar); iterate the screen until met
  - Automated groundedness check (cited IDs ⊆ retrieved set) + reviewer gloss-accuracy spot-check
- Security/abuse hardening: rate limiting, prompt-injection tests, request size caps (see §9)
- Ops: cost/latency budget, prompt & dataset versioning, observability (see §11)
- Staged rollout per §12; launch only when the §14 checklist is green

---

## 6. Key Design Principles (don't skip these)

1. **Accuracy over cleverness** — never let the LLM free-generate a shlok reference. Always ground in retrieved data.
2. **Show the source** — always display the actual Sanskrit/translation used, not just paraphrased advice. Builds trust.
3. **Scope boundary** — this is reflective/philosophical guidance, not therapy. Build in detection for when a user's situation needs real professional support, and don't try to "Gita" through a crisis.
4. **Consistent taxonomy** — lock the theme/emotion tag list before tagging 700 verses, or retrieval quality will be inconsistent.
5. **Translation consistency** — pick one base translation source; don't blend multiple without clear attribution per verse.

---

## 7. Open Decisions

**Resolved** (see Decisions Log): target audience · English translation source · persona · language/scope · embeddings · vector store · safety-screen order · retrieval strategy · privacy stance.

**All decision loops resolved:**
- [x] ~~Which specific PD English text: Ganguli vs Arnold~~ → **Ganguli (prose)**
- [x] ~~Exact crisis-resource list + response mode~~ → **resources shown *alongside* guidance (not a hard stop); US/UK locale-detected + findahelpline.com fallback**
- [x] ~~Traditional commentary (Shankaracharya etc.)~~ → **post-MVP, out of scope for v1**

**Remaining are the two data-gated launch blockers (detail in ARCHITECTURE.md §8):**
- [ ] **G1** — calibrate retrieval thresholds (`SCOPE_THRESHOLD`/`k`/`min_candidates`) against the eval set
- [ ] **G2** — validate safety-screen recall against an adversarial crisis test set (incl. acute-crisis handling)

---

## 8. Non-Functional Requirements & SLOs

| Dimension | Target (MVP) | Notes |
|---|---|---|
| Latency (p50) | ≤ 6 s to first token | Two model round trips (Haiku → Opus); stream generation |
| Latency (p95) | ≤ 12 s | Worst case includes one grounding regen |
| Availability | 99% | Single managed backend; degrade gracefully on LLM outage |
| Cost/query | ~$0.022 (worst ~$0.043) | Generation-dominated; see ARCHITECTURE §7a |
| Correctness | 0 ungrounded citations reach the user | Enforced by grounding guardrail, not best-effort |

## 9. Security & Abuse

- **Secrets:** API keys in platform env/secret manager; never in repo, logs, or client bundle.
- **Prompt injection:** user text delimited and treated as data, not instructions; grounding guardrail is the backstop against injected fake citations.
- **Rate limiting + request caps:** per-IP/session rate limit and max input length to bound cost and abuse.
- **Input abuse:** reject/aggregate obviously non-genuine traffic; log anomalies (anonymized).
- **Dependency/supply chain:** pin dependency versions; only load the FAISS index we build (never a downloaded/untrusted one — pickle risk).

## 10. Privacy & Legal

- **Data:** no accounts; chat content not persisted beyond the session. Only anonymized/aggregated metrics stored.
- **Consent:** clear notice at entry; "AI representation of Gita concepts, not scripture and not a person" disclaimer.
- **Not therapy:** explicit "this is reflective guidance, not medical/mental-health advice" notice; crisis resources always one tap away.
- **Regime:** UK GDPR + US CCPA/CPRA aligned by design (minimal collection). Publish a short privacy policy + terms before launch.
- **Safety logging:** crisis-flagged events logged as counts/tiers only — **never raw distressing user text** — to respect both privacy and the minimal-retention stance.

## 11. Observability & Monitoring

- **Per-request metrics:** latency (per stage), cost, tokens, retrieval score of top hit, out-of-scope rate, grounding-regen count, error rate.
- **Safety metrics (highest priority):** crisis-trigger rate and tier distribution; alert on anomalies. Sample flagged cases (anonymized) for ongoing recall review — a live proxy for G2.
- **Quality drift:** track share of queries hitting the out-of-scope fallback and the full-corpus fallback (spikes signal tagging/threshold drift).
- **Prompt & dataset versioning:** every prompt and `verses.jsonl` version tagged; responses attributable to a version for debugging/rollback.

## 12. Deployment & Rollout

- **Environments:** local → staging (full eval run) → production.
- **Release gate:** CI runs the eval harness; a regression in recall@4 or **any** drop in acute-tier safety recall blocks the deploy.
- **Staged launch:** internal dogfood → closed soft launch (small US/UK cohort, collect feedback) → public. No big-bang.
- **Rollback:** pin model IDs, prompt version, and dataset version; rollback = redeploy prior versions. Index is a build artifact, reproducible from `verses.jsonl`.

## 13. Success Metrics (post-launch)

- **Retrieval:** live proxy for recall via thumbs-up/down on "was this verse relevant?"
- **Groundedness:** 0 verified hallucinated-citation reports (hard target).
- **Safety:** 0 missed acute-crisis cases in ongoing sampled review (hard target).
- **Engagement:** return usage, session depth — secondary to the correctness/safety bars above.

## 14. Launch Readiness Checklist (Definition of Done)

- [ ] Dataset: 700 verses tagged from taxonomy, reviewed, versioned
- [ ] G1 met: recall@4 ≥ 0.85, out-of-scope precision ≥ 0.9 on golden set
- [ ] G2 met: crisis recall ≥ 0.95, **acute-tier recall = 1.0** on safety set
- [ ] Grounding guardrail verified (no ungrounded citation escapes in eval)
- [ ] Crisis resources wired + locale detection tested (US/UK/fallback)
- [ ] Disclaimers + consent + privacy policy + terms published
- [ ] Rate limiting, input caps, secrets management in place
- [ ] Observability dashboards + safety alerting live
- [ ] CI eval-regression gate enforced
- [ ] Staged-rollout plan executed through soft launch

---

## Related docs
- `ARCHITECTURE.md` — component-level technical design, code skeletons, known limitations & launch gates
- `EVAL_SPEC.md` — golden retrieval set (G1) + adversarial safety set (G2)
- `TAXONOMY.md` — locked theme / emotional-tag / life-situation vocabularies (v1)
