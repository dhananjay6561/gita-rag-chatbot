"""In-memory per-client rate limiter (PLAN §9).

Sliding-window counter keyed by client id (IP/session). Process-local — adequate
for a single managed backend at MVP; swap for a shared store (Redis) if the
service scales horizontally. `now` is passed in (monotonic seconds) so the window
logic is deterministic and unit-testable.

Space is bounded by the set of *currently active* clients, not the all-time set:
a fully-expired client is dropped on next touch, and a periodic sweep reclaims
idle clients that never return — otherwise a stream of distinct IPs (organic
churn or a spoofed-source flood) would grow `_hits` without limit.
"""
from __future__ import annotations

from collections import deque


class RateLimiter:
    def __init__(self, max_requests: int, window_s: float, sweep_every: int = 1024):
        self.max = max_requests
        self.window = window_s
        self._hits: dict[str, deque] = {}
        # Amortised GC: sweep all keys once every `sweep_every` calls so idle
        # clients that never come back can't accumulate. O(clients) per sweep,
        # O(1) amortised per request.
        self._sweep_every = sweep_every
        self._ops = 0

    def allow(self, key: str, now: float) -> bool:
        """Record a hit and return False if the client is over the window limit."""
        self._ops += 1
        if self._ops >= self._sweep_every:
            self._sweep(now)
            self._ops = 0

        cutoff = now - self.window
        q = self._hits.get(key)
        if q is None:
            q = deque()

        while q and q[0] <= cutoff:
            q.popleft()

        if len(q) >= self.max:
            self._hits[key] = q  # still active (throttled) — keep the pruned window
            return False

        q.append(now)
        self._hits[key] = q
        return True

    def _sweep(self, now: float) -> None:
        """Drop clients whose entire window has expired (their most recent hit
        is older than the window). Reclaims idle keys the per-request path never
        revisits."""
        cutoff = now - self.window
        stale = [k for k, q in self._hits.items() if not q or q[-1] <= cutoff]
        for k in stale:
            del self._hits[k]
