import express from "express";
import { db } from "../../firebaseAdmin";
import { MaxBountyAuth, MaxBountyCampaigns, MaxBountyTracking, MaxBountyPostbacks } from "../../integrations/maxbounty";

export const maxbountyRouter = express.Router();

// 1. Authentication Configuration POST
maxbountyRouter.post("/auth", async (req, res) => {
  try {
    const { email, password, userId = "system-fallback" } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and passcode/token are required." });
    }

    const authMgr = new MaxBountyAuth(email, password, userId);
    const credentials = await authMgr.saveCredentials();

    res.json({
      success: true,
      message: "MaxBounty network credentials authorized and registered successfully.",
      credentials: {
        email: credentials.email,
        tokenExpiry: credentials.tokenExpiry,
        active: true
      }
    });
  } catch (err: any) {
    console.error("[MaxBounty API Auth Error]", err);
    res.status(500).json({ error: err.message || "Failed to authenticate with MaxBounty API." });
  }
});

// 2. Fetch configured credentials
maxbountyRouter.get("/credentials", async (req, res) => {
  try {
    const userId = (req.query.userId as string) || "system-fallback";
    const creds = await MaxBountyAuth.getCredentials(userId);

    if (!creds) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      email: creds.email,
      expiry: creds.tokenExpiry
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Campaign Sync and discovery scoring GET
maxbountyRouter.get("/campaigns", async (req, res) => {
  try {
    const userId = (req.query.userId as string) || "system-fallback";
    const forceSync = req.query.sync === "true";

    let campaignsSnap = await db.collection("maxbounty_campaigns").get();
    
    // Auto-sync if collection is vacant or caller requested it
    if (campaignsSnap.empty || forceSync) {
      const creds = await MaxBountyAuth.getCredentials(userId);
      if (!creds) {
        // Return structured seed offers if credentials aren't configured yet so that the UI can function immediately
        console.log("[MaxBounty Router] No credentials found. Loading scored seed campaign list.");
        const seedMgr = new MaxBountyCampaigns("unauthenticated_token");
        const seedList = await seedMgr.fetchFromNetwork("top");
        const scored = await seedMgr.scoreCampaigns(seedList);
        return res.json({ campaigns: scored, synced: false, needCredentials: true });
      }

      const syncMgr = new MaxBountyCampaigns(creds.apiToken);
      const syncedCampaigns = await syncMgr.syncToDb(userId);
      return res.json({ campaigns: syncedCampaigns, synced: true });
    }

    const campaigns: any[] = [];
    campaignsSnap.forEach(doc => campaigns.push(doc.data()));
    
    // Sort by discovery score descending
    campaigns.sort((a, b) => (b.score || 0) - (a.score || 0));

    res.json({ campaigns, synced: false });
  } catch (err: any) {
    console.error("[MaxBounty API Campaigns Error]", err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Manual Sync Trigger POST
maxbountyRouter.post("/sync", async (req, res) => {
  try {
    const { userId = "system-fallback" } = req.body;
    const creds = await MaxBountyAuth.getCredentials(userId);

    if (!creds) {
      return res.status(401).json({ error: "MaxBounty credentials required to manually sync from remote networks." });
    }

    const syncMgr = new MaxBountyCampaigns(creds.apiToken);
    const campaigns = await syncMgr.syncToDb(userId);

    res.json({
      success: true,
      syncedCount: campaigns.length,
      campaigns
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Generate tracking link POST
maxbountyRouter.post("/generate-link", async (req, res) => {
  try {
    const {
      campaignId, // networkCampaignId (number)
      dbCampaignId, // path id (string)
      sub1 = "pinterest",
      sub2 = "money-hub",
      sub3 = "pin-5542",
      sub4 = "",
      sub5 = "user123",
      userId = "system-fallback"
    } = req.body;

    if (!campaignId) {
      return res.status(400).json({ error: "campaignId (number) is required." });
    }

    // Attempt to pull user MaxBounty ID
    const creds = await MaxBountyAuth.getCredentials(userId);
    const affiliateId = creds?.apiToken ? "mb-aff-100234" : "100234"; // Fallback to test ID

    const createdLink = await MaxBountyTracking.createTrackingLink({
      campaignId: dbCampaignId || `mb-campaign-${campaignId}`,
      networkCampaignId: Number(campaignId),
      affiliateId,
      sub1,
      sub2,
      sub3,
      sub4: sub4 || `mb-camp-${campaignId}`,
      sub5,
      userId
    });

    res.json({
      success: true,
      link: createdLink
    });
  } catch (err: any) {
    console.error("[MaxBounty Tracking Link Generator Error]", err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Incoming postback hook (Point 7 Postback webhook)
maxbountyRouter.post("/postbacks/maxbounty", async (req, res) => {
  try {
    const payload = req.body;
    const signature = req.headers["x-signature"];
    const secret = process.env.MAXBOUNTY_POSTBACK_SECRET || "default_maxbounty_secret_key";

    // Validate Signature
    const isValid = MaxBountyPostbacks.verifySignature(payload, signature, secret);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid cryptographic signature. Replaced payload ignored." });
    }

    // Direct to async process queue (RabbitMQ alternative)
    const taskQueueId = await MaxBountyPostbacks.enqueuePostback({
      transaction_id: payload.transaction_id || payload.txid,
      payout: Number(payload.payout || payload.amount || 0),
      status: payload.status || "confirmed",
      sub1: payload.sub1,
      sub2: payload.sub2,
      sub3: payload.sub3,
      sub4: payload.sub4,
      sub5: payload.sub5
    });

    res.json({
      success: true,
      message: "Conversion received & buffered in queue processing thread.",
      taskQueueId
    });
  } catch (err: any) {
    console.error("[MaxBounty Webhook Hook Error]", err);
    res.status(500).json({ error: err.message });
  }
});
