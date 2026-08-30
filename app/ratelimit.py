"""In-memory per-client rate limiter (PLAN §9).

Sliding-window counter keyed by client id (IP/session). Process-local — adequate
for a single managed backend at MVP; swap for a shared store (Redis) if the
service scales horizontally. `now` is passed in (monotonic seconds) so the window
logic is deterministic and unit-testable.
"""
from __future__ import annotations

from collections import defaultdict, deque


class RateLimiter:
    def __init__(self, max_requests: int, window_s: float):
        self.max = max_requests
        self.window = window_s
        self._hits: dict[str, deque] = defaultdict(deque)

    def allow(self, key: str, now: float) -> bool:
        """Record a hit and return False if the client is over the window limit."""
        q = self._hits[key]
        cutoff = now - self.window
        while q and q[0] <= cutoff:
            q.popleft()
        if len(q) >= self.max:
            if not q:
                del self._hits[key]  # keep the map from growing unbounded
            return False
        q.append(now)
        return True
