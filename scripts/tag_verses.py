"""LLM-assisted verse tagging, constrained to the v1 taxonomy (PLAN §3.3).

Reads raw verse records (sanskrit + Ganguli translation, no tags) and fills
plain_explanation, chapter_context, themes, emotional_tags, life_situations via
structured output. Tags are forced into the closed vocabularies and sanitized
defensively — no free text. Every verse still needs MANUAL review afterward,
especially philosophically nuanced ones (≥20% two-reviewer sample).

    python -m scripts.tag_verses --in data/verses_raw.jsonl --out data/verses.jsonl
"""
from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

from pydantic import BaseModel, Field

from app import config, taxonomy


class VerseTags(BaseModel):
    plain_explanation: str = Field(
        description="Modern, conversational restatement of the verse's practical "
                    "meaning — how a person would apply it. No archaic language.")
    chapter_context: str = Field(
        description="One line on where this verse falls in Krishna's argument to Arjuna.")
    themes: list[str] = Field(
        description=f"1-3 teachings, ONLY from: {list(taxonomy.THEMES)}")
    emotional_tags: list[str] = Field(
        description=f"1-4 user feelings this speaks to, ONLY from: {list(taxonomy.EMOTIONAL_TAGS)}")
    life_situations: list[str] = Field(
        description=f"1-3 contexts, ONLY from: {list(taxonomy.LIFE_SITUATIONS)}")


_SYSTEM = (
    "You tag Bhagavad Gita verses for a reflective-guidance retrieval system. "
    "Given the Sanskrit and an English translation, write a plain-language "
    "explanation and assign tags STRICTLY from the provided closed vocabularies. "
    "Tag for how a seeker would phrase their problem, not scholarly terms. Prefer "
    "fewer accurate tags over many loose ones. Never invent a tag outside the lists."
)

_model = None
_PROVIDER = "anthropic"  # set from --provider in main


def _get_model():
    global _model
    if _model is None:
        if _PROVIDER == "ollama":
            from langchain_ollama import ChatOllama  # local, keyless
            base = ChatOllama(model=config.OLLAMA_CHAT_MODEL, base_url=config.OLLAMA_BASE_URL)
        else:
            from langchain_anthropic import ChatAnthropic
            base = ChatAnthropic(model=config.SAFETY_MODEL, max_tokens=1024)
        _model = base.with_structured_output(VerseTags)
    return _model


def _sanitize(t: VerseTags) -> VerseTags:
    t.themes = [x for x in t.themes if x in taxonomy.THEMES][:3]
    t.emotional_tags = [x for x in t.emotional_tags if x in taxonomy.EMOTIONAL_TAGS][:4]
    t.life_situations = [x for x in t.life_situations if x in taxonomy.LIFE_SITUATIONS][:3]
    return t


async def _tag_one(v: dict, sem: asyncio.Semaphore) -> dict:
    async with sem:
        tags: VerseTags = await _get_model().ainvoke([
            ("system", _SYSTEM),
            ("human", f'Sanskrit: {v["sanskrit"]}\nTranslation: {v["translation"]}'),
        ])
    return {**v, **_sanitize(tags).model_dump()}


async def _main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="src", default="data/verses_raw.jsonl")
    ap.add_argument("--out", dest="out", default="data/verses.jsonl")
    ap.add_argument("--provider", default="anthropic", choices=["anthropic", "ollama"])
    ap.add_argument("--limit", type=int, default=None)  # tag only the first N (sampling)
    ap.add_argument("--concurrency", type=int, default=4)
    args = ap.parse_args()

    global _PROVIDER
    _PROVIDER = args.provider

    raw = [json.loads(l) for l in Path(args.src).read_text().splitlines() if l.strip()]
    if args.limit:
        raw = raw[:args.limit]
    sem = asyncio.Semaphore(args.concurrency)
    tagged = await asyncio.gather(*(_tag_one(v, sem) for v in raw))
    Path(args.out).write_text("\n".join(json.dumps(v, ensure_ascii=False) for v in tagged) + "\n")
    print(f"tagged {len(tagged)} verses → {args.out}  (MANUAL review still required)")


if __name__ == "__main__":
    asyncio.run(_main())
