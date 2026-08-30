# Dataset

`verses.jsonl` is the tagged corpus — one JSON record per verse, the source of
truth the FAISS index is built from (`scripts/build_index.py`). Schema is defined
in `docs/PROJECT_PLAN.md §3.2`; tags are drawn only from `docs/TAXONOMY.md` (v1).

## Seed status (MVP)

The current file is an **18-verse seed** to make the pipeline runnable end-to-end,
not the launch corpus. It covers a spread of the taxonomy (detachment, grief,
anger, svadharma, surrender, equanimity).

**Provenance caveat — read before trusting any text here:**

- `sanskrit` / `transliteration` — canonical Devanagari + IAST for well-known
  verses. Still to be reconciled 1:1 against a specific PD/CC0 digital edition.
- `translation` — faithful renderings, **not** verified verbatim against Kisari
  Mohan Ganguli. The `translation_source` field says `seed — verify …` precisely
  so nothing is falsely attributed. Replace with the real Ganguli PD text before
  launch (PLAN Decisions Log).
- `plain_explanation` + tags — hand-authored for the seed; the full corpus uses
  `scripts/tag_verses.py` (LLM-assisted, taxonomy-constrained) + manual review.

## Path to the launch corpus (~700 verses)

1. Assemble raw records: Ganguli `translation` (PD) + Devanagari `sanskrit` from a
   licence-verified PD/CC0 edition + auto IAST (`indic-transliteration`).
2. Tag via `scripts/tag_verses.py`, then manual review (≥20% two-reviewer sample).
3. Rebuild the index; re-run the G1 harness (`eval/run.py`).

The `translation_source` / `sanskrit_source` fields flip to the real citations
once verbatim-verified.
