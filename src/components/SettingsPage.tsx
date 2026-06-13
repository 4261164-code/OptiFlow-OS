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

  const [settings, setSettings] = useState<any>({
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
    analyticsId: '',
    agentOverrides: {
      "CEO Strategic Executive": { provider: 'default', customApiKey: '', customModel: '' },
      "Writer Agent": { provider: 'default', customApiKey: '', customModel: '' },
      "Pinterest Agent": { provider: 'default', customApiKey: '', customModel: '' },
      "Research Agent": { provider: 'default', customApiKey: '', customModel: '' }
    }
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
          const data = docSnap.data();
          setSettings((prev: any) => ({
            ...prev,
            ...data,
            agentOverrides: {
              ...prev.agentOverrides,
              ...(data.agentOverrides || {})
            }
          }));
        }
      } catch (err) {
        console.error("Failed to load settings", err);
        handleFirestoreError(err, OperationType.GET, settingsPath);
      }
      setLoading(false);
    };
    loadSettings();
  }, []);

  const [testingAll, setTestingAll] = useState(false);
  const [testStates, setTestStates] = useState<Record<string, {
    status: 'idle' | 'testing' | 'success' | 'failed';
    message?: string;
    details?: string;
    error?: string;
  }>>({});

  const integrationsList = [
    { id: 'gemini', name: 'Google Gemini', category: 'Core AI Platform', desc: 'Runs core intelligence, pipelines, agent reasoning, and self-improving CEO decisions.' },
    { id: 'openai', name: 'OpenAI (GPT-4o)', category: 'Reasoning Fallback', desc: 'Drives eBook chapter compilers and advanced content synthetics.' },
    { id: 'nvidia', name: 'NVIDIA NIM Catalog', category: 'Computing Clusters', desc: 'Validates Llama-3.1 405B routing fallbacks and bulk content pipelines.' },
    { id: 'midjourney', name: 'Midjourney Engine', category: 'Creative Graphic Agency', desc: 'Generates pin vectors, article header concepts, and layout mockups.' },
    { id: 'wordpress', name: 'WordPress Blog Connector', category: 'Auto-Publishing', desc: 'Saves Phase 2 XML-RPC credentials for auto-publishing draft campaigns.' },
    { id: 'pinterest', name: 'Pinterest Business', category: 'Social Distribution', desc: 'Exchanges authorized PIN syndication hooks to sync boards.' },
    { id: 'telegram', name: 'Telegram Broadcast', category: 'Social Alerts', desc: 'Fires instant lead alerts and live post notifications to channels.' },
    { id: 'linkedin', name: 'LinkedIn UGC Feed', category: 'Social Distribution', desc: 'Broadcasts executive summaries and marketing copies to feeds.' }
  ];

  const testSingleIntegration = async (integrationId: string) => {
    if (!auth.currentUser) return;
    setTestStates(prev => ({
      ...prev,
      [integrationId]: { status: 'testing' }
    }));

    try {
      // First, auto-save settings to capture any live field inputs
      await setDoc(doc(db, 'settings', auth.currentUser.uid), settings);

      const response = await fetch('/api/test-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId, userId: auth.currentUser.uid })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTestStates(prev => ({
          ...prev,
          [integrationId]: {
            status: 'success',
            message: data.message,
            details: data.details
          }
        }));
      } else {
        setTestStates(prev => ({
          ...prev,
          [integrationId]: {
            status: 'failed',
            error: data.error || "Handshake rejected by endpoint."
          }
        }));
      }
    } catch (err: any) {
      setTestStates(prev => ({
        ...prev,
        [integrationId]: {
          status: 'failed',
          error: err.message || "Network request failed."
        }
      }));
    }
  };

  const testAllIntegrations = async () => {
    setTestingAll(true);
    for (const item of integrationsList) {
      await testSingleIntegration(item.id);
      // Brief, pleasant staggering delay
      await new Promise(r => setTimeout(r, 450));
    }
    setTestingAll(false);
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-sans tracking-tight font-bold tracking-tight text-white mb-2">Platform Settings</h1>
        <p className="text-zinc-400">Configure your API keys and external connections for the OptiFlow ecosystem.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle>Integrations & AI API Diagnostics Matrix</CardTitle>
                <CardDescription>Run live real-time handshake validation checks across all configured generative providers and distribution channels.</CardDescription>
              </div>
              <Button type="button" variant="secondary" onClick={testAllIntegrations} disabled={testingAll}>
                {testingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin stroke-[2.8]" />
                    Sequencing All Handshakes...
                  </>
                ) : (
                  "Test All Connection Nodes"
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
              {integrationsList.map((item) => {
                const state = testStates[item.id] || { status: 'idle' };
                return (
                  <div key={item.id} className="bg-[#1C1D21] border border-white/5 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-white/10 transition-all duration-200">
                    <div className="space-y-1.5 animate-fade-in">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-white font-sans">{item.name}</h4>
                        <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-full text-zinc-400 font-mono tracking-wide uppercase">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed min-h-[36px]">
                        {item.desc}
                      </p>
                    </div>

                    <div className="flex flex-col space-y-2.5">
                      {state.status === 'success' && (
                        <div className="bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 px-3 py-2 rounded-xl text-xs leading-normal font-sans">
                          <span className="font-bold text-emerald-300 block mb-0.5">✓ Operational & Authenticated</span>
                          <span className="text-[10px] text-zinc-400 break-words block">{state.details || state.message}</span>
                        </div>
                      )}
                      {state.status === 'failed' && (
                        <div className="bg-rose-500/5 border border-rose-500/15 text-rose-400 px-3 py-2 rounded-xl text-xs leading-normal font-sans">
                          <span className="font-bold text-rose-300 block mb-0.5">❌ Handshake Rejected</span>
                          <span className="text-[10px] text-zinc-400 break-words block">{state.error}</span>
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={() => testSingleIntegration(item.id)}
                        disabled={state.status === 'testing' || testingAll}
                        className={`w-full py-3.5 text-xs font-bold font-mono tracking-widest uppercase transition-all duration-300 rounded-xl relative overflow-hidden ${
                          state.status === 'success'
                            ? 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.35)] text-white border-none'
                            : state.status === 'failed'
                            ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold'
                            : state.status === 'testing'
                            ? 'bg-zinc-800 text-zinc-400 border border-white/5 cursor-not-allowed'
                            : 'bg-[#25262B] hover:bg-[#2D2E35] text-zinc-200 hover:text-white border border-white/5 font-semibold'
                        }`}
                      >
                        {state.status === 'testing' ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Establishing...
                          </span>
                        ) : state.status === 'success' ? (
                          <span className="flex items-center justify-center gap-1 font-sans tracking-wide">
                            Connected & Active ✓
                          </span>
                        ) : state.status === 'failed' ? (
                          "Handshake Failed - Retry"
                        ) : (
                          "Ping Connection"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
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
              <CardTitle>Agent Model Overrides</CardTitle>
              <CardDescription>Assign specific AI providers and models to specialized agent nodes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(settings.agentOverrides).map(([agentName, override]: [string, any]) => (
                <div key={agentName} className="p-4 bg-[#1C1D21] border border-white/5 rounded-xl space-y-3">
                  <h4 className="text-sm font-bold text-white">{agentName}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase text-zinc-500">Provider</label>
                      <select 
                        value={override.provider}
                        onChange={e => setSettings({
                          ...settings, 
                          agentOverrides: { ...settings.agentOverrides, [agentName]: { ...override, provider: e.target.value } }
                        })}
                        className="w-full bg-[#0D1117] border border-white/10 rounded-lg p-2 text-sm text-white"
                      >
                        <option value="default">Default</option>
                        <option value="gemini">Gemini</option>
                        <option value="openai">OpenAI</option>
                        <option value="nvidia">NVIDIA NIM</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase text-zinc-500">Custom API Key</label>
                      <Input 
                        type="password" 
                        value={override.customApiKey} 
                        onChange={e => setSettings({
                          ...settings, 
                          agentOverrides: { ...settings.agentOverrides, [agentName]: { ...override, customApiKey: e.target.value } }
                        })}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase text-zinc-500">Custom Model</label>
                      <Input 
                        value={override.customModel} 
                        onChange={e => setSettings({
                          ...settings, 
                          agentOverrides: { ...settings.agentOverrides, [agentName]: { ...override, customModel: e.target.value } }
                        })}
                        placeholder="e.g. gpt-4o"
                      />
                    </div>
                  </div>
                </div>
              ))}
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
                  
                  <div className="pt-1">
                    <span className="text-[10px] text-zinc-400 leading-normal">Requires <code className="bg-white/5 px-1 py-0.5 rounded text-[9px]">w_member_social</code> or UGC post credentials. Test connectivity using the diagnostic master grid at the top of the settings page.</span>
                  </div>
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

      </div>
    </div>
  );
}
