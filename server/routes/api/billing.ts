import { Router } from "express";
import Stripe from "stripe";
import { db } from "../../firebaseAdmin";

export const billingRouter = Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export interface PlanConfig {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  badge?: string;
  popular?: boolean;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  limits: {
    campaigns: number;
    monthlyClicks: number;
    aiGenerations: number;
    bandwidthGb: number;
  };
  features: string[];
}

export const PLANS: Record<string, PlanConfig> = {
  starter: {
    id: "starter",
    name: "Starter Velocity",
    tagline: "Essential autonomous affiliate routing & keyword discovery",
    priceMonthly: 29,
    priceYearly: 290,
    badge: "Solo Operators",
    stripePriceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_STARTER_YEARLY,
    limits: {
      campaigns: 10,
      monthlyClicks: 25000,
      aiGenerations: 250,
      bandwidthGb: 50,
    },
    features: [
      "10 Active Traffic Campaigns",
      "25,000 Outbound Routed Clicks/mo",
      "250 Long-Form AI Articles & Pins",
      "Standard Smart Redirector (/go/:slug)",
      "MaxBounty API Catalog Ingestion",
      "Real-time Bot & Spider Filtering",
      "Standard Community Support",
    ],
  },
  growth: {
    id: "growth",
    name: "Growth Scaler",
    tagline: "High-converting multi-armed bandit optimization & auto-publishing",
    priceMonthly: 79,
    priceYearly: 790,
    popular: true,
    badge: "Most Popular",
    stripePriceIdMonthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_GROWTH_YEARLY,
    limits: {
      campaigns: 50,
      monthlyClicks: 150000,
      aiGenerations: 1500,
      bandwidthGb: 300,
    },
    features: [
      "50 Active Traffic Campaigns",
      "150,000 Outbound Routed Clicks/mo",
      "1,500 Multi-Format AI Generations",
      "Multi-Armed Bandit Thompson Sampling",
      "Automated WordPress & Pinterest Sync",
      "Live In-Flight Telemetry Stream (SSE)",
      "WebOps Autonomous Self-Healing Agent",
      "SubID Deep Conversion Attribution",
      "Priority 24/7 API Quota Scaling",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise Fleet",
    tagline: "Full-scale affiliate media buying cluster with custom infrastructure",
    priceMonthly: 249,
    priceYearly: 2490,
    badge: "Media Houses",
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
    limits: {
      campaigns: 999999,
      monthlyClicks: 1000000,
      aiGenerations: 999999,
      bandwidthGb: 2000,
    },
    features: [
      "Unlimited Active Campaigns",
      "1,000,000+ Outbound Tracked Clicks/mo",
      "Unlimited Gemini 2.5 Flash / Pro Tokens",
      "Custom CNAME Branded Tracking Domains",
      "HMAC S2S Postback Signature Security",
      "Distributed Cluster Worker Engine",
      "Raw Kafka/Webhook Event Streaming",
      "Dedicated Technical Account Director",
      "99.99% Guaranteed SLA Uptime",
    ],
  },
};

export const FREE_TIER_LIMITS = {
  campaigns: 3,
  monthlyClicks: 5000,
  aiGenerations: 25,
  bandwidthGb: 5,
};

/**
 * Server-side quota entitlement check.
 * Verifies whether user is within their active plan's limits.
 */
export async function checkQuota(
  userId: string,
  feature: "campaigns" | "aiGenerations" | "monthlyClicks"
): Promise<{ allowed: boolean; limit: number; current: number; planId: string }> {
  try {
    let planId = "free";
    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists) {
      const u = userDoc.data() || {};
      planId = u.subscription?.planId || u.subscriptionTier || "free";
    }

    const plan = PLANS[planId];
    const limits = plan ? plan.limits : FREE_TIER_LIMITS;
    const limit = limits[feature];

    let current = 0;
    if (feature === "campaigns") {
      const snap = await db.collection("campaigns").where("userId", "==", userId).count().get();
      current = snap.data().count;
    } else if (feature === "aiGenerations") {
      const snap = await db.collection("articles").where("userId", "==", userId).count().get();
      current = snap.data().count;
    } else if (feature === "monthlyClicks") {
      const snap = await db.collection("affiliate_clicks").where("userId", "==", userId).count().get();
      current = snap.data().count;
    }

    return {
      allowed: current < limit,
      limit,
      current,
      planId,
    };
  } catch (err) {
    // If quota check fails gracefully, do not arbitrarily lock out in development
    return { allowed: true, limit: 999999, current: 0, planId: "free" };
  }
}

// GET /api/billing/plans - Retrieve tier configurations
billingRouter.get("/plans", (_req, res) => {
  return res.json({
    success: true,
    plans: PLANS,
    hasStripeConfigured: !!stripeSecretKey,
  });
});

// GET /api/billing/status - Retrieve user subscription status & usage
billingRouter.get("/status", async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Missing authentication" });
    }

    let subData: any = {
      planId: "free",
      status: "active",
      tier: "free",
      currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
      cancelAtPeriodEnd: false,
    };

    try {
      const doc = await db.collection("users").doc(userId).get();
      if (doc.exists) {
        const u = doc.data() || {};
        if (u.subscription) {
          subData = { ...subData, ...u.subscription };
        } else if (u.subscriptionTier) {
          subData.planId = u.subscriptionTier;
          subData.tier = u.subscriptionTier;
        }
      }
    } catch (e) {
      console.warn("[Billing] Could not fetch user subscription record from Firestore:", e);
    }

    let usage = {
      clicksThisMonth: 0,
      articlesGenerated: 0,
      activeCampaigns: 0,
      aiTokensUsed: 0,
    };

    try {
      const campaignsCount = await db.collection("campaigns").where("userId", "==", userId).count().get();
      usage.activeCampaigns = campaignsCount.data().count;

      const articlesCount = await db.collection("articles").where("userId", "==", userId).count().get();
      usage.articlesGenerated = articlesCount.data().count;

      const clicksCount = await db.collection("affiliate_clicks").where("userId", "==", userId).count().get();
      usage.clicksThisMonth = clicksCount.data().count;
    } catch (e) {
      // Defaults to 0
    }

    const currentPlan = PLANS[subData.planId] || {
      id: "free",
      name: "Starter Trial",
      tagline: "Free exploration sandbox",
      priceMonthly: 0,
      priceYearly: 0,
      limits: FREE_TIER_LIMITS,
      features: [
        "3 Active Campaigns",
        "5,000 Outbound Clicks",
        "25 AI Content Generations",
        "Standard Bot Filtering",
      ],
    };

    return res.json({
      success: true,
      subscription: subData,
      plan: currentPlan,
      usage,
      limits: currentPlan.limits,
      hasStripeConfigured: !!stripeSecretKey,
    });
  } catch (error: any) {
    console.error("[Billing] Error fetching subscription status:", error);
    return res.status(500).json({ error: error.message || "Failed to load billing status" });
  }
});

// POST /api/billing/create-checkout-session - Initiate subscription upgrade
billingRouter.post("/create-checkout-session", async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: Missing authentication" });
    }

    const userEmail = req.user?.email || "billing@optiflow.io";
    const { planId, interval = "month" } = req.body;

    const plan = PLANS[planId];
    if (!plan) {
      return res.status(400).json({ error: `Unknown planId: ${planId}` });
    }

    const price = interval === "year" ? plan.priceYearly : plan.priceMonthly;
    const origin = req.headers.origin || req.headers.referer || "http://localhost:3000";

    // 1. If real Stripe is configured, create verified Stripe Checkout Session
    if (stripe) {
      const priceId = interval === "year" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
      const lineItem = priceId
        ? { price: priceId, quantity: 1 }
        : {
            price_data: {
              currency: "usd",
              product_data: {
                name: `OptiFlow OS — ${plan.name}`,
                description: plan.tagline,
              },
              unit_amount: price * 100,
              recurring: {
                interval: interval === "year" ? ("year" as const) : ("month" as const),
              },
            },
            quantity: 1,
          };

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: userEmail,
        client_reference_id: userId,
        line_items: [lineItem],
        success_url: `${origin}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/settings?checkout=cancelled`,
        metadata: {
          userId,
          planId,
          interval,
        },
      });

      return res.json({
        success: true,
        url: session.url,
        sessionId: session.id,
        isSimulated: false,
      });
    }

    // 2. Strict Production Guard: In production without Stripe, fail safely
    if (process.env.NODE_ENV === "production") {
      return res.status(503).json({
        error: "Billing gateway is currently offline for maintenance. Please configure STRIPE_SECRET_KEY.",
      });
    }

    // 3. Development / Sandbox mode only: simulate upgrade for testing
    const simulatedSub = {
      planId,
      tier: planId,
      status: "active",
      interval,
      price,
      currency: "usd",
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now() + (interval === "year" ? 365 : 30) * 24 * 60 * 60 * 1000,
      cancelAtPeriodEnd: false,
      simulatedTransactionId: `sim_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      updatedAt: Date.now(),
    };

    try {
      await db.collection("users").doc(userId).set(
        {
          subscription: simulatedSub,
          subscriptionTier: planId,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("[Billing] Could not save simulated tier to Firestore:", e);
    }

    return res.json({
      success: true,
      isSimulated: true,
      message: `[Dev Mode] Successfully upgraded to ${plan.name} (${interval}ly billing)!`,
      subscription: simulatedSub,
      redirectUrl: "/settings?checkout=success",
    });
  } catch (error: any) {
    console.error("[Billing] Error creating checkout session:", error);
    return res.status(500).json({ error: error.message || "Failed to initialize checkout" });
  }
});

// POST /api/billing/create-portal-session - Customer self-service billing portal
billingRouter.post("/create-portal-session", async (req: any, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const origin = req.headers.origin || "http://localhost:3000";

    const userDoc = await db.collection("users").doc(userId).get();
    const customerId = userDoc.data()?.stripeCustomerId;

    if (stripe && customerId) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/settings`,
      });
      return res.json({ success: true, url: portalSession.url });
    }

    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ error: "No active Stripe customer found for this account." });
    }

    return res.json({
      success: true,
      isSimulated: true,
      message: "Customer Portal Simulation: Sandbox account has no external Stripe customer ID.",
      returnUrl: `${origin}/settings`,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Could not open portal" });
  }
});

// POST /api/billing/webhook - Ingest Stripe Webhooks with signature check & idempotency
billingRouter.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (stripe && webhookSecret) {
    if (!sig) {
      return res.status(400).send("Webhook Error: Missing stripe-signature header");
    }
    try {
      const rawPayload = (req as any).rawBody || JSON.stringify(req.body);
      event = stripe.webhooks.constructEvent(rawPayload, sig, webhookSecret);
    } catch (err: any) {
      console.error(`[Stripe Webhook] Signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else if (process.env.NODE_ENV === "production") {
    return res.status(503).json({ error: "Stripe webhook secret is not configured in production." });
  } else {
    // Development sandbox mode
    event = req.body as Stripe.Event;
  }

  try {
    // Idempotency: Prevent duplicate processing if Stripe retries webhook
    const eventId = event?.id;
    if (eventId) {
      const eventRef = db.collection("stripe_processed_events").doc(eventId);
      const eventSnap = await eventRef.get();
      if (eventSnap.exists) {
        return res.json({ received: true, duplicate: true });
      }
      await eventRef.set({
        id: eventId,
        type: event.type,
        processedAt: Date.now(),
      });
    }

    const eventType = event.type;
    const dataObj = event.data?.object as any;

    if (eventType === "checkout.session.completed") {
      const userId = dataObj?.client_reference_id || dataObj?.metadata?.userId;
      const planId = dataObj?.metadata?.planId || "growth";
      if (userId) {
        await db.collection("users").doc(userId).set(
          {
            subscription: {
              planId,
              tier: planId,
              status: "active",
              stripeCustomerId: dataObj.customer,
              stripeSubscriptionId: dataObj.subscription,
              updatedAt: Date.now(),
            },
            subscriptionTier: planId,
            stripeCustomerId: dataObj.customer,
          },
          { merge: true }
        );
      }
    } else if (eventType === "customer.subscription.updated") {
      const customerId = dataObj.customer;
      const status = dataObj.status; // 'active', 'past_due', 'canceled', etc.
      const currentPeriodEnd = dataObj.current_period_end ? dataObj.current_period_end * 1000 : Date.now();
      const cancelAtPeriodEnd = !!dataObj.cancel_at_period_end;

      const userSnap = await db.collection("users").where("stripeCustomerId", "==", customerId).get();
      for (const doc of userSnap.docs) {
        await doc.ref.set(
          {
            subscription: {
              status,
              currentPeriodEnd,
              cancelAtPeriodEnd,
              updatedAt: Date.now(),
            },
          },
          { merge: true }
        );
      }
    } else if (eventType === "customer.subscription.deleted") {
      const customerId = dataObj.customer;
      const userSnap = await db.collection("users").where("stripeCustomerId", "==", customerId).get();
      for (const doc of userSnap.docs) {
        await doc.ref.set(
          {
            subscription: {
              planId: "free",
              tier: "free",
              status: "canceled",
              updatedAt: Date.now(),
            },
            subscriptionTier: "free",
          },
          { merge: true }
        );
      }
    } else if (eventType === "invoice.payment_failed") {
      const customerId = dataObj.customer;
      const userSnap = await db.collection("users").where("stripeCustomerId", "==", customerId).get();
      for (const doc of userSnap.docs) {
        await doc.ref.set(
          {
            subscription: {
              status: "past_due",
              updatedAt: Date.now(),
            },
          },
          { merge: true }
        );
      }
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error("[Stripe Webhook] Processing error:", err);
    return res.status(500).json({ error: "Webhook processing error" });
  }
});

// POST /api/billing/simulate-tier - Developer sandbox instant switch (Blocked in production)
billingRouter.post("/simulate-tier", async (req: any, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Tier simulation is disabled in production environments." });
  }

  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { planId = "growth" } = req.body;
    const plan = PLANS[planId] || {
      id: planId,
      name: "Free Sandbox",
      limits: FREE_TIER_LIMITS,
    };

    await db.collection("users").doc(userId).set(
      {
        subscription: {
          planId,
          tier: planId,
          status: "active",
          updatedAt: Date.now(),
        },
        subscriptionTier: planId,
      },
      { merge: true }
    );

    return res.json({
      success: true,
      message: `Account tier successfully updated to ${plan.name}`,
      planId,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to update tier" });
  }
});
