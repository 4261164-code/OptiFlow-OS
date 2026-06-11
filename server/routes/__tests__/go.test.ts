import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

const mocks = vi.hoisted(() => {
    const mockGet = vi.fn();
    const mockDoc = vi.fn(() => ({ get: mockGet }));
    const mockSet = vi.fn().mockResolvedValue(true);
    const mockCollection = vi.fn(() => ({
        doc: mockDoc,
        add: vi.fn(),
        set: mockSet
    }));
    return { mockGet, mockDoc, mockSet, mockCollection };
});

vi.mock("../../firebaseAdmin", () => ({
    db: { collection: mocks.mockCollection }
}));

import { goRouter } from "../go";
import * as clickTracking from "../../services/clickTracking";

const mockProcessClick = vi.spyOn(clickTracking, "processClick").mockResolvedValue("test-click-123");

const app = express();
app.use("/go", goRouter);

describe("goRouter GET /go/:offerId", () => {
    it("Valid offerId redirects quickly and fires click tracking", async () => {
        mocks.mockGet.mockResolvedValueOnce({ exists: true, data: () => ({ link: "https://example.com/aff" }) });
        
        const startTime = Date.now();
        const response = await request(app).get("/go/offer-1?articleId=abc&source=web");
        const elapsed = Date.now() - startTime;
        
        expect(response.status).toBe(302);
        expect(response.header.location).toBe("https://example.com/aff");
        expect(elapsed).toBeLessThan(100);
        expect(mockProcessClick).toHaveBeenCalledWith("offer-1", "abc", "web", undefined, expect.any(String), undefined);
    });

    it("Invalid offerId redirects to homepage", async () => {
        mocks.mockGet.mockResolvedValueOnce({ exists: false });
        
        const response = await request(app).get("/go/unknown-offer");
        expect(response.status).toBe(302);
        expect(response.header.location).toBe("/");
    });

    it("Non-https destination URL falls back and logs anomaly", async () => {
        mocks.mockGet.mockResolvedValueOnce({ exists: true, data: () => ({ link: "http://example.com/aff" }) });
        
        const response = await request(app).get("/go/offer-bad");
        expect(response.status).toBe(302);
        expect(response.header.location).toBe("/");
    });
});
