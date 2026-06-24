import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  signInAnonymously, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from './firebase';

export async function signUpWithEmail(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error creating account:", error);
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
}

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
    const wasSandbox = localStorage.getItem('sandbox_developer_user') !== null;
    localStorage.removeItem('sandbox_developer_user');
    await signOut(auth);
    if (wasSandbox) {
      window.location.reload();
    }
  } catch (error) {
    console.error("Error signing out", error);
  }
}

export async function getAuthToken() {
  if (localStorage.getItem('sandbox_developer_user')) {
    return 'sandbox-developer-bypass-token';
  }
  const user = auth.currentUser;
  if (!user) return "";
  return await user.getIdToken(true);
}

function waitForUser(): Promise<import('firebase/auth').User> {
  return new Promise((resolve, reject) => {
    const savedSandbox = localStorage.getItem('sandbox_developer_user');
    if (savedSandbox) {
      try {
        const parsed = JSON.parse(savedSandbox);
        parsed.getIdToken = async () => 'sandbox-developer-bypass-token';
        resolve(parsed as any);
        return;
      } catch (e) {
        localStorage.removeItem('sandbox_developer_user');
      }
    }

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

  if (!response.ok) {
    const clone = response.clone();
    const contentType = clone.headers.get('content-type');
    let errorMessage = `Server Error (${response.status})`;
    
    try {
      if (contentType && contentType.includes('application/json')) {
        const errData = await clone.json();
        errorMessage = errData.error || errData.message || errorMessage;
      } else {
        const text = await clone.text();
        errorMessage = text.substring(0, 100) || errorMessage;
      }
    } catch (e) {
      // Ignore error parsing issues
    }
    
    throw new Error(errorMessage);
  }

  return response;
}

