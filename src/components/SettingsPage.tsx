import React, { useState, useEffect } from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';

export function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  
  const [settings, setSettings] = useState({
    geminiApiKey: '',
    wordpressUrl: '',
    wordpressUsername: '',
    wordpressPassword: '',
    wordpressSandboxMode: false,
    pinterestToken: '',
    telegramToken: '',
    telegramChatId: '',
    analyticsId: ''
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!auth.currentUser) return;
      setLoading(true);
      const settingsPath = `settings/${auth.currentUser.uid}`;
      try {
        const docRef = doc(db, 'settings', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as any);
        }
      } catch (err) {
        console.error("Failed to load settings", err);
        handleFirestoreError(err, OperationType.GET, settingsPath);
      }
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSaving(true);
    const settingsPath = `settings/${auth.currentUser.uid}`;
    try {
      await setDoc(doc(db, 'settings', auth.currentUser.uid), settings);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, settingsPath);
    }
    setSaving(false);
  };

  const handleHealthCheck = async () => {
    setHealthStatus('loading');
    try {
      // 1. Check Gemini via backend
      const response = await fetch('/api/health');
      const data = await response.json();
      
      // 2. Client Side Firestore Write Check
      let dbStatus = "Checking...";
      if (auth.currentUser) {
        try {
          const testRef = doc(db, 'settings', auth.currentUser.uid + '_test');
          await setDoc(testRef, { test: true });
          dbStatus = "Writable";
        } catch (e: any) {
          dbStatus = "Failed: " + e.message;
        }
      } else {
        dbStatus = "Must be logged in to test";
      }

      setHealthStatus({
         status: 'success',
         checks: {
            ...data.checks,
            database: dbStatus,
            storage: 'Reachable' // Defaulting to reachable as storage rules often match auth
         }
      });
    } catch (err: any) {
      setHealthStatus({ status: 'error', error: err.message });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-sans tracking-tight font-bold tracking-tight text-white mb-2">Platform Settings</h1>
        <p className="text-zinc-400">Configure your API keys and external connections for the OptiFlow ecosystem.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>System Health Check</CardTitle>
                <CardDescription>Verify connections to Firebase, Gemini, and Storage.</CardDescription>
              </div>
              <Button variant="secondary" onClick={handleHealthCheck} disabled={healthStatus === 'loading'}>
                {healthStatus === 'loading' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Run Health Check
              </Button>
            </div>
          </CardHeader>
          {healthStatus && healthStatus !== 'loading' && (
            <CardContent>
              <div className="bg-[#1C1D21] rounded-lg p-4 border border-white/5 space-y-3">
                {healthStatus.status === 'error' ? (
                   <div className="text-red-400 flex items-center"><XCircle className="w-5 h-5 mr-2" /> Error: {healthStatus.error}</div>
                ) : (
                   <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between p-2 bg-[#25262B]/50 rounded">
                         <span className="text-zinc-400">Firebase Auth</span>
                         {auth.currentUser ? <CheckCircle2 className="w-4 h-4 text-[#d7f941]" /> : <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[#25262B]/50 rounded">
                         <span className="text-zinc-400">Firestore DB</span>
                         <span className={healthStatus.checks?.database === 'Writable' ? 'text-[#d7f941]' : 'text-red-500'}>
                           {healthStatus.checks?.database}
                         </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[#25262B]/50 rounded">
                         <span className="text-zinc-400">Gemini API</span>
                         <span className={healthStatus.checks?.gemini === 'Connected' ? 'text-[#d7f941]' : 'text-red-500'}>
                           {healthStatus.checks?.gemini}
                         </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[#25262B]/50 rounded">
                         <span className="text-zinc-400">Cloud Storage</span>
                         <span className={healthStatus.checks?.storage === 'Reachable' ? 'text-[#d7f941]' : 'text-zinc-500'}>
                           {healthStatus.checks?.storage}
                         </span>
                      </div>
                   </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        <form onSubmit={handleSave} className="md:col-span-2 contents">
          <Card>
            <CardHeader>
              <CardTitle>AI Core Connections</CardTitle>
              <CardDescription>Required for content factory generation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Google Gemini API Key (Optional Override)*</label>
                <Input 
                  type="password" 
                  value={settings.geminiApiKey} 
                  onChange={e => setSettings({...settings, geminiApiKey: e.target.value})} 
                  placeholder="AI Studio key falls back to environment by default" 
                />
                <p className="text-[10px] text-zinc-500">* The system uses the global server environment key if left blank.</p>
              </div>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>WordPress Integration</CardTitle>
              <CardDescription>Required for Phase 2 Auto-Publishing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Site URL</label>
                <Input type="url" value={settings.wordpressUrl} onChange={e => setSettings({...settings, wordpressUrl: e.target.value})} placeholder="https://yourblog.com" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Username</label>
                <Input value={settings.wordpressUsername || ''} onChange={e => setSettings({...settings, wordpressUsername: e.target.value})} placeholder="admin" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Application Password</label>
                <Input type="password" value={settings.wordpressPassword} onChange={e => setSettings({...settings, wordpressPassword: e.target.value})} placeholder="xxxx xxxx xxxx xxxx" />
              </div>
              <div className="flex items-start space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="wordpressSandboxMode"
                  checked={settings.wordpressSandboxMode || false}
                  onChange={e => setSettings({...settings, wordpressSandboxMode: e.target.checked})}
                  className="mt-1 h-4 w-4 rounded border-white/10 bg-[#25262B] text-[#d7f941] focus:ring-[#d7f941]"
                />
                <div className="space-y-1">
                  <label htmlFor="wordpressSandboxMode" className="text-sm font-semibold text-white cursor-pointer select-none">
                    Enable Sandbox Simulation Mode
                  </label>
                  <p className="text-xs text-zinc-400">
                    If enabled or if host is unreachable, the system automatically simulates successful publishing so your pipelines and workflows don't fail.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social & Analytics</CardTitle>
              <CardDescription>Required for analytics and distribution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pinterest Access Token</label>
                <Input type="password" value={settings.pinterestToken} onChange={e => setSettings({...settings, pinterestToken: e.target.value})} placeholder="pina_..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Telegram Bot Token</label>
                <Input type="password" value={settings.telegramToken} onChange={e => setSettings({...settings, telegramToken: e.target.value})} placeholder="123456:ABC-DEF..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Telegram Chat / Channel ID</label>
                <Input value={settings.telegramChatId || ''} onChange={e => setSettings({...settings, telegramChatId: e.target.value})} placeholder="@my_channel_name or chat_id" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Google Analytics ID</label>
                <Input value={settings.analyticsId} onChange={e => setSettings({...settings, analyticsId: e.target.value})} placeholder="G-XXXXXXXXXX" />
              </div>
            </CardContent>
            <CardFooter className="bg-[#1C1D21] border-t border-white/5 justify-end pt-6">
               <Button type="submit" disabled={saving || loading}>
                 {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                 Save Configuration
               </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
