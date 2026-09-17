from app import resources


def test_us_locale():
    assert resources.for_locale("en-US")[0]["contact"] == "Call or text 988"


def test_uk_locale_variants():
    assert resources.for_locale("en-GB")[0]["name"] == "Samaritans"
    assert resources.for_locale("en_GB")[0]["name"] == "Samaritans"


def test_english_and_none_resolve_to_default_region():
    # UK-audience deployment: bare "en" / no locale get a real UK helpline,
    # not the generic international page (config.DEFAULT_CRISIS_REGION).
    assert resources.for_locale(None)[0]["name"] == "Samaritans"
    assert resources.for_locale("en")[0]["name"] == "Samaritans"


def test_non_english_unknown_region_falls_back():
    # A locale we can't place and isn't English keeps the localized international
    # page rather than an English-only line.
    assert resources.for_locale("fr-FR")[0]["region"] == "international"


def test_default_region_is_configurable(monkeypatch):
    monkeypatch.setattr(resources.config, "DEFAULT_CRISIS_REGION", "US")
    assert resources.for_locale("en")[0]["region"] == "US"
    monkeypatch.setattr(resources.config, "DEFAULT_CRISIS_REGION", "")
    assert resources.for_locale("en")[0]["region"] == "international"
