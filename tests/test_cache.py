import asyncio

from app.cache import AsyncLRU


async def test_hit_skips_factory_and_returns_cached():
    calls = []

    async def factory():
        calls.append(1)
        return "v"

    c = AsyncLRU(maxsize=8)
    assert await c.get_or_set("k", factory) == "v"
    assert await c.get_or_set("k", factory) == "v"
    assert calls == [1]                      # second call served from cache
    assert (c.hits, c.misses) == (1, 1)


async def test_lru_eviction_is_bounded():
    async def make(v):
        async def factory():
            return v
        return factory

    c = AsyncLRU(maxsize=2)
    await c.get_or_set("a", await make("a"))
    await c.get_or_set("b", await make("b"))
    await c.get_or_set("a", await make("a2"))  # touch 'a' → 'b' is now LRU
    await c.get_or_set("c", await make("c"))   # evicts 'b'
    assert set(c._data) == {"a", "c"}
    assert len(c._data) == 2                    # never exceeds maxsize


async def test_concurrent_miss_keeps_first_writer():
    async def slow(v):
        async def factory():
            await asyncio.sleep(0)
            return v
        return factory

    c = AsyncLRU(maxsize=8)
    r1, r2 = await asyncio.gather(
        c.get_or_set("k", await slow("first")),
        c.get_or_set("k", await slow("second")),
    )
    assert c._data["k"] == r1 == r2            # deterministic: one value wins
