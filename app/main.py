"""FastAPI app — the deterministic chain wired end-to-end (ARCH §10-11).

safety+classify → retrieve → scope-check → generate → grounding guardrail.
Stateless: no accounts, no server-side history at MVP (PLAN §10).
"""
from __future__ import annotations

import logging
import uuid
from contextlib import asynccontextmanager
from typing import Literal, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

from app import config, generation, resources, retrieval, safety

log = logging.getLogger("gita")

DISCLAIMER = ("This is an AI representation of Bhagavad Gita concepts — not "
             "scripture, not a person, and not a substitute for professional "
             "medical or mental-health advice.")


class AskRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)  # cap bounds cost/abuse (§9)
    locale: Optional[str] = None
    mode: Literal["guidance", "verses"] = "guidance"


@asynccontextmanager
async def lifespan(app: FastAPI):
    config.require_secrets()  # fail fast if a required key is missing (§9)
    vs = retrieval.load_index()
    app.state.all_ids = {d.metadata["id"] for d in vs.docstore._dict.values()}
    retrieval.assert_distance_orientation(vs)  # fail fast if score orientation is wrong
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/health")
async def health():
    """Liveness + readiness for the managed platform (Railway/Render)."""
    ready = hasattr(app.state, "all_ids")
    return {"status": "ok", "index_loaded": ready,
            "corpus_size": len(app.state.all_ids) if ready else 0}


def _verse_panel(verses, verse_refs: list[str]) -> list[dict]:
    """Panel data straight from metadata — never the model's reproduction (§4.3)."""
    refs = set(verse_refs)
    return [
        {"id": d.metadata["id"], "sanskrit": d.metadata["sanskrit"],
         "transliteration": d.metadata["transliteration"],
         "translation": d.metadata["translation"],
         "translation_source": d.metadata["translation_source"],
         "sanskrit_source": d.metadata["sanskrit_source"]}
        for d in verses if d.metadata["id"] in refs
    ]


def _response(reply, *, verse_refs, verses, mode, crisis_block, out_of_scope):
    # Panel only in verses mode AND when we have grounded refs — a SAFE_FALLBACK
    # returns [], so we suppress the panel rather than show it next to a fallback.
    panel = _verse_panel(verses, verse_refs) if (mode == "verses" and verse_refs) else None
    return {
        "reply": reply,
        "verse_refs": verse_refs,
        "verses": panel,
        "crisis_resources": crisis_block,
        "out_of_scope": out_of_scope,
        "disclaimer": DISCLAIMER,
    }


@app.post("/ask")
async def ask(req: AskRequest):
    request_id = str(uuid.uuid4())  # server-generated, for tracing (§10-11)
    crisis_block = None
    try:
        # [1] SAFETY + CLASSIFY — one Haiku call (regex tripwire runs inside).
        screen = await safety.screen_and_classify(req.query)
        if screen.crisis:
            crisis_block = resources.for_locale(req.locale)

        # [2-3] RETRIEVE + SCOPE CHECK
        verses = await retrieval.retrieve(req.query, screen.emotional_tags)
        if verses is None:
            return _response(
                "Nothing in the Gita speaks directly to this. If it helps, tell me "
                "how the situation is making you feel and I'll try again.",
                verse_refs=[], verses=[], mode=req.mode,
                crisis_block=crisis_block, out_of_scope=True,
            )

        # [4-5] GENERATE + GROUNDING GUARDRAIL
        raw = await generation.generate(req.query, verses)
        reply, verse_refs = await generation.enforce_grounding(
            raw, verses, all_ids=app.state.all_ids,
            regen=lambda corr: generation.generate(req.query, verses, correction=corr),
        )
        return _response(reply, verse_refs=verse_refs, verses=verses, mode=req.mode,
                         crisis_block=crisis_block, out_of_scope=False)

    except Exception as e:
        # Never surface a stack trace to the seeker; log the type only, no raw query (§10).
        log.warning("pipeline_failure request_id=%s error=%s", request_id, type(e).__name__)
        return _response(
            "I'm having trouble right now. Please try again in a moment.",
            verse_refs=[], verses=[], mode=req.mode,
            crisis_block=crisis_block, out_of_scope=False,
        )
