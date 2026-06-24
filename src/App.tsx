/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './lib/firebase';
import { loginWithGoogle, loginAnonymously } from './lib/auth';
import { onAuthStateChanged, User } from 'firebase/auth';
import { disableNetwork, enableNetwork, doc, getDoc } from 'firebase/firestore';

import { AppLayout } from './components/AppLayout';
import { Overview } from './pages/dashboard/Overview';
import { ContentCommand } from './pages/dashboard/Content';
import { Offers } from './pages/dashboard/Offers';
import { Traffic } from './pages/dashboard/Traffic';
import { Creators } from './pages/dashboard/Creators';
import { AIBrain } from './pages/dashboard/AIBrain';
import { Automations } from './pages/dashboard/Automations';
import { Jobs } from './pages/dashboard/Jobs';
import { AnalyticsLab } from './pages/dashboard/AnalyticsLab';
import { SettingsPage } from './components/SettingsPage';
import { NotificationProvider } from './components/NotificationContext';
import { NotificationToast } from './components/NotificationToast';
import { NotificationDrawer } from './components/NotificationDrawer';
import { LandingPage } from './components/LandingPage';
import { OnboardingWizard } from './components/OnboardingWizard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [guestLoading, setGuestLoading] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(true);
  const [checkingOnboarding, setCheckingOnboarding] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      setOnboardingCompleted(true);
      return;
    }

    // Bypass onboarding for default sandbox developer user
    if (localStorage.getItem('sandbox_developer_user')) {
      setOnboardingCompleted(true);
      return;
    }

    const checkOnboarding = async () => {
      setCheckingOnboarding(true);
      try {
        const docRef = doc(db, 'settings', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().onboardingCompleted) {
          setOnboardingCompleted(true);
        } else {
          setOnboardingCompleted(false);
        }
      } catch (err) {
        console.error("Failed to check onboarding state, defaulting to completed:", err);
        setOnboardingCompleted(true);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [user]);

  useEffect(() => {
    // Check if there is an active sandbox session in localStorage
    const savedSandboxUser = localStorage.getItem('sandbox_developer_user');
    if (savedSandboxUser) {
      try {
        setUser(JSON.parse(savedSandboxUser));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('sandbox_developer_user');
      }
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (user && localStorage.getItem('sandbox_developer_user')) {
      disableNetwork(db).catch(err => console.warn('Could not disable network for sandbox:', err));
    } else {
      enableNetwork(db).catch(err => console.warn('Could not enable network:', err));
    }
  }, [user]);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
        setAuthError('Google Sign-In popup was blocked by your browser inside the preview iFrame. Please use the "Open App in New Tab" button or try "Dev Guest Access" below!');
      } else {
        setAuthError(`Sign-in error: ${error?.message || 'Failed to sign in.'}`);
      }
    }
  };

  const handleGuestLogin = async () => {
    setAuthError(null);
    setGuestLoading(true);
    try {
      await loginAnonymously();
    } catch (error: any) {
      console.error("Guest login failed:", error);
      const isRestricted = error?.code === 'auth/operation-not-allowed' || 
                           error?.code === 'auth/admin-restricted-operation' ||
                           error?.message?.includes('admin-restricted-operation') ||
                           error?.message?.includes('operation-not-allowed');

      if (isRestricted) {
        setAuthError(
          'Guest Access (Anonymous sign-in) is currently disabled or restricted on this Firebase project.\n' +
          'To enable anonymous sign-in:\n' +
          '1. Go to your Firebase Console (Authentication -> Sign-in Method tab).\n' +
          '2. Add/Enable the "Anonymous" provider and Save.\n' +
          'Alternatively, click "Launch App" to sign in securely with Google (opens in new tab if blocked), or use the Sandbox Bypass below!'
        );
      } else {
        setAuthError(`Guest login error: ${error?.message || 'Failed to sign in anonymously.'}`);
      }
    } finally {
      setGuestLoading(false);
    }
  };

  const handleSandboxBypass = () => {
    const sandboxUser = {
      uid: 'q8i1F0a4i5er1dvWI7xljYkwaSH2',
      email: '4261164@myuwc.ac.za',
      emailVerified: true,
      isAnonymous: false,
      displayName: 'Sandbox Developer',
    };
    localStorage.setItem('sandbox_developer_user', JSON.stringify(sandboxUser));
    setUser(sandboxUser as any);
  };

  if (loading || checkingOnboarding) return null;

  if (!user) {
    return (
      <LandingPage 
        handleLogin={handleLogin} 
        handleGuestLogin={handleGuestLogin} 
        handleSandboxBypass={handleSandboxBypass}
        guestLoading={guestLoading} 
        authError={authError} 
      />
    );
  }

  if (!onboardingCompleted) {
    return (
      <OnboardingWizard onComplete={() => setOnboardingCompleted(true)} />
    );
  }

  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/content" element={<ContentCommand />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/traffic" element={<Traffic />} />
            <Route path="/creators" element={<Creators />} />
            <Route path="/brain" element={<AIBrain />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/analytics" element={<AnalyticsLab />} />
            <Route path="/settings" element={<SettingsPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <NotificationToast />
      <NotificationDrawer />
    </NotificationProvider>
  );
}
