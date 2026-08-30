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

# --- Retrieval thresholds (GATING — calibrate in G1, ARCH §8) ---------------
SCOPE_THRESHOLD = float(os.getenv("SCOPE_THRESHOLD", "1.0"))  # placeholder; tune on eval set
K = int(os.getenv("RETRIEVE_K", "4"))
MIN_CANDIDATES = int(os.getenv("MIN_CANDIDATES", "3"))        # below this → full-corpus fallback

# --- Secrets (presence checked at startup, values never logged) -------------
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
