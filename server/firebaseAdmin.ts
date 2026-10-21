import { initializeApp, getApps, cert, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function getAppletConfig() {
  try {
    const configPath = join(process.cwd(), 'firebase-applet-config.json');
    if (existsSync(configPath)) {
      const firebaseConfig = JSON.parse(readFileSync(configPath, 'utf8'));
      return {
        firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || firebaseConfig.databaseId || process.env.FIREBASE_DATABASE_ID || '(default)',
        projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId || 'earn-pulse-51df9'
      };
    }
  } catch (e) {
    console.warn('[AppletConfig] Fallback to defaults. Error loading config file:', e instanceof Error ? e.message : String(e));
  }
  return {
    firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || '(default)',
    projectId: process.env.FIREBASE_PROJECT_ID || 'earn-pulse-51df9'
  };
}

let adminApp: App | undefined;
let db: Firestore;
let auth: Auth;

export const hasServiceAccount = !!(
  (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  (process.env.K_SERVICE && !process.env.K_SERVICE.startsWith('ais-dev-') && !process.env.K_SERVICE.startsWith('ais-pre-'))
);

export function initFirebaseAdmin() {
  if (adminApp) return { db, auth, adminApp, hasServiceAccount };

  const config = getAppletConfig();
  const projectId = process.env.FIREBASE_PROJECT_ID || config.projectId;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (getApps().length === 0) {
    if (projectId && clientEmail && privateKey) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('[Firebase Admin] Initialized with Service Account Credentials.');
    } else {
      adminApp = initializeApp({
        credential: applicationDefault(),
        projectId: config.projectId
      });
      console.warn('[Firebase Admin Warning] Initialized without Service Account Credentials. Expect PERMISSION_DENIED on reads/writes if not in a service account environment.');
    }
  } else {
    adminApp = getApps()[0];
  }

  db = getFirestore(adminApp, config.firestoreDatabaseId);
  auth = getAuth(adminApp);

  return { db, auth, adminApp, hasServiceAccount };
}

// Initialize immediately so db and auth exports are available
initFirebaseAdmin();

if (!hasServiceAccount && process.env.NODE_ENV !== 'production') {
  console.warn('\n======================================================');
  console.warn('⚠️ FIRESTORE ADMIN SDK UNAUTHENTICATED IN DEV MODE');
  console.warn('======================================================');
  console.warn('The AI Studio Dev Server cannot access your Firebase project.');
  console.warn('Background workers will fail with PERMISSION_DENIED.');
  console.warn('To fix this, add FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL,');
  console.warn('and FIREBASE_PROJECT_ID to your Secrets menu.');
  console.warn('======================================================\n');
}

export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function handleServerError(error: any): never {
  console.error('[Database Server Error]:', error);
  throw new DatabaseError(error?.message || String(error), error?.code);
}

export { db, auth, adminApp };
