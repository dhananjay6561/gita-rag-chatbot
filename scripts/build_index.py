"""Build the FAISS index from data/verses.jsonl (ARCH §3).

One Document per verse — NO text splitting: verses are atomic knowledge units,
and splitting would fragment a verse across chunks and break the "one citation =
one whole verse" grounding guarantee. Re-run whenever verses.jsonl is corrected.

    python -m scripts.build_index
"""
from __future__ import annotations

import json
from pathlib import Path

from langchain_community.vectorstores import FAISS
from langchain_community.vectorstores.utils import DistanceStrategy
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings

from app import config

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "verses.jsonl"
OUT = ROOT / "index" / "faiss_gita"


def _composite(v: dict) -> str:
    """Embedding string: explanation + tags, NOT raw Sanskrit (poor semantic
    match to English queries). Sanskrit/translation live in metadata (ARCH §3)."""
    return " ".join([
        v["plain_explanation"],
        " ".join(v["themes"]),
        " ".join(v["life_situations"]),
        " ".join(v["emotional_tags"]),
    ])


def _load_docs() -> list[Document]:
    docs = []
    for line in DATA.read_text().splitlines():
        if not line.strip():
            continue
        v = json.loads(line)
        docs.append(Document(page_content=_composite(v), metadata=v))
    return docs


def main() -> None:
    docs = _load_docs()
    embeddings = OpenAIEmbeddings(model=config.EMBEDDING_MODEL)  # 3072-dim
    # COSINE (not the default L2) → bounded, interpretable distance for the scope
    # threshold. The SAME strategy must be used at query time (retrieval.py).
    vs = FAISS.from_documents(docs, embeddings, distance_strategy=DistanceStrategy.COSINE)
    OUT.parent.mkdir(exist_ok=True)
    vs.save_local(str(OUT))
    print(f"indexed {len(docs)} verses → {OUT}")


if __name__ == "__main__":
    main()
