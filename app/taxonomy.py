"""Closed tag vocabularies — v1 (mirror of TAXONOMY.md).

TAXONOMY.md is the human-facing source of truth; this module is the code
mirror the safety+classify call and the tagging script import so they can't
drift into free-text tags. Any change is a deliberate version bump in BOTH
places + a re-tag/re-embed (TAXONOMY.md §Version).
"""
from __future__ import annotations

VERSION = "v1"

EMOTIONAL_TAGS = (
    "anxiety", "fear", "anger", "resentment", "grief", "sadness", "guilt",
    "shame", "overwhelm", "restlessness", "hopelessness", "loneliness",
    "jealousy", "attachment", "confusion", "self-doubt", "frustration",
    "apathy", "craving", "pride",
)

LIFE_SITUATIONS = (
    "career pressure", "exam/study stress", "relationship conflict",
    "breakup/divorce", "family conflict", "grief/bereavement", "health/illness",
    "financial worry", "decision paralysis", "failure/setback",
    "burnout/loss of motivation", "moral dilemma", "social comparison",
    "major life transition", "caregiving strain",
)
