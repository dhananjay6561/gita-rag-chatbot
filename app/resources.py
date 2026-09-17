"""Crisis resources, locale-selected (PLAN Decisions Log, ARCH §11).

Attached alongside the normal guidance when the safety screen flags distress —
not a hard stop. US/UK specific. When the locale carries no usable region we
resolve to config.DEFAULT_CRISIS_REGION (UK for this deployment) so a distressed
UK user on a bare "en" browser still gets a real helpline, not the generic
international page; only when that default is unset do we fall back.
"""
from __future__ import annotations

from app import config

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


def _parts(locale: str | None) -> tuple[str | None, str | None]:
    """Split a BCP-47 locale like 'en-US' / 'en_GB' into (language, region)."""
    if not locale:
        return None, None
    bits = locale.replace("_", "-").split("-")
    lang = bits[0].lower() or None
    region = bits[1].upper() if len(bits) > 1 else None
    return lang, region


_BY_REGION = {"US": _US, "GB": _UK, "UK": _UK}


def for_locale(locale: str | None) -> list[dict]:
    """Resources for the caller's locale.

    A stocked region wins outright. Otherwise, English or an absent locale
    resolves to config.DEFAULT_CRISIS_REGION (UK here) so a distressed UK user
    on a bare "en" browser still gets a helpline; a non-English locale we can't
    place (e.g. fr-FR) gets the localized international page instead of an
    English-only line.
    """
    lang, region = _parts(locale)
    if region in _BY_REGION:
        return _BY_REGION[region]
    if lang in (None, "en"):
        return _BY_REGION.get(config.DEFAULT_CRISIS_REGION, _FALLBACK)
    return _FALLBACK
