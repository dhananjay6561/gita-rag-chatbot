import { describe, it, expect } from "vitest";

import { parseSSE, __parseFrame } from "@/lib/sse";

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(enc.encode(chunk));
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>) {
  const events = [];
  for await (const ev of parseSSE(stream)) events.push(ev);
  return events;
}

describe("parseSSE", () => {
  it("reassembles frames split across chunk boundaries", async () => {
    const events = await collect(
      streamOf(['data: {"tok', 'en":"hi"}\n\n', 'event: done\ndata: {"x":1}\n\n']),
    );
    expect(events).toEqual([
      { event: "message", data: '{"token":"hi"}' },
      { event: "done", data: '{"x":1}' },
    ]);
  });

  it("handles CRLF line endings", async () => {
    const events = await collect(streamOf(['data: {"token":"a"}\r\n\r\n']));
    expect(events).toEqual([{ event: "message", data: '{"token":"a"}' }]);
  });

  it("flushes a trailing frame with no final blank line", async () => {
    const events = await collect(streamOf(["event: error\ndata: oops"]));
    expect(events).toEqual([{ event: "error", data: "oops" }]);
  });
});

describe("__parseFrame", () => {
  it("joins multiple data lines with a newline", () => {
    expect(__parseFrame("data: line1\ndata: line2")).toEqual({
      event: "message",
      data: "line1\nline2",
    });
  });

  it("ignores comment lines and trims one leading space", () => {
    expect(__parseFrame(":keep-alive\ndata:  x")).toEqual({
      event: "message",
      data: " x",
    });
  });

  it("returns null for a frame with no data", () => {
    expect(__parseFrame("event: ping")).toBeNull();
  });
});
