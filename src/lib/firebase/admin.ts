import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getAppletConfig } from './config';

let adminApp: App | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

export const hasServiceAccount = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

export function initFirebaseAdmin() {
  if (adminApp) return { db: db!, auth: auth!, adminApp, hasServiceAccount };

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
        projectId: config.projectId
      });
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️ Firebase Admin credentials missing in production. Expect PERMISSION_DENIED on reads/writes.');
      } else {
        console.warn('⚠️ Firebase Admin credentials missing. Run "npm run setup" or provide Service Account ENV vars.');
      }
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

export { db, auth, adminApp };

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function handleServerError(error: unknown): never {
  const code = (error as { code?: string | number }).code;
  if (code === 'permission-denied' || code === 7 || (error instanceof Error && error.message.includes('PERMISSION_DENIED'))) {
    throw new DatabaseError(
      'DATABASE_UNAVAILABLE: Firestore permission denied. ' +
      'Check FIREBASE_PRIVATE_KEY and service account permissions in Firebase Console.'
    );
  }
  if (error instanceof Error && error.message.includes('Service Account')) {
    throw new DatabaseError(error.message);
  }
  throw error as Error;
}
