import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "../firebase-applet-config.json" assert { type: "json" };

const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
const databaseId = process.env.FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId;

console.log(`[firebaseAdmin] Initializing with ProjectID: ${projectId}, DatabaseID: ${databaseId}`);

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: projectId,
  });
}

// Access the specific named database
export const db = getFirestore(undefined, databaseId);
