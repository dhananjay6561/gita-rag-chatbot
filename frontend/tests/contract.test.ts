import { describe, it, expect } from "vitest";

import {
  AskRequestSchema,
  AskResponseSchema,
  HealthSchema,
  StreamDoneSchema,
} from "@/lib/contract";

describe("AskRequestSchema", () => {
  it("defaults mode to guidance", () => {
    const parsed = AskRequestSchema.parse({ query: "hello" });
    expect(parsed.mode).toBe("guidance");
  });

  it("rejects an empty query", () => {
    expect(AskRequestSchema.safeParse({ query: "" }).success).toBe(false);
  });

  it("rejects a query over the 2000 char cap", () => {
    expect(AskRequestSchema.safeParse({ query: "x".repeat(2001) }).success).toBe(
      false,
    );
  });

  it("rejects an unknown mode", () => {
    expect(
      AskRequestSchema.safeParse({ query: "hi", mode: "poem" }).success,
    ).toBe(false);
  });
});

function omit<T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const clone = { ...obj };
  delete clone[key];
  return clone;
}

const VALID_RESPONSE = {
  reply: "Act with care, then release the outcome. [2.47]",
  verse_refs: ["2.47"],
  verses: [
    {
      id: "2.47",
      sanskrit: "कर्मण्येवाधिकारस्ते",
      transliteration: "karmany evadhikaras te",
      translation: "Your right is to action alone.",
      translation_source: "Ganguli",
      sanskrit_source: "GRETIL",
    },
  ],
  crisis_resources: null,
  out_of_scope: false,
  disclaimer: "AI representation of Gita concepts.",
};

describe("AskResponseSchema", () => {
  it("accepts a well-formed response", () => {
    expect(AskResponseSchema.parse(VALID_RESPONSE)).toMatchObject({
      out_of_scope: false,
    });
  });

  it("accepts null verses and crisis_resources", () => {
    const parsed = AskResponseSchema.parse({
      ...VALID_RESPONSE,
      verses: null,
      crisis_resources: null,
    });
    expect(parsed.verses).toBeNull();
  });

  it("rejects a response missing a required field", () => {
    const rest = omit(VALID_RESPONSE, "out_of_scope");
    expect(AskResponseSchema.safeParse(rest).success).toBe(false);
  });
});

describe("StreamDoneSchema", () => {
  it("is AskResponse without reply", () => {
    const meta = omit(VALID_RESPONSE, "reply");
    expect(StreamDoneSchema.safeParse(meta).success).toBe(true);
    // reply is not part of the done frame, but extra keys are stripped, not rejected
    expect("reply" in StreamDoneSchema.parse(meta)).toBe(false);
  });
});

describe("HealthSchema", () => {
  it("accepts a ready payload", () => {
    expect(
      HealthSchema.parse({ status: "ok", index_loaded: true, corpus_size: 18 }),
    ).toMatchObject({ index_loaded: true });
  });

  it("rejects a negative corpus size", () => {
    expect(
      HealthSchema.safeParse({
        status: "ok",
        index_loaded: true,
        corpus_size: -1,
      }).success,
    ).toBe(false);
  });
});
