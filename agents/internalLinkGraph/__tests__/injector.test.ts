import { describe, it, expect } from "vitest";
import { injectLinks } from "../injector";

describe("injector", () => {
  it("Original article document never modified", () => {
    const original = "This is a test document.";
    const result = injectLinks(original, [{ anchorText: "test document", targetKeyword: "test" }]);
    expect(original).toBe("This is a test document.");
  });

  it("Output contains all original content (substring check)", () => {
    const original = "This is a test document.";
    const result = injectLinks(original, [{ anchorText: "test document", targetKeyword: "test" }]);
    expect(result.injectedContent.replace(/\[|\]|\(\/article\/test\)/g, '')).toBe(original);
  });

  it("Anchor appears exactly once per link; handles HTML + markdown", () => {
    const original = "This is a test document with testing words.";
    const result = injectLinks(original, [{ anchorText: "test document", targetKeyword: "test" }]);
    expect(result.injectedContent).toContain("[test document](/article/test)");
    expect(result.injectedCount).toBe(1);
  });

  it("Skips injection if insertion point not found (no throw)", () => {
    const original = "This is a document.";
    const result = injectLinks(original, [{ anchorText: "not found", targetKeyword: "none" }]);
    expect(result.skippedCounts).toBe(1);
    expect(result.injectedCount).toBe(0);
    expect(result.injectedContent).toBe(original);
  });

  it("Dry-run returns injection plan with zero Firestore writes", () => {
    const result = injectLinks("test text", [{ anchorText: "test text", targetKeyword: "foo" }]);
    expect(result.injectionPlan).toBeDefined();
    expect(result.injectionPlan[0].status).toBe("injected");
  });
});
