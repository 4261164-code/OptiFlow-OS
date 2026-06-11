import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Job, Article, Pin } from '../types';
import { Card, CardContent } from './ui';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  TrendingUp, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Filter,
  Calendar,
  Link2,
  Zap,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useNotifications } from './NotificationContext';
import { CampaignIcon, ArticlesIcon, PinterestIcon, BubblyAppleIcon, CloverMascotIcon, BrandingXIcon, BrandingHexIcon } from './CustomIcons';
import { AgentLauncher } from './AgentLauncher';
import { CampaignHealthHeatmap } from './CampaignHealthHeatmap';

export function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'error'>('all');
  const [viewMode, setViewMode] = useState<'launcher' | 'analytics'>('launcher');

  const { notifications } = useNotifications();
  const [aiSummary, setAiSummary] = useState<{
    healthScore: number;
    statusState: 'stellar' | 'operational' | 'warning' | 'critical';
    summary: string;
    urgentTasks: Array<{
      id: string;
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      category: 'connection' | 'seo' | 'creative' | 'general';
    }>;
    milestonesReached: string[];
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchExecutiveSummary = async (force = false) => {
    if (!auth.currentUser) return;
    if (aiLoading) return;
    
    // If we have a summary and not forcing, skip
    if (aiSummary && !force) return;

    setAiLoading(true);
    setAiError(null);

    try {
      // Package dynamic inputs for personalized portfolio telemetry
      const compactJobs = jobs.slice(0, 5).map(j => ({
        type: 'campaign_job',
        keyword: j.keyword,
        status: j.status,
        createdAt: j.createdAt,
        error: j.error || null
      }));

      const compactArticles = articles.slice(0, 5).map(a => ({
        type: 'article_published',
        title: a.title,
        updatedAt: a.updatedAt
      }));

      const compactNotifs = notifications.slice(0, 5).map(n => ({
        type: 'notification_alert',
        title: n.title,
        message: n.message,
        category: n.type,
        createdAt: n.createdAt
      }));

      const combinedActivities = [...compactJobs, ...compactArticles, ...compactNotifs];

      const res = await fetch("/api/executive-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recentActivities: combinedActivities,
          userId: auth.currentUser.uid
        })
      });

      const data = await res.json().catch(() => ({ error: "Failed to parse API response" }));

      if (!res.ok) {
        throw new Error(data.error || "Analysis engine gateway error.");
      }

      if (data.success && data.summary) {
        setAiSummary(data.summary);
      } else {
        throw new Error("Analyst returned invalid schema coordinates.");
      }
    } catch (err: any) {
      console.warn("AI summary query error:", err);
      setAiError(err?.message || String(err));
      setAiSummary(null);
    } finally {
      setAiLoading(false);
    }
  };

  // Run automatically when jobs or notifications populate
  useEffect(() => {
    if (auth.currentUser && jobs.length > 0 && !aiSummary && !aiLoading) {
      fetchExecutiveSummary();
    }
  }, [auth.currentUser, jobs.length, notifications.length]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    
    // Subscribe to Jobs
    const qJobs = query(collection(db, 'jobs'), where('userId', '==', uid));
    const unsubJobs = onSnapshot(qJobs, (snap) => {
      setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)).sort((a,b) => b.createdAt - a.createdAt));
    });

    // Subscribe to Articles
    const qArticles = query(collection(db, 'articles'), where('userId', '==', uid));
    const unsubArticles = onSnapshot(qArticles, (snap) => {
      setArticles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)).sort((a,b) => b.createdAt - a.createdAt));
    });

    // Subscribe to Pins
    const qPins = query(collection(db, 'pins'), where('userId', '==', uid));
    const unsubPins = onSnapshot(qPins, (snap) => {
      setPins(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pin)).sort((a,b) => b.createdAt - a.createdAt));
    });

    return () => { unsubJobs(); unsubArticles(); unsubPins(); };
  }, [auth.currentUser]);

  // Filter logic
  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    if (filter === 'completed') return job.status === 'completed';
    if (filter === 'processing') return job.status !== 'completed' && job.status !== 'error';
    if (filter === 'error') return job.status === 'error';
    return true;
  });

  if (viewMode === 'launcher') {
    return (
      <div className="space-y-6">
        {/* Hub Active Header Toggles */}
        <div className="flex justify-end border-b border-white/5 pb-4">
          <div className="bg-[#101115] p-1 rounded-2xl flex items-center border border-white/5 text-xs">
            <button 
              onClick={() => setViewMode('launcher')} 
              className="px-4 py-2 rounded-xl font-bold transition duration-300 flex items-center gap-2 bg-[#a8ff35] text-black shadow-md cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Agent Launcher</span>
            </button>
            <button 
              onClick={() => setViewMode('analytics')} 
              className="px-4 py-2 rounded-xl font-bold transition duration-300 flex items-center gap-2 text-zinc-400 hover:text-white cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-zinc-500" />
              <span>Campaign Console</span>
            </button>
          </div>
        </div>
        <AgentLauncher 
          onToggleToAnalytics={() => setViewMode('analytics')} 
          activeCampaignsCount={jobs.length} 
          completedArticlesCount={articles.length} 
        />
      </div>
    );
  }

  return (
    <>
      {/* Console Active Header Toggles */}
      <div className="flex justify-end border-b border-white/5 pb-4 mb-6">
        <div className="bg-[#101115] p-1 rounded-2xl flex items-center border border-white/5 text-xs">
          <button 
            onClick={() => setViewMode('launcher')} 
            className="px-4 py-2 rounded-xl font-bold transition duration-300 flex items-center gap-2 text-zinc-400 hover:text-white cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-zinc-500 hover:text-[#a8ff35]" />
            <span>Agent Launcher</span>
          </button>
          <button 
            onClick={() => setViewMode('analytics')} 
            className="px-4 py-2 rounded-xl font-bold transition duration-300 flex items-center gap-2 bg-[#a8ff35] text-black shadow-md cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Campaign Console</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Middle/Main Area: Dashboard statistics and Campaign lists (8 cols) */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* Header Title Grid (similar to top header label in visual reference) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Campaign Factory</h1>
            <p className="text-xs text-zinc-500 mt-1">Orchestrate enterprise SEO content silos and visual social feeds automatically.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 bg-white/3 px-3.5 py-2 rounded-xl border border-white/5">
              <BrandingHexIcon className="w-5.5 h-5.5 text-[#a8ff35]" />
              <span>Realtime Core Online</span>
            </span>
          </div>
        </div>

        {/* AI Executive Portfolio Summary Card */}
        <Card className="bg-[#101115] border border-white/5 rounded-[28px] p-6 shadow-2xl relative overflow-hidden group">
          {/* Subtle ambient lighting accent effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#a8ff35]/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative space-y-5">
            {/* Inside Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#a8ff35]/15 flex items-center justify-center text-[#a8ff35]">
                  <Zap className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">AI Executive Portfolio Analyst</h2>
                  <p className="text-[10px] text-zinc-500 font-medium">Real-time intelligent diagnostic auditing campaign health and logs</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Active Assessment Indicator */}
                {aiSummary && (
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${
                    aiSummary.statusState === 'stellar' ? 'text-[#a8ff35] border-[#a8ff35]/20 bg-[#a8ff35]/5' :
                    aiSummary.statusState === 'operational' ? 'text-blue-400 border-blue-500/20 bg-blue-500/5' :
                    aiSummary.statusState === 'warning' ? 'text-[#FBBF24] border-[#FBBF24]/20 bg-[#FBBF24]/5' :
                    'text-red-400 border-red-500/25 bg-red-500/5'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      aiSummary.statusState === 'stellar' ? 'bg-[#a8ff35]' :
                      aiSummary.statusState === 'operational' ? 'bg-blue-400' :
                      aiSummary.statusState === 'warning' ? 'bg-[#FBBF24]' :
                      'bg-red-400'
                    } animate-ping`} />
                    <span>{aiSummary.statusState}</span>
                  </span>
                )}

                <button 
                  onClick={() => fetchExecutiveSummary(true)}
                  disabled={aiLoading}
                  className="p-1.5 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-[10px] font-bold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin text-[#a8ff35]' : ''}`} />
                  <span>{aiLoading ? "Modeling..." : "Refresh Summary"}</span>
                </button>
              </div>
            </div>

            {/* Content Output */}
            {aiLoading && !aiSummary ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <div className="w-6 h-6 rounded-full border-2 border-[#a8ff35]/20 border-t-[#a8ff35] animate-spin" />
                <p className="text-xs text-zinc-400 font-semibold animate-pulse">Orchestrating Gemini portfolio analytic matrices...</p>
              </div>
            ) : aiError && !aiSummary ? (
              <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-400">Audit Compilation Interrupted</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{aiError}</p>
                </div>
              </div>
            ) : aiSummary ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-white/5">
                {/* Left Side: Summary paragraph & Milestones (8 cols) */}
                <div className="md:col-span-8 space-y-4">
                  <div className="flex items-start gap-4">
                    {/* Visual Radial health meter */}
                    <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center bg-zinc-950/60 rounded-full border border-white/5">
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle 
                          cx="32" 
                          cy="32" 
                          r="26" 
                          className="stroke-zinc-900" 
                          strokeWidth="3.5" 
                          fill="transparent" 
                        />
                        <circle 
                          cx="32" 
                          cy="32" 
                          r="26" 
                          stroke={
                            aiSummary.statusState === 'stellar' ? '#a8ff35' : 
                            aiSummary.statusState === 'warning' ? '#FBBF24' : 
                            aiSummary.statusState === 'critical' ? '#EF4444' : '#60A5FA'
                          } 
                          strokeWidth="4" 
                          fill="transparent" 
                          strokeDasharray="163.36"
                          strokeDashoffset={163.36 - (163.36 * aiSummary.healthScore) / 100}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="text-center z-10">
                        <span className="text-base font-extrabold text-white block leading-none font-mono">{aiSummary.healthScore}%</span>
                        <span className="text-[7px] uppercase text-zinc-500 block font-bold mt-0.5 leading-none">Health</span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans font-medium">
                        {aiSummary.summary}
                      </p>
                    </div>
                  </div>

                  {/* Staggered Milestones */}
                  {aiSummary.milestonesReached && aiSummary.milestonesReached.length > 0 && (
                    <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-2.5">
                      <h3 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#a8ff35]" />
                        <span>Core Success Indicators</span>
                      </h3>
                      <ul className="space-y-1.5">
                        {aiSummary.milestonesReached.map((milestone, i) => (
                          <li key={i} className="text-[11px] text-zinc-400 font-medium flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#a8ff35] mt-1.5 flex-shrink-0" />
                            <span>{milestone}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Right Side: Actionable Urgent Tasks (4 cols) */}
                <div className="md:col-span-4 space-y-3 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-white/5 md:pl-6">
                  <h3 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#a8ff35]" />
                    <span>Urgent Tasks ({aiSummary.urgentTasks.length})</span>
                  </h3>
                  
                  <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                    {aiSummary.urgentTasks.map((t) => (
                      <div 
                        key={t.id} 
                        className="bg-black/30 border border-white/5 hover:border-white/10 p-3 rounded-2xl space-y-1.5 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold text-white truncate max-w-[120px]">{t.title}</span>
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            t.priority === 'high' ? 'text-red-400 bg-red-400/5 border border-red-500/10' :
                            t.priority === 'medium' ? 'text-amber-400 bg-[#FBBF24]/5 border border-[#FBBF24]/10' :
                            'text-blue-400 bg-blue-500/5'
                          }`}>
                            {t.priority}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-normal font-medium">{t.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        {/* Dynamic Multichannel Campaign Health Heatmap Matrix */}
        <CampaignHealthHeatmap jobs={jobs} />

        {/* Core Stats Bento Blocks (similar to visual style in preview with Digital Agency lime accent block) */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Solid lime-green bento block mirroring the agency style card */}
          <Card className="bg-[#a8ff35] border-none rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-widest text-zinc-900 font-extrabold font-sans">Orchestrations</span>
              <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center text-zinc-950">
                <CampaignIcon className="w-5.5 h-5.5" />
              </div>
            </div>
            <div className="text-4xl font-extrabold text-zinc-950 tracking-tighter">{jobs.length}</div>
            <div className="text-[10px] text-zinc-800 font-bold mt-1.5 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-zinc-900 stroke-[3]" />
              <span>Active campaign clusters</span>
            </div>
          </Card>

          <Card className="bg-[#101115] border-white/5 rounded-3xl p-5 shadow-2xl relative overflow-hidden group hover:border-[#a8ff35]/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-widest text-[#6B6E7B] font-bold">SEO Articles</span>
              <div className="w-10 h-10 rounded-xl bg-[#a8ff35]/10 flex items-center justify-center text-[#a8ff35]">
                <ArticlesIcon className="w-5.5 h-5.5" strokeWidth={2.8} />
              </div>
            </div>
            <div className="text-4xl font-bold text-white tracking-tighter">{articles.length}</div>
            <div className="text-[10px] text-zinc-500 font-semibold mt-1 flex items-center gap-1.5">
              <BubblyAppleIcon className="w-5 h-5 text-[#a8ff35]" />
              <span>Fully indexable schema</span>
            </div>
          </Card>

          <Card className="bg-[#101115] border-white/5 rounded-3xl p-5 shadow-2xl relative overflow-hidden group hover:border-[#a8ff35]/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-widest text-[#6B6E7B] font-bold">Creative Assets</span>
              <div className="w-10 h-10 rounded-xl bg-[#a8ff35]/10 flex items-center justify-center text-[#a8ff35]">
                <PinterestIcon className="w-5.5 h-5.5" />
              </div>
            </div>
            <div className="text-4xl font-bold text-white tracking-tighter">{pins.length}</div>
            <div className="text-[10px] text-zinc-500 font-semibold mt-1 flex items-center gap-1.5">
              <CloverMascotIcon className="w-5 h-5 text-[#a8ff35]" />
              <span>Visual Pinterest pins</span>
            </div>
          </Card>
        </div>

        {/* CourseConnect Category Filter Line (exactly matching reference style with Lime underline!) */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-none py-1">
            <button 
              onClick={() => setFilter('all')}
              className={`text-xs font-semibold pb-2 transition cursor-pointer relative ${filter === 'all' ? 'text-white border-b-2 border-[#a8ff35]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              All campaigns
            </button>
            <button 
              onClick={() => setFilter('completed')}
              className={`text-xs font-semibold pb-2 transition cursor-pointer relative ${filter === 'completed' ? 'text-white border-b-2 border-[#a8ff35]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Completed
            </button>
            <button 
              onClick={() => setFilter('processing')}
              className={`text-xs font-semibold pb-2 transition cursor-pointer relative ${filter === 'processing' ? 'text-white border-b-2 border-[#a8ff35]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Active Running
            </button>
            <button 
              onClick={() => setFilter('error')}
              className={`text-xs font-semibold pb-2 transition cursor-pointer relative ${filter === 'error' ? 'text-white border-b-2 border-[#a8ff35]' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Failed / Blocked
            </button>
          </div>
          <div className="flex items-center text-[10px] uppercase tracking-wide text-zinc-500 gap-1.5 font-bold cursor-pointer hover:text-zinc-300 transition shrink-0 pl-4">
            <Filter className="w-3.5 h-3.5" />
            <span>Customize View</span>
          </div>
        </div>

        {/* Dynamic Campaigns Listing styled precisely as CourseConnect Cards! */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="bg-[#101115] border border-white/5 rounded-[28px] p-12 text-center text-zinc-500 text-sm">
              <CampaignIcon className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="font-semibold text-zinc-400">No campaigns found matching filter</p>
              <p className="text-xs text-zinc-600 mt-1">Start by orchestrating your first dynamic SEO target keyphrase campaign.</p>
              <Link to="/new" className="inline-block mt-4 text-xs bg-[#a8ff35] text-black px-4 py-2 rounded-xl hover:bg-[#92ec1d] font-bold transition">
                Create First Campaign
              </Link>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const jobAny = job as any;
              // Determine labels for features
              const hasFaq = jobAny.hasFaq ? 'FAQ Engine' : null;
              const hasLinks = jobAny.internalLinks ? 'Internal Links' : null;
              const statusColorMap = 
                job.status === 'completed' ? 'text-[#a8ff35] border-[#a8ff35]/20 bg-[#a8ff35]/5' :
                job.status === 'error' ? 'text-red-400 border-red-500/20 bg-red-500/5' :
                'text-[#a8ff35] border-[#a8ff35]/20 bg-[#a8ff35]/5 animate-pulse';

              return (
                <div 
                  key={job.id} 
                  className="bg-[#101115] border border-white/5 hover:border-[#a8ff35]/15 p-5 rounded-[24px] flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 shadow-xl shadow-black/20"
                >
                  <div className="flex items-start md:items-center gap-5 flex-1">
                    {/* Visual Mock Thumbnail (Left side in CourseConnect illustration) */}
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900/60 flex-shrink-0 flex items-center justify-center border border-white/5 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#a8ff35]/15 to-zinc-800 opacity-60" />
                      <div className="text-zinc-400 font-bold text-lg select-none uppercase z-10 font-mono">
                        {job.keyword.substring(0, 2)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#101115] rounded-tl-lg flex items-center justify-center border-t border-l border-white/5">
                        <TrendingUp className="w-3 h-3 text-[#a8ff35]" />
                      </div>
                    </div>

                    {/* Meta and Title Content */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 font-mono">Start: {new Date(job.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                        <span className="text-zinc-600">•</span>
                        <div className="flex items-center gap-1 text-[#a8ff35]">
                          <BrandingXIcon className="w-4 h-4 text-[#a8ff35]" />
                          <span className="text-[10px] font-bold">CORE NODE</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-white tracking-tight hover:text-[#a8ff35] transition-colors">
                        {job.keyword}
                      </h3>

                      {/* Course tags/Badges line (matching style of the visual badges) */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900/50 border border-white/5 px-2.5 py-1 rounded-lg">
                          Level: {jobAny.seoLevel || 'Standard'}
                        </span>
                        {hasFaq && (
                          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900/50 border border-white/5 px-2.5 py-1 rounded-lg">
                            {hasFaq}
                          </span>
                        )}
                        {hasLinks && (
                          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900/50 border border-white/5 px-2.5 py-1 rounded-lg">
                            {hasLinks}
                          </span>
                        )}
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${statusColorMap}`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action button precisely as illustrated! */}
                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    <Link 
                      to={`/articles`}
                      className="w-11 h-11 bg-[#a8ff35] hover:bg-[#92ec1d] rounded-xl flex items-center justify-center text-black font-extrabold transition-all cursor-pointer shadow-lg shadow-[#a8ff35]/15 flex-shrink-0"
                    >
                      <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Sidebar: Calendar, Mentors, Learning Progress (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Calendar Widget panel (June 2026 - matches modern style) */}
        <Card className="bg-[#101115] border-white/5 rounded-[28px] p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
             <span className="text-xs font-bold text-white flex items-center gap-1.5">
               <Calendar className="w-3.5 h-3.5 text-zinc-400" />
               <span>June 2026</span>
             </span>
             <div className="flex items-center gap-1">
                <button className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition cursor-pointer">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition cursor-pointer">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
             </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mb-3">
             {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map((day, dIdx) => (
                <span key={day} className="text-[9px] font-bold text-zinc-600 block">{day}</span>
             ))}
          </div>

          <div className="grid grid-cols-7 gap-y-3 gap-x-2 text-center text-xs">
             {/* Simple visual layout representing current week around current local date June 5th 2026 */}
             <span className="text-zinc-600 py-1 font-mono">31</span>
             <span className="text-zinc-300 py-1 font-mono">1</span>
             <span className="text-zinc-300 py-1 font-mono">2</span>
             <span className="text-zinc-300 py-1 font-mono">3</span>
             <span className="text-zinc-300 py-1 font-mono">4</span>
             {/* Selected highlighted 5th has special underline / blue circle */}
             <div className="relative py-1 flex flex-col items-center justify-center font-bold">
                <span className="text-[#a8ff35] font-mono">5</span>
                <span className="absolute bottom-0 w-1.5 h-1.5 bg-[#a8ff35] rounded-full" />
             </div>
             <span className="text-zinc-300 py-1 font-mono">6</span>
             
             <span className="text-zinc-300 py-1 font-mono">7</span>
             <span className="text-zinc-300 py-1 font-mono">8</span>
             <span className="text-zinc-300 py-1 font-mono">9</span>
             <span className="text-zinc-300 py-1 font-mono">10</span>
             <span className="text-zinc-300 py-1 font-mono">11</span>
             <span className="text-zinc-300 py-1 font-mono">12</span>
             <span className="text-zinc-300 py-1 font-mono">13</span>
          </div>
        </Card>

        {/* Mentors / Agent Profiles Section (extremely visually rich copy) */}
        <Card className="bg-[#101115] border-white/5 rounded-[28px] p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
             <span className="text-xs font-bold text-white uppercase tracking-wider">Operational Agents</span>
             <span className="text-[10px] text-[#a8ff35] font-bold hover:underline cursor-pointer">View active</span>
          </div>

          <div className="space-y-4">
             {/* Agent Item 1 */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-[#a8ff35]/60 flex items-center justify-center text-white font-bold text-xs shadow">
                     RES
                   </div>
                   <div>
                     <p className="text-xs font-bold text-white">Research Agent</p>
                     <p className="text-[10px] text-zinc-500 font-semibold">SERP & Semantic Intelligence</p>
                   </div>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">Active</span>
             </div>

             {/* Agent Item 2 */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#a8ff35] to-emerald-500 flex items-center justify-center text-black font-extrabold text-xs shadow">
                     WRT
                   </div>
                   <div>
                     <p className="text-xs font-bold text-white">Director of Content</p>
                     <p className="text-[10px] text-zinc-500 font-semibold">Markdown Generation Core</p>
                   </div>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">Active</span>
             </div>

             {/* Agent Item 3 */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow">
                     PIN
                   </div>
                   <div>
                     <p className="text-xs font-bold text-white">Pinterest Creative Node</p>
                     <p className="text-[10px] text-zinc-500 font-semibold">Visual Layout Engine</p>
                   </div>
                </div>
                <span className="text-[10px] text-purple-400 bg-purple-500/5 border border-purple-500/20 px-2 py-0.5 rounded font-mono font-bold">Waiting</span>
             </div>
          </div>
        </Card>

        {/* Learning Process / Active Syndications Tracker (slash patterned!) */}
        <Card className="bg-[#101115] border-white/5 rounded-[28px] p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
             <span className="text-xs font-bold text-white uppercase tracking-wider">Syndication Process</span>
             <span className="text-[10px] text-zinc-500 font-mono font-bold">Live Streams</span>
          </div>

          <div className="space-y-4">
             {/* Progress Bar 1 */}
             <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold">
                   <span className="text-zinc-300">Google Index Syndication</span>
                   <span className="text-[#a8ff35]">80%</span>
                </div>
                <div className="h-2.5 w-full bg-zinc-800/60 rounded-full overflow-hidden relative">
                   {/* Slash patterned background */}
                   <div 
                     className="h-full bg-gradient-to-r from-emerald-500 to-[#a8ff35] rounded-full transition-all duration-300"
                     style={{ 
                       width: '80%',
                       backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                       backgroundSize: '10px 10px'
                     }}
                   />
                </div>
             </div>

             {/* Progress Bar 2 */}
             <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold">
                   <span className="text-zinc-300">Pinterest Creative Distribution</span>
                   <span className="text-[#a8ff35]">60%</span>
                </div>
                <div className="h-2.5 w-full bg-zinc-800/60 rounded-full overflow-hidden relative">
                   <div 
                     className="h-full bg-gradient-to-r from-[#a8ff35] to-emerald-600 rounded-full transition-all duration-300"
                     style={{ 
                       width: '60%',
                       backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                       backgroundSize: '10px 10px'
                     }}
                   />
                </div>
             </div>

             {/* Progress Bar 3 */}
             <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold">
                   <span className="text-zinc-300">LinkedIn Broadcasting pipeline</span>
                   <span className="text-[#a8ff35]">95%</span>
                </div>
                <div className="h-2.5 w-full bg-zinc-800/60 rounded-full overflow-hidden relative">
                   <div 
                     className="h-full bg-gradient-to-r from-[#a8ff35] to-purple-600 rounded-full transition-all duration-300"
                     style={{ 
                       width: '95%',
                       backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                       backgroundSize: '10px 10px'
                     }}
                   />
                </div>
             </div>
          </div>
        </Card>

      </div>
    </div>
    </>
  );
}
