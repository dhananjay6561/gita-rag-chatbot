"""Full keyless RAG demo — retrieval + generation + grounding, no API keys.

Wires the real pipeline logic to LOCAL stand-ins so the whole loop runs offline:
  - retrieval : sentence-transformers + numpy cosine over the 701-verse corpus
  - generation: a local Ollama model (llama3.2:1b) with the real Krishna-persona
                system prompt (`app.generation._system_prompt`)
  - safety    : the real regex tripwire (`app.safety.regex_tripwire`)
  - grounding : the real guardrail (`app.generation.enforce_grounding`) — verifies
                every cited verse id is in the retrieved set, regenerates or falls
                back otherwise

Production still uses OpenAI embeddings + Claude (ARCH §2); this only proves the
machinery end-to-end without paid keys. Needs `ollama serve` running.

    python -m scripts.demo_rag_local "I keep losing my temper and regret it"
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

import numpy as np
import requests
from sentence_transformers import SentenceTransformer

from app import generation, safety

DATA = Path(__file__).resolve().parent.parent / "data" / "verses_raw.jsonl"
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")


class Doc:
    """Minimal Document stand-in for the app's metadata/page_content contract."""

    def __init__(self, rec: dict):
        self.metadata = rec
        self.page_content = rec["translation"]


def _ollama(system: str, user: str) -> str:
    r = requests.post(OLLAMA_URL, timeout=180, json={
        "model": MODEL, "system": system, "prompt": user, "stream": False,
    })
    r.raise_for_status()
    return r.json()["response"].strip()


async def _answer(model, mat, verses, all_ids, query: str):
    if safety.regex_tripwire(query):
        print("  [safety] crisis tripwire fired → resources would be attached (continuing)")

    qv = model.encode([query], normalize_embeddings=True)[0]
    docs = [Doc(verses[i]) for i in np.argsort(-(mat @ qv))[:4]]

    system = generation._system_prompt(docs, None)
    raw = _ollama(system, f"<seeker>{query}</seeker>")

    async def regen(correction: str) -> str:
        return _ollama(generation._system_prompt(docs, correction), f"<seeker>{query}</seeker>")

    reply, refs = await generation.enforce_grounding(raw, docs, all_ids, regen)
    return docs, reply, refs


async def _main() -> None:
    verses = [json.loads(l) for l in DATA.read_text().splitlines() if l.strip()]
    all_ids = {v["id"] for v in verses}
    model = SentenceTransformer("all-MiniLM-L6-v2")
    mat = model.encode([v["translation"] for v in verses],
                       normalize_embeddings=True, show_progress_bar=False)

    for q in (sys.argv[1:] or ["I keep losing my temper and doing things I regret"]):
        docs, reply, refs = await _answer(model, mat, verses, all_ids, q)
        print(f"\n{'='*70}\nQUERY: {q}")
        print(f"retrieved: {[d.metadata['id'] for d in docs]}")
        print(f"grounded verse_refs: {refs}")
        print(f"\nREPLY:\n{reply}")


if __name__ == "__main__":
    asyncio.run(_main())
