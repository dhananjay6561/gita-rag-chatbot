"""Retrieval with metadata pre-filter and graceful fallback (ARCH §4.1-4.2).

The `similarity_search_with_score` path is the single source of truth: it yields
the scores the fallback and the out-of-scope threshold both depend on. FAISS is
sync + CPU-bound, so the async entry point offloads to a threadpool — calling it
directly in an async handler would block the event loop.
"""
from __future__ import annotations

from pathlib import Path

from fastapi.concurrency import run_in_threadpool

from app import config

INDEX_DIR = Path(__file__).resolve().parent.parent / "index" / "faiss_gita"

_embeddings = None
_vs = None


def _get_embeddings():
    global _embeddings
    if _embeddings is None:
        from app.embeddings import get_embeddings  # config-driven provider
        _embeddings = get_embeddings()
    return _embeddings


def load_index():
    """Load the FAISS index once at boot and cache it module-side (ARCH §4.1).

    allow_dangerous_deserialization is safe ONLY because we build and control
    this index. Never load a downloaded/third-party FAISS index this way (§9).
    """
    global _vs
    from langchain_community.vectorstores import FAISS
    _vs = FAISS.load_local(
        str(INDEX_DIR), _get_embeddings(), allow_dangerous_deserialization=True,
    )
    return _vs


def assert_distance_orientation(vs) -> None:
    """Fail fast at boot if lower score is not closer (ARCH §11 R3).

    The scope logic assumes minimum score = nearest. LangChain's cosine handling
    is version-dependent (an IP index would invert the sign), so verify a verse
    queried with its own text is its own nearest match.
    """
    doc = next(iter(vs.docstore._dict.values()))
    hits = vs.similarity_search_with_score(doc.page_content, k=1)
    if not hits or hits[0][0].metadata["id"] != doc.metadata["id"]:
        raise RuntimeError("FAISS distance orientation check failed — see ARCH §11 R3")


def _retrieve_sync(query: str, tags: list[str], k: int, min_candidates: int):
    def tag_overlap(meta: dict) -> bool:
        # Callable filter, not a dict filter: emotional_tags is a LIST in metadata
        # and FAISS's dict filter won't set-intersect it (it would match nothing).
        return bool(set(meta.get("emotional_tags", [])) & set(tags))

    # fetch_k = live corpus size forces the filter to run over the WHOLE corpus
    # (true filter-then-rank), not just the raw top-20 (ARCH §4.2).
    hits = _vs.similarity_search_with_score(
        query, k=k, filter=tag_overlap, fetch_k=_vs.index.ntotal,
    )

    # A mis-tag must not silently drop the best verse.
    if len(hits) < min_candidates:
        hits = _vs.similarity_search_with_score(query, k=k)

    # Score is squared-L2 on normalized vectors = 2·(1−cos) ∈ [0,4]; lower = closer.
    best = hits[0][1] if hits else float("inf")
    if best > config.SCOPE_THRESHOLD:
        return None  # out-of-scope: no forced verse
    return [doc for doc, _ in hits]


async def retrieve(query: str, tags: list[str], k: int | None = None,
                   min_candidates: int | None = None):
    """Top-k verses for the query, or None when out of scope."""
    return await run_in_threadpool(
        _retrieve_sync, query, tags,
        k if k is not None else config.K,
        min_candidates if min_candidates is not None else config.MIN_CANDIDATES,
    )
