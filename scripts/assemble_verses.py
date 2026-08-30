"""Assemble the raw verse corpus: Sanskrit + transliteration + a PD translation.

Pulls the Devanagari text and transliteration (ancient, public-domain source
text) plus a chosen English translation from the open `gita/gita` dataset (MIT),
and writes `data/verses_raw.jsonl` — the pre-tagging corpus that `tag_verses.py`
then annotates. Numbering follows the 701-verse convention (chapter 13 includes
its invocatory verse); ids are `chapter.verse`, contiguous per chapter.

    python -m scripts.assemble_verses --author "Shri Purohit Swami"

NOTE (translation source): the locked doc choice is Kisari Mohan Ganguli, which
is not available verse-aligned in this dataset. Purohit Swami (1935) is the only
complete, verse-numbered PD option here — PD in UK/EU; US status pending review.
Swap with --author once the source decision is confirmed.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import requests

BASE = "https://raw.githubusercontent.com/gita/gita/main/data/"
OUT = Path(__file__).resolve().parent.parent / "data" / "verses_raw.jsonl"

SANSKRIT_SOURCE = "Devanagari (PD source text) via gita/gita dataset (MIT)"
_TRANSLATION_SOURCE = {
    "Shri Purohit Swami": "Shri Purohit Swami, 1935 (PD in UK/EU; verify US status)",
}


def _fetch(name: str):
    r = requests.get(BASE + name, timeout=90)
    r.raise_for_status()
    return r.json()


def _clean(text: str) -> str:
    """Trim and collapse the blank-line padding in the dataset's text fields."""
    return re.sub(r"\n{2,}", "\n", text.strip())


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--author", default="Shri Purohit Swami")
    ap.add_argument("--out", default=str(OUT))
    args = ap.parse_args()

    verses = _fetch("verse.json")
    translations = _fetch("translation.json")

    tx = {
        t["verse_id"]: t["description"].strip()
        for t in translations
        if t.get("lang") == "english" and t["authorName"] == args.author
    }
    if not tx:
        raise SystemExit(f"no English translation found for author {args.author!r}")

    records = []
    for v in verses:
        vid = v["id"]
        if vid not in tx:
            raise SystemExit(f"verse {v['chapter_number']}.{v['verse_number']} missing translation")
        records.append({
            "id": f"{v['chapter_number']}.{v['verse_number']}",
            "chapter": v["chapter_number"],
            "verse": v["verse_number"],
            "sanskrit": _clean(v["text"]),
            "transliteration": _clean(v["transliteration"]),
            "translation": tx[vid],
            "translation_source": _TRANSLATION_SOURCE.get(args.author, args.author),
            "sanskrit_source": SANSKRIT_SOURCE,
        })

    records.sort(key=lambda r: (r["chapter"], r["verse"]))
    Path(args.out).write_text(
        "\n".join(json.dumps(r, ensure_ascii=False) for r in records) + "\n"
    )
    print(f"assembled {len(records)} verses → {args.out}  (translation: {args.author})")


if __name__ == "__main__":
    main()
