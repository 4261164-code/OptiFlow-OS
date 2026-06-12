import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { 
  Activity, 
  Cpu, 
  DollarSign, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Play, 
  Pause, 
  Info,
  TrendingUp,
  Brain,
  ShieldCheck,
  Server
} from 'lucide-react';

interface HealthOverview {
  agentFailureRate: number;
  pipelineFailureRate: number;
  retrySuccessRate: number;
  mostUnstableClusters: string[];
  mostFailingOffers: string[];
  timestamp: number;
}

interface CostEvent {
  id: string;
  type: string;
  cost: number;
  model: string;
  entityId: string;
  description: string;
  timestamp: number;
}

interface ProfitMetric {
  id: string;
  entityId: string;
  type: string;
  revenue: number;
  cost: number;
  profit: number;
  roi: number;
}

interface OpCluster {
  id: string;
  title: string;
  keyword: string;
  status: string;
}

interface OpJob {
  id: string;
  keyword: string;
  status: string;
  error?: string;
  updatedAt: number;
}

export function OpsBoard() {
  const [health, setHealth] = useState<HealthOverview>({
    agentFailureRate: 0.004,
    pipelineFailureRate: 0.015,
    retrySuccessRate: 1.0,
    mostUnstableClusters: ['Autonomous Trading', 'Growth Marketing'],
    mostFailingOffers: ['unassigned-fallback'],
    timestamp: Date.now()
  });
  const [recentCosts, setRecentCosts] = useState<CostEvent[]>([]);
  const [profits, setProfits] = useState<ProfitMetric[]>([]);
  const [clusters, setClusters] = useState<OpCluster[]>([]);
  const [failedJobs, setFailedJobs] = useState<OpJob[]>([]);

  const [syncing, setSyncing] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [togglingClusterId, setTogglingClusterId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Authenticated ops headers
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.currentUser?.uid || 'dev-guest'}`
    };
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    // 1. Subscribe to failed jobs for immediate force-retry tracking
    const qJobs = query(
      collection(db, 'jobs'), 
      where('userId', '==', uid),
      where('status', '==', 'error')
    );
    const unsubJobs = onSnapshot(qJobs, (snap) => {
      setFailedJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as OpJob)));
    });

    // 2. Subscribe to active clusters for pause/resume state management
    const qClusters = query(
      collection(db, 'topic_clusters'),
      where('userId', '==', uid)
    );
    const unsubClusters = onSnapshot(qClusters, (snap) => {
      setClusters(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as OpCluster)));
    });

    // 3. Keep real-time sync of profit metrics
    const qProfits = query(collection(db, 'profit_metrics'), orderBy('roi', 'desc'), limit(15));
    const unsubProfits = onSnapshot(qProfits, (snap) => {
      if (!snap.empty) {
        setProfits(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProfitMetric)));
      }
    }, (error) => {
      console.warn("Real-time profit metrics subscription error, using raw calculations fallback", error);
    });

    // 4. Load initial health digest and costs through ops routing
    fetch(`/api/ops/health-digest`, {
      headers: getHeaders()
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.overview) setHealth(data.overview);
          if (data.recentCosts) setRecentCosts(data.recentCosts);
          // if no profit_metrics set by subscription, fallback
          if (data.topProfitMetrics && data.topProfitMetrics.length > 0) {
            setProfits(data.topProfitMetrics);
          }
        }
      })
      .catch(err => console.error("Failed to load health overview:", err));

    return () => {
      unsubJobs();
      unsubClusters();
      unsubProfits();
    };
  }, [auth.currentUser]);

  // Trigger Manual Ledger Syc
  const triggerLedgerSync = async () => {
    setSyncing(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/ops/recovery/ledger-sync', {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ text: 'Prisinte Ledger and Pre-aggregated Metrics synchronized successfully!', type: 'success' });
        // Reload health metrics and stats
        const digestRes = await fetch(`/api/ops/health-digest`, { headers: getHeaders() });
        const digestData = await digestRes.json();
        if (digestData.success) {
          if (digestData.overview) setHealth(digestData.overview);
          if (digestData.recentCosts) setRecentCosts(digestData.recentCosts);
          if (digestData.topProfitMetrics) setProfits(digestData.topProfitMetrics);
        }
      } else {
        setStatusMessage({ text: data.error || 'Failed to sync immutable ledger metrics.', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Network gateway error contacting SaaS Ops api.', type: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  // Trigger Force Retry on Job
  const triggerJobRetry = async (jobId: string) => {
    setRetryingId(jobId);
    try {
      const res = await fetch('/api/ops/job/retry', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ jobId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ text: `Job ${jobId} successfully re-queued into Autopilot queue.`, type: 'success' });
      } else {
        setStatusMessage({ text: data.error || 'Autopilot force-retry rejected.', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to send autopilot job signal.', type: 'error' });
    } finally {
      setRetryingId(null);
    }
  };

  // Toggle Cluster State (Pause/Resume)
  const toggleClusterStatus = async (clusterId: string, currentStatus: string) => {
    setTogglingClusterId(clusterId);
    const action = currentStatus === 'paused' ? 'resume' : 'pause';
    try {
      const res = await fetch('/api/ops/cluster/pause-resume', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ clusterId, action })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ text: `Cluster successfully ${action === 'pause' ? 'paused' : 'resumed'}!`, type: 'success' });
      } else {
        setStatusMessage({ text: data.error || 'Cluster status toggle failed.', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failure connecting to cluster operations api.', type: 'error' });
    } finally {
      setTogglingClusterId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Status Notifications */}
      {statusMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between border ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' 
            : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900'
        }`}>
          <div className="flex items-center space-x-3">
            {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="text-sm font-medium">{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="text-xs hover:underline uppercase tracking-wide cursor-pointer font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 1: SYSTEM HEALTH OVERVIEW */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Failure Observability & Health</h2>
          </div>
          <button
            onClick={triggerLedgerSync}
            disabled={syncing}
            className="inline-flex items-center bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white dark:text-gray-100 font-medium text-xs px-3 py-2 rounded-lg transition-colors border border-zinc-700 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synchronizing Recalculation...' : 'Run Ledger Metrics Sync'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">Click Loss Ratio</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-white">
              {(health.agentFailureRate * 100).toFixed(2)}%
            </p>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block pb-1">
              Confirmed buffered click events ratio versus total clicks.
            </span>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${Math.max(100 - health.agentFailureRate * 500, 5)}%` }}></div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">Agent Autopilot Pipeline Errors</span>
              <Brain className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-white">
              {(health.pipelineFailureRate * 100).toFixed(2)}%
            </p>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block pb-1">
              Active job pipeline instances registering execution failures.
            </span>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full" style={{ width: `${Math.max(100 - health.pipelineFailureRate * 500, 5)}%` }}></div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">Webhook Postback Match Rate</span>
              <Server className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-white">
              {(health.retrySuccessRate * 100).toFixed(1)}%
            </p>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block pb-1">
              Successful matches of incoming network conversions post-retry.
            </span>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${health.retrySuccessRate * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Warning list blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" /> Unstable Semantic Clusters
            </h4>
            <div className="space-y-2">
              {health.mostUnstableClusters.map((clusterName, i) => (
                <div key={i} className="flex justify-between items-center text-xs text-red-200/80 bg-red-950/20 px-3 py-1.5 rounded">
                  <span>{clusterName}</span>
                  <span className="font-mono text-[10px] font-bold text-red-400 uppercase bg-red-950/50 px-1.5 py-0.5 rounded">Fluctuating Error Rates</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 bg-orange-500/5 border border-orange-500/10 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1.5" /> Failing Offers/Links
            </h4>
            <div className="space-y-2">
              {health.mostFailingOffers.map((offerName, i) => (
                <div key={i} className="flex justify-between items-center text-xs text-orange-200/80 bg-orange-950/20 px-3 py-1.5 rounded">
                  <span>{offerName}</span>
                  <span className="font-mono text-[10px] font-bold text-orange-400 uppercase bg-orange-950/50 px-1.5 py-0.5 rounded">Orphan Redirect Warnings</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: COSTS & PROFIT DRILLDOWN (Task 5) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Event stream */}
        <div className="p-6 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-850">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-sm uppercase tracking-wide">
              <Cpu className="w-4 h-4 text-indigo-400 mr-2" /> Recent AI & Compute Cost Ledger
            </h3>
            <span className="text-xs font-mono text-zinc-400">Task 5 Cost Tracker</span>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1 text-xs">
            {recentCosts.length === 0 ? (
              <div className="text-zinc-500 flex flex-col justify-center items-center h-[200px] text-center border-2 border-dashed border-zinc-800 rounded-lg">
                <Info className="w-8 h-8 mb-2 opacity-30 text-zinc-400" />
                <p>No cost events logs found.</p>
                <p className="text-[10px]">Costs populate as Autopilot and image agents execute.</p>
              </div>
            ) : (
              recentCosts.map((cost) => (
                <div key={cost.id} className="flex justify-between items-start p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-850 rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium text-zinc-950 dark:text-zinc-200">{cost.description || cost.type}</p>
                    <div className="flex items-center space-x-1.5 font-mono text-[10px] text-zinc-400">
                      <span className="bg-zinc-800 text-zinc-300 font-bold px-1.5 py-0.5 rounded uppercase">{cost.type.replace('_', ' ')}</span>
                      <span>{cost.model || 'model'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-500 font-mono">-${cost.cost.toFixed(4)}</p>
                    <p className="text-[9px] text-zinc-500">{new Date(cost.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Profit Metrics Table */}
        <div className="p-6 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-850 font-sans">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-sm uppercase tracking-wide">
              <TrendingUp className="w-4 h-4 text-emerald-400 mr-2" /> ROI & Profit Breakdown per Pillar
            </h3>
            <span className="text-xs font-mono text-emerald-400">Real profit metrics</span>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 text-xs font-sans">
            {profits.length === 0 ? (
              <div className="text-zinc-500 flex flex-col justify-center items-center h-[200px] text-center border-2 border-dashed border-zinc-800 rounded-lg">
                <DollarSign className="w-8 h-8 mb-2 opacity-30 text-zinc-400" />
                <p>No aggregated profit metrics compile yet.</p>
                <p className="text-[10px]">Run a Ledger Sync to compute active ROI lists.</p>
              </div>
            ) : (
              profits.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-850 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{p.entityId}</p>
                      <span className="bg-emerald-950/50 text-emerald-400 text-[9px] font-bold px-1 rounded uppercase">{p.type}</span>
                    </div>
                    <div className="flex space-x-3 text-[10px] text-zinc-500 font-mono">
                      <span>Rev: <strong className="text-zinc-950 dark:text-zinc-300">${p.revenue.toFixed(2)}</strong></span>
                      <span>Cost: <strong className="text-zinc-950 dark:text-zinc-300">${p.cost.toFixed(3)}</strong></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400 font-mono">+${p.profit.toFixed(2)}</p>
                    <p className="text-[10px] font-bold font-mono text-emerald-500">ROI: {p.roi.toFixed(1)}%</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3: DEEP AUTOPILOT CONTROLS & MANUAL OVERRIDES (Task 7) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
        {/* Failed pipeline retrier */}
        <div className="p-6 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 rounded-xl space-y-4">
          <div className="pb-2 border-b border-gray-100 dark:border-zinc-850">
            <h3 className="font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-wide flex items-center">
              <Play className="w-4 h-4 text-emerald-400 mr-2" /> Autopilot Job Pipeline Hardener
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Select any failed agent script run to force an immediate backend autopilot retry.
            </p>
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 text-xs">
            {failedJobs.length === 0 ? (
              <div className="text-zinc-500 flex flex-col justify-center items-center h-[200px] text-center border-2 border-dashed border-zinc-800 rounded-lg">
                <CheckCircle className="w-8 h-8 mb-2 opacity-30 text-emerald-400 animate-pulse" />
                <p className="font-semibold text-zinc-300">All Systems Standard</p>
                <p className="text-[10px]">No failed pipeline jobs detected currently.</p>
              </div>
            ) : (
              failedJobs.map((job) => (
                <div key={job.id} className="p-3 border border-red-500/20 bg-red-950/5 rounded-lg flex justify-between items-center gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] bg-red-950/50 text-red-400 border border-red-500/30 px-1 rounded">ERROR</span>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{job.keyword}</p>
                    </div>
                    {job.error && <p className="text-[10px] text-red-300 font-mono truncate">{job.error}</p>}
                    <p className="text-[9px] text-zinc-500 font-mono">Last modified: {new Date(job.updatedAt).toLocaleTimeString()}</p>
                  </div>
                  <button
                    onClick={() => triggerJobRetry(job.id)}
                    disabled={retryingId === job.id}
                    className="flex-shrink-0 bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {retryingId === job.id ? 'Retrying...' : 'Force Retry'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cluster controller */}
        <div className="p-6 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 rounded-xl space-y-4">
          <div className="pb-2 border-b border-gray-100 dark:border-zinc-850">
            <h3 className="font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-wide flex items-center">
              <Pause className="w-4 h-4 text-orange-400 mr-2" /> Silo Cluster Operational Controllers
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Pause active SEO generation loops or resume planning cycles on a per-cluster basis instantly.
            </p>
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 text-xs">
            {clusters.length === 0 ? (
              <div className="text-zinc-500 text-center py-10">
                No active topic clusters registered to pause/resume.
              </div>
            ) : (
              clusters.map((cl) => (
                <div key={cl.id} className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-850 rounded-lg flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{cl.title || cl.keyword}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        cl.status === 'paused' 
                          ? 'bg-amber-950/50 text-amber-400 border border-amber-500/20' 
                          : 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {cl.status}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleClusterStatus(cl.id, cl.status)}
                    disabled={togglingClusterId === cl.id}
                    className={`inline-flex items-center font-bold text-xs px-3 py-1.5 rounded-md transition-all active:scale-95 cursor-pointer border ${
                      cl.status === 'paused' 
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent' 
                        : 'bg-amber-500 hover:bg-amber-600 text-white border-transparent'
                    }`}
                  >
                    {cl.status === 'paused' ? (
                      <>
                        <Play className="w-3.5 h-3.5 mr-1" /> Resume
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5 mr-1" /> Pause
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
