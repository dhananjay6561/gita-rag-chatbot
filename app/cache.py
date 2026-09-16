"""Bounded caches for deterministic-input LLM/embedding calls (perf, not big-O).

The dominant per-request cost in this service is model latency + spend, not
algorithmic work. Two calls have stable, repeatable inputs — the safety
classification of a query string and the embedding of a query string — so
memoising them on the raw text cuts both latency and cost on repeat/near-repeat
traffic. Both caches are size-bounded (LRU eviction) so they can't grow without
limit — space stays O(maxsize), independent of unique-query volume.

Caching the safety classification is safe even on the crisis path: the regex
tripwire FLOOR is applied in `screen_and_classify`, OUTSIDE the cached
`classify` call, so it re-runs on every request regardless of a cache hit.
"""
from __future__ import annotations

from collections import OrderedDict
from typing import Awaitable, Callable, Hashable, TypeVar

_T = TypeVar("_T")


class AsyncLRU:
    """Minimal async-aware LRU. Caches resolved results (not coroutines — those
    are single-await). Bounded by `maxsize`; least-recently-used evicted first."""

    def __init__(self, maxsize: int = 512):
        self.maxsize = maxsize
        self._data: "OrderedDict[Hashable, object]" = OrderedDict()
        self.hits = 0
        self.misses = 0

    async def get_or_set(self, key: Hashable, factory: Callable[[], Awaitable[_T]]) -> _T:
        if key in self._data:
            self._data.move_to_end(key)
            self.hits += 1
            return self._data[key]  # type: ignore[return-value]
        self.misses += 1
        value = await factory()
        # Re-check: a concurrent miss for the same key may have populated it while
        # we awaited. Keep the first-writer's value to stay deterministic.
        if key in self._data:
            self._data.move_to_end(key)
            return self._data[key]  # type: ignore[return-value]
        self._data[key] = value
        self._data.move_to_end(key)
        while len(self._data) > self.maxsize:
            self._data.popitem(last=False)
        return value

    def clear(self) -> None:
        self._data.clear()
        self.hits = self.misses = 0
