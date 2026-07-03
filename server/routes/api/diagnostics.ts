import { Router } from "express";
import { getStartupDiagnostics } from "../../startup";

const router = Router();

router.get("/", (req, res) => {
  res.json(getStartupDiagnostics());
});

export const diagnosticsRouter = router;
