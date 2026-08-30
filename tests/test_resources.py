from app import resources


def test_us_locale():
    assert resources.for_locale("en-US")[0]["contact"] == "Call or text 988"


def test_uk_locale_variants():
    assert resources.for_locale("en-GB")[0]["name"] == "Samaritans"
    assert resources.for_locale("en_GB")[0]["name"] == "Samaritans"


def test_unknown_and_none_fall_back():
    assert resources.for_locale(None)[0]["region"] == "international"
    assert resources.for_locale("fr-FR")[0]["region"] == "international"
    assert resources.for_locale("en")[0]["region"] == "international"
