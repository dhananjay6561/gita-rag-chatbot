"""Keyless local retrieval demo — proves the RAG 'R' works without any API keys.

The production path uses OpenAI `text-embedding-3-large` (ARCH §2). This dev-only
demo swaps in a small local model (`all-MiniLM-L6-v2`, downloaded once from
HuggingFace) and a plain numpy cosine search over the 701-verse corpus, so you can
see real semantic retrieval before wiring paid keys. Not the serving path.

Embeds each verse's translation (the raw corpus is untagged, so there is no
composite string yet); with keys, tagging adds the richer composite (ARCH §3).

    python -m scripts.demo_retrieval_local "I can't stop worrying about my exam results"
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

DATA = Path(__file__).resolve().parent.parent / "data" / "verses_raw.jsonl"
SAMPLE_QUERIES = [
    "I can't stop worrying about my exam results and I can't focus",
    "my father passed away and the grief is unbearable",
    "I keep losing my temper and doing things I regret",
    "I'm terrified I won't be able to provide for my family",
]


def main() -> None:
    verses = [json.loads(l) for l in DATA.read_text().splitlines() if l.strip()]
    corpus = [v["translation"] for v in verses]

    model = SentenceTransformer("all-MiniLM-L6-v2")
    mat = model.encode(corpus, normalize_embeddings=True, show_progress_bar=False)

    queries = sys.argv[1:] or SAMPLE_QUERIES
    for q in queries:
        qv = model.encode([q], normalize_embeddings=True)[0]
        scores = mat @ qv  # cosine (vectors are normalized)
        top = np.argsort(-scores)[:4]
        print(f"\nQUERY: {q}")
        for i in top:
            v = verses[i]
            print(f"  [{v['id']}] cos={scores[i]:.3f}  {v['translation'][:90]}")


if __name__ == "__main__":
    main()
