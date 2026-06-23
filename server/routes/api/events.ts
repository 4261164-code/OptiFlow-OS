import { Router } from "express";
import { EventEngine } from "../../events/engine";
import { db } from "../../firebaseAdmin";

const router = Router();

router.post("/trigger", async (req: any, res) => {
  try {
    const { type, payload } = req.body;

    if (!type || !payload) {
       return res.status(400).json({ error: "Missing type or payload" });
    }

    const eventId = await EventEngine.publishEvent(type, payload);
    res.json({ success: true, eventId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/status", async (req: any, res) => {
  try {
     const snap = await db.collection("system_events").orderBy("created_at", "desc").limit(20).get();
     const events: any[] = [];
     snap.forEach(doc => events.push(doc.data()));
     res.json({ success: true, events });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
