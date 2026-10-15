import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Trash2, 
  Shield,
  Sparkles,
  Play,
  Check,
  HelpCircle,
  Compass,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Link,
  Info,
  Key,
  Server,
  Cpu,
  Zap,
  Radio,
  Eye,
  EyeOff,
  Copy,
  Search,
  Filter,
  Globe,
  Share2,
  DollarSign,
  Database,
  Sliders,
  UserCheck,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  CreditCard
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { apiFetch } from '../lib/auth';
import { BillingSubscriptionPanel } from './billing/BillingSubscriptionPanel';

type SettingsCategory = 'all' | 'billing' | 'ai' | 'cms' | 'social' | 'affiliate' | 'security' | 'database';

export function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGuideStep, setActiveGuideStep] = useState<string | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const [purging, setPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState<string | null>(null);
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const [isAdmin, setIsAdmin] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actioningUserId, setActioningUserId] = useState<string | null>(null);

  const toggleShowKey = (fieldId: string) => {
    setShowKeys(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(fieldId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!auth.currentUser) return;
      if (localStorage.getItem('sandbox_developer_user')) {
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
      list.sort((a, b) => {
        if (a.role === 'admin') return -1;
        if (b.role === 'admin') return 1;
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
    role: 'admin',
    adminBypassEnabled: true,
    ceoName: 'ExOS Strategic Core',
    ceoPersona: 'Pragmatic, growth-obsessed strategic partner specializing in high-converting affiliate automation.',
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
    { id: 'gemini', name: 'Google Gemini', category: 'Core AI Platform', desc: 'Primary core intelligence, autonomous pipelines, agent reasoning, and self-improving CEO decisions.' },
    { id: 'openai', name: 'OpenAI (GPT-4o)', category: 'Reasoning Fallback', desc: 'eBook chapter compilers, programmatic content writing, and advanced synthetics.' },
    { id: 'nvidia', name: 'NVIDIA NIM Catalog', category: 'Computing Clusters', desc: 'High-throughput Llama-3.1 405B inference and bulk processing clusters.' },
    { id: 'midjourney', name: 'Midjourney Engine', category: 'Creative Graphic Agency', desc: 'Pin vectors, article header illustrations, and visual conversion assets.' },
    { id: 'wordpress', name: 'WordPress Blog Connector', category: 'Auto-Publishing', desc: 'XML-RPC and REST credentials for automated article drafts and live syndication.' },
    { id: 'pinterest', name: 'Pinterest Business', category: 'Social Distribution', desc: 'Authorized board syndication and automated visual traffic pins.' },
    { id: 'telegram', name: 'Telegram Broadcast', category: 'Social Alerts', desc: 'Instant bot alerts for live campaign conversions and lead signals.' },
    { id: 'linkedin', name: 'LinkedIn UGC Feed', category: 'Social Distribution', desc: 'Executive summaries and business marketing post syndication.' },
    { id: 'maxbounty', name: 'MaxBounty Plugin API', category: 'Affiliate Network', desc: 'Server-to-Server postback integration for real-time EPCs and CPA offers.' },
    { id: 'clickbank', name: 'ClickBank Plugin API', category: 'Affiliate Network', desc: 'Real-time sales tracking, hoplink generators, and order attribution.' },
    { id: 'api_plugin', name: 'Custom API Plugin / Webhook', category: 'Extension', desc: 'Outbound webhook triggers and custom REST API dispatchers.' }
  ];

  const testSingleIntegration = async (integrationId: string) => {
    if (!auth.currentUser) return;
    setTestStates(prev => ({
      ...prev,
      [integrationId]: { status: 'testing' }
    }));

    try {
      await setDoc(doc(db, 'settings', auth.currentUser.uid), settings, { merge: true });

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
      await new Promise(r => setTimeout(r, 350));
    }
    setTestingAll(false);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!auth.currentUser) return;
    setSaving(true);
    setSaveSuccess(false);
    const settingsPath = `settings/${auth.currentUser.uid}`;
    try {
      await setDoc(doc(db, 'settings', auth.currentUser.uid), settings, { merge: true });
      
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        role: settings.role || 'admin',
        displayName: auth.currentUser.displayName || settings.ceoName || 'Sandbox User',
        email: auth.currentUser.email || 'operator@optiflow.io',
        approved: true
      }, { merge: true });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, settingsPath);
    }
    setSaving(false);
  };

  const handleFillSandboxDefaults = async () => {
    const updated = {
      ...settings,
      geminiApiKey: settings.geminiApiKey || 'AIzaSyDemoKey_OptiFlowCorePrimary_98213',
      openaiApiKey: settings.openaiApiKey || 'sk-demoOpenAI_ReasoningFallbackCore_77182',
      nvidiaApiKey: settings.nvidiaApiKey || 'nvapi-demoNVIDIA_ClusterInferenceLlama405B',
      midjourneyApiKey: settings.midjourneyApiKey || 'mj_demoKey_CreativeGraphicAgency',
      midjourneyEndpoint: settings.midjourneyEndpoint || 'https://api.imagineapi.dev/v1/sandbox',
      wordpressUrl: settings.wordpressUrl || 'https://sandbox-blog.optiflow.io',
      wordpressUsername: settings.wordpressUsername || 'sandbox_writer_agent',
      wordpressPassword: settings.wordpressPassword || 'sand box auth pass word demo',
      customWebhookUrl: settings.customWebhookUrl || 'https://hook.us1.make.com/optiflow_sandbox',
      customApiKey: settings.customApiKey || 'api_key_optiflow_zapier_bridge_secret',
      maxbountyApiKey: settings.maxbountyApiKey || 'mb_live_sandbox_key_6a9b8c2d1e',
      clickbankApiKey: settings.clickbankApiKey || 'DEV-SANDBOX-CLICKBANK-KEY-99182',
      pinterestToken: settings.pinterestToken || 'pina_sandbox_token_board_syndication_8213',
      telegramToken: settings.telegramToken || '1234567890:AABBC-DDEE-FFGG_TelegramSandboxBot',
      telegramChatId: settings.telegramChatId || '@optiflow_campaign_signals',
      analyticsId: settings.analyticsId || 'G-SANDBOX-9918',
      adminBypassEnabled: true,
      role: 'admin'
    };
    setSettings(updated);
    setActiveGuideStep(null);

    if (auth.currentUser) {
      await setDoc(doc(db, 'settings', auth.currentUser.uid), updated, { merge: true });
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleLaunchOnboardingTour = () => {
    window.dispatchEvent(new CustomEvent('open-onboarding-wizard'));
  };

  const isAICoreCompleted = !!(settings.geminiApiKey || settings.openaiApiKey);
  const isWordPressCompleted = !!(settings.wordpressUrl && settings.wordpressPassword);
  const isSocialCompleted = !!(settings.telegramToken || settings.pinterestToken || settings.linkedinToken);
  const isAffiliateCompleted = !!(settings.maxbountyApiKey || settings.clickbankApiKey);
  const isSecurityCompleted = !!(settings.adminBypassEnabled || settings.role === 'admin');

  const stepsList = [
    {
      id: 'ai_connections',
      category: 'ai',
      title: 'Model Intelligence (AI Core)',
      desc: 'Connect Google Gemini or OpenAI to power autonomous agents, writing engines, and SEO clustering.',
      completed: isAICoreCompleted,
      requiredField: 'Google Gemini / OpenAI API Key',
      elementId: 'card-ai-connections',
      focusSelector: '#input-gemini-key',
      guideText: '💡 Gemini is the primary core for all agent decisions. Get your free API key from Google AI Studio. Fill it in under the "AI Core Connections" card.'
    },
    {
      id: 'wordpress',
      category: 'cms',
      title: 'Auto-Publishing Outlet (WordPress)',
      desc: 'Link your WordPress blog URL and application password for Phase 2 automated draft posting.',
      completed: isWordPressCompleted,
      requiredField: 'WordPress Site URL & Application Password',
      elementId: 'card-wordpress',
      focusSelector: '#input-wordpress-url',
      guideText: '📝 Link your self-hosted or WordPress.com blog. Enter your URL and generate an "Application Password" in your WordPress admin panel (Users -> Profile).'
    },
    {
      id: 'social',
      category: 'social',
      title: 'Distribution Channels (Social & Alerts)',
      completed: isSocialCompleted,
      desc: 'Configure Telegram Alerts or Pinterest boards to automatically syndicate and publicize campaigns.',
      requiredField: 'Telegram Token / Pinterest Access Token',
      elementId: 'card-social',
      focusSelector: '#input-telegram-token',
      guideText: '📢 Set up your social feeds. Create a Telegram channel and add a Bot to receive live campaign alerts, or link Pinterest API boards.'
    },
    {
      id: 'affiliate',
      category: 'affiliate',
      title: 'Attribution Platforms (CPA Networks)',
      completed: isAffiliateCompleted,
      desc: 'Integrate ClickBank or MaxBounty keys to capture real-time offer metrics and Hoplink attributions.',
      requiredField: 'MaxBounty / ClickBank API Key',
      elementId: 'card-affiliates',
      focusSelector: '#input-maxbounty-key',
      guideText: '💰 Add CPA networks. Enter your developer keys to synchronize available campaigns, evaluate high EPC targets, and fetch CPA details.'
    },
    {
      id: 'security',
      category: 'security',
      title: 'Security Governance & Override',
      completed: isSecurityCompleted,
      desc: 'Claim absolute administrative powers bypass to operate the sandbox environment.',
      requiredField: 'Admin Power Override Toggled ON',
      elementId: 'card-privileges',
      focusSelector: '#checkbox-admin-bypass',
      guideText: '🛡️ Sandbox mode relies on administrator bypass. Enabling this toggle assigns the "admin" security claim to bypass any standard auth restrictions.'
    }
  ];

  const completedStepsCount = stepsList.filter(s => s.completed).length;
  const onboardingPercent = Math.round((completedStepsCount / stepsList.length) * 100);

  const startGuideStep = (stepId: string, category: string, elementId: string, focusSelector: string) => {
    setActiveCategory('all');
    setActiveGuideStep(stepId);
    setTimeout(() => {
      const targetEl = document.getElementById(elementId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          const inputEl = document.querySelector(focusSelector) as HTMLElement;
          if (inputEl) {
            inputEl.focus();
          }
        }, 400);
      }
    }, 50);
  };

  // Filter categories and search matches
  const shouldShowCard = (cardCategory: SettingsCategory, searchTerms: string[]) => {
    if (activeCategory !== 'all' && activeCategory !== cardCategory) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    return searchTerms.some(term => term.toLowerCase().includes(searchQuery.toLowerCase().trim()));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans selection:bg-[#d7f941]/30">
      
      {/* HD Page Title & Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#d7f941]">System Kernel</span>
            <span className="text-zinc-500 text-xs">/</span>
            <span className="text-xs text-zinc-400">Settings Hub</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Platform Settings & Connections</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Configure your AI providers, auto-publishers, affiliate networks, and security claims.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={handleLaunchOnboardingTour}
            className="border-[#d7f941]/30 hover:bg-[#d7f941]/10 text-[#d7f941] text-xs font-bold py-2 px-3.5 rounded-xl gap-2 cursor-pointer shadow-[0_0_15px_rgba(215,249,65,0.06)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Launch Setup Tour
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleFillSandboxDefaults}
            className="border-white/10 hover:bg-white/5 text-zinc-200 text-xs font-semibold py-2 px-3.5 rounded-xl gap-2 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[#d7f941]" />
            Auto-Fill Sandbox Keys
          </Button>

          <Button
            type="button"
            onClick={() => handleSave()}
            disabled={saving || loading}
            className="bg-[#d7f941] hover:bg-[#cbf033] text-black font-extrabold text-xs py-2 px-4 rounded-xl gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(215,249,65,0.2)]"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                Saved to Cloud ✓
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      {/* Onboarding Assistant Checklist Banner */}
      {onboardingOpen ? (
        <Card id="onboarding-guide-card" className="bg-[#0B0F17]/90 border border-[#d7f941]/30 shadow-[0_15px_40px_rgba(0,0,0,0.6),0_0_30px_rgba(215,249,65,0.06)] overflow-hidden relative rounded-3xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#d7f941]/5 rounded-full blur-3xl pointer-events-none" />
          
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#d7f941]/10 border border-[#d7f941]/25 flex items-center justify-center text-[#d7f941] shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-white text-base sm:text-lg">Interactive Onboarding Assistant</CardTitle>
                    <span className="text-[9px] bg-[#d7f941]/15 text-[#d7f941] border border-[#d7f941]/30 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                      Operator Guide
                    </span>
                  </div>
                  <CardDescription className="text-xs text-zinc-400 mt-0.5">
                    Step-by-step checklist to configure and activate your entire content engine.
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setOnboardingOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 p-1.5 h-auto rounded-lg cursor-pointer"
                  title="Collapse Assistant"
                >
                  <ChevronUp className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-5 space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-zinc-400 font-semibold uppercase tracking-wider">Overall Cockpit Calibration</span>
                <span className="font-mono text-[#d7f941] font-extrabold">{onboardingPercent}% Operational</span>
              </div>
              <div className="w-full bg-[#131924] h-2 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-[#d7f941] h-full rounded-full shadow-[0_0_12px_rgba(215,249,65,0.4)] transition-all duration-700" 
                  style={{ width: `${onboardingPercent}%` }}
                />
              </div>
            </div>

            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {stepsList.map((step, idx) => (
                <div 
                  key={step.id} 
                  className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                    step.completed 
                      ? 'bg-emerald-950/10 border-emerald-500/20 text-zinc-300' 
                      : activeGuideStep === step.id
                      ? 'bg-[#d7f941]/10 border-[#d7f941]/40 shadow-[0_0_20px_rgba(215,249,65,0.08)] text-white'
                      : 'bg-[#131924]/60 border-white/5 hover:border-white/10 text-zinc-400'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-zinc-500 font-bold bg-white/5 px-1.5 py-0.5 rounded">
                          0{idx + 1}
                        </span>
                        <h4 className={`text-xs font-bold ${step.completed ? 'text-zinc-300' : 'text-zinc-200'}`}>
                          {step.title}
                        </h4>
                      </div>
                      {step.completed ? (
                        <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Active
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold shrink-0">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-2.5">
                    <span className="text-[9px] font-mono text-zinc-500 truncate max-w-[130px]">
                      {step.requiredField}
                    </span>
                    <Button
                      type="button"
                      variant={activeGuideStep === step.id ? "default" : "outline"}
                      onClick={() => startGuideStep(step.id, step.category, step.elementId, step.focusSelector)}
                      className="text-[10px] font-bold py-1 px-2.5 h-auto rounded-lg font-mono tracking-wide uppercase transition-all cursor-pointer"
                    >
                      {activeGuideStep === step.id ? "Guiding..." : step.completed ? "Review" : "Guide Me"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {activeGuideStep && (
              <div className="p-3.5 bg-[#d7f941]/5 border border-[#d7f941]/20 rounded-2xl flex items-start gap-3 relative overflow-hidden">
                <Lightbulb className="w-4 h-4 text-[#d7f941] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">
                    {stepsList.find(s => s.id === activeGuideStep)?.title} Walkthrough
                  </p>
                  <p className="text-xs text-[#d7f941] leading-relaxed font-medium">
                    {stepsList.find(s => s.id === activeGuideStep)?.guideText}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center justify-between bg-[#0B0F17] border border-white/10 p-3.5 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#d7f941]" />
            <span className="text-xs font-bold text-zinc-300">OptiFlow Setup Assistant</span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
              {onboardingPercent}% Configured
            </span>
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => setOnboardingOpen(true)}
            className="text-[#d7f941] hover:text-white text-xs font-semibold py-1 px-3 h-auto rounded-lg border border-[#d7f941]/20 hover:bg-[#d7f941]/10 cursor-pointer"
          >
            Show Assistant
          </Button>
        </div>
      )}

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#0B0F17]/90 border border-white/10 p-2.5 rounded-2xl backdrop-blur-xl sticky top-2 z-30 shadow-lg">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 lg:pb-0">
          {[
            { id: 'all', label: 'All Settings', icon: Sliders },
            { id: 'billing', label: 'Billing & Quotas', icon: CreditCard },
            { id: 'ai', label: 'AI Intelligence', icon: Cpu },
            { id: 'cms', label: 'Publishing & CMS', icon: Globe },
            { id: 'social', label: 'Social & Alerts', icon: Share2 },
            { id: 'affiliate', label: 'Affiliates & CPA', icon: DollarSign },
            { id: 'security', label: 'Access & Roles', icon: Shield },
            { id: 'database', label: 'Data Tools', icon: Database },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id as SettingsCategory)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive 
                    ? 'bg-[#d7f941] text-black shadow-[0_0_15px_rgba(215,249,65,0.25)]' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search keys, models, plugins..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#131924] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d7f941]/50 transition-all font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Billing & Subscription Hub */}
      {(activeCategory === 'billing' || (activeCategory === 'all' && (searchQuery.toLowerCase().includes('bill') || searchQuery.toLowerCase().includes('stripe') || searchQuery.toLowerCase().includes('plan') || searchQuery.toLowerCase().includes('price') || searchQuery.toLowerCase().includes('quota')))) && (
        <Card className="bg-[#0B0F17]/90 border-white/10 shadow-xl rounded-3xl overflow-hidden backdrop-blur-xl">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#d7f941]" />
              Enterprise Billing & Autonomous Quota Management
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 mt-0.5">
              Live subscription lifecycle, automated Stripe checkout, plan quotas, and multi-armed bandit tier entitlements.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <BillingSubscriptionPanel />
          </CardContent>
        </Card>
      )}

      {/* Diagnostics Matrix Card (Shown on 'all' or when searching integrations) */}
      {shouldShowCard('all', ['matrix', 'diagnostics', 'handshake', 'gemini', 'openai', 'nvidia', 'wordpress', 'telegram', 'pinterest', 'maxbounty', 'clickbank']) && (
        <Card className="bg-[#0B0F17]/90 border-white/10 shadow-xl rounded-3xl overflow-hidden backdrop-blur-xl">
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-lg">Live Integrations Diagnostics Matrix</CardTitle>
                <CardDescription className="text-xs text-zinc-400 mt-0.5">
                  Real-time network handshake checks across all configured AI providers, CMS webhooks, and monetization APIs.
                </CardDescription>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={testAllIntegrations} 
                disabled={testingAll}
                className="border-white/10 hover:bg-white/5 text-xs font-bold text-zinc-300 rounded-xl gap-2 cursor-pointer"
              >
                {testingAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d7f941]" />
                    Sequencing All Handshakes...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-[#d7f941]" />
                    Test All Connection Nodes
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {integrationsList.map((item) => {
                const state = testStates[item.id] || { status: 'idle' };
                return (
                  <div key={item.id} className="bg-[#131924]/70 border border-white/5 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-white/15 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-white">{item.name}</h4>
                        <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-full text-zinc-400 font-mono tracking-wide uppercase">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed min-h-[32px]">
                        {item.desc}
                      </p>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-white/5">
                      {state.status === 'success' && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1.5 rounded-xl text-[11px]">
                          <span className="font-bold block">✓ Authenticated</span>
                          <span className="text-[10px] text-zinc-400 truncate block">{state.details || state.message}</span>
                        </div>
                      )}
                      {state.status === 'failed' && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1.5 rounded-xl text-[11px]">
                          <span className="font-bold block">❌ Handshake Error</span>
                          <span className="text-[10px] text-zinc-400 truncate block">{state.error}</span>
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={() => testSingleIntegration(item.id)}
                        disabled={state.status === 'testing' || testingAll}
                        className={`w-full py-2 text-xs font-bold font-mono tracking-wider uppercase transition-all rounded-xl cursor-pointer ${
                          state.status === 'success'
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                            : state.status === 'failed'
                            ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                            : state.status === 'testing'
                            ? 'bg-zinc-800 text-zinc-500'
                            : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
                        }`}
                      >
                        {state.status === 'testing' ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin text-[#d7f941]" />
                            Testing...
                          </span>
                        ) : state.status === 'success' ? (
                          "Re-Ping Node ✓"
                        ) : state.status === 'failed' ? (
                          "Retry Ping"
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
      )}

      {/* Main Settings Form Grid */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* 1. AI Intelligence Core */}
        {shouldShowCard('ai', ['ai', 'gemini', 'openai', 'nvidia', 'midjourney', 'models', 'intelligence']) && (
          <Card 
            id="card-ai-connections" 
            className={`bg-[#0B0F17]/90 border rounded-3xl shadow-xl backdrop-blur-xl transition-all duration-300 ${
              activeGuideStep === 'ai_connections' 
                ? 'border-[#d7f941] shadow-[0_0_30px_rgba(215,249,65,0.12)]' 
                : 'border-white/10'
            }`}
          >
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#d7f941]/10 text-[#d7f941] flex items-center justify-center border border-[#d7f941]/20">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">AI Core Model Connections</CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Foundational generative engines powering autonomous copywriting, SEO synthesis, and reasoning.
                    </CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => testSingleIntegration('gemini')}
                  className="text-xs font-mono text-[#d7f941] hover:bg-[#d7f941]/10 rounded-lg p-2 h-auto"
                >
                  Ping Gemini
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              
              {/* Google Gemini */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-[#d7f941]" />
                    Google Gemini API Key (Primary Core)
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">Server Fallback Active</span>
                </div>
                <div className="relative">
                  <input 
                    id="input-gemini-key"
                    type={showKeys['gemini'] ? 'text' : 'password'}
                    value={settings.geminiApiKey || ''}
                    onChange={e => setSettings({...settings, geminiApiKey: e.target.value})}
                    placeholder="AIzaSy... (uses server environment key if left blank)"
                    className="w-full bg-[#131924] border border-white/10 rounded-xl pl-4 pr-20 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d7f941]/60 font-mono"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleShowKey('gemini')}
                      className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
                    >
                      {showKeys['gemini'] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(settings.geminiApiKey, 'gemini')}
                      className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
                    >
                      {copiedKey === 'gemini' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Runs core reasoning, chapter generation, and autonomous CEO workflows.
                </p>
              </div>

              {/* OpenAI GPT-4o */}
              <div className="space-y-2 pt-3 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-sky-400" />
                    OpenAI API Key (Optional Fallback)
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">GPT-4o Engine</span>
                </div>
                <div className="relative">
                  <input 
                    type={showKeys['openai'] ? 'text' : 'password'}
                    value={settings.openaiApiKey || ''}
                    onChange={e => setSettings({...settings, openaiApiKey: e.target.value})}
                    placeholder="sk-..."
                    className="w-full bg-[#131924] border border-white/10 rounded-xl pl-4 pr-20 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d7f941]/60 font-mono"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleShowKey('openai')}
                      className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
                    >
                      {showKeys['openai'] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(settings.openaiApiKey, 'openai')}
                      className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
                    >
                      {copiedKey === 'openai' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* NVIDIA NIM */}
              <div className="space-y-2 pt-3 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                    NVIDIA NIM API Key (High-Scale Cluster)
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">Llama-3.1 405B</span>
                </div>
                <div className="relative">
                  <input 
                    type={showKeys['nvidia'] ? 'text' : 'password'}
                    value={settings.nvidiaApiKey || ''}
                    onChange={e => setSettings({...settings, nvidiaApiKey: e.target.value})}
                    placeholder="nvapi-..."
                    className="w-full bg-[#131924] border border-white/10 rounded-xl pl-4 pr-20 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d7f941]/60 font-mono"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleShowKey('nvidia')}
                      className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
                    >
                      {showKeys['nvidia'] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(settings.nvidiaApiKey, 'nvidia')}
                      className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
                    >
                      {copiedKey === 'nvidia' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Midjourney Engine */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Midjourney API Key</label>
                  <input 
                    type="password"
                    value={settings.midjourneyApiKey || ''}
                    onChange={e => setSettings({...settings, midjourneyApiKey: e.target.value})}
                    placeholder="API Key for ImagineAPI / GoAPI bridge"
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d7f941]/60 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">MJ Custom API Endpoint</label>
                  <input 
                    type="url"
                    value={settings.midjourneyEndpoint || ''}
                    onChange={e => setSettings({...settings, midjourneyEndpoint: e.target.value})}
                    placeholder="https://api.imagineapi.dev/v1/..."
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d7f941]/60 font-mono"
                  />
                </div>
              </div>

            </CardContent>
          </Card>
        )}

        {/* 2. Specialized Agent Model Overrides & CEO Persona */}
        {shouldShowCard('ai', ['agent', 'ceo', 'persona', 'model', 'overrides']) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CEO Agent Personality */}
            <Card className="bg-[#0B0F17]/90 border-white/10 rounded-3xl shadow-xl backdrop-blur-xl">
              <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="text-base sm:text-lg">Executive CEO Personality</CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Customize the strategic partner directing your automated campaigns and decisions.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">CEO Executive Name</label>
                  <input 
                    type="text"
                    value={settings.ceoName || ''}
                    onChange={e => setSettings({...settings, ceoName: e.target.value})}
                    placeholder="e.g. Athena Strategic Core"
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#d7f941]/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Persona & Strategic Directives</label>
                  <textarea 
                    value={settings.ceoPersona || ''}
                    onChange={e => setSettings({...settings, ceoPersona: e.target.value})}
                    rows={4}
                    placeholder="Describe tone, risk profile, and monetization philosophies..."
                    className="w-full bg-[#131924] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#d7f941]/60 leading-relaxed"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sub-Agent Model Overrides */}
            <Card className="bg-[#0B0F17]/90 border-white/10 rounded-3xl shadow-xl backdrop-blur-xl">
              <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="text-base sm:text-lg">Specialized Agent Overrides</CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Assign custom providers or models to specific pipeline nodes.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-3">
                {Object.entries(settings.agentOverrides).map(([agentName, override]: [string, any]) => (
                  <div key={agentName} className="p-3 bg-[#131924]/80 border border-white/5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{agentName}</span>
                      <span className="text-[10px] font-mono text-zinc-400">Node Override</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                        value={override.provider}
                        onChange={e => setSettings({
                          ...settings, 
                          agentOverrides: { ...settings.agentOverrides, [agentName]: { ...override, provider: e.target.value } }
                        })}
                        className="bg-[#0D1117] border border-white/10 rounded-lg p-2 text-xs text-white"
                      >
                        <option value="default">Default (Gemini)</option>
                        <option value="openai">OpenAI</option>
                        <option value="nvidia">NVIDIA NIM</option>
                      </select>
                      <input 
                        type="text" 
                        value={override.customModel || ''} 
                        onChange={e => setSettings({
                          ...settings, 
                          agentOverrides: { ...settings.agentOverrides, [agentName]: { ...override, customModel: e.target.value } }
                        })}
                        placeholder="Model e.g. gpt-4o"
                        className="bg-[#0D1117] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        )}

        {/* 3. Publishing & WordPress CMS */}
        {shouldShowCard('cms', ['cms', 'wordpress', 'blog', 'publishing', 'article', 'draft']) && (
          <Card 
            id="card-wordpress" 
            className={`bg-[#0B0F17]/90 border rounded-3xl shadow-xl backdrop-blur-xl transition-all duration-300 ${
              activeGuideStep === 'wordpress' 
                ? 'border-[#d7f941] shadow-[0_0_30px_rgba(215,249,65,0.12)]' 
                : 'border-white/10'
            }`}
          >
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">WordPress Blog Connector</CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Phase 2 automated draft posting and live article distribution.
                    </CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => testSingleIntegration('wordpress')}
                  className="text-xs font-mono text-sky-400 hover:bg-sky-500/10 rounded-lg p-2 h-auto"
                >
                  Test XML-RPC
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">WordPress Site URL</label>
                  <input 
                    id="input-wordpress-url"
                    type="url"
                    value={settings.wordpressUrl || ''}
                    onChange={e => setSettings({...settings, wordpressUrl: e.target.value})}
                    placeholder="https://yourblog.com"
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Username</label>
                  <input 
                    type="text"
                    value={settings.wordpressUsername || ''}
                    onChange={e => setSettings({...settings, wordpressUsername: e.target.value})}
                    placeholder="admin or publisher"
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Application Password</label>
                  <input 
                    type="password"
                    value={settings.wordpressPassword || ''}
                    onChange={e => setSettings({...settings, wordpressPassword: e.target.value})}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-zinc-500">
                Generate an Application Password in WordPress admin: <strong>Users → Profile → Application Passwords</strong>.
              </p>
            </CardContent>
          </Card>
        )}

        {/* 4. Social & Alerts */}
        {shouldShowCard('social', ['social', 'telegram', 'pinterest', 'twitter', 'linkedin', 'analytics']) && (
          <Card 
            id="card-social" 
            className={`bg-[#0B0F17]/90 border rounded-3xl shadow-xl backdrop-blur-xl transition-all duration-300 ${
              activeGuideStep === 'social' 
                ? 'border-[#d7f941] shadow-[0_0_30px_rgba(215,249,65,0.12)]' 
                : 'border-white/10'
            }`}
          >
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Social Distribution & Instant Alerts</CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Telegram live conversion bot, Pinterest pinning syndication, and social hooks.
                    </CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => testSingleIntegration('telegram')}
                  className="text-xs font-mono text-emerald-400 hover:bg-emerald-500/10 rounded-lg p-2 h-auto"
                >
                  Test Telegram
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Telegram */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Telegram Bot Token</label>
                  <input 
                    id="input-telegram-token"
                    type="password"
                    value={settings.telegramToken || ''}
                    onChange={e => setSettings({...settings, telegramToken: e.target.value})}
                    placeholder="123456:ABC-DEF..."
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Telegram Channel / Chat ID</label>
                  <input 
                    type="text"
                    value={settings.telegramChatId || ''}
                    onChange={e => setSettings({...settings, telegramChatId: e.target.value})}
                    placeholder="@my_channel_name or -100..."
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                {/* Pinterest */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Pinterest Access Token</label>
                  <input 
                    type="password"
                    value={settings.pinterestToken || ''}
                    onChange={e => setSettings({...settings, pinterestToken: e.target.value})}
                    placeholder="pina_..."
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                {/* Google Analytics */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Google Analytics ID</label>
                  <input 
                    type="text"
                    value={settings.analyticsId || ''}
                    onChange={e => setSettings({...settings, analyticsId: e.target.value})}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                {/* Twitter / LinkedIn */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">X (Twitter) Bearer Token</label>
                  <input 
                    type="password"
                    value={settings.twitterToken || ''}
                    onChange={e => setSettings({...settings, twitterToken: e.target.value})}
                    placeholder="Bearer token..."
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">LinkedIn Access Token</label>
                  <input 
                    type="password"
                    value={settings.linkedinToken || ''}
                    onChange={e => setSettings({...settings, linkedinToken: e.target.value})}
                    placeholder="w_member_social token..."
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

              </div>
            </CardContent>
          </Card>
        )}

        {/* 5. Affiliates & CPA Networks */}
        {shouldShowCard('affiliate', ['affiliate', 'maxbounty', 'clickbank', 'webhook', 'zapier', 'cpa']) && (
          <Card 
            id="card-affiliates" 
            className={`bg-[#0B0F17]/90 border rounded-3xl shadow-xl backdrop-blur-xl transition-all duration-300 ${
              activeGuideStep === 'affiliate' 
                ? 'border-[#d7f941] shadow-[0_0_30px_rgba(215,249,65,0.12)]' 
                : 'border-white/10'
            }`}
          >
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Third-Party Affiliate Networks & Webhooks</CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Live EPC synchronization, hoplink generation, and custom outbound webhooks.
                    </CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => testSingleIntegration('maxbounty')}
                  className="text-xs font-mono text-amber-400 hover:bg-amber-500/10 rounded-lg p-2 h-auto"
                >
                  Test MaxBounty
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">MaxBounty API Key</label>
                  <input 
                    id="input-maxbounty-key"
                    type="password"
                    value={settings.maxbountyApiKey || ''}
                    onChange={e => setSettings({...settings, maxbountyApiKey: e.target.value})}
                    placeholder="mb_live_..."
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">ClickBank Developer API Key</label>
                  <input 
                    type="password"
                    value={settings.clickbankApiKey || ''}
                    onChange={e => setSettings({...settings, clickbankApiKey: e.target.value})}
                    placeholder="DEV-..."
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Custom Webhook Endpoint URL</label>
                  <input 
                    type="url"
                    value={settings.customWebhookUrl || ''}
                    onChange={e => setSettings({...settings, customWebhookUrl: e.target.value})}
                    placeholder="https://hook.make.com/..."
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Zapier / REST API Plugin Secret</label>
                  <input 
                    type="password"
                    value={settings.customApiKey || ''}
                    onChange={e => setSettings({...settings, customApiKey: e.target.value})}
                    placeholder="Secret token for external plugins..."
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 6. Security Governance & Access Claims */}
        {shouldShowCard('security', ['security', 'governance', 'role', 'admin', 'bypass', 'whitelist', 'users']) && (
          <Card 
            id="card-privileges" 
            className={`bg-[#0B0F17]/90 border rounded-3xl shadow-xl backdrop-blur-xl transition-all duration-300 ${
              activeGuideStep === 'security' 
                ? 'border-[#d7f941] shadow-[0_0_30px_rgba(215,249,65,0.12)]' 
                : 'border-white/10'
            }`}
          >
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Access Governance & System Privileges</CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Fine-grained role policy controls, bypass overrides, and system maintenance lock.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Security Governance Role</label>
                <select
                  value={settings.role || 'admin'}
                  onChange={e => setSettings({...settings, role: e.target.value})}
                  className="w-full bg-[#131924] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#d7f941]"
                >
                  <option value="admin">System Administrator (Root - Full Read/Write Powers)</option>
                  <option value="analyst">Strategy Analyst (Read-Only Diagnostics & Topologies)</option>
                  <option value="creator">Content Creator (UGC Pipelines & Drafts Only)</option>
                </select>
              </div>

              {/* Admin Bypass Toggle */}
              <div className="bg-[#131924]/80 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                      Admin Power Override Claims
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        id="checkbox-admin-bypass"
                        type="checkbox" 
                        checked={settings.adminBypassEnabled !== false} 
                        onChange={e => setSettings({...settings, adminBypassEnabled: e.target.checked, role: e.target.checked ? 'admin' : settings.role})} 
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:bg-[#d7f941] peer-checked:bg-[#d7f941]/30"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Manually inject root administrator permissions. When active, all actions bypass policy constraints and authenticate directly.
                  </p>
                </div>
              </div>

              {/* Maintenance Mode Toggle */}
              <div className="bg-[#131924]/80 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wide">
                      System Maintenance Mode
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.maintenanceMode === true} 
                        onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} 
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:bg-red-500 peer-checked:bg-red-500/30"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Pause all autonomous agents and background workers immediately. The dashboard remains accessible for configuration.
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        )}

        {/* 7. Operator Whitelist & Governance (Admins) */}
        {isAdmin && shouldShowCard('security', ['whitelist', 'operators', 'users', 'governance']) && (
          <Card className="bg-[#0B0F17]/90 border-white/10 rounded-3xl shadow-xl backdrop-blur-xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#d7f941]/10 flex items-center justify-center text-[#d7f941] border border-[#d7f941]/20">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">User Governance & Access Whitelist</CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Manage operator clearances and role authorizations across the OptiFlow gateway.
                    </CardDescription>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={loadUsersList} 
                  disabled={loadingUsers}
                  className="border-white/10 hover:bg-white/5 text-xs font-bold text-zinc-300 rounded-xl gap-2 cursor-pointer self-start sm:self-center"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin text-[#d7f941]' : ''}`} />
                  Refresh Operators
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loadingUsers && usersList.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 font-mono text-xs flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#d7f941]" />
                  Scanning Firestore User Registry...
                </div>
              ) : usersList.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 font-mono text-xs">
                  No registered users discovered. Check auth configuration.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#131924]/60">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/5 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                        <th className="p-3.5 font-bold">Operator Profile</th>
                        <th className="p-3.5 font-bold">Identity Hash (UID)</th>
                        <th className="p-3.5 font-bold">Role Tier</th>
                        <th className="p-3.5 text-center font-bold">Clearance Status</th>
                        <th className="p-3.5 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {usersList.map((usr) => {
                        const isPrimaryOwner = usr.role === 'admin';
                        const isActioning = actioningUserId === usr.id;
                        
                        return (
                          <tr key={usr.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-3.5 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs">
                                  {usr.email || 'anonymous@optiflow.io'}
                                </span>
                                {isPrimaryOwner && (
                                  <span className="bg-[#d7f941]/10 text-[#d7f941] border border-[#d7f941]/25 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                Discovered: {usr.createdAt ? new Date(usr.createdAt).toLocaleDateString() : 'Active'}
                              </div>
                            </td>
                            <td className="p-3.5 font-mono text-[10px] text-zinc-400">
                              <span className="bg-black/30 border border-white/5 px-2 py-1 rounded select-all">
                                {usr.id}
                              </span>
                            </td>
                            <td className="p-3.5">
                              {isPrimaryOwner ? (
                                <span className="font-mono text-[10px] bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-700">
                                  Administrator (Root)
                                </span>
                              ) : (
                                <select
                                  value={usr.role || 'creator'}
                                  disabled={isActioning}
                                  onChange={(e) => handleChangeRole(usr.id, e.target.value)}
                                  className="bg-[#0D1117] border border-white/10 rounded-lg text-xs text-white px-2 py-1 focus:border-[#d7f941] focus:outline-none"
                                >
                                  <option value="admin">Administrator</option>
                                  <option value="analyst">Analyst</option>
                                  <option value="creator">Creator</option>
                                </select>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              {usr.approved || isPrimaryOwner ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  APPROVED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/25">
                                  PENDING
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right">
                              {isPrimaryOwner ? (
                                <span className="text-[10px] text-zinc-500 font-mono italic">
                                  System Lock
                                </span>
                              ) : (
                                <Button
                                  type="button"
                                  disabled={isActioning}
                                  onClick={() => handleToggleApproval(usr)}
                                  className={`text-[10px] font-bold py-1 px-3 h-auto rounded-lg transition-all cursor-pointer ${
                                    usr.approved 
                                      ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20" 
                                      : "bg-[#d7f941] hover:bg-[#cbf033] text-black font-extrabold"
                                  }`}
                                >
                                  {isActioning ? (
                                    <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                  ) : usr.approved ? (
                                    "Revoke"
                                  ) : (
                                    "Approve Access"
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

        {/* 8. Database Tools & Mock Purge */}
        {shouldShowCard('database', ['database', 'purge', 'reset', 'erase', 'mock']) && (
          <Card className="bg-[#0B0F17]/90 border border-rose-500/25 rounded-3xl shadow-xl backdrop-blur-xl">
            <CardHeader className="border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-rose-400 text-base sm:text-lg">Database & Mock Data Purge</CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Completely erase programmatic test articles, campaigns, offers, and tracking logs from Firestore.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                This action scans all core collections in Firestore and removes generated simulation records.
                <span className="text-rose-400 font-semibold ml-1">Warning: This operation is permanent and irreversible.</span>
              </p>

              {purgeSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-2xl text-xs leading-normal">
                  <span className="font-bold block mb-1">✓ Purge Success</span>
                  <span>{purgeSuccess}</span>
                </div>
              )}

              {purgeError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-2xl text-xs leading-normal">
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
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Purge All Mock & Seeded Data
                </Button>
              ) : (
                <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-2xl space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                      Verify Purge Request
                    </label>
                    <p className="text-[11px] text-zinc-400">
                      Please type <code className="bg-rose-500/15 text-rose-300 px-1 py-0.5 rounded font-mono font-bold">PURGE</code> below to authorize the wipeout.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5 max-w-md">
                    <input
                      value={confirmText}
                      onChange={e => setConfirmText(e.target.value)}
                      placeholder="Type PURGE to verify..."
                      className="bg-black/40 border border-rose-500/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500 font-mono text-xs uppercase"
                    />
                    <Button
                      type="button"
                      disabled={purging}
                      onClick={handlePurgeAllData}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                    >
                      {purging ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
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
                      className="text-xs rounded-xl cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </form>

    </div>
  );
}
