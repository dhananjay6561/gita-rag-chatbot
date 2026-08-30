from app import safety


def _result(**kw):
    base = dict(crisis=False, tier="none", emotional_tags=[], life_situation=None, intensity="low")
    base.update(kw)
    return safety.SafetyResult(**base)


def test_tripwire_fires_on_explicit_phrases():
    assert safety.regex_tripwire("I want to kill myself")
    assert safety.regex_tripwire("been thinking about ending it all")
    assert safety.regex_tripwire("I want to die")


def test_tripwire_ignores_benign_wording():
    assert not safety.regex_tripwire("this deadline is killing me")
    assert not safety.regex_tripwire("I'd die for a coffee right now")
    assert not safety.regex_tripwire("that workout destroyed me")


def test_floor_raises_but_never_creates_acute():
    out = safety.apply_floor(_result(), tripped=True)
    assert out.crisis and out.tier == "elevated"  # acute stays the LLM's call


def test_floor_never_lowers_llm_verdict():
    out = safety.apply_floor(_result(crisis=True, tier="acute", intensity="high"), tripped=False)
    assert out.crisis and out.tier == "acute"


def test_sanitize_drops_off_taxonomy_tags():
    out = safety._sanitize(_result(emotional_tags=["anxiety", "made_up"], life_situation="banana"))
    assert out.emotional_tags == ["anxiety"]
    assert out.life_situation is None
