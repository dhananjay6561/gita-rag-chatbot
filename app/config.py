"""Model IDs, thresholds, and env-sourced secrets (ARCH §7, §9).

Secrets come from the environment / platform secret manager — never hardcoded,
never committed (PLAN §9). Load a local .env in dev only.
"""
from __future__ import annotations

import os

# --- Models (Decisions Log, locked) -----------------------------------------
GENERATION_MODEL = "claude-opus-4-8"     # Krishna persona; adaptive thinking, no temperature
SAFETY_MODEL = "claude-haiku-4-5"        # merged safety-screen + classifier (one call)
EMBEDDING_MODEL = "text-embedding-3-large"  # 3072-dim; same at index + query

# Embeddings provider: "openai" (prod, text-embedding-3-large) or "ollama"
# (local, free, no key). Switching providers changes the vector space, so rebuild
# the index AND recalibrate SCOPE_THRESHOLD (see build_index / ARCH §4.2).
EMBEDDINGS_PROVIDER = os.getenv("EMBEDDINGS_PROVIDER", "openai")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# --- Retrieval thresholds (GATING — calibrate in G1, ARCH §8) ---------------
SCOPE_THRESHOLD = float(os.getenv("SCOPE_THRESHOLD", "1.0"))  # placeholder; tune on eval set
K = int(os.getenv("RETRIEVE_K", "4"))
MIN_CANDIDATES = int(os.getenv("MIN_CANDIDATES", "3"))        # below this → full-corpus fallback

# --- Serving limits (PLAN §9, ARCH §8) --------------------------------------
REQUEST_TIMEOUT_S = float(os.getenv("REQUEST_TIMEOUT_S", "30"))  # bounded per-query deadline
RATE_LIMIT_MAX = int(os.getenv("RATE_LIMIT_MAX", "20"))          # requests per window, per client
RATE_LIMIT_WINDOW_S = float(os.getenv("RATE_LIMIT_WINDOW_S", "60"))

# Comma-separated frontend origins for CORS; empty = same-origin only (safe default).
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]

# --- Secrets (presence checked at startup, values never logged) -------------
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def require_secrets() -> None:
    """Fail fast at boot if a required key is missing (never log the values).

    OPENAI_API_KEY is only needed for the OpenAI embeddings provider — the local
    Ollama provider needs no key.
    """
    required = [("ANTHROPIC_API_KEY", ANTHROPIC_API_KEY)]
    if EMBEDDINGS_PROVIDER == "openai":
        required.append(("OPENAI_API_KEY", OPENAI_API_KEY))
    missing = [name for name, val in required if not val]
    if missing:
        raise RuntimeError(f"missing required secrets: {', '.join(missing)}")
