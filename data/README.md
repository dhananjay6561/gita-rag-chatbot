# Dataset

Two files, two stages of one pipeline:

- **`verses_raw.jsonl`** — the full **701-verse** corpus: `sanskrit`, `transliteration`,
  `translation`, sources. Assembled by `scripts/assemble_verses.py` from the open
  `gita/gita` dataset (MIT). Pre-tagging: no tags/explanations yet.
- **`verses.jsonl`** — the **tagged** corpus the FAISS index is built from
  (`scripts/build_index.py`). Schema in `docs/PROJECT_PLAN.md §3.2`; tags only from
  `docs/TAXONOMY.md` (v1). Currently an **18-verse hand-built seed** — replaced by
  the tagged full corpus once `scripts/tag_verses.py` runs (needs API keys).

## Numbering

701-verse convention (chapter 13 includes its invocatory verse). Ids are
`chapter.verse`, contiguous per chapter, no gaps.

## Translation source — DECISION PENDING

The locked doc choice is **Kisari Mohan Ganguli** (PD, zero legal risk), but it is
not available verse-aligned in any structured dataset, and its Mahabharata prose
is not cleanly per-verse addressable — aligning 700 verses to it is slow/error-prone.

`verses_raw.jsonl` currently uses **Shri Purohit Swami (1935)** — the only complete,
verse-numbered PD translation in the source dataset. Caveat: **PD in UK/EU, but its
US copyright status needs review** (may be protected until 2031). Zero-US-risk
alternatives that are verse-numbered prose: **Telang (SBE, 1882)** or Ganguli/Telang
from sacred-texts (needs a separate fetch + alignment).

`assemble_verses.py --author` swaps the translation in one re-run once confirmed.

## Path to the launch corpus

1. Confirm translation source (above) → re-assemble if needed.
2. `scripts/tag_verses.py` (LLM-assisted, taxonomy-constrained) → manual review
   (≥20% two-reviewer sample) → `verses.jsonl`.
3. `scripts/build_index.py` → re-run G1 harness (`eval/run.py`).

`transliteration` is the dataset's phonetic scheme, not strict IAST; regenerate
from Devanagari with `indic-transliteration` if strict IAST is required.
