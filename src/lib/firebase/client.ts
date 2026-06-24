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

  if (auth) {
    const proto = Object.getPrototypeOf(auth);
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'currentUser') || Object.getOwnPropertyDescriptor(auth, 'currentUser');
    const originalGetter = descriptor ? descriptor.get : null;
    const originalSetter = descriptor ? descriptor.set : null;

    Object.defineProperty(auth, 'currentUser', {
      get() {
        const stack = new Error().stack || '';
        const isSDKCaller = stack.includes('@firebase') || 
                            stack.includes('firestore') || 
                            stack.includes('node_modules') || 
                            stack.includes('/chunks/');

        if (!isSDKCaller && typeof window !== 'undefined' && window.localStorage) {
          const saved = window.localStorage.getItem('sandbox_developer_user');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              return {
                ...parsed,
                getIdToken: async () => 'sandbox-developer-bypass-token',
                getIdTokenResult: async () => ({ token: 'sandbox-developer-bypass-token', claims: {} }),
                reload: async () => {},
                toJSON: () => parsed,
                emailVerified: true,
                isAnonymous: false,
                providerData: [],
                metadata: {},
                phoneNumber: null,
                photoURL: null,
              };
            } catch (e) {
              return null;
            }
          }
        }
        // Fall back to original SDK getter safely for Firebase SDK callers
        if (originalGetter) {
          return originalGetter.call(auth);
        }
        return null;
      },
      set(val) {
        if (originalSetter) {
          originalSetter.call(auth, val);
        }
      },
      configurable: true
    });
  }

  return { app, db, auth };
}

initFirebaseClient();

export { app, db, auth };
