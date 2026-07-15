import { db, auth, adminApp, DatabaseError, handleServerError, hasServiceAccount } from '../src/lib/firebase/admin';

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

export { db, auth, adminApp, DatabaseError, handleServerError, hasServiceAccount };
