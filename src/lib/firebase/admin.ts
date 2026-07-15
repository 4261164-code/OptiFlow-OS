import { initializeApp, getApps, cert, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getAppletConfig } from './config';

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
  const projectId = process.env.FIREBASE_PROJECT_ID;
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
      console.warn('⚠️ Firebase Admin initialized without Service Account Credentials. Expect PERMISSION_DENIED on reads/writes if not in a service account environment.');
    }
  } else {
    adminApp = getApps()[0];
  }

  db = getFirestore(adminApp, config.firestoreDatabaseId);
  auth = getAuth(adminApp);

  return { db, auth, adminApp };
}

// Initialize immediately so db and auth exports are available
initFirebaseAdmin();

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
