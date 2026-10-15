import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

const mocks = vi.hoisted(() => {
  const store = new Map<string, any>();
  const mockSet = vi.fn().mockImplementation((data, opts) => {
    return Promise.resolve(true);
  });
  const mockGet = vi.fn();
  const mockUpdate = vi.fn().mockResolvedValue(true);
  const mockDoc = vi.fn((docId) => ({
    get: mockGet,
    set: mockSet,
    update: mockUpdate,
  }));
  const mockWhere = vi.fn().mockReturnThis();
  const mockLimit = vi.fn().mockReturnThis();
  const mockCount = vi.fn(() => ({
    get: vi.fn().mockResolvedValue({ data: () => ({ count: 2 }) })
  }));

  const mockCollection = vi.fn((colName) => ({
    doc: mockDoc,
    where: mockWhere,
    limit: mockLimit,
    count: mockCount,
    get: mockGet,
  }));

  return { store, mockSet, mockGet, mockUpdate, mockDoc, mockWhere, mockLimit, mockCount, mockCollection };
});

vi.mock("../../../firebaseAdmin", () => ({
  db: {
    collection: mocks.mockCollection,
  }
}));

import { billingRouter, checkQuota, PLANS } from "../billing";
import { postbackRouter } from "../postback";
import { telemetryHub } from "../../../services/telemetryStream";

const app = express();
app.use(express.json());
// Inject authenticated mock user for billing routes
app.use((req: any, _res, next) => {
  req.user = { uid: "test-user-123", email: "user@example.com", role: "user" };
  next();
});
app.use("/api/billing", billingRouter);
app.use("/api/webhooks", postbackRouter);
app.use("/api/postback", postbackRouter);
app.use("/postback", postbackRouter);

describe("Billing & Subscription Engine", () => {
  it("GET /api/billing/plans returns consistent tiered pricing structure", async () => {
    const res = await request(app).get("/api/billing/plans");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.plans.starter.priceMonthly).toBe(29);
    expect(res.body.plans.growth.priceMonthly).toBe(79);
    expect(res.body.plans.enterprise.priceMonthly).toBe(249);
  });

  it("GET /api/billing/status retrieves current subscription and usage", async () => {
    mocks.mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        subscription: { planId: "growth", status: "active" },
        stripeCustomerId: "cus_123"
      })
    });

    const res = await request(app).get("/api/billing/status");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.subscription.planId).toBe("growth");
    expect(res.body.plan.id).toBe("growth");
  });

  it("POST /api/billing/create-checkout-session in dev mode simulates tier upgrade safely", async () => {
    const res = await request(app)
      .post("/api/billing/create-checkout-session")
      .send({ planId: "growth", interval: "month" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.subscription.planId).toBe("growth");
  });

  it("POST /api/billing/simulate-tier updates user tier and respects limits", async () => {
    const res = await request(app)
      .post("/api/billing/simulate-tier")
      .send({ planId: "enterprise" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.planId).toBe("enterprise");
  });

  it("checkQuota accurately enforces plan thresholds", async () => {
    mocks.mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ subscription: { planId: "free" } })
    });

    const quota = await checkQuota("test-user-123", "campaigns");
    expect(quota.limit).toBe(3); // Free tier limit is 3
    expect(quota.current).toBe(2);
    expect(quota.allowed).toBe(true);
  });
});

describe("Affiliate Postback Webhooks (Reconciled Routes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Accepts POST to /api/webhooks/postback and confirms conversion", async () => {
    // 1. convSnap.exists -> false (not a duplicate)
    mocks.mockGet.mockResolvedValueOnce({ exists: false });
    // 2. clickSnap.exists -> true (found matching click)
    mocks.mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        userId: "test-user-123",
        offerId: "nord-1",
        articleId: "art-1",
        source: "pinterest",
        country: "US"
      })
    });

    const res = await request(app)
      .post("/api/webhooks/postback?test=true")
      .send({
        clickId: "click-abc-123",
        amount: 45.00,
        offerId: "nord-1",
        transactionId: "tx-999"
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe("reconciled_immediately");
  });

  it("Accepts GET to /postback with query params (MaxBounty compatibility)", async () => {
    mocks.mockGet.mockResolvedValueOnce({ exists: false });
    mocks.mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        userId: "test-user-123",
        offerId: "mb-offer-2",
        articleId: "art-2",
        source: "direct",
        country: "CA"
      })
    });

    const res = await request(app)
      .get("/postback?test=true&sub1=click-xyz-789&payout=30.00&txid=tx-888&currency=USD");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe("reconciled_immediately");
  });

  it("Prevents duplicate revenue on duplicate conversion delivery", async () => {
    // convSnap exists with status confirmed
    mocks.mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        conversionId: "conv-tx-999",
        status: "confirmed",
        amount: 45.00
      })
    });

    const res = await request(app)
      .post("/api/webhooks/postback?test=true")
      .send({
        clickId: "click-abc-123",
        amount: 45.00,
        transactionId: "tx-999"
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ignored");
    expect(res.body.message).toContain("Duplicate conversion");
  });

  it("Correctly handles conversion reversals and refunds", async () => {
    mocks.mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        conversionId: "conv-tx-999",
        status: "confirmed",
        amount: 45.00,
        userId: "test-user-123",
        offerId: "nord-1"
      })
    });

    const res = await request(app)
      .post("/api/webhooks/postback?test=true")
      .send({
        clickId: "click-abc-123",
        amount: 45.00,
        status: "reversed",
        transactionId: "tx-999"
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("reversed");
  });

  it("Rejects invalid payout values", async () => {
    const res = await request(app)
      .post("/api/webhooks/postback?test=true")
      .send({
        clickId: "click-abc-123",
        amount: "invalid-number"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Invalid numeric payout amount");
  });
});
