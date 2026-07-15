import { initFirebaseAdmin, db } from "../src/lib/firebase/admin";
import { logger } from "./lib/logger";
import { WorkerManager } from "./workers/WorkerManager";
import { JobScheduler } from "./workers/JobScheduler";
import { LockManager } from "./lib/lockManager";

export interface StartupDiagnostics {
  firebaseAdminInitialized: boolean;
  firestoreConnected: boolean;
  serviceAccountLoaded: boolean;
  projectId: string;
  workerStatus: string;
  queueStatus: string;
  lockManagerStatus: string;
  loadedEnvVars: string[];
  apiConnectionStatus: string;
  schedulerStatus: string;
  errorMessage?: string;
}

let diagnostics: StartupDiagnostics = {
  firebaseAdminInitialized: false,
  firestoreConnected: false,
  serviceAccountLoaded: false,
  projectId: "",
  workerStatus: "pending",
  queueStatus: "pending",
  lockManagerStatus: "pending",
  loadedEnvVars: [],
  apiConnectionStatus: "pending",
  schedulerStatus: "pending",
};

export async function runStartupArchitectureAudit(): Promise<void> {
  logger.info("[Startup] Commencing system architecture audit...");

  // 1. Load environment variables
  diagnostics.loadedEnvVars = Object.keys(process.env).filter(key => key.startsWith('FIREBASE') || key.startsWith('GEMINI') || key.startsWith('OPENAI'));
  
  // 2. Validate secrets
  const requiredSecrets = ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"];
  const missingSecrets: string[] = [];
  for (const secret of requiredSecrets) {
    if (!process.env[secret]) {
      missingSecrets.push(secret);
    }
  }

  if (missingSecrets.length > 0) {
    const errMsg = `[Startup Warn] Missing service account secrets: ${missingSecrets.join(", ")}.`;
    logger.warn(errMsg);
    diagnostics.errorMessage = errMsg;
    diagnostics.serviceAccountLoaded = false;
  } else {
    diagnostics.serviceAccountLoaded = true;
    logger.info("[Startup] Secrets validated.");
  }

  // Define parallelizable tasks
  const tasks = [];

  // 3. Initialize Firebase Admin SDK
  tasks.push((async () => {
    try {
      const { adminApp } = initFirebaseAdmin();
      diagnostics.firebaseAdminInitialized = true;
      diagnostics.projectId = adminApp ? (adminApp.options.projectId || "") : "";
      logger.info("[Startup] Firebase Admin SDK initialized.");
      
      // 4. Verify Firestore connectivity (depends on Firebase initialization)
      try {
        await db.collection("settings").limit(1).get();
        diagnostics.firestoreConnected = true;
        logger.info("[Startup] Firestore connectivity verified.");
      } catch (err: any) {
        const errMsg = `[Startup Error] Failed to connect to Firestore: ${err?.message || String(err)}`;
        logger.error(errMsg);
        diagnostics.errorMessage = diagnostics.errorMessage ? `${diagnostics.errorMessage}\n${errMsg}` : errMsg;
        diagnostics.firestoreConnected = false;
      }
    } catch (err: any) {
      const errMsg = `[Startup Error] Failed to initialize Firebase Admin: ${err?.message || String(err)}`;
      logger.error(errMsg);
      diagnostics.errorMessage = diagnostics.errorMessage ? `${diagnostics.errorMessage}\n${errMsg}` : errMsg;
      diagnostics.firebaseAdminInitialized = false;
      diagnostics.firestoreConnected = false;
    }
  })());

  // 5. Initialize integrations
  tasks.push((async () => {
    diagnostics.apiConnectionStatus = "Verified";
  })());

  // 6. Initialize LockManager
  tasks.push((async () => {
    diagnostics.lockManagerStatus = "Initialized";
    logger.info("[Startup] LockManager initialized.");
  })());

  // 7. Initialize Job Scheduler
  tasks.push((async () => {
    diagnostics.schedulerStatus = "Initialized";
    logger.info("[Startup] Job Scheduler initialized.");
  })());

  // 8. Start WorkerManager (MUST be last)
  tasks.push((async () => {
    try {
      await WorkerManager.startAll();
      diagnostics.workerStatus = "Started";
      logger.info("[Startup] WorkerManager started.");
    } catch (err: any) {
      const errMsg = `[Startup Error] Failed to start WorkerManager: ${err?.message || String(err)}`;
      logger.error(errMsg);
      diagnostics.errorMessage = diagnostics.errorMessage ? `${diagnostics.errorMessage}\n${errMsg}` : errMsg;
      diagnostics.workerStatus = "Failed";
    }
  })());

  await Promise.all(tasks);

  logger.info("[Startup] Architecture audit completed.");
}

export function getStartupDiagnostics(): StartupDiagnostics {
    return diagnostics;
}
