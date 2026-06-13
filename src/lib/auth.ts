import { signInWithPopup, GoogleAuthProvider, signOut, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
}

export async function loginAnonymously() {
  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.error("Error signing in anonymously", error);
    throw error;
  }
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
}

export async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) return "";
  return await user.getIdToken(true);
}

function waitForUser(): Promise<import('firebase/auth').User> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) resolve(user);
      else reject(new Error('No authenticated user'));
    });
  });
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const user = await waitForUser();
  const token = await user.getIdToken(true);

  // Use robust standard Headers API to merge headers safely
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  
  if (options.headers) {
    const passedHeaders = new Headers(options.headers);
    passedHeaders.forEach((value, name) => {
      headers.set(name, value);
    });
  }
  
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    throw new Error('Unauthorized — token rejected by server');
  }

  return response;
}

