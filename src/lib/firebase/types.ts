// /src/lib/firebase/types.ts
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface AdminCredential {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}
