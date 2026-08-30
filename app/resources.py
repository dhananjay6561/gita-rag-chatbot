"""Crisis resources, locale-selected (PLAN Decisions Log, ARCH §11).

Attached alongside the normal guidance when the safety screen flags distress —
not a hard stop. US/UK specific, international fallback when locale is unknown.
"""
from __future__ import annotations

_US = [
    {"name": "988 Suicide & Crisis Lifeline", "contact": "Call or text 988",
     "region": "US"},
    {"name": "Crisis Text Line", "contact": "Text HOME to 741741", "region": "US"},
]

_UK = [
    {"name": "Samaritans", "contact": "Call 116 123", "region": "UK"},
    {"name": "Crisis Text Line", "contact": "Text SHOUT to 85258", "region": "UK"},
]

_FALLBACK = [
    {"name": "Find A Helpline", "contact": "https://findahelpline.com",
     "region": "international"},
]


def _region(locale: str | None) -> str | None:
    """Pull an ISO region from a BCP-47 locale like 'en-US' / 'en_GB'."""
    if not locale:
        return None
    parts = locale.replace("_", "-").split("-")
    return parts[1].upper() if len(parts) > 1 else None


def for_locale(locale: str | None) -> list[dict]:
    """Resources for the caller's locale; international fallback when unknown."""
    region = _region(locale)
    if region == "US":
        return _US
    if region in ("GB", "UK"):
        return _UK
    return _FALLBACK
