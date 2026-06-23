/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './lib/firebase';
import { loginWithGoogle, loginAnonymously } from './lib/auth';
import { onAuthStateChanged, User } from 'firebase/auth';

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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [guestLoading, setGuestLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

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
      if (error?.code === 'auth/operation-not-allowed') {
        setAuthError('Guest Access (Anonymous sign-in) is disabled. To activate: open the app in a new tab to use Google, or go to your Firebase Console -> Authentication -> Sign-in Method to enable "Anonymous".');
      } else {
        setAuthError(`Guest login error: ${error?.message || 'Failed to sign in anonymously.'}`);
      }
    } finally {
      setGuestLoading(false);
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <LandingPage 
        handleLogin={handleLogin} 
        handleGuestLogin={handleGuestLogin} 
        guestLoading={guestLoading} 
        authError={authError} 
      />
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
