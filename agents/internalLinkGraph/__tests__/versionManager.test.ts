import { describe, it, expect, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  const mockWhere = vi.fn().mockReturnThis();
  const mockOrderBy = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();
  const mockDoc = vi.fn(() => ({ get: mockGet, set: mockSet }));
  const mockCollection = vi.fn(() => ({
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    get: mockGet,
    doc: mockDoc,
  }));
  return { mockGet, mockSet, mockWhere, mockOrderBy, mockLimit, mockDoc, mockCollection };
});

vi.mock("../../../server/firebaseAdmin", () => ({
  db: { collection: mocks.mockCollection }
}));

vi.mock("../logger", () => ({
  logLinkGraphEvent: vi.fn()
}));

import { createSnapshot, rollback } from "../versionManager";

describe("versionManager", () => {
  it("Snapshot created before every write; content equals original exactly", async () => {
    mocks.mockGet.mockResolvedValueOnce({ empty: true });
    
    const { versionId, versionNum } = await createSnapshot("art1", "clus1", "content");
    expect(versionNum).toBe(1);
    expect(mocks.mockSet).toHaveBeenCalledWith(expect.objectContaining({
      articleId: "art1",
      content: "content",
      versionNum: 1
    }));
  });

  it("Rollback restores to snapshot; version increments correctly", async () => {
    mocks.mockGet.mockResolvedValueOnce({ exists: true, data: () => ({ versionNum: 1, content: "old" }) });
    const result = await rollback("art1", "vsn-123");
    expect(result.success).toBe(true);
    expect(result.restoredVersionNum).toBe(1);
  });

  it("Rollback to non-existent version throws clear error", async () => {
    mocks.mockGet.mockResolvedValueOnce({ exists: false });
    await expect(rollback("art1", "vsn-999")).rejects.toThrow("Version not found");
  });
});
