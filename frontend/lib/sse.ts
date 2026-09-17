/**
 * Minimal Server-Sent Events parser for a fetch response body. EventSource only
 * speaks GET, but /ask/stream is a POST with a JSON body, so we read the stream
 * ourselves. Spec-aligned enough for our frames: CRLF normalised, frames split
 * on a blank line, `event:` and (possibly multiple) `data:` fields, `:` comment
 * lines and leading-space trimming honored.
 */
export type SSEEvent = { event: string; data: string };

function parseFrame(raw: string): SSEEvent | null {
  let event = "message";
  const data: string[] = [];
  for (const line of raw.split("\n")) {
    if (line === "" || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
  }
  return data.length === 0 ? null : { event, data: data.join("\n") };
}

export async function* parseSSE(
  stream: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncGenerator<SSEEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      if (signal?.aborted) return;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const frame = parseFrame(buffer.slice(0, sep));
        buffer = buffer.slice(sep + 2);
        if (frame) yield frame;
      }
    }
    // Flush a trailing frame that arrived without a final blank line.
    const tail = parseFrame(buffer);
    if (tail) yield tail;
  } finally {
    reader.releaseLock();
  }
}

/** Exposed for unit testing the frame grammar in isolation. */
export const __parseFrame = parseFrame;
