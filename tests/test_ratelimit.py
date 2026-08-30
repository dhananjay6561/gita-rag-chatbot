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
