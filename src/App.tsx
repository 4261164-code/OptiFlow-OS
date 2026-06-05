/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './lib/firebase';
import { loginWithGoogle } from './lib/auth';
import { onAuthStateChanged, User } from 'firebase/auth';

import { AppLayout } from './components/AppLayout';
import { Dashboard } from './components/Dashboard';
import { CampaignBuilder } from './components/CampaignBuilder';
import { ArticlesPage } from './components/ArticlesPage';
import { OffersPage } from './components/OffersPage';
import { PinsPage } from './components/PinsPage';
import { SettingsPage } from './components/SettingsPage';
import { PublishingQueue } from './components/PublishingQueue';
import { Analytics } from './components/Analytics';
import { AgentManagement } from './components/AgentManagement';
import { AffiliateMatch } from './components/AffiliateMatch';
import { TrafficEngine } from './components/TrafficEngine';
import { CreatorNetwork } from './components/CreatorNetwork';
import { Button } from './components/ui';
import { Sparkles, Loader2, AlertCircle, ExternalLink, UserCheck, HelpCircle } from 'lucide-react';

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
      const { loginAnonymously } = await import('./lib/auth');
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090B] text-zinc-200">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090B] p-4 text-zinc-200">
        <div className="w-full max-w-lg bg-[#161618] border border-white/5 p-8 rounded-2xl shadow-xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-full h-full rounded-2xl object-cover shadow-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-sans tracking-tight font-bold text-white flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-[#d7f941]" />
              Welcome to AffiliateOS
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Automate your affiliate campaigns, WordPress publishing, and SEO generation.
            </p>
          </div>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs flex items-start text-left leading-relaxed space-y-1 flex-col">
              <div className="flex items-center gap-2 font-semibold text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Authentication Helper</span>
              </div>
              <p className="pl-6 text-zinc-300">{authError}</p>
            </div>
          )}

          <div className="space-y-3">
            {/* 1. Primary Open in New Tab Button (Recommended for iFrames) */}
            <a 
              href={window.location.origin} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#d7f941]/20 to-[#d7f941]/30 hover:from-[#d7f941]/30 hover:to-[#d7f941]/40 border border-[#d7f941]/30 text-[#d7f941] font-semibold text-sm transition-all shadow-md group"
            >
              <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              1. Open App in New Tab (Recommended)
            </a>

            {/* 2. Standard Continue with Google */}
            <button 
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white font-medium text-sm transition-all border border-white/5 active:scale-[0.98]"
              onClick={handleLogin}
            >
              Sign in with Google
            </button>

            {/* 3. Dev Guest / Anonymous Sign In */}
            <button 
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25262B] hover:bg-[#2D2E33] text-zinc-300 font-semibold text-xs tracking-wide uppercase transition-all border border-white/5 disabled:opacity-50 active:scale-[0.98]"
              disabled={guestLoading}
              onClick={handleGuestLogin}
            >
              {guestLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d7f941]" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-[#d7f941]" />
              )}
              Option 2: Sign in as Guest / Developer
            </button>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-1.5 text-zinc-500 text-[11px]">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Running in Sandboxed Preview? Choose New Tab or Guest Access.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<CampaignBuilder />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/pins" element={<PinsPage />} />
          <Route path="/publishing" element={<PublishingQueue />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/affiliate-match" element={<AffiliateMatch />} />
          <Route path="/traffic-engine" element={<TrafficEngine />} />
          <Route path="/creator-network" element={<CreatorNetwork />} />
          <Route path="/agents" element={<AgentManagement />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
