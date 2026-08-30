from app import config, retrieval


class Doc:
    def __init__(self, vid, tags):
        self.metadata = {"id": vid, "emotional_tags": tags}
        self.page_content = ""


class FakeIndex:
    def __init__(self, n):
        self.ntotal = n


class FakeVS:
    """Minimal FAISS stand-in: applies the callable filter, then trims to k."""

    def __init__(self, corpus):  # corpus: list of (Doc, score), closest first
        self.corpus = corpus
        self.index = FakeIndex(len(corpus))
        self.calls = []

    def similarity_search_with_score(self, query, k, filter=None, fetch_k=None):
        self.calls.append({"filtered": filter is not None, "fetch_k": fetch_k})
        items = self.corpus
        if filter is not None:
            items = [(d, s) for d, s in items if filter(d.metadata)]
        return items[:k]


def _ids(docs):
    return [d.metadata["id"] for d in docs]


def test_tag_overlap_filters_by_list_intersection(monkeypatch):
    corpus = [(Doc("2.47", ["anxiety"]), 0.2), (Doc("2.48", ["anxiety"]), 0.3),
              (Doc("9.22", ["fear"]), 0.4)]
    monkeypatch.setattr(retrieval, "_vs", FakeVS(corpus))
    monkeypatch.setattr(config, "SCOPE_THRESHOLD", 1.0)
    out = retrieval._retrieve_sync("q", ["anxiety"], k=4, min_candidates=1)
    assert _ids(out) == ["2.47", "2.48"]  # only anxiety-tagged verses


def test_fallback_to_full_corpus_when_too_few(monkeypatch):
    corpus = [(Doc("2.47", ["anxiety"]), 0.2), (Doc("9.22", ["fear"]), 0.3),
              (Doc("2.20", ["grief"]), 0.4)]
    vs = FakeVS(corpus)
    monkeypatch.setattr(retrieval, "_vs", vs)
    monkeypatch.setattr(config, "SCOPE_THRESHOLD", 1.0)
    out = retrieval._retrieve_sync("q", ["anxiety"], k=4, min_candidates=3)
    assert _ids(out) == ["2.47", "9.22", "2.20"]  # mis-tag degraded to full corpus
    assert vs.calls[0]["filtered"] and not vs.calls[1]["filtered"]
    assert vs.calls[0]["fetch_k"] == vs.index.ntotal  # filter runs over whole corpus


def test_out_of_scope_returns_none(monkeypatch):
    corpus = [(Doc("2.47", ["anxiety"]), 3.0)]  # best distance beyond threshold
    monkeypatch.setattr(retrieval, "_vs", FakeVS(corpus))
    monkeypatch.setattr(config, "SCOPE_THRESHOLD", 1.0)
    assert retrieval._retrieve_sync("q", ["anxiety"], k=4, min_candidates=1) is None
