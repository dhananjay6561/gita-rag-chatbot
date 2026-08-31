"""Embeddings factory — one place so index build and query use the SAME model
(skill: fix-consistent-embeddings). Provider is config-driven: OpenAI
(text-embedding-3-large, prod) or Ollama (local, free, no key).
"""
from __future__ import annotations

from app import config


def get_embeddings():
    if config.EMBEDDINGS_PROVIDER == "ollama":
        from langchain_ollama import OllamaEmbeddings  # lazy: optional provider dep
        return OllamaEmbeddings(model=config.OLLAMA_EMBED_MODEL,
                                base_url=config.OLLAMA_BASE_URL)
    from langchain_openai import OpenAIEmbeddings
    return OpenAIEmbeddings(model=config.EMBEDDING_MODEL)
