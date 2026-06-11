import { describe, it, expect, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const mockGet = vi.fn();
    const mockLimit = vi.fn(() => ({ get: mockGet }));
    const mockWhere = vi.fn().mockReturnThis();

    const mockCollection = vi.fn((name) => {
        return {
            where: mockWhere,
            limit: mockLimit,
            get: mockGet
        };
    });
    return { mockGet, mockLimit, mockWhere, mockCollection };
});

vi.mock("../../../firebaseAdmin", () => ({
    db: { collection: mocks.mockCollection }
}));

import request from "supertest";
import express from "express";
import { clicksApiRouter } from "../clicks";

const app = express();
app.use(clicksApiRouter);

describe("GET /analytics", () => {
    it("Rejects unauthenticated requests", async () => {
        const res = await request(app).get("/analytics");
        expect(res.status).toBe(401);
    });

    it("Returns correct aggregation", async () => {
        // Mock docs
        mocks.mockGet.mockResolvedValueOnce({
            docs: [
                { data: () => ({ offerId: "o1", source: "direct", articleId: "a1" }) },
                { data: () => ({ offerId: "o1", source: "direct", articleId: "a2" }) },
                { data: () => ({ offerId: "o2", source: "seo", articleId: "a1" }) }
            ]
        });
        mocks.mockWhere.mockReturnThis();
        mocks.mockLimit.mockReturnThis();

        // Error docs
        mocks.mockGet.mockResolvedValueOnce({
            docs: []
        });

        const res = await request(app).get("/analytics").set("Authorization", "Bearer token123");
        expect(res.status).toBe(200);
        expect(res.body.totalClicks).toBe(3);
        expect(res.body.byOffer["o1"]).toBe(2);
        expect(res.body.byOffer["o2"]).toBe(1);
        expect(res.body.errorRate).toBe(0);
    });
});
