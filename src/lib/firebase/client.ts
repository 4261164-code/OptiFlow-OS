import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import appletConfig from '../../../firebase-applet-config.json';
import { FirebaseConfig } from './types';

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

export function initFirebaseClient() {
  if (app) return { app, db: db!, auth: auth! };

  // Support VITE_ prefix environment variables for production environment builds,
  // and fall back to workspace development configuration.
  const firebaseConfig: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId,
  };

  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app, import.meta.env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId);
  auth = getAuth(app);

  return { app, db, auth };
}

initFirebaseClient();

export { app, db, auth };
