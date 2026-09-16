"""Embeddings factory — one place so index build and query use the SAME model
(skill: fix-consistent-embeddings). Provider is config-driven: OpenAI
(text-embedding-3-large, prod) or Ollama (local, free, no key).
"""
from __future__ import annotations

import functools

from app import config


class _QueryCachedEmbeddings:
    """Delegates to the underlying embeddings, memoising embed_query on the raw
    text. Query embeddings are deterministic for a fixed model, so caching is
    exact and safe; a repeated query skips the embedding API call entirely
    (perf, not big-O). Size-bounded → space stays O(maxsize). embed_documents is
    passed straight through (index build runs once, offline, uncached).

    A wrapper rather than a monkeypatch because LangChain embeddings are pydantic
    models that reject arbitrary attribute assignment."""

    def __init__(self, emb, maxsize: int):
        self._emb = emb
        self.embed_query = functools.lru_cache(maxsize=maxsize)(emb.embed_query)

    def embed_documents(self, texts):
        return self._emb.embed_documents(texts)

    def __getattr__(self, name):  # forward anything else (e.g. async variants)
        return getattr(self._emb, name)


def _with_query_cache(emb, maxsize: int):
    return emb if maxsize <= 0 else _QueryCachedEmbeddings(emb, maxsize)


def get_embeddings():
    if config.EMBEDDINGS_PROVIDER == "ollama":
        from langchain_ollama import OllamaEmbeddings  # lazy: optional provider dep
        emb = OllamaEmbeddings(model=config.OLLAMA_EMBED_MODEL,
                               base_url=config.OLLAMA_BASE_URL)
    else:
        from langchain_openai import OpenAIEmbeddings
        emb = OpenAIEmbeddings(model=config.EMBEDDING_MODEL)
    return _with_query_cache(emb, config.EMBED_CACHE_SIZE)
