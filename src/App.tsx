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
import { EbookCreator } from './components/EbookCreator';
import { PublishingQueue } from './components/PublishingQueue';
import { Analytics } from './components/Analytics';
import ExecutiveDashboard from './pages/executive';
import { AgentManagement } from './components/AgentManagement';
import { AffiliateMatch } from './components/AffiliateMatch';
import { TrafficEngine } from './components/TrafficEngine';
import { CreatorNetwork } from './components/CreatorNetwork';
import { SEOClusters } from './components/SEOClusters';
import { IntelligenceCenter } from './components/IntelligenceCenter';
import { KeywordExplorer } from './components/KeywordExplorer';
import { AutomationSuite } from './components/AutomationSuite';
import { NotificationProvider } from './components/NotificationContext';
import { NotificationToast } from './components/NotificationToast';
import { NotificationDrawer } from './components/NotificationDrawer';
import { LandingPage } from './components/LandingPage';

import EarnPage from './pages/rewards/EarnPage';
import WalletPage from './pages/rewards/WalletPage';
import WithdrawPage from './pages/rewards/WithdrawPage';
import AdminRewardsPage from './pages/rewards/AdminRewardsPage';

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
            <Route path="/" element={<Dashboard />} />
            <Route path="/new" element={<CampaignBuilder />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/ebooks" element={<EbookCreator />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/pins" element={<PinsPage />} />
            <Route path="/publishing" element={<PublishingQueue />} />
            <Route path="/clusters" element={<SEOClusters />} />
            <Route path="/keywords" element={<KeywordExplorer />} />
            <Route path="/automation" element={<AutomationSuite />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/executive" element={<ExecutiveDashboard />} />
            <Route path="/affiliate-match" element={<AffiliateMatch />} />
            <Route path="/traffic-engine" element={<TrafficEngine />} />
            <Route path="/creator-network" element={<CreatorNetwork />} />
            <Route path="/intel-digest" element={<IntelligenceCenter />} />
            <Route path="/agents" element={<AgentManagement />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* EarnPulse GPT Layers */}
            <Route path="/earn" element={<EarnPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/withdraw" element={<WithdrawPage />} />
            <Route path="/admin/rewards" element={<AdminRewardsPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <NotificationToast />
      <NotificationDrawer />
    </NotificationProvider>
  );
}
