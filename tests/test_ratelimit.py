from app.ratelimit import RateLimiter


def test_allows_up_to_limit_then_blocks():
    rl = RateLimiter(max_requests=3, window_s=60)
    assert [rl.allow("ip", now=0) for _ in range(3)] == [True, True, True]
    assert rl.allow("ip", now=0) is False


def test_window_slides_and_frees_capacity():
    rl = RateLimiter(max_requests=2, window_s=10)
    assert rl.allow("ip", now=0) and rl.allow("ip", now=1)
    assert rl.allow("ip", now=5) is False       # still inside the window
    assert rl.allow("ip", now=12) is True        # first two aged out


def test_clients_are_isolated():
    rl = RateLimiter(max_requests=1, window_s=60)
    assert rl.allow("a", now=0) is True
    assert rl.allow("b", now=0) is True
    assert rl.allow("a", now=0) is False


def test_reused_client_window_does_not_grow_unbounded():
    # An expired hit must be pruned, not accumulated — a repeat client stays O(1).
    rl = RateLimiter(max_requests=1, window_s=10)
    assert rl.allow("a", now=0) is True
    assert rl.allow("a", now=1) is False   # blocked, still in window
    assert rl.allow("a", now=20) is True   # window passed, allowed again
    assert len(rl._hits["a"]) == 1         # old hit dropped, not stacked


def test_sweep_reclaims_idle_clients():
    # sweep_every=3 → the 3rd call triggers a GC pass before it's recorded.
    rl = RateLimiter(max_requests=5, window_s=10, sweep_every=3)
    rl.allow("a", now=0)
    rl.allow("b", now=1)
    rl.allow("c", now=100)                  # a and b are long expired here
    assert set(rl._hits) == {"c"}           # idle keys reclaimed, map bounded
