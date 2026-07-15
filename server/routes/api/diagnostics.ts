import { Router } from "express";
import { getStartupDiagnostics, runStartupArchitectureAudit } from "../../startup";

const router = Router();

router.get("/", (req, res) => {
  res.json(getStartupDiagnostics());
});

router.post("/refresh", async (req, res) => {
  await runStartupArchitectureAudit();
  res.json(getStartupDiagnostics());
});

export const diagnosticsRouter = router;
