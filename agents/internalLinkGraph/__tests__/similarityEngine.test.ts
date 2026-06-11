import { describe, it, expect } from "vitest";
import { computeSimilarity } from "../similarityEngine";

describe("similarityEngine", () => {
  it("Returns score 0.0–1.0 for any two articles", () => {
    const score = computeSimilarity("foo", "bar");
    expect(score).toBeGreaterThanOrEqual(0.0);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it("Returns 0.0 for empty strings; 1.0 for identical content", () => {
    expect(computeSimilarity("", "")).toBe(0.0);
    expect(computeSimilarity("identical text", "identical text")).toBe(1.0);
  });

  it("Score < 0.3 for completely unrelated content", () => {
    const score = computeSimilarity("this is about cats and kittens", "understanding quantum physics and black holes");
    expect(score).toBeLessThan(0.3);
  });

  it("Throws on null/undefined input; handles stopwords-only articles", () => {
    expect(() => computeSimilarity(null as any, "text")).toThrow();
    expect(computeSimilarity("the and or", "but so if")).toBe(0.0);
  });
});
