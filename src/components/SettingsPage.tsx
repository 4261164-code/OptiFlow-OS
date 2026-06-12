import React, { useState, useEffect } from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';

export function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  
  const [purging, setPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState<string | null>(null);
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handlePurgeAllData = async () => {
    if (!auth.currentUser) return;
    if (confirmText.toUpperCase() !== 'PURGE') {
      setPurgeError("Verification signature does not match. Please enter 'PURGE' to verify.");
      return;
    }

    setPurging(true);
    setPurgeSuccess(null);
    setPurgeError(null);

    try {
      const uid = auth.currentUser.uid;
      const collectionsToPurge = ['articles', 'pins', 'jobs', 'offers', 'ebooks', 'agent_logs', 'automationLogs', 'topic_clusters', 'article_metrics'];
      let deletedCount = 0;

      for (const colName of collectionsToPurge) {
        const q = query(collection(db, colName), where('userId', '==', uid));
        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
        await Promise.all(deletePromises);
        deletedCount += querySnapshot.size;
      }

      setPurgeSuccess(`Structural wipeout complete. Restored baseline system parameters and cleaned ${deletedCount} analytics records.`);
      setConfirmText('');
      setShowPurgeConfirm(false);
    } catch (err: any) {
      console.error("Purge failure:", err);
      setPurgeError(err.message || "Failed to finalize database purge.");
    } finally {
      setPurging(false);
    }
  };

  const [settings, setSettings] = useState({
    geminiApiKey: '',
    openaiApiKey: '',
    nvidiaApiKey: '',
    midjourneyApiKey: '',
    midjourneyEndpoint: '',
    wordpressUrl: '',
    wordpressUsername: '',
    wordpressPassword: '',
    wordpressSandboxMode: false,
    pinterestToken: '',
    telegramToken: '',
    telegramChatId: '',
    twitterToken: '',
    linkedinToken: '',
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

  const [testingLinkedin, setTestingLinkedin] = useState(false);
  const [linkedinTestResult, setLinkedinTestResult] = useState<{ success: boolean; name?: string; urn?: string; error?: string; notice?: string } | null>(null);

  const testLinkedInConnection = async () => {
    if (!auth.currentUser) return;
    setTestingLinkedin(true);
    setLinkedinTestResult(null);
    try {
      // Auto-save active configuration settings to Firestore so server uses latest input
      await setDoc(doc(db, 'settings', auth.currentUser.uid), settings);

      const response = await fetch('/api/test-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: auth.currentUser.uid })
      });

      const data = await response.json();
      setLinkedinTestResult(data);
    } catch (err: any) {
      setLinkedinTestResult({
        success: false,
        error: err.message || "Network request failed while testing connection."
      });
    } finally {
      setTestingLinkedin(false);
    }
  };

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
      if (!response.ok) throw new Error("Backend health endpoint unreachable");
      const data = await response.json();
      
      // 2. Client Side Firestore Write Check
      let dbStatus = "Checking...";
      if (auth.currentUser) {
        try {
          const testRef = doc(db, 'settings', auth.currentUser.uid + '_test');
          await setDoc(testRef, { test: true });
          dbStatus = "Writable";
        } catch (e: any) {
          dbStatus = "Degraded (Permission Denied)";
          console.warn("Firestore write check failed:", e);
        }
      } else {
        dbStatus = "Must be logged in to test";
      }

      setHealthStatus({
         status: 'success',
         checks: {
            ...data.checks,
            database: dbStatus,
            openai: settings.openaiApiKey ? "Key Provided" : "Not configured",
            nvidia: settings.nvidiaApiKey ? "Key Provided" : "Not configured",
            midjourney: settings.midjourneyApiKey ? "Key Provided" : "Not configured",
            storage: 'Reachable' 
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
                {healthStatus === 'loading' ? <Loader2 className="w-5 h-5 mr-2 animate-spin stroke-[2.8]" /> : null}
                Run Health Check
              </Button>
            </div>
          </CardHeader>
          {healthStatus && healthStatus !== 'loading' && (
            <CardContent>
              <div className="bg-[#1C1D21] rounded-lg p-4 border border-white/5 space-y-3">
                {healthStatus.status === 'error' ? (
                   <div className="text-red-400 flex items-center"><XCircle className="w-5.5 h-5.5 mr-2 stroke-[2.8]" /> Error: {healthStatus.error}</div>
                ) : (
                   <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between p-2 bg-[#25262B]/50 rounded">
                         <span className="text-zinc-400">Firebase Auth</span>
                         {auth.currentUser ? <CheckCircle2 className="w-5 h-5 text-[#d7f941] stroke-[2.8]" /> : <XCircle className="w-5 h-5 text-red-500 stroke-[2.8]" />}
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[#25262B]/50 rounded">
                         <span className="text-zinc-400">Firestore DB</span>
                         <span className={healthStatus.checks?.database === 'Writable' ? 'text-[#d7f941]' : 'text-red-500'}>
                           {healthStatus.checks?.database}
                         </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[#25262B]/50 rounded">
                         <span className="text-zinc-400">Gemini API</span>
                         <span className={healthStatus.checks?.gemini === 'Connected' ? 'text-[#d7f941]' : 'text-rose-400'}>
                           {healthStatus.checks?.gemini}
                         </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[#25262B]/50 rounded">
                         <span className="text-zinc-400">OpenAI Fallback</span>
                         <span className={healthStatus.checks?.openai === 'Key Provided' ? 'text-[#d7f941]' : 'text-zinc-500'}>
                           {healthStatus.checks?.openai}
                         </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[#25262B]/50 rounded">
                         <span className="text-zinc-400">NVIDIA NIM</span>
                         <span className={healthStatus.checks?.nvidia === 'Key Provided' ? 'text-[#d7f941]' : 'text-zinc-500'}>
                           {healthStatus.checks?.nvidia}
                         </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-[#25262B]/50 rounded">
                         <span className="text-zinc-400">Midjourney</span>
                         <span className={healthStatus.checks?.midjourney === 'Key Provided' ? 'text-[#d7f941]' : 'text-zinc-500'}>
                           {healthStatus.checks?.midjourney}
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
              <div className="space-y-4">
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
                
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">OpenAI API Key (Optional)</label>
                  <Input 
                    type="password" 
                    value={settings.openaiApiKey || ''} 
                    onChange={e => setSettings({...settings, openaiApiKey: e.target.value})} 
                    placeholder="sk-..." 
                  />
                  <p className="text-[10px] text-zinc-500">Enables GPT-4o for complex reasoning and eBook creation fallback.</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">NVIDIA NIM API Key</label>
                  <Input 
                    type="password" 
                    value={settings.nvidiaApiKey || ''} 
                    onChange={e => setSettings({...settings, nvidiaApiKey: e.target.value})} 
                    placeholder="nvapi-..." 
                  />
                  <p className="text-[10px] text-zinc-500">Used for High-Scale Llama-3.1 405B inference and fallbacks.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Midjourney API Key</label>
                    <Input 
                      type="password" 
                      value={settings.midjourneyApiKey || ''} 
                      onChange={e => setSettings({...settings, midjourneyApiKey: e.target.value})} 
                      placeholder="API Key for MJ wrapper" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">MJ API Endpoint</label>
                    <Input 
                      type="url" 
                      value={settings.midjourneyEndpoint || ''} 
                      onChange={e => setSettings({...settings, midjourneyEndpoint: e.target.value})} 
                      placeholder="https://api.imagineapi.dev/v1/..." 
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 md:col-span-2">Required for custom Midjourney generation. Supports standard imagineapi/goapi bridges.</p>
                </div>
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
                <Input type="password" value={settings.pinterestToken || ''} onChange={e => setSettings({...settings, pinterestToken: e.target.value})} placeholder="pina_..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">X (Twitter) Developer Token / Bearer</label>
                  <Input type="password" value={settings.twitterToken || ''} onChange={e => setSettings({...settings, twitterToken: e.target.value})} placeholder="X API Bearer token..." />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">LinkedIn Access Token</label>
                  <Input type="password" value={settings.linkedinToken || ''} onChange={e => setSettings({...settings, linkedinToken: e.target.value})} placeholder="LinkedIn UGC access token..." />
                  
                  <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] text-zinc-400 leading-normal">Requires <code className="bg-white/5 px-1 py-0.5 rounded text-[9px]">w_member_social</code> or UGC post credentials.</span>
                    <button
                      type="button"
                      onClick={testLinkedInConnection}
                      disabled={testingLinkedin || !settings.linkedinToken}
                      className="text-[10px] font-bold uppercase tracking-wider text-[#d7f941] bg-white/5 border border-[#d7f941]/20 hover:bg-[#d7f941]/5 disabled:opacity-50 px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1.5"
                    >
                      {testingLinkedin ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-[#d7f941]" />
                          Testing Authenticator...
                        </>
                      ) : (
                        "Test API Connection"
                      )}
                    </button>
                  </div>

                  {linkedinTestResult && (
                    <div className={`mt-2 p-2 rounded text-xs leading-relaxed border ${
                      linkedinTestResult.success 
                        ? 'bg-green-500/5 border-green-500/20 text-green-300' 
                        : 'bg-red-500/5 border-red-500/20 text-red-300'
                    }`}>
                      {linkedinTestResult.success ? (
                        <div className="space-y-1">
                          <p className="font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 inline" />
                            <span>Authentication Successful!</span>
                          </p>
                          <p className="text-[10px] text-zinc-300 break-all">
                            Connected: <strong className="text-white">{linkedinTestResult.name}</strong> <span className="text-zinc-500">({linkedinTestResult.urn})</span>
                          </p>
                          {linkedinTestResult.notice && (
                            <p className="text-[9px] text-[#d7f941] font-medium italic">{linkedinTestResult.notice}</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-red-400 inline" />
                            <span>Authentication Rejected</span>
                          </p>
                          <p className="text-[10px] text-zinc-300 break-all">{linkedinTestResult.error}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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

        {/* PREMIUM ACCOUNT RESET & PURGE DANGER ZONE */}
        <Card className="border border-rose-500/20 bg-rose-500/[0.01] overflow-hidden rounded-[32px]">
          <CardHeader className="border-b border-rose-500/10 bg-rose-500/5 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-white text-lg font-bold">Danger Zone // System Restitution</CardTitle>
                <CardDescription className="text-rose-400/70 text-xs">Irreversible core data purge and statistics rollback.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6.5 space-y-6">
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Purges all generated content assets (Campaign blueprints, articles, Pinterest visual designs, background executions, matched offers) associated with your user session. System analytics dashboard and activity grids will reset to zero database records.
            </p>

            {purgeSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-4 text-xs font-mono">
                {purgeSuccess}
              </div>
            )}

            {purgeError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl p-4 text-xs font-mono">
                {purgeError}
              </div>
            )}

            {showPurgeConfirm ? (
              <div className="bg-zinc-950/65 border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-[#6B6E7B] font-bold">
                    Action Verification Signature
                  </label>
                  <p className="text-[11px] text-zinc-500">
                    To authorize a complete data wipeout, please type exactly <strong className="text-white select-all">PURGE</strong> below:
                  </p>
                </div>
                <Input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type PURGE to verify"
                  className="font-mono text-xs uppercase"
                />
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    onClick={handlePurgeAllData}
                    disabled={purging || confirmText.toUpperCase() !== 'PURGE'}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-5 py-4.5 rounded-2xl flex items-center gap-2 font-mono"
                  >
                    {purging ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        PURGING CORE DATABASES...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        CONFIRM STRUCTURAL WIPEOUT
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowPurgeConfirm(false);
                      setConfirmText('');
                      setPurgeError(null);
                    }}
                    className="text-zinc-400 hover:text-white text-xs px-4"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Button
                  onClick={() => setShowPurgeConfirm(true)}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs tracking-wide px-6 py-4 rounded-2xl transition duration-200"
                >
                  <Trash2 className="w-4 h-4 mr-2 text-rose-400" />
                  Wipe Database Records & Statistics
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
