/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './lib/firebase';
import { loginWithGoogle, loginAnonymously } from './lib/auth';
import { onAuthStateChanged, User } from 'firebase/auth';
import { disableNetwork, enableNetwork, doc, getDoc, setDoc } from 'firebase/firestore';
import { ShieldAlert, LogOut, Loader2, Key, Check } from 'lucide-react';

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
  const [userApproved, setUserApproved] = useState<boolean | null>(null);
  const [checkingApproval, setCheckingApproval] = useState<boolean>(false);

  const verifyAccessAndOnboarding = async () => {
    if (!user) return;
    setCheckingApproval(true);
    setCheckingOnboarding(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      let isApproved = false;
      let role = 'creator';

      // Auto-approve primary owner email
      if (user.email === '4261164@myuwc.ac.za') {
        isApproved = true;
        role = 'admin';
      }

      if (userSnap.exists()) {
        const userData = userSnap.data();
        isApproved = userData.approved === true || isApproved;
        
        // Keep Firestore in sync if owner wasn't marked approved or admin
        if (user.email === '4261164@myuwc.ac.za' && (userData.approved !== true || userData.role !== 'admin')) {
          await setDoc(userRef, { approved: true, role: 'admin' }, { merge: true });
        }
      } else {
        // New user sign-in: write initial profile doc as unapproved (unless they are owner)
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || 'anonymous@optiflow.io',
          approved: isApproved,
          role: role,
          displayName: user.displayName || 'Pending User',
          createdAt: new Date().toISOString()
        }, { merge: true });
      }

      setUserApproved(isApproved);

      // Check onboarding state
      const settingsRef = doc(db, 'settings', user.uid);
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists() && settingsSnap.data().onboardingCompleted) {
        setOnboardingCompleted(true);
      } else {
        setOnboardingCompleted(false);
      }
    } catch (err) {
      console.error("Failed to verify user access/onboarding:", err);
      // Fallback for safety (owner is always approved)
      if (user.email === '4261164@myuwc.ac.za') {
        setUserApproved(true);
      } else {
        setUserApproved(false);
      }
      setOnboardingCompleted(true);
    } finally {
      setCheckingApproval(false);
      setCheckingOnboarding(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setOnboardingCompleted(true);
      setUserApproved(null);
      return;
    }

    // Bypass onboarding/approval for default sandbox developer user
    if (localStorage.getItem('sandbox_developer_user')) {
      setOnboardingCompleted(true);
      setUserApproved(true);
      return;
    }

    verifyAccessAndOnboarding();
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

  if (loading || checkingOnboarding || checkingApproval) return null;

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

  if (userApproved === false) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#040507] text-zinc-200 overflow-y-auto font-sans">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-rose-500/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="w-full max-w-lg bg-[#0c0e14] border border-rose-500/10 rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden text-center space-y-6">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-16 h-16 flex items-center justify-center bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-500 mx-auto animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.15)]">
            <ShieldAlert size={32} />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-rose-500/15 text-rose-400 px-3 py-1 rounded-full font-mono border border-rose-500/25">
              Access Pending Verification
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight pt-2">OptiFlow Sandbox Enclave</h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
              This environment is currently restricted to approved developer and white-listed analyst accounts. Public access is currently disabled.
            </p>
          </div>

          {/* User diagnostics terminal block */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-left font-mono text-[11px] space-y-2 text-zinc-400">
            <div className="flex justify-between border-b border-white/5 pb-1.5 mb-1.5">
              <span className="text-zinc-500">PARAMETER</span>
              <span className="text-zinc-500">VALUE</span>
            </div>
            <div className="flex justify-between">
              <span>Account Email</span>
              <span className="text-white truncate max-w-[180px]">{user.email || 'anonymous@optiflow.io'}</span>
            </div>
            <div className="flex justify-between">
              <span>Identity Hash</span>
              <span className="text-[#a8ff35] truncate max-w-[180px]">{user.uid}</span>
            </div>
            <div className="flex justify-between">
              <span>Governance State</span>
              <span className="text-amber-400 font-bold">Unverified / Pending</span>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500">
            Please share your Identity Hash with your primary system administrator to authorize instant sandbox clearance.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
            <button
              onClick={() => verifyAccessAndOnboarding()}
              className="px-5 py-2.5 bg-[#a8ff35] hover:bg-[#baff4c] text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-all"
            >
              <Check size={14} strokeWidth={3} />
              Re-Verify Access
            </button>
            <button
              onClick={async () => {
                try {
                  localStorage.removeItem('sandbox_developer_user');
                  await auth.signOut();
                  setUser(null);
                  setUserApproved(null);
                } catch (err) {
                  console.error(err);
                }
              }}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
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
