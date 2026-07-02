import React, { useState, useEffect } from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Trash2, Shield } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { apiFetch } from '../lib/auth';

export function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  
  const [purging, setPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState<string | null>(null);
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const [isAdmin, setIsAdmin] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actioningUserId, setActioningUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!auth.currentUser) return;
      if (auth.currentUser.email === '4261164@myuwc.ac.za' || localStorage.getItem('sandbox_developer_user')) {
        setIsAdmin(true);
        return;
      }
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().role === 'admin') {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error("Admin role verification failed:", err);
      }
    };
    checkAdminRole();
  }, []);

  const loadUsersList = async () => {
    if (!auth.currentUser || !isAdmin) return;
    setLoadingUsers(true);
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort: owner first, then by date descending
      list.sort((a, b) => {
        if (a.email === '4261164@myuwc.ac.za') return -1;
        if (b.email === '4261164@myuwc.ac.za') return 1;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
      setUsersList(list);
    } catch (err) {
      console.error("Failed to load users list:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsersList();
    }
  }, [isAdmin]);

  const handleToggleApproval = async (targetUser: any) => {
    if (!auth.currentUser || !isAdmin) return;
    setActioningUserId(targetUser.id);
    try {
      const targetApproved = !targetUser.approved;
      const userRef = doc(db, 'users', targetUser.id);
      await setDoc(userRef, { approved: targetApproved }, { merge: true });
      
      // Update local state
      setUsersList(prev => prev.map(u => u.id === targetUser.id ? { ...u, approved: targetApproved } : u));
    } catch (err) {
      console.error("Failed to toggle approval:", err);
    } finally {
      setActioningUserId(null);
    }
  };

  const handleChangeRole = async (targetUserId: string, newRole: string) => {
    if (!auth.currentUser || !isAdmin) return;
    setActioningUserId(targetUserId);
    try {
      const userRef = doc(db, 'users', targetUserId);
      await setDoc(userRef, { role: newRole }, { merge: true });
      
      // Update local state
      setUsersList(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error("Failed to update user role:", err);
    } finally {
      setActioningUserId(null);
    }
  };

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
      const response = await apiFetch('/api/ops/purge-all-data', {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPurgeSuccess(data.message || "Successfully purged all mock and test-run database records!");
        setConfirmText('');
        setShowPurgeConfirm(false);
      } else {
        throw new Error(data.error || "Handshake rejected by purge endpoint.");
      }
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
    customWebhookUrl: '',
    customApiKey: '',
    maxbountyApiKey: '',
    clickbankApiKey: '',
    maintenanceMode: false,
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
    { id: 'linkedin', name: 'LinkedIn UGC Feed', category: 'Social Distribution', desc: 'Broadcasts executive summaries and marketing copies to feeds.' },
    { id: 'maxbounty', name: 'MaxBounty Plugin API', category: 'Affiliate Network', desc: 'Secure Server-to-Server connection for live EPCs and CPA offers.' },
    { id: 'clickbank', name: 'ClickBank Plugin API', category: 'Affiliate Network', desc: 'Real-time sales & hoplink attribution.' },
    { id: 'api_plugin', name: 'Custom API Plugin / Webhook', category: 'Extension', desc: 'Validates outbound webhook payload delivery and custom API handshakes.' }
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

      const response = await apiFetch('/api/test-integration', {
        method: 'POST',
        body: JSON.stringify({ integrationId })
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
      
      // Sync user profile role configuration as well
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        role: settings.role || 'admin',
        displayName: auth.currentUser.displayName || settings.ceoName || 'Sandbox User',
        email: auth.currentUser.email || 'anonymous@optiflow.io'
      }, { merge: true });
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Access & System Privileges</CardTitle>
                <CardDescription>Configure your backend governance role and bypass overrides.</CardDescription>
              </div>
              <Shield className="w-5 h-5 text-[#a8ff35] animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Security Governance Role</label>
                <select
                  value={settings.role || 'admin'}
                  onChange={e => setSettings({...settings, role: e.target.value})}
                  className="w-full bg-[#0D1117] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#a8ff35]/50 transition-all"
                >
                  <option value="admin">System Administrator (Full Powers)</option>
                  <option value="analyst">Strategy Analyst (Read-Only Insights)</option>
                  <option value="creator">Content Creator (UGC Pipelines Only)</option>
                </select>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Changing this value instantly recalculates role-based permissions in middleware blocks.
                </p>
              </div>

              <div className="bg-[#10141d]/80 border border-amber-500/15 p-4 rounded-xl flex items-start gap-3 mt-2">
                <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1 flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Admin Power Override Claims</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.adminBypassEnabled !== false} 
                        onChange={e => setSettings({...settings, adminBypassEnabled: e.target.checked, role: e.target.checked ? 'admin' : settings.role})} 
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:bg-[#a8ff35] peer-checked:bg-[#a8ff35]/20"></div>
                    </label>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Manually inject root administrator permissions. When active, all actions bypass policy constraints and authenticate directly.
                  </p>
                </div>
              </div>

              <div className="bg-[#10141d]/80 border border-red-500/15 p-4 rounded-xl flex items-start gap-3 mt-2">
                <Shield className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wide">System Maintenance Mode</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.maintenanceMode === true} 
                        onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} 
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:bg-red-500 peer-checked:bg-red-500/20"></div>
                    </label>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Pause all autonomous agents and background workers immediately. The dashboard remains accessible for configuration.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CEO Agent Personality</CardTitle>
              <CardDescription>Customize your strategic partner's identity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">CEO Name</label>
                <Input 
                  value={settings.ceoName || 'ExOS Strategic Core'} 
                  onChange={e => setSettings({...settings, ceoName: e.target.value})} 
                  placeholder="e.g. Athena" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Persona Description</label>
                <textarea 
                  value={settings.ceoPersona || ''} 
                  onChange={e => setSettings({...settings, ceoPersona: e.target.value})} 
                  className="w-full bg-[#0D1117] border border-white/10 rounded-lg p-3 text-sm text-white min-h-[100px]"
                  placeholder="Describe the CEO's personality, tone, and strategic focus..." 
                />
              </div>
            </CardContent>
          </Card>
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
              <CardTitle>API Plugins & Webhooks</CardTitle>
              <CardDescription>Extend OptiFlow with custom REST APIs and Webhook endpoints.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Custom Webhook URL</label>
                <Input type="url" value={settings.customWebhookUrl || ''} onChange={e => setSettings({...settings, customWebhookUrl: e.target.value})} placeholder="https://hook.make.com/..." />
                <p className="text-[10px] text-zinc-500">Fires on campaign completion and major lifecycle events.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Zapier / Custom REST API Key</label>
                <Input type="password" value={settings.customApiKey || ''} onChange={e => setSettings({...settings, customApiKey: e.target.value})} placeholder="Secret token for external plugins..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Affiliate Platforms</CardTitle>
              <CardDescription>Configure and validate custom API plugin keys for affiliate networks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">MaxBounty API Key</label>
                <Input type="password" value={settings.maxbountyApiKey || ''} onChange={e => setSettings({...settings, maxbountyApiKey: e.target.value})} placeholder="mb_live_..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">ClickBank API / Developer Key</label>
                <Input type="password" value={settings.clickbankApiKey || ''} onChange={e => setSettings({...settings, clickbankApiKey: e.target.value})} placeholder="DEV-..." />
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

        {/* Database & Mock Data Purge Section */}
        <Card className="border-rose-500/25 bg-rose-950/5 mt-6">
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-rose-400">Database & Mock Data Purge</CardTitle>
                <CardDescription>
                  Completely erase all programmatic articles, campaigns, offers, tracking logs, and analytical metric histories from Firestore.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <p className="text-xs text-zinc-400 leading-relaxed">
              This action scans all 25+ core system collections in Firestore and removes all documents belonging to your user profile, as well as general simulation/mock entries.
              <span className="text-rose-400 font-semibold ml-1">Warning: This operation is permanent and irreversible.</span>
            </p>

            {purgeSuccess && (
              <div className="bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 px-4 py-3 rounded-xl text-xs leading-normal">
                <span className="font-bold block mb-1">✓ Purge Success</span>
                <span>{purgeSuccess}</span>
              </div>
            )}

            {purgeError && (
              <div className="bg-rose-500/5 border border-rose-500/15 text-rose-400 px-4 py-3 rounded-xl text-xs leading-normal">
                <span className="font-bold block mb-1">❌ Purge Failed</span>
                <span>{purgeError}</span>
              </div>
            )}

            {!showPurgeConfirm ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setShowPurgeConfirm(true);
                  setConfirmText('');
                  setPurgeSuccess(null);
                  setPurgeError(null);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Purge All Mock & Seeded Data
              </Button>
            ) : (
              <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-xl space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                    Verify Purge Request
                  </label>
                  <p className="text-[11px] text-zinc-400">
                    Please type <code className="bg-rose-500/10 text-rose-300 px-1 py-0.5 rounded font-mono font-bold">PURGE</code> below to authorize the structural wipeout.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 max-w-md">
                  <Input
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="Type PURGE to verify..."
                    className="bg-black/20 border-rose-500/30 text-white focus:border-rose-500 font-mono text-sm uppercase"
                  />
                  <Button
                    type="button"
                    disabled={purging}
                    onClick={handlePurgeAllData}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold whitespace-nowrap"
                  >
                    {purging ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Purging System...
                      </>
                    ) : (
                      "Authorize Wipeout"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowPurgeConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Access Governance Section */}
        {isAdmin && (
          <Card className="border-zinc-800 bg-[#16171B] mt-6">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#a8ff35]/10 flex items-center justify-center text-[#a8ff35] border border-[#a8ff35]/20">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-white">User Governance & Access Whitelist</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Private Preview Mode: Only accounts manually authorized below can bypass the OptiFlow gateway and access dashboard telemetry.
                    </CardDescription>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={loadUsersList} 
                  disabled={loadingUsers}
                  className="border-white/10 hover:bg-white/5 text-xs font-bold text-zinc-300 self-start sm:self-center"
                >
                  {loadingUsers ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : null}
                  Refresh Operators
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {loadingUsers && usersList.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 font-mono text-xs flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#a8ff35]" />
                  Scanning Firestore User Registry...
                </div>
              ) : usersList.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 font-mono text-xs">
                  No registered users discovered. Check auth configuration.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/5 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                        <th className="p-3 md:p-4 font-bold">Operator Profile</th>
                        <th className="p-3 md:p-4 font-bold">Identity Hash (UID)</th>
                        <th className="p-3 md:p-4 font-bold">Role Tier</th>
                        <th className="p-3 md:p-4 text-center font-bold">Clearance Status</th>
                        <th className="p-3 md:p-4 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {usersList.map((usr) => {
                        const isPrimaryOwner = usr.email === '4261164@myuwc.ac.za';
                        const isActioning = actioningUserId === usr.id;
                        
                        return (
                          <tr key={usr.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-3 md:p-4 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">
                                  {usr.email || 'anonymous@optiflow.io'}
                                </span>
                                {isPrimaryOwner && (
                                  <span className="bg-[#a8ff35]/10 text-[#a8ff35] border border-[#a8ff35]/25 text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold tracking-tight">
                                    OWNER / ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                Discovered: {usr.createdAt ? new Date(usr.createdAt).toLocaleDateString() : 'N/A'}
                              </div>
                            </td>
                            <td className="p-3 md:p-4 font-mono text-[10px] text-zinc-400">
                              <span className="bg-black/40 border border-white/5 px-2 py-1 rounded select-all">
                                {usr.id}
                              </span>
                            </td>
                            <td className="p-3 md:p-4">
                              {isPrimaryOwner ? (
                                <span className="font-mono text-[10px] bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-700">
                                  Administrator (Root)
                                </span>
                              ) : (
                                <select
                                  value={usr.role || 'creator'}
                                  disabled={isActioning}
                                  onChange={(e) => handleChangeRole(usr.id, e.target.value)}
                                  className="bg-[#1C1D21] border border-white/10 rounded-lg text-xs text-white px-2 py-1 focus:border-[#a8ff35] focus:outline-none"
                                >
                                  <option value="admin">Administrator</option>
                                  <option value="analyst">Analyst</option>
                                  <option value="creator">Creator</option>
                                </select>
                              )}
                            </td>
                            <td className="p-3 md:p-4 text-center">
                              {usr.approved || isPrimaryOwner ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  APPROVED ACCESS
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/25">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                  PENDING APPROVAL
                                </span>
                              )}
                            </td>
                            <td className="p-3 md:p-4 text-right">
                              {isPrimaryOwner ? (
                                <span className="text-[10px] text-zinc-500 font-mono italic">
                                  Immutable System Lock
                                </span>
                              ) : (
                                <Button
                                  type="button"
                                  disabled={isActioning}
                                  onClick={() => handleToggleApproval(usr)}
                                  className={`text-[11px] font-bold py-1 px-3 h-auto rounded-lg transition-all ${
                                    usr.approved 
                                      ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20" 
                                      : "bg-[#a8ff35]/10 hover:bg-[#a8ff35]/20 text-black font-extrabold border border-[#a8ff35]/20"
                                  }`}
                                >
                                  {isActioning ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                                  ) : usr.approved ? (
                                    "Revoke Access"
                                  ) : (
                                    "Approve Operator"
                                  )}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
