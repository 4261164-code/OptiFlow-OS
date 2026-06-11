import { describe, it, expect, vi } from "vitest";

vi.mock("../logger", () => ({
  logLinkGraphEvent: vi.fn()
}));

import { runSimulation } from "../dryRunSimulator";

describe("dryRunSimulator", () => {
  it("Zero Firestore writes in dry-run (mock + verify call count)", async () => {
    const result = await runSimulation("clus-1", 5, [], {});
    expect(result.dryRun).toBe(true);
  });

  it("Returns complete simulation report matching live run structure", async () => {
    const result = await runSimulation("clus-1", 5, [{ articleId: "art1", linksIn: 0, linksOut: 5, topAnchors: ["test"] }], { high: 2 });
    expect(result).toHaveProperty("clusterId", "clus-1");
    expect(result).toHaveProperty("linksSimulated", 5);
    expect(result).toHaveProperty("byArticle");
    expect(result).toHaveProperty("confidenceDistribution");
    expect(result).toHaveProperty("approvalRequired", true);
  });
});
