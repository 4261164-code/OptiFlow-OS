import { signInWithPopup, GoogleAuthProvider, signOut, signInAnonymously } from 'firebase/auth';
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

export async function apiFetch(url: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  
  const token = await user.getIdToken();
  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${token}`
  };

  return fetch(url, { ...options, headers });
}
