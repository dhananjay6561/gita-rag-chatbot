"""G1 harness — retrieval-threshold calibration (EVAL_SPEC §2, ARCH §12).

Runs the golden set through the real classify→retrieve path (not the HTTP app)
and reports the numbers that gate launch:
  - recall@k                  target ≥ 0.85
  - MRR                       target ≥ 0.70
  - out-of-scope precision    target ≥ 0.90

Thresholds are CLI flags so sweeps are reproducible. Makes live Haiku + OpenAI
calls — needs ANTHROPIC_API_KEY and OPENAI_API_KEY.

    python -m eval.run --k 4 --scope-threshold 1.0
    python -m eval.run --limit 10
"""
from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

from app import config, retrieval, safety

SET_PATH = Path(__file__).parent / "golden_retrieval.jsonl"


def _load(limit: int | None) -> list[dict]:
    items = [json.loads(line) for line in SET_PATH.read_text().splitlines() if line.strip()]
    return items[:limit] if limit else items


async def _score_one(item: dict, k: int, min_candidates: int, sem: asyncio.Semaphore) -> dict:
    async with sem:
        screen = await safety.classify(item["query"])
        verses = await retrieval.retrieve(item["query"], screen.emotional_tags, k, min_candidates)
    got = [d.metadata["id"] for d in verses] if verses else []
    accept = set(item.get("expected_verse_ids", [])) | set(item.get("acceptable_verse_ids", []))
    rank = next((i + 1 for i, vid in enumerate(got) if vid in accept), 0)
    return {
        "id": item["id"], "in_scope": item["in_scope"],
        "got": got, "hit": rank > 0, "rank": rank,
        "returned_none": verses is None, "query": item["query"],
    }


def _report(rows: list[dict]) -> bool:
    in_scope = [r for r in rows if r["in_scope"]]
    out_scope = [r for r in rows if not r["in_scope"]]

    hits = [r for r in in_scope if r["hit"]]
    recall = len(hits) / len(in_scope) if in_scope else 0.0
    mrr = sum(1 / r["rank"] for r in hits) / len(in_scope) if in_scope else 0.0
    correct_oos = [r for r in out_scope if r["returned_none"]]
    oos_precision = len(correct_oos) / len(out_scope) if out_scope else 0.0

    print("\n=== G1: retrieval metrics ===")
    print(f"items: {len(rows)}  (in-scope {len(in_scope)}, out-of-scope {len(out_scope)})")
    print(f"recall@k           {recall:.2f}   target ≥ 0.85")
    print(f"MRR                {mrr:.2f}   target ≥ 0.70")
    print(f"out-of-scope prec  {oos_precision:.2f}   target ≥ 0.90")

    misses = [r for r in in_scope if not r["hit"]]
    if misses:
        print("\n--- MISSES (expected verse not in top-k) ---")
        for r in misses:
            print(f"  [{r['id']}] got={r['got']}  {r['query']!r}")
    leaks = [r for r in out_scope if not r["returned_none"]]
    if leaks:
        print("\n--- out-of-scope leaks (forced a verse) ---")
        for r in leaks:
            print(f"  [{r['id']}] got={r['got']}  {r['query']!r}")

    passed = recall >= 0.85 and mrr >= 0.70 and oos_precision >= 0.90
    print(f"\nG1 gate: {'PASS' if passed else 'FAIL'} "
          f"(recall={recall:.2f}, mrr={mrr:.2f}, oos={oos_precision:.2f})")
    return passed


async def _main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--k", type=int, default=config.K)
    ap.add_argument("--min-candidates", type=int, default=config.MIN_CANDIDATES)
    ap.add_argument("--scope-threshold", type=float, default=config.SCOPE_THRESHOLD)
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--concurrency", type=int, default=4)
    args = ap.parse_args()

    config.SCOPE_THRESHOLD = args.scope_threshold  # sweep target (ARCH §12)
    retrieval.load_index()

    items = _load(args.limit)
    sem = asyncio.Semaphore(args.concurrency)
    rows = await asyncio.gather(
        *(_score_one(it, args.k, args.min_candidates, sem) for it in items)
    )
    rows.sort(key=lambda r: r["id"])
    return 0 if _report(rows) else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(_main()))
