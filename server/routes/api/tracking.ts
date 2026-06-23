import { Router } from "express";
import { db } from "../../firebaseAdmin";
import { ClickObject, ConversionObject } from "../../schema";
import { EventEngine } from "../../events/engine";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// /api/tracking/click?offer_id=O123&content_id=C456&source=pinterest&redirect=URL
router.get("/click", async (req: any, res) => {
  try {
    const { offer_id, content_id, source, redirect } = req.query;

    if (!offer_id || !redirect) {
       // Need redirect URL to actually forward the user
       return res.status(400).send("Missing offer_id or redirect URL");
    }

    const clickId = uuidv4();

    const click: ClickObject = {
      click_id: clickId,
      content_id: (content_id as string) || "unknown",
      offer_id: (offer_id as string),
      source: (source as string) || "direct",
      timestamp: Date.now(),
    };

    await db.collection("clicks").doc(clickId).set(click);

    // Append subid to the redirect URL
    const url = new URL(redirect as string);
    // Passing subid which the affiliate network will store & post back
    url.searchParams.set("subid", clickId);

    // Provide a smooth real-time tracking experience without UI blocking
    res.redirect(302, url.toString());
  } catch (error: any) {
    console.error("[Tracking] Click error:", error);
    res.status(500).send("Tracking error");
  }
});

// /api/tracking/postback?subid=123&payout=1.50&network=maxbounty
router.get("/postback", async (req: any, res) => {
  try {
    const { subid, payout, network } = req.query;

    if (!subid || !payout) {
      return res.status(400).send("Missing subid or payout");
    }

    const conversionId = uuidv4();
    const revenue = parseFloat(payout as string) || 0;

    const conversion: ConversionObject = {
      conversion_id: conversionId,
      click_id: (subid as string),
      revenue: revenue,
      network: (network as string) || "unknown",
      timestamp: Date.now(),
    };

    await db.collection("conversions").doc(conversionId).set(conversion);

    // Fetch the click data to know which offer/content this belongs to
    const clickDoc = await db.collection("clicks").doc(subid as string).get();
    let offer_id = "unknown";
    if (clickDoc.exists) {
      offer_id = clickDoc.data()?.offer_id || "unknown";
    }

    // Fire an event for the Orchestrator Engine (Revenue Loop)
    await EventEngine.publishEvent("conversion_increase", {
      conversion_id: conversionId,
      click_id: subid,
      offer_id: offer_id,
      revenue: revenue,
      network: network
    });

    res.status(200).send("OK");
  } catch (error: any) {
    console.error("[Tracking] Postback error:", error);
    res.status(500).send("Postback error");
  }
});

export default router;
