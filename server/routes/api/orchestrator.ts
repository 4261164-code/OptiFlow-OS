import { Router } from "express";
import { OrchestrationEngine } from "../../orchestrator/engine";
import { db } from "../../firebaseAdmin";

const router = Router();

router.post("/trigger", async (req: any, res) => {
  try {
    const userId = req.user?.uid || "admin";
    const { trigger_event, target_id, initial_context } = req.body;

    if (!trigger_event || !target_id) {
       return res.status(400).json({ error: "Missing trigger_event or target_id" });
    }

    const jobId = await OrchestrationEngine.startNewJob(userId, trigger_event, target_id, initial_context || {});
    res.json({ success: true, jobId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/status", async (req: any, res) => {
  try {
     const snap = await db.collection("orchestration_jobs").orderBy("created_at", "desc").limit(20).get();
     const jobs: any[] = [];
     snap.forEach(doc => jobs.push(doc.data()));
     res.json({ success: true, jobs });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/tasks/:jobId", async (req: any, res) => {
  try {
     const { jobId } = req.params;
     const snap = await db.collection("orchestration_tasks").where("job_id", "==", jobId).orderBy("created_at", "asc").get();
     const tasks: any[] = [];
     snap.forEach(doc => tasks.push(doc.data()));
     res.json({ success: true, tasks });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
