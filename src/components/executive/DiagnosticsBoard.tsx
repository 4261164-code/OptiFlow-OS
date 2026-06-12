import React, { useState, useEffect } from 'react';
import { auth } from '../../lib/firebase';
import { 
  Activity, 
  ShieldAlert, 
  Cpu, 
  Database, 
  RefreshCw, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Server,
  Zap,
  Flame,
  Key,
  Sliders,
  History,
  Lock,
  Unlock,
  CornerDownLeft,
  XCircle,
  HelpCircle,
  Eye,
  AlertOctagon
} from 'lucide-react';

interface ApiStatus {
  status: 'online' | 'degraded' | 'offline';
  message: string;
  lastChecked: number;
}

interface MetricLog {
  id: string;
  cpuPercent: number;
  memoryMB: number;
  databaseLatencyMs: number;
  apiLatencyMs: number;
  errorRate15m: number;
  conversionRatePercent: number;
  revenueRateHourly: number;
  timestamp: number;
}

interface ErrorLog {
  id: string;
  message: string;
  stack: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  recommendation: string;
  details: any;
  timestamp: number;
}

interface AuditLog {
  id: string;
  userId: string;
  idempotencyKey: string;
  action: string;
  decisionScore: number;
  gate: 'GREEN' | 'YELLOW' | 'RED' | 'BLACK';
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'QUEUED_APPROVAL' | 'DECLINED_BY_ADMIN' | 'ROLLED_BACK';
  result?: any;
  error?: string;
  timestamp: number;
  rollbackPointer?: string;
  trace?: {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    timestamp: number;
  };
}

interface PendingApproval {
  id: string;
  idempotencyKey: string;
  status: string;
  timestamp: number;
  actionPlan: {
    action: string;
    score: number;
    gate: 'GREEN' | 'YELLOW' | 'RED' | 'BLACK';
    normalized: {
      action: string;
      target: string;
      impact: string;
      reversibility: string;
      factors: string[];
    }
  }
}

export function DiagnosticsBoard() {
  const [apiHealth, setApiHealth] = useState<Record<string, ApiStatus>>({});
  const [metrics, setMetrics] = useState<MetricLog[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [activeBreakers, setActiveBreakers] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [checkingApi, setCheckingApi] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

  // Simulation Controls Preset States
  const [simError, setSimError] = useState("Database validation schema mismatch: missing variable 'activeKey'");
  const [simFactors, setSimFactors] = useState<string[]>(["reversible"]);
  const [simImpact, setSimImpact] = useState<'low' | 'medium' | 'high'>("medium");
  const [simReversibility, setSimReversibility] = useState<'low' | 'high'>("high");
  const [simulating, setSimulating] = useState(false);
  const [simulationResponse, setSimulationResponse] = useState<any | null>(null);

  // Enhanced Failsafe Invariant & State Machine Simulation controls
  const [duplicateStripeEvent, setDuplicateStripeEvent] = useState(false);
  const [activeRetryChains, setActiveRetryChains] = useState(0);
  const [selfHealCooldownViolation, setSelfHealCooldownViolation] = useState(false);
  const [fromState, setFromState] = useState("");
  const [toState, setToState] = useState("");
  const [depth, setDepth] = useState(0);
  const [impactScope, setImpactScope] = useState<"LOCAL" | "GLOBAL">("LOCAL");
  const [cooldownPassed, setCooldownPassed] = useState(true);

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.currentUser?.uid || 'dev-guest'}`
    };
  };

  const fetchAllDiagnostics = async () => {
    try {
      // API Key statuses
      const apiRes = await fetch('/api/ops/api-health', { headers: getHeaders() });
      if (apiRes.ok) {
        const data = await apiRes.json();
        setApiHealth(data?.apiHealth || {});
      }

      // System metrics history
      const metricsRes = await fetch('/api/ops/system-diagnostics', { headers: getHeaders() });
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data?.metrics || []);
      }

      // Errors
      const errorsRes = await fetch('/api/ops/error-logs', { headers: getHeaders() });
      if (errorsRes.ok) {
        const data = await errorsRes.json();
        setErrorLogs(data?.logs || []);
      }

      // Immutable Audits
      const auditsRes = await fetch('/api/ops/audit-logs', { headers: getHeaders() });
      if (auditsRes.ok) {
        const data = await auditsRes.json();
        setAuditLogs(data?.logs || []);
      }

      // Pending approvals
      const pendingsRes = await fetch('/api/ops/pending-approvals', { headers: getHeaders() });
      if (pendingsRes.ok) {
        const data = await pendingsRes.json();
        setPendingApprovals(data?.approvals || []);
      }

      // Active breakers
      const breakersRes = await fetch('/api/ops/active-breakers', { headers: getHeaders() });
      if (breakersRes.ok) {
        const data = await breakersRes.json();
        setActiveBreakers(data?.activeBreakers || []);
      }
    } catch (err) {
      console.error("Failed to load metrics dashboards:", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerApiCheck = async () => {
    setCheckingApi(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/ops/api-health/trigger', {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setApiHealth(data?.apiHealth || {});
        setSuccessMessage("API Gateway sanity checks completed successfully.");
      }
    } catch (err: any) {
      setErrorMessage("Force API check failed: " + err.message);
    } finally {
      setCheckingApi(false);
    }
  };

  const resolvePendingAction = async (id: string, decision: 'APPROVE' | 'DECLINE') => {
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/ops/approvals/evaluate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ id, decision })
      });
      if (res.ok) {
        setSuccessMessage(`Approval queue updated: Action ${decision}D.`);
        fetchAllDiagnostics();
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || "Failed to process approval action.");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleRollback = async (auditLogId: string) => {
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/ops/audit-logs/rollback', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ auditLogId })
      });
      if (res.ok) {
        setSuccessMessage("Rollback transaction committed to database successfully.");
        fetchAllDiagnostics();
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || "Rollback failed. State may have changed.");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleResetBreaker = async (breakerKey: string) => {
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/ops/active-breakers/reset', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ breakerKey })
      });
      if (res.ok) {
        setSuccessMessage(`Circuit breaker successfully reset for error scope.`);
        fetchAllDiagnostics();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const runSimulation = async () => {
    setSimulating(true);
    setSimulationResponse(null);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/ops/simulate-anomaly', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          errorMsg: simError,
          factors: simFactors,
          impact: simImpact,
          reversibility: simReversibility,
          duplicateStripeEvent,
          activeRetryChains,
          selfHealCooldownViolation,
          fromState,
          toState,
          depth,
          impactScope,
          cooldownPassed
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSimulationResponse(data);
        if (data.blocked) {
          setErrorMessage(`Simulation blocked by policy engine: ${data.reason}`);
        } else {
          setSuccessMessage("Simulation completed. Actions parsed through firewall.");
        }
        fetchAllDiagnostics();
      }
    } catch (err: any) {
      setErrorMessage("Simulation execution crashed: " + err.message);
    } finally {
      setSimulating(false);
    }
  };

  const toggleFactor = (factor: string) => {
    if (simFactors.includes(factor)) {
      setSimFactors(simFactors.filter(f => f !== factor));
    } else {
      setSimFactors([...simFactors, factor]);
    }
  };

  useEffect(() => {
    fetchAllDiagnostics();
    const interval = setInterval(fetchAllDiagnostics, 15000); // refresh components state
    return () => clearInterval(interval);
  }, []);

  const latestMetric = metrics[metrics.length - 1];

  return (
    <div className="space-y-8" id="systems-diagnostics-board">
      
      {/* Notifications center */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center space-x-3 transition-all animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 rounded-xl flex items-center space-x-3 transition-all animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-500 animate-bounce" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* CORE TELEMETRY STRIP */}
      <section className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-zinc-900 p-6 shadow-sm">
        <div className="border-b border-gray-100 dark:border-zinc-850 pb-6 mb-6">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-[#d7f941]" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Node Telemetry</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Host performance, API delays, and passive simulation revenue pipelines.</p>
        </div>

        {latestMetric ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            
            <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-850 bg-gray-50/50 dark:bg-[#18181b]/30">
              <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">CPU Usage</span>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1 font-mono">{latestMetric.cpuPercent}%</div>
              <div className="w-full bg-gray-200 dark:bg-zinc-850 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${latestMetric.cpuPercent}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-850 bg-gray-50/50 dark:bg-[#18181b]/30">
              <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">Heap Memory</span>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1 font-mono">{latestMetric.memoryMB} MB</div>
              <span className="text-[10px] text-zinc-500 font-mono">Process allocated heap</span>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-850 bg-gray-50/50 dark:bg-[#18181b]/30">
              <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">Database Latency</span>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1 font-mono">{latestMetric.databaseLatencyMs} ms</div>
              <span className="text-[10px] text-zinc-500">Firestore write pulse</span>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-850 bg-gray-50/50 dark:bg-[#18181b]/30">
              <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">Outbound API hop</span>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1 font-mono">{latestMetric.apiLatencyMs} ms</div>
              <span className="text-[10px] text-zinc-500 font-mono">Baseline roundtrip latency</span>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-850 bg-rose-500/5 border-rose-500/10 dark:bg-rose-950/5 dark:border-rose-950/10">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium font-semibold">Anomalies (15m)</span>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">{latestMetric.errorRate15m}</div>
              <span className="text-[10px] text-rose-500">Anomaly count</span>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-850 bg-gray-50/50 dark:bg-[#18181b]/30">
              <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">Conversion Rate</span>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1 font-mono">{latestMetric.conversionRatePercent}%</div>
              <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-[#d7f941] h-full rounded-full" style={{ width: `${latestMetric.conversionRatePercent}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-100 dark:border-zinc-850 bg-emerald-500/5 border-emerald-500/10 dark:bg-emerald-950/5 dark:border-emerald-950/10">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium font-semibold">Revenue Pace</span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">${latestMetric.revenueRateHourly}/hr</div>
              <span className="text-[10px] text-emerald-500 font-medium">Passive generation pacing</span>
            </div>

          </div>
        ) : (
          <div className="h-24 flex items-center justify-center border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl text-gray-400 text-sm animate-pulse">
            Telemetry metrics aggregating. Standby...
          </div>
        )}
      </section>

      {/* THREE LAYERS WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMN LEFT: SECURITY POLICY INSIGHTS & SIMULATIONS (L1, L2, L3 DEMO) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* SECURE FIREWALL SIMULATION CONSOLE */}
          <section className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-zinc-900 p-6 shadow-sm space-y-6">
            <div>
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-[#d7f941]" />
                <h3 className="text-lg font-bold text-gray-950 dark:text-white">Secure Sandbox Simulation Panel</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Trigger anomalies to test the Layer 2 Advisory Diagnostic Brain and see the Layer 3 Risk Security gating policies in action.
              </p>
            </div>

            <div className="space-y-4">
              {/* Error selection preset */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 block mb-1">Predefined Exception Type</label>
                <select 
                  className="w-full bg-gray-50 dark:bg-[#18181b] border border-gray-100 dark:border-[#222] p-2.5 rounded-xl text-xs text-gray-750 dark:text-zinc-300 outline-none cursor-pointer"
                  value={simError}
                  onChange={(e) => setSimError(e.target.value)}
                >
                  <option value="Database validation schema mismatch: missing variable 'activeKey'">Missing Environment Variables (Scored: Critical)</option>
                  <option value="Stripe API: Insufficient permissions to charge card status">Charge transaction error (Payment Risk)</option>
                  <option value="AI Router Error: 429 Model quota exceeded on providers pipeline">API Quota exceeded (Routing Failover)</option>
                  <option value="Concurrency deadlock reached on collection 'articles' docs">Database transaction deadlock (Auto Retry)</option>
                  <option value="Job thread 'image_generator' stuck pending for 360 seconds">Stuck Background Workers (Queue Reset)</option>
                </select>
              </div>

              {/* Custom risk modifiers */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-[#18181b]/30 p-4 rounded-xl border border-gray-100 dark:border-zinc-900">
                <div>
                  <span className="text-xs font-bold text-gray-750 dark:text-zinc-400 block mb-2">Simulated Risk Modifiers</span>
                  <div className="space-y-2">
                    {[
                      { key: "data_destruction", label: "Data Destruction (+40)" },
                      { key: "payment_impact", label: "Payment Impact (+40)" },
                      { key: "api_cost", label: "Api Cost (+10)" },
                      { key: "reversible", label: "Revertible (-30)" },
                      { key: "cache_only", label: "Cache Only (-50)" }
                    ].map(f => (
                      <label key={f.key} className="flex items-center space-x-2 text-xs text-gray-600 dark:text-zinc-300 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={simFactors.includes(f.key)}
                          onChange={() => toggleFactor(f.key)}
                          className="rounded border-zinc-700 accent-[#d7f941]"
                        />
                        <span>{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 block mb-1">State Demands Reversibility</label>
                    <div className="flex space-x-2">
                      {['low', 'high'].map(r => (
                        <button
                          key={r}
                          onClick={() => setSimReversibility(r as any)}
                          className={`flex-1 text-center py-1 rounded text-xs font-semibold select-none cursor-pointer border ${
                            simReversibility === r 
                              ? 'bg-[#d7f941]/10 border-[#d7f941] text-[#9eb628]' 
                              : 'border-zinc-800 text-zinc-400 bg-transparent'
                          }`}
                        >
                          {r.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-400 block mb-1">Impact Radius</label>
                    <div className="flex space-x-2">
                      {['low', 'medium', 'high'].map(i => (
                        <button
                          key={i}
                          onClick={() => setSimImpact(i as any)}
                          className={`flex-1 text-center py-1 rounded text-xs font-semibold select-none cursor-pointer border ${
                            simImpact === i 
                              ? 'bg-[#d7f941]/10 border-[#d7f941] text-[#9eb628]' 
                              : 'border-zinc-800 text-zinc-400 bg-transparent'
                          }`}
                        >
                          {i.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Distributed Boundary Firewall Controls */}
              <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800/60 bg-gray-50/50 dark:bg-zinc-900/40 space-y-4">
                <span className="text-xs font-bold text-gray-900 dark:text-[#d7f941] block">Distributed Boundary Firewall Controls</span>
                
                {/* System Invariant Kernel */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">1. System Invariant Kernel</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex items-center space-x-2 text-[11px] text-gray-700 dark:text-zinc-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={duplicateStripeEvent}
                        onChange={(e) => setDuplicateStripeEvent(e.target.checked)}
                        className="rounded border-zinc-300 dark:border-zinc-700 accent-[#d7f941]"
                      />
                      <span>Duplicate Stripe Event</span>
                    </label>
                    <label className="flex items-center space-x-2 text-[11px] text-gray-700 dark:text-zinc-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selfHealCooldownViolation}
                        onChange={(e) => setSelfHealCooldownViolation(e.target.checked)}
                        className="rounded border-zinc-300 dark:border-zinc-700 accent-[#d7f941]"
                      />
                      <span>Cooldown Violation</span>
                    </label>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-750 dark:text-zinc-400 mt-1">
                    <span>Active Retry Chains count:</span>
                    <input 
                      type="number" 
                      min="0"
                      max="5"
                      value={activeRetryChains}
                      onChange={(e) => setActiveRetryChains(parseInt(e.target.value) || 0)}
                      className="w-16 bg-gray-100 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded px-1.5 py-0.5 text-center font-mono text-xs text-gray-900 dark:text-zinc-200 outline-none"
                    />
                  </div>
                </div>

                {/* Hard State Transitions */}
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-850/50">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">2. Rigid State Transitions Machine</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 dark:text-zinc-450 block mb-0.5">From State</label>
                      <select 
                        value={fromState}
                        onChange={(e) => setFromState(e.target.value)}
                        className="w-full bg-gray-55 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-[11px] px-1 py-1 rounded text-gray-700 dark:text-zinc-300 outline-none cursor-pointer"
                      >
                        <option value="">(None - Default Action)</option>
                        <option value="PENDING">PENDING</option>
                        <option value="RUNNING">RUNNING</option>
                        <option value="FAILED">FAILED</option>
                        <option value="RETRYING">RETRYING</option>
                        <option value="SUCCESS">SUCCESS</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 dark:text-zinc-450 block mb-0.5">To State</label>
                      <select 
                        value={toState}
                        onChange={(e) => setToState(e.target.value)}
                        className="w-full bg-gray-55 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-[11px] px-1 py-1 rounded text-gray-700 dark:text-zinc-300 outline-none cursor-pointer"
                      >
                        <option value="">(None - Default Action)</option>
                        <option value="PENDING">PENDING</option>
                        <option value="RUNNING">RUNNING</option>
                        <option value="FAILED">FAILED</option>
                        <option value="RETRYING">RETRYING</option>
                        <option value="SUCCESS">SUCCESS</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Constrained Self Healer */}
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-855">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">3. Self-Healing Constrained Actor</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 dark:text-zinc-450 block mb-0.5">Impact Scope</label>
                      <select 
                        value={impactScope}
                        onChange={(e) => setImpactScope(e.target.value as any)}
                        className="w-full bg-gray-55 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-[11px] px-1 py-1 rounded text-gray-700 dark:text-zinc-300 outline-none cursor-pointer"
                      >
                        <option value="LOCAL">LOCAL</option>
                        <option value="GLOBAL">GLOBAL</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 dark:text-zinc-450 block mb-0.5">Call Depth</label>
                      <input 
                        type="number"
                        min="0"
                        max="3"
                        value={depth}
                        onChange={(e) => setDepth(parseInt(e.target.value) || 0)}
                        className="w-full bg-gray-100 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-[11px] px-1 py-0.5 rounded text-gray-700 dark:text-zinc-300 text-center outline-none"
                      />
                    </div>
                  </div>
                  <label className="flex items-center space-x-2 text-[11px] text-gray-700 dark:text-zinc-300 cursor-pointer pt-1">
                    <input 
                      type="checkbox" 
                      checked={cooldownPassed}
                      onChange={(e) => setCooldownPassed(e.target.checked)}
                      className="rounded border-zinc-300 dark:border-zinc-700 accent-[#d7f941]"
                    />
                    <span>Actor Cooldown Interval Passed</span>
                  </label>
                </div>
              </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={runSimulation}
                    disabled={simulating}
                    className="w-full bg-[#d7f941] hover:bg-[#c2e13a] text-zinc-950 font-bold text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 mr-1.5 animate-pulse text-zinc-800" />
                    {simulating ? "Engaging Gates..." : "Process Diagnostics"}
                  </button>
                  <button
                    onClick={async () => {
                      if (!auth.currentUser) return;
                      const res = await fetch('/api/executive/revenue/compound', {
                        method: 'POST',
                        headers: getHeaders(),
                        body: JSON.stringify({ userId: auth.currentUser.uid })
                      });
                      if (res.ok) alert("Autonomous Revenue Compounding Cycle Executed via True-RL Multi-Arm Bandit parameters.");
                    }}
                    className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" />
                    Trigger RL Compound
                  </button>
                </div>
              </div>

            {/* Simulation outcomes report */}
            {simulationResponse && (
              <div className="p-4 rounded-xl border border-[#d7f941]/30 bg-[#d7f941]/2 dark:bg-[#d7f941]/0 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Diagnostics Execution Result</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    simulationResponse.actionPlan?.gate === 'GREEN' ? 'bg-emerald-500/20 text-emerald-400' :
                    simulationResponse.actionPlan?.gate === 'YELLOW' ? 'bg-indigo-500/20 text-indigo-400' :
                    simulationResponse.actionPlan?.gate === 'RED' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    Gate: {simulationResponse.actionPlan?.gate || 'BLOCKED'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-400 block font-medium">Model Chosen</span>
                    <span className="font-mono text-gray-800 dark:text-zinc-200">
                      {simulationResponse.actionPlan?.gate === 'BLACK' ? 'None (Blocked)' : 'gemini-2.5-flash-lite'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-medium">Security Risk Score</span>
                    <span className="font-mono text-gray-800 dark:text-zinc-200">{simulationResponse.actionPlan?.score ?? 0}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-400 block font-medium">Layer 2 Suggested Action</span>
                    <span className="text-[#9eb628] font-bold font-mono">
                      {simulationResponse.actionPlan?.action || "GENERAL_HEAL_LOG"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-400 block font-medium">Layer 3 Processor Status</span>
                    <span className={`font-mono font-bold ${
                      simulationResponse.blocked ? 'text-rose-500' : 
                      simulationResponse.result?.success ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {simulationResponse.blocked 
                        ? `BLOCKED: Loop protection triggered.` 
                        : simulationResponse.result?.error || "SUCCESSFULLY COMMITTED TO INFRASTRUCTURE"
                      }
                    </span>
                  </div>
                </div>

              </div>
            )}
          </section>

          {/* ACTIVE CIRCUIT BREAKERS (Task 3 tracker) */}
          <section className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-zinc-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-850 pb-4">
              <div className="flex items-center space-x-2">
                <AlertOctagon className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold text-gray-950 dark:text-white">Active System Circuit Breakers</h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded">
                Loop Prevention Enabled
              </span>
            </div>

            {activeBreakers.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500 flex items-center justify-center space-x-2">
                <Unlock className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>All auto-repair modules active. Zero circuit interrupters lock states.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {activeBreakers.map(breaker => (
                  <div key={breaker} className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Lock className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      <span className="text-xs font-mono font-semibold text-rose-800 dark:text-rose-300 truncate">
                        {breaker}
                      </span>
                    </div>
                    <button
                      onClick={() => handleResetBreaker(breaker)}
                      className="px-2.5 py-1 bg-rose-500 text-white font-bold text-[10px] uppercase rounded-md hover:bg-rose-600 transition-colors flex-shrink-0 cursor-pointer"
                    >
                      Reset Circuit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* COLUMN RIGHT: PENDING ACTION GATES & AUDIT TRAILS (L3) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* PENDING APPROVALS HUB (RED GATES) */}
          <section className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-zinc-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-850 pb-4">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold text-gray-950 dark:text-white">Red Gate Approvals Portal</h3>
              </div>
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full">
                {pendingApprovals.length} Pending
              </span>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1" />
                <span className="text-xs font-bold text-zinc-400">Security Gate Is Clear</span>
                <span className="text-[10px] text-zinc-500 leading-snug">No risky actions (Scoring &gt; 40) are queued awaiting manual operator override.</span>
              </div>
            ) : (
              <div className="space-y-4 divide-y divide-zinc-900/40">
                {pendingApprovals.map(pending => (
                  <div key={pending.id} className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-amber-500 font-bold">{pending.actionPlan?.action}</span>
                      <span className="text-[10px] text-zinc-500">
                        Score: {pending.actionPlan?.score}
                      </span>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#18181b]/50 p-3 rounded-lg border border-gray-100 dark:border-zinc-900 text-xs text-gray-500 dark:text-zinc-400 space-y-1">
                      <div>Target: <span className="font-mono text-gray-800 dark:text-zinc-300">{pending.actionPlan?.normalized?.target}</span></div>
                      <div>Reversibility: <span className="font-semibold text-zinc-300">{pending.actionPlan?.normalized?.reversibility}</span></div>
                      <div>Factors triggered: {pending.actionPlan?.normalized?.factors?.join(', ')}</div>
                    </div>

                    <div className="flex space-x-2 h-9">
                      <button
                        onClick={() => resolvePendingAction(pending.id, 'APPROVE')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                      >
                        Approve & Execute
                      </button>
                      <button
                        onClick={() => resolvePendingAction(pending.id, 'DECLINE')}
                        className="px-4 bg-rose-950/20 text-rose-400 border border-rose-900/40 hover:bg-rose-950/40 font-bold text-xs rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* CLOCKS & SECURITY KEYS */}
          <section className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-zinc-900 p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-850 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-[#d7f941]" />
                <h3 className="text-base font-bold text-gray-950 dark:text-white">API Gateway Health</h3>
              </div>
              <button
                onClick={triggerApiCheck}
                disabled={checkingApi}
                className="text-[10px] flex items-center space-x-1 hover:text-[#d7f941] text-zinc-400 font-bold transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${checkingApi ? 'animate-spin' : ''}`} />
                <span>Verify Gateways</span>
              </button>
            </div>

            <div className="space-y-3">
              {Object.keys(apiHealth).length === 0 ? (
                <div className="text-center text-xs text-zinc-500 py-4">Loading API diagnostics states...</div>
              ) : (
                Object.entries(apiHealth).map(([key, service]) => (
                  <div key={key} className="flex items-center justify-between py-1 text-xs">
                    <span className="font-mono uppercase text-gray-600 dark:text-zinc-400">{key}</span>
                    <span className={`font-semibold ${
                      service.status === 'online' ? 'text-emerald-500' :
                      service.status === 'degraded' ? 'text-amber-500' : 'text-rose-500'
                    }`}>
                      {service.status.toUpperCase()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>

      </div>

      {/* SECTION: CLOUD IMMUTABLE LEADER AUDITING CENTER (Task 4) */}
      <section className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-zinc-900 p-6 shadow-sm">
        <div className="border-b border-gray-100 dark:border-zinc-850 pb-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Append-Only Immutable Audit Log</h2>
            </div>
            <span className="text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1 rounded-full font-mono">
              {auditLogs.length} Records Verified
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Secure, un-editable system logs, capturing risk gates, decision evaluations, outcomes, and automated state rollback triggers.
          </p>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-zinc-900 rounded-xl flex flex-col items-center justify-center space-y-2 text-zinc-500 text-xs">
            <span>No transactional actions logged yet. Simulated or actual workloads will write records here.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {auditLogs.map(audit => {
              const isExpanded = expandedAuditId === audit.id;
              const isReversible = audit.status === "SUCCESS" && audit.rollbackPointer;
              const isRolledBack = audit.status === "ROLLED_BACK";
              
              return (
                <div 
                  key={audit.id}
                  className={`border rounded-xl transition-all ${
                    isExpanded 
                      ? 'border-[#d7f941] bg-[#d7f941]/5' 
                      : 'border-gray-50 dark:border-zinc-850/60 bg-gray-50/20 dark:bg-[#18181b]/15'
                  }`}
                >
                  <div 
                    onClick={() => setExpandedAuditId(isExpanded ? null : audit.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        audit.gate === 'GREEN' ? 'bg-emerald-500/10 text-emerald-500' :
                        audit.gate === 'YELLOW' ? 'bg-indigo-500/10 text-indigo-500' :
                        'bg-amber-500/10 text-amber-500 font-bold'
                      }`}>
                        {audit.gate} Gate
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 bg-gray-200/50 dark:bg-zinc-800 rounded text-zinc-400">
                        {audit.action}
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${
                        audit.status === 'SUCCESS' ? 'text-emerald-500' :
                        audit.status === 'FAILED' ? 'text-rose-500' :
                        audit.status === 'ROLLED_BACK' ? 'text-zinc-500 line-through' : 'text-amber-500'
                      }`}>
                        {audit.status}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-zinc-500">
                      <span className="font-mono text-[10px]">Key: {audit.idempotencyKey}</span>
                      <span>{new Date(audit.timestamp).toLocaleTimeString()}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-zinc-850/30 pt-4 space-y-4">
                      
                      {/* Trans Tracing Context Header */}
                      {audit.trace && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15 text-xs">
                          <div className="flex items-center space-x-2 text-indigo-400 font-mono">
                            <span className="font-bold uppercase text-[9px] bg-indigo-500/20 px-1.5 py-0.5 rounded">Trace Lineage</span>
                            <span>TraceID: {audit.trace.traceId}</span>
                          </div>
                          <div className="font-mono text-gray-500 dark:text-zinc-400">
                            SpanID: {audit.trace.spanId}
                          </div>
                        </div>
                      )}

                      {/* JSON Result / Error block */}
                      {audit.result && (
                        <div>
                          <span className="text-xs font-bold text-zinc-400 block mb-1">Execution output result</span>
                          <pre className="text-xs font-mono text-zinc-500 bg-zinc-950 p-3 rounded overflow-x-auto">
                            {JSON.stringify(audit.result, null, 2)}
                          </pre>
                        </div>
                      )}

                      {audit.error && (
                        <div className="p-3 bg-rose-950/20 border border-rose-900/40 text-rose-400 rounded-lg text-xs font-mono">
                          {audit.error}
                        </div>
                      )}

                      {/* State Rollback Trigger */}
                      {isReversible && (
                        <div className="flex items-center justify-between bg-zinc-950/40 p-3 rounded-lg border border-zinc-900">
                          <div>
                            <span className="text-xs font-bold text-zinc-300 block">Dangerous Action Reversal</span>
                            <p className="text-[10px] text-zinc-500 mt-0.5">This action has registered safety checkpoints. Rollback can automatically restore state parameters.</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRollback(audit.id);
                            }}
                            className="bg-transparent hover:bg-zinc-800 text-zinc-300 hover:text-white px-3 py-1.5 border border-zinc-800 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                          >
                            <CornerDownLeft className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Rollback State Action</span>
                          </button>
                        </div>
                      )}

                      {isRolledBack && (
                        <div className="p-3 bg-zinc-900/30 text-zinc-500 rounded-lg text-xs flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-zinc-500" />
                          <span>This action has been successfully rolled back and state invariants were restored in full.</span>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
