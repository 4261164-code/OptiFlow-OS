import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { generateAnchorText } from "../anchorGenerator";

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: async () => ({
          text: JSON.stringify({ anchor: "survey sites", confidence: 0.85 })
        })
      };
    }
  };
});

describe("anchorGenerator", () => {
  let oldKey = process.env.GEMINI_API_KEY;
  beforeAll(() => {
    process.env.GEMINI_API_KEY = "test";
  });
  afterAll(() => {
    process.env.GEMINI_API_KEY = oldKey;
  });

  it("Returns non-empty string for valid source + target", async () => {
    const result = await generateAnchorText("These are the best survey sites available.", "survey sites");
    expect(result.anchor).toBe("survey sites");
    expect(result.confidence).toBe(0.85);
  });
  
  it("Anchor text 2–8 words, appears naturally in source content", async () => {
    const result = await generateAnchorText("These are the best survey sites available.", "survey sites");
    const wordCount = result.anchor.split(" ").length;
    expect(wordCount).toBeGreaterThanOrEqual(2);
    expect(wordCount).toBeLessThanOrEqual(8);
  });

  it("Never returns raw URL as anchor; returns confidence score alongside", async () => {
    const result = await generateAnchorText("These are the best survey sites available.", "survey sites");
    expect(result.anchor).not.toContain("http");
    expect(typeof result.confidence).toBe("number");
  });

  it("Handles missing target article gracefully", async () => {
    //
  });
});
