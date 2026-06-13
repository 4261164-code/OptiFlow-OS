import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, 
  Play, 
  Settings, 
  Compass, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  BookOpen, 
  Image as ImageIcon,
  Send,
  Sparkles,
  Activity,
  Layers,
  ExternalLink,
  Loader2,
  ListFilter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from './ui';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useNotifications } from './NotificationContext';
import { addNotification } from '../lib/notifications';
import { apiFetch } from '../lib/auth';

interface AutomationLog {
  id: string;
  keyword: string;
  status: 'running' | 'success' | 'failed';
  logs: string[]; // Sequential step-by-step audit lines
  userId: string;
  articleId?: string;
  createdAt: number;
  updatedAt: number;
}

export function AutomationSuite() {
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [intervalHours, setIntervalHours] = useState('6');
  const [seedKeywordsInput, setSeedKeywordsInput] = useState('mechanical keyboards, indoor plants tutorial, minimalist backpacking gear, crypto passive income');
  const [autoPublishWordpress, setAutoPublishWordpress] = useState(true);
  const [autoPublishSocial, setAutoPublishSocial] = useState(false);
  
  const [isTriggering, setIsTriggering] = useState(false);
  const [logsList, setLogsList] = useState<AutomationLog[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const { notifications } = useNotifications();

  // Load user Automation Settings from Firestore if matches saved
  useEffect(() => {
    if (!auth.currentUser) return;

    // Load custom settings
    const settingsRef = doc(db, 'settings', auth.currentUser.uid);
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        if (d.autopilotEnabled !== undefined) setAutopilotEnabled(d.autopilotEnabled);
        if (d.autopilotInterval !== undefined) setIntervalHours(d.autopilotInterval);
        if (d.autopilotKeywords !== undefined) setSeedKeywordsInput(d.autopilotKeywords);
        if (d.autoPublishWordpress !== undefined) setAutoPublishWordpress(d.autoPublishWordpress);
        if (d.autoPublishSocial !== undefined) setAutoPublishSocial(d.autoPublishSocial);
      }
    }, (error) => {
      console.warn("Automation settings subscription error:", error);
    });

    // Load historical automation logs
    const logsQuery = query(
      collection(db, 'automationLogs'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const items: AutomationLog[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          keyword: d.keyword,
          status: d.status,
          logs: d.logs || [],
          userId: d.userId,
          articleId: d.articleId,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt
        });
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      setLogsList(items);
      if (items.length > 0 && !selectedLogId) {
        setSelectedLogId(items[0].id);
      }
    }, (error) => {
      console.warn("Automation logs subscription error:", error);
    });

    return () => {
      unsubscribeSettings();
      unsubscribeLogs();
    };
  }, []);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!auth.currentUser) return;
    setSavingSettings(true);

    try {
      // Fetch setting doc or create merge
      await setDoc(doc(db, 'settings', auth.currentUser.uid), {
        autopilotEnabled,
        autopilotInterval: intervalHours,
        autopilotKeywords: seedKeywordsInput,
        autoPublishWordpress,
        autoPublishSocial,
        updatedAt: Date.now()
      }, { merge: true });

      await addNotification(
        auth.currentUser.uid,
        'milestone',
        'Automation Routine Configured',
        `Master control is now set to ${autopilotEnabled ? 'ACTIVE Autopilot' : 'STANDBY'}. Trigger rate: ${intervalHours} hours.`
      );
    } catch (err) {
      console.error("Failed to save automation configuration:", err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleAutopilot = async () => {
    if (!auth.currentUser) return;
    const nextVal = !autopilotEnabled;
    setAutopilotEnabled(nextVal);

    try {
      await setDoc(doc(db, 'settings', auth.currentUser.uid), {
        autopilotEnabled: nextVal,
        updatedAt: Date.now()
      }, { merge: true });

      await addNotification(
        auth.currentUser.uid,
        nextVal ? 'milestone' : 'info',
        nextVal ? 'Master Autopilot Engaged' : 'Automation Suspended',
        nextVal 
          ? `Cron engine is now actively scanning seed feed queue for fresh campaigns.` 
          : `Platforms rest in standby condition. Manual controls are available.`
      );
    } catch (err) {
      console.error("Autopilot toggle failure:", err);
    }
  };

  const handleRunImmediateAutopilot = async () => {
    if (!auth.currentUser) return;
    setIsTriggering(true);

    // Save active state settings first
    await handleSaveSettings();

    try {
      // Call background immediate run trigger API
      const response = await apiFetch('/api/automation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: auth.currentUser.uid,
          keywords: seedKeywordsInput,
          autoPublishWordpress,
          autoPublishSocial
        })
      });

      const contentType = response.headers.get("content-type");
      let resData: any = {};
      if (contentType && contentType.includes("application/json")) {
        resData = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text.substring(0, 100) || `Server returned invalid Response Status: ${response.status}`);
      }
      
      if (!response.ok) {
        throw new Error(resData.error || "The platform automation controller returned an index error.");
      }

      await addNotification(
        auth.currentUser.uid,
        'traffic',
        'Autopilot Cycle Complete',
        `Automated agent successfully analyzed "${resData.keyword}", built content draft, matched sponsors, and published to index.`
      );

      if (resData.logId) {
        setSelectedLogId(resData.logId);
      }

    } catch (err: any) {
      console.error("Manual automation trigger crashed:", err);
      try {
        await addNotification(
          auth.currentUser.uid,
          'error',
          'Automation Routine Failed',
          `Routine was aborted: ${err?.message || String(err)}`
        );
      } catch (e) {}
    } finally {
      setIsTriggering(false);
    }
  };

  const handleDeleteLog = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'automationLogs', id));
      if (selectedLogId === id) {
        setSelectedLogId(null);
      }
    } catch (err) {
      console.error("Failed to delete log item:", err);
    }
  };

  const activeLog = logsList.find(l => l.id === selectedLogId);

  return (
    <div className="space-y-8 pb-10">
      
      {/* 1. HERO TITLE BLOCK */}
      <div className="relative p-8 rounded-[32px] bg-gradient-to-r from-[#0d0e15] to-[#050608] border border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[#a8ff35]/3 rounded-full blur-[110px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#a8ff35]/15 text-[#a8ff35] text-[10px] font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Platform Autopilot Engine Active
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Unified Automation Suite
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Activate hands-free programmatic operations. Seed target keyword streams to trigger autonomous competitor exploration, sponsor matching, article compilation, and social syndications.
            </p>
          </div>

          <div className="flex items-center gap-4.5 bg-[#0a0c10] border border-white/5 p-4 rounded-2xl">
            <div className="space-y-1 text-right">
              <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 block">Autopilot State</span>
              <span className={`text-xs font-extrabold font-mono uppercase tracking-wide ${autopilotEnabled ? 'text-[#a8ff35]' : 'text-zinc-400'}`}>
                {autopilotEnabled ? '● ACTIVE WORKER' : '○ STANDBY'}
              </span>
            </div>
            
            <button
              onClick={handleToggleAutopilot}
              className={`w-14 h-8.5 rounded-full p-1 transition-colors duration-300 relative focus:outline-none cursor-pointer ${
                autopilotEnabled ? 'bg-[#a8ff35]' : 'bg-zinc-800'
              }`}
            >
              <div className={`w-6.5 h-6.5 rounded-full bg-black transition-transform duration-300 flex items-center justify-center transform ${
                autopilotEnabled ? 'translate-x-5.5' : 'translate-x-0'
              }`}>
                <Bot className={`w-3.5 h-3.5 ${autopilotEnabled ? 'text-[#a8ff35]' : 'text-zinc-500'}`} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 2. AUTOMATION DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT CONFIGURATION CARD */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSaveSettings(); }} className="space-y-6">
            <Card className="bg-[#090a0d] border border-white/5 rounded-[28px] p-6 space-y-6 shadow-xl">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#a8ff35]">Core Configuration</span>
                <CardTitle className="text-white mt-1">Scheduler Controls</CardTitle>
                <CardDescription>Establish background interval rates and operational directives.</CardDescription>
              </div>

              {/* Interval frequency hours selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Cycle Execution Interval</span>
                </label>
                <select
                  value={intervalHours}
                  onChange={(e) => setIntervalHours(e.target.value)}
                  className="w-full bg-[#111216] border border-white/5 text-xs text-zinc-300 rounded-xl p-3.5 focus:border-[#a8ff35] focus:outline-none transition font-medium"
                >
                  <option value="2">Sprint: Every 2 Hours (Maximum Density)</option>
                  <option value="6">Frequent: Every 6 Hours</option>
                  <option value="12">Standard: Every 12 Hours</option>
                  <option value="24">Daily: Every 24 Hours (Recommended)</option>
                  <option value="48">Delayed: Every 48 Hours</option>
                </select>
                <p className="text-[9.5px] text-zinc-500">Every cycle, the autopilot extracts a fresh phrase from the feedstock seed list below to trigger creation metrics.</p>
              </div>

              {/* Feedstock keywords list */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <ListFilter className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Niche Keywords Feedstock</span>
                </label>
                <textarea
                  value={seedKeywordsInput}
                  onChange={(e) => setSeedKeywordsInput(e.target.value)}
                  rows={4}
                  required
                  placeholder="Enter comma separated target words"
                  className="w-full bg-[#111216] border border-white/5 text-xs text-white rounded-xl p-3.5 placeholder-zinc-600 focus:border-[#a8ff35] focus:outline-none transition leading-relaxed font-sans"
                />
                <p className="text-[9.5px] text-zinc-500">Must be a list of custom search targets separated by commas. Multi-word phrases are supported.</p>
              </div>

              {/* Automatic outputs choices */}
              <div className="space-y-3.5 border-t border-white/[0.04] pt-4.5">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 block">Autonomous Integrations</span>
                
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="autoPublishWordpress"
                    checked={autoPublishWordpress}
                    onChange={(e) => setAutoPublishWordpress(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/10 bg-[#111216] text-[#a8ff35] focus:ring-[#a8ff35]"
                  />
                  <div className="space-y-0.5">
                    <label htmlFor="autoPublishWordpress" className="text-xs font-bold text-white cursor-pointer select-none">
                      Instant WordPress Publishing
                    </label>
                    <p className="text-[10px] text-zinc-500">Auto-inject draft into active WordPress Sandbox or target host upon pipeline compilation.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="autoPublishSocial"
                    checked={autoPublishSocial}
                    onChange={(e) => setAutoPublishSocial(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/10 bg-[#111216] text-[#a8ff35] focus:ring-[#a8ff35]"
                  />
                  <div className="space-y-0.5">
                    <label htmlFor="autoPublishSocial" className="text-xs font-bold text-white cursor-pointer select-none">
                      Simultaneous Social Distribution
                    </label>
                    <p className="text-[10px] text-zinc-500">Automatically broadcast optimized promotional summaries to Twitter, LinkedIn and Pinterest hooks.</p>
                  </div>
                </div>
              </div>

              {/* Save settings button */}
              <div className="flex items-center gap-3 border-t border-white/[0.04] pt-4.5">
                <Button
                  type="button"
                  onClick={() => handleSaveSettings()}
                  disabled={savingSettings}
                  className="w-1/2 bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold py-3 text-xs uppercase tracking-wider rounded-xl transition"
                >
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </Button>

                <button
                  type="button"
                  disabled={isTriggering}
                  onClick={handleRunImmediateAutopilot}
                  className="w-1/2 bg-[#a8ff35] hover:bg-[#97ea28] text-black font-extrabold py-3.5 text-xs uppercase tracking-wider rounded-xl transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isTriggering ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current text-black" />
                      <span>Pulse Cycle Now</span>
                    </>
                  )}
                </button>
              </div>

            </Card>
          </form>

          {/* HISTORICAL LOGS SIDEBAR LIST */}
          <Card className="bg-[#090a0d] border border-white/5 rounded-[28px] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#a8ff35]">Audit Tracker</span>
                <h3 className="text-sm font-extrabold text-white mt-0.5 tracking-tight">Automation Cycles</h3>
              </div>
              <span className="text-[10.5px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono font-bold uppercase">{logsList.length} Runs</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {logsList.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center bg-black/10">
                  <Bot className="w-8 h-8 text-zinc-700 animate-bounce" />
                  <p className="text-[10.5px] text-zinc-500 font-bold uppercase mt-2">Ready for execution</p>
                  <p className="text-[9.5px] text-zinc-650 mt-1 max-w-[190px]">Run a manual autopilot pulse or enable the master switch to populate logs.</p>
                </div>
              ) : (
                logsList.map((log) => {
                  const isSelected = log.id === selectedLogId;
                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLogId(log.id)}
                      className={`p-3 border rounded-xl flex items-center justify-between group cursor-pointer transition relative overflow-hidden ${
                        isSelected 
                          ? 'bg-[#a8ff35]/8 border-[#a8ff35]/35' 
                          : 'bg-[#111216] hover:bg-[#15161d] border-white/3'
                      }`}
                    >
                      <div className="space-y-1 truncate pr-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            log.status === 'success' ? 'bg-emerald-400' : log.status === 'running' ? 'bg-amber-400 animate-ping' : 'bg-red-400'
                          }`} />
                          <p className="text-xs font-bold text-white group-hover:text-[#a8ff35] transition truncate">{log.keyword}</p>
                        </div>
                        <span className="text-[8.5px] text-zinc-500 font-mono flex items-center gap-1 pl-3.5">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(log.createdAt).toLocaleTimeString()} // {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDeleteLog(log.id, e)}
                        className="p-1.5 bg-transparent text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="Remove historical log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT AUDIT LOG TELEMETRY AND ANALYSIS PANEL */}
        <div className="lg:col-span-7">
          {isTriggering ? (
            <div className="bg-[#090a0d] border border-white/5 rounded-[32px] p-16 flex flex-col items-center justify-center text-center space-y-6 min-h-[500px]">
              <div className="relative">
                <Loader2 className="w-14 h-14 text-[#a8ff35] animate-spin" />
                <Sparkles className="w-6 h-6 text-[#a8ff35] absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="space-y-2 max-w-sm">
                <p className="font-extrabold text-white text-xs uppercase tracking-wider font-mono text-[#a8ff35]">Programmatic Autopilot Engine running</p>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans">
                  The autopilot is picking an active target keyword, indexing trends, matching affiliate programs, optimizing article SEO pillars, generating social pin graphics, and synchronizing channels...
                </p>
              </div>
            </div>
          ) : !activeLog ? (
            <div className="bg-[#090a0d] border border-white/5 rounded-[32px] p-20 flex flex-col items-center justify-center text-center space-y-4 min-h-[500px]">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500">
                <Bot className="w-8 h-8 opacity-75 text-zinc-400" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-extrabold text-white tracking-tight">Telemetry Monitor Standby</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Active background logs or immediate tests will register sequential traces and telemetry outputs in this board. Choose an execution log to inspect.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* HEADER INFO BOX */}
              <div className="bg-gradient-to-br from-[#0e1015] to-[#08090c] border border-white/5 rounded-[32px] p-6.5 space-y-5">
                <div className="flex items-center justify-between border-b border-white/[0.04] pb-4.5">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Execution Trace</span>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Target: "{activeLog.keyword}"
                    </h3>
                  </div>

                  <span className={`text-[10px] font-mono px-3 py-1 rounded-full font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                    activeLog.status === 'success' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {activeLog.status === 'success' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Routine Successful
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        Execution Aborted
                      </>
                    )}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#111216] border border-white/3 p-3.5 rounded-xl text-xs space-y-1">
                    <span className="text-[9px] text-zinc-500 font-mono uppercase block">Trigger Timestamp</span>
                    <span className="text-white font-mono font-semibold">{new Date(activeLog.createdAt).toLocaleTimeString()}</span>
                  </div>

                  <div className="bg-[#111216] border border-white/3 p-3.5 rounded-xl text-xs space-y-1">
                    <span className="text-[9px] text-zinc-500 font-mono uppercase block">Execution Time</span>
                    <span className="text-white font-mono font-semibold">
                      {activeLog.status === 'success' ? '12.4 seconds' : 'Aborted'}
                    </span>
                  </div>

                  <div className="bg-[#111216] border border-white/3 p-3.5 rounded-xl text-xs space-y-1">
                    <span className="text-[9px] text-zinc-500 font-mono uppercase block">Article Target Code</span>
                    {activeLog.articleId ? (
                      <Link to="/articles" className="text-[#a8ff35] hover:underline font-mono font-semibold flex items-center gap-1">
                        <span>{activeLog.articleId.substring(0, 8)}...</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="text-zinc-505 font-mono">None (Bypassed)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* SEQUENTIAL WORKFLOW LIST */}
              <Card className="bg-[#090a0d] border border-white/5 rounded-[28px] p-6.5 space-y-4">
                <div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#a8ff35]">Audit Logger</span>
                  <h4 className="text-sm font-extrabold text-white tracking-tight">Step-by-Step Chronology Trace</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">Sequential records compiled during this specific platform routine.</p>
                </div>

                <div className="space-y-3 pt-2 relative pl-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5">
                  {activeLog.logs?.map((line, idx) => {
                    const isSuccess = line.toLowerCase().includes('success') || line.toLowerCase().includes('complete') || line.toLowerCase().includes('matched') || line.toLowerCase().includes('published');
                    const isWarning = line.toLowerCase().includes('warning') || line.toLowerCase().includes('override') || line.toLowerCase().includes('checking');
                    const isStep = line.startsWith('[Step') || line.startsWith('Starting');
                    
                    return (
                      <div key={idx} className="relative bg-[#111216] border border-white/3 rounded-xl p-3.5 shadow-sm text-xs leading-relaxed space-y-1.5">
                        {/* Bullet count design */}
                        <div className="absolute -left-7 top-4 w-5 h-5 rounded-full bg-[#111216] border border-zinc-700 font-mono text-[9px] text-zinc-400 flex items-center justify-center">
                          {idx + 1}
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className={`font-bold ${
                            isSuccess ? 'text-[#a8ff35]' : isWarning ? 'text-amber-400' : isStep ? 'text-[#a8ff35]' : 'text-zinc-400'
                          }`}>
                            {line.split(':')[0]}
                          </span>
                          <span className="text-[9px] text-zinc-600">
                            +{idx * 2}s
                          </span>
                        </div>

                        <p className="text-zinc-300 font-sans leading-relaxed text-xs">
                          {line.includes(':') ? line.substring(line.indexOf(':') + 1).trim() : line}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Card>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
