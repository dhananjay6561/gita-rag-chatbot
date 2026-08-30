from app import generation

ALL_IDS = {"2.47", "2.48", "9.22", "2.62"}


class Doc:
    def __init__(self, vid):
        self.metadata = {"id": vid}
        self.page_content = ""


def test_cited_ids_bracketed_and_grouped():
    assert generation._cited_ids("as [2.47] teaches", ALL_IDS) == {"2.47"}
    assert generation._cited_ids("see [2.47, 2.48]", ALL_IDS) == {"2.47", "2.48"}


def test_cited_ids_catches_bare_real_refs():
    assert generation._cited_ids("verse 9.22 reassures you", ALL_IDS) == {"9.22"}


def test_cited_ids_ignores_non_verse_decimals():
    # $2.99 and step 3.1 are not real verse ids, so they must not count.
    assert generation._cited_ids("it costs $2.99 and see step 3.1", ALL_IDS) == set()


def test_text_handles_string_and_thinking_blocks():
    assert generation._text("hello") == "hello"
    blocks = [
        {"type": "thinking", "thinking": "..."},
        {"type": "text", "text": "hello"},
        {"type": "text", "text": " world"},
    ]
    assert generation._text(blocks) == "hello world"


async def test_grounding_passes_clean_response():
    async def regen(_):
        raise AssertionError("should not regenerate a clean response")

    reply, refs = await generation.enforce_grounding(
        "Consider [2.47] here.", [Doc("2.47"), Doc("2.48")], ALL_IDS, regen)
    assert reply == "Consider [2.47] here." and refs == ["2.47"]


async def test_grounding_regenerates_and_names_offender():
    calls = []

    async def regen(correction):
        calls.append(correction)
        return "Only [2.47] now."

    reply, refs = await generation.enforce_grounding(
        "Bad [9.22] cite.", [Doc("2.47")], ALL_IDS, regen)
    assert refs == ["2.47"]
    assert "9.22" in calls[0]  # R1: offender named so the retry changes the input


async def test_grounding_falls_back_when_retries_exhausted():
    async def regen(_):
        return "still cites [9.22]"

    reply, refs = await generation.enforce_grounding(
        "bad [9.22]", [Doc("2.47")], ALL_IDS, regen, max_retries=1)
    assert reply == generation.SAFE_FALLBACK and refs == []
