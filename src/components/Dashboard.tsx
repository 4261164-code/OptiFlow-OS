import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Job, Article, Pin } from '../types';
import { apiFetch } from '../lib/auth';
import { Card } from './ui';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  ArrowRight, 
  Filter,
  Activity,
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
    
    if (aiSummary && !force) return;

    setAiLoading(true);
    setAiError(null);

    try {
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

      const res = await apiFetch("/api/executive-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recentActivities: combinedActivities
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
      console.log("AI summary query error:", err);
      setAiError(err?.message || String(err));
      setAiSummary(null);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (auth.currentUser && jobs.length > 0 && !aiSummary && !aiLoading) {
      const timer = setTimeout(() => {
        fetchExecutiveSummary();
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [auth.currentUser, jobs.length > 0, !!aiSummary]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    
    const qJobs = query(collection(db, 'jobs'), where('userId', '==', uid));
    const unsubJobs = onSnapshot(qJobs, (snap) => {
      setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)).sort((a,b) => b.createdAt - a.createdAt));
    }, (error) => {
      console.warn("Error in Dashboard jobs subscription:", error);
    });

    const qArticles = query(collection(db, 'articles'), where('userId', '==', uid));
    const unsubArticles = onSnapshot(qArticles, (snap) => {
      setArticles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)).sort((a,b) => b.createdAt - a.createdAt));
    }, (error) => {
      console.warn("Error in Dashboard articles subscription:", error);
    });

    const qPins = query(collection(db, 'pins'), where('userId', '==', uid));
    const unsubPins = onSnapshot(qPins, (snap) => {
      setPins(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pin)).sort((a,b) => b.createdAt - a.createdAt));
    }, (error) => {
      console.warn("Error in Dashboard pins subscription:", error);
    });

    return () => { unsubJobs(); unsubArticles(); unsubPins(); };
  }, [auth.currentUser]);

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    if (filter === 'completed') return job.status === 'completed';
    if (filter === 'processing') return job.status !== 'completed' && job.status !== 'error';
    if (filter === 'error') return job.status === 'error';
    return true;
  });

  if (viewMode === 'launcher') {
    return (
      <div className="space-y-8">
        <div className="flex justify-end border-b border-white/5 pb-6">
          <div className="bg-[#0D1117] p-1 rounded-full flex items-center border border-white/5 text-xs shadow-inner">
            <button 
              onClick={() => setViewMode('launcher')} 
              className="px-6 py-2.5 rounded-full font-bold transition duration-300 flex items-center gap-2 bg-blue-600 text-white shadow-lg cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>Agent Launcher</span>
            </button>
            <button 
              onClick={() => setViewMode('analytics')} 
              className="px-6 py-2.5 rounded-full font-bold transition duration-300 flex items-center gap-2 text-zinc-400 hover:text-white cursor-pointer"
            >
              <BarChart3 className="w-4 h-4" />
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
      <div className="flex justify-end border-b border-white/5 pb-6 mb-8">
        <div className="bg-[#0D1117] p-1 rounded-full flex items-center border border-white/5 text-xs shadow-inner">
          <button 
            onClick={() => setViewMode('launcher')} 
            className="px-6 py-2.5 rounded-full font-bold transition duration-300 flex items-center gap-2 text-zinc-400 hover:text-white cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>Agent Launcher</span>
          </button>
          <button 
            onClick={() => setViewMode('analytics')} 
            className="px-6 py-2.5 rounded-full font-bold transition duration-300 flex items-center gap-2 bg-blue-600 text-white shadow-lg cursor-pointer"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Campaign Console</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Area: Dashboard stats and Campaign lists */}
        <div className="lg:col-span-12 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white font-sans">Campaign Factory</h1>
              <p className="text-sm text-zinc-500 mt-1">Orchestrate enterprise SEO content silos automatically.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-zinc-400 font-mono flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-lg border border-white/5">
                <BrandingHexIcon className="w-5 h-5 text-blue-500" />
                <span>REALTIME CORE ONLINE</span>
              </span>
            </div>
          </div>
            <CampaignHealthHeatmap jobs={jobs} />
        </div>
      </div>
    </>
  );
}
