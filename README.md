# Gita RAG Chatbot

Life guidance grounded in the Bhagavad Gita via retrieval-augmented generation.
A seeker describes a problem; the system retrieves the most relevant verses and
generates a compassionate, **grounded** response — every citation is traceable to
a real retrieved verse. No hallucinated shlokas.

See `docs/` for the full design: `PROJECT_PLAN.md`, `ARCHITECTURE.md`,
`EVAL_SPEC.md`, `TAXONOMY.md`.

## Pipeline

```
query → safety+classify (Haiku) → retrieve (FAISS, tag pre-filter)
      → scope check → generate (Opus, Krishna persona) → grounding guardrail → response
```

## Layout

```
app/        config, taxonomy, safety, resources, retrieval, generation, main (FastAPI /ask)
scripts/    build_index.py (FAISS from data/), tag_verses.py (taxonomy-constrained)
data/       verses.jsonl (corpus; 18-verse seed at MVP — see data/README.md)
eval/       golden_retrieval.jsonl (G1), safety_set.jsonl (G2), run.py, run_safety.py
tests/      unit tests for the pieces vanilla RAG lacks (guardrail, filter, scope, safety)
frontend/   Next.js chat UI (App Router, Tailwind v4); shares the API contract via a Zod SSOT
```

## Setup

```bash
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env        # add ANTHROPIC_API_KEY + OPENAI_API_KEY
```

## Run

```bash
python -m scripts.build_index          # build FAISS index from data/verses.jsonl
uvicorn app.main:app --reload          # serve the API
pytest -q                              # unit tests (no API keys needed)
```

Endpoints: `POST /ask` (JSON), `POST /ask/stream` (SSE for the chat UI), `GET /health`.
Serving is hardened: per-client rate limiting, per-request deadline, startup secret
validation, graceful errors (no stack traces), and per-request metrics logging.

No keys handy? See the keyless local demos in `scripts/demo_*_local.py`.

## Frontend

A Next.js chat UI lives in `frontend/`. It talks to this API through server-side
proxy routes and validates every response against a Zod contract that mirrors
`/ask` and `/health`. See `frontend/README.md` for setup and deploy.

```bash
cd frontend
pnpm install
cp .env.example .env.local     # set BACKEND_URL to this API
pnpm dev
```

## Eval gates (need API keys)

```bash
python -m eval.run_safety              # G2: crisis recall ≥ 0.95, acute recall = 1.0
python -m eval.run --scope-threshold 1.0   # G1: recall@k ≥ 0.85, sweep to calibrate
```

## Status

Code layer complete and unit-tested. Data is an 18-verse **seed**; the ~700-verse
launch corpus (verbatim Ganguli PD + Devanagari) is still to be sourced. G1/G2 run
once API keys are set.
