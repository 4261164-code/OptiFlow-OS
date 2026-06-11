import { describe, it, expect, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const mockSet = vi.fn().mockResolvedValue(true);
    const mockAdd = vi.fn().mockResolvedValue(true);
    const mockCollection = vi.fn((col) => {
        return {
            doc: vi.fn(() => ({ set: mockSet })),
            add: mockAdd
        };
    });
    return { mockSet, mockAdd, mockCollection };
});

vi.mock("../../firebaseAdmin", () => ({
    db: { collection: mocks.mockCollection }
}));

import { processClick } from "../clickTracking";

describe("processClick", () => {
    it("Hashes IP with SHA-256 and never stores raw", async () => {
        const clickId = await processClick("test-off", "art-1", "src", "ua", "192.168.1.1", "none");
        expect(mocks.mockSet).toHaveBeenCalledWith(expect.objectContaining({
            offerId: "test-off",
            ip: "c5eb5a4cc76a5cdb16e79864b9ccd26c3553f0c396d0a21bafb7be71c1efcd8c" // sha256 of 192.168.1.1
        }));
        expect(mocks.mockSet).not.toHaveBeenCalledWith(expect.objectContaining({ ip: "192.168.1.1" }));
    });

    it("Firestore failure does not block redirect (we return clickId resolving immediately)", async () => {
        mocks.mockSet.mockRejectedValueOnce(new Error("Test firestore failure"));
        const clickId = await processClick("fail-off", "art-1", undefined, undefined, undefined, undefined);
        expect(clickId).toBeDefined(); // Process immediately returns even if fire and forget fails
    });
});

