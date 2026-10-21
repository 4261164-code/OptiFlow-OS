import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from "@/components/ui";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Cpu, 
  Database, 
  Key, 
  RefreshCw, 
  Zap, 
  ShieldAlert, 
  Terminal, 
  Activity, 
  Server,
  Info
} from 'lucide-react';

export function StartupDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDiagnostics = (refresh: boolean = false) => {
    setLoading(true);
    fetch(refresh ? '/api/diagnostics/refresh' : '/api/diagnostics', { 
      method: refresh ? 'POST' : 'GET' 
    })
      .then(res => res.json())
      .then(data => {
        setDiagnostics(data);
        setLoading(false);
        setLastUpdated(new Date());
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  // Helper to determine if a variable exists in loaded list
  const isEnvActive = (varName: string) => {
    return diagnostics?.loadedEnvVars?.includes(varName);
  };

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="bg-red-950/20 border border-red-500/20 text-red-400 p-6 rounded-2xl flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-lg mb-1">Diagnostics Offline</h3>
            <p className="text-sm opacity-90">{error}</p>
            <Button onClick={() => { setError(null); fetchDiagnostics(); }} className="mt-4 bg-red-500 text-white hover:bg-red-600">
              Retry Handshake
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-950/40 p-6 rounded-3xl border border-white/5">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#d7f941] uppercase">System Kernel</span>
          <h1 className="text-2xl font-sans font-bold tracking-tight text-white mt-1">
            OptiFlow Diagnostics Matrix
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Real-time provider handshakes, integration status, event ledger, and distributed worker node telemetries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
              Last audit: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button 
            onClick={() => fetchDiagnostics(true)} 
            disabled={loading}
            variant="default"
            className="gap-2 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Validating Handshakes...' : 'Rerun Matrix Audit'}
          </Button>
        </div>
      </div>

      {/* Primary Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core System Handshakes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Real-time Handshake Validation Grid</CardTitle>
                <CardDescription>Direct network connection checks with foundational services.</CardDescription>
              </div>
              <Activity className="w-5 h-5 text-zinc-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Handshake 1: Firebase Administration */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-950/30 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Firebase Admin SDK</h4>
                  <p className="text-xs text-zinc-500">
                    Project ID: <span className="font-mono text-zinc-400">{diagnostics?.projectId || "N/A"}</span>
                  </p>
                </div>
              </div>
              <div>
                {diagnostics?.firebaseAdminInitialized ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Initialized
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/15">
                    <XCircle className="w-3.5 h-3.5" />
                    Offline
                  </span>
                )}
              </div>
            </div>

            {/* Handshake 2: Firestore Connectivity */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-950/30 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Firestore Database</h4>
                  <p className="text-xs text-zinc-500">Collection synchronization & data durability</p>
                </div>
              </div>
              <div>
                {diagnostics?.firestoreConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/15">
                    <XCircle className="w-3.5 h-3.5" />
                    Failed
                  </span>
                )}
              </div>
            </div>

            {/* Handshake 3: Distributed Worker Manager */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-950/30 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Distributed Worker Manager</h4>
                  <p className="text-xs text-zinc-500">Async pipeline & content processing worker pools</p>
                </div>
              </div>
              <div>
                {diagnostics?.workerStatus === 'Started' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Active Threads
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/15">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {diagnostics?.workerStatus || "Pending"}
                  </span>
                )}
              </div>
            </div>

            {/* Handshake 4: LockManager & Job Scheduler */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-950/30 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Lock Manager & Job Scheduler</h4>
                  <p className="text-xs text-zinc-500">Atomic thread synchronization & cron automations</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                  Lock: {diagnostics?.lockManagerStatus || "Idle"}
                </span>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                  Cron: {diagnostics?.schedulerStatus || "Idle"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Flags & Cryptographic Service Credentials */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Ecosystem Environment Flags</CardTitle>
                <CardDescription>Critical system-level directives and access keys.</CardDescription>
              </div>
              <Key className="w-5 h-5 text-zinc-500" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* ENABLE_EVENT_LEDGER Flag */}
            <div className="flex flex-col gap-1 p-3 bg-zinc-950/30 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-zinc-300">ENABLE_EVENT_LEDGER</span>
                <span className={`h-2 w-2 rounded-full ${isEnvActive('ENABLE_EVENT_LEDGER') ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-500">
                <span>Immutable campaign tracking</span>
                <span className="font-mono text-zinc-400">{isEnvActive('ENABLE_EVENT_LEDGER') ? 'ACTIVE / ON' : 'OFFLINE'}</span>
              </div>
            </div>

            {/* ENABLE_AGGREGATION_WORKERS Flag */}
            <div className="flex flex-col gap-1 p-3 bg-zinc-950/30 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-zinc-300">ENABLE_AGGREGATION_WORKERS</span>
                <span className={`h-2 w-2 rounded-full ${isEnvActive('ENABLE_AGGREGATION_WORKERS') ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-500">
                <span>Distributed statistic aggregations</span>
                <span className="font-mono text-zinc-400">{isEnvActive('ENABLE_AGGREGATION_WORKERS') ? 'ACTIVE / ON' : 'OFFLINE'}</span>
              </div>
            </div>

            {/* FIREBASE_PROJECT_ID */}
            <div className="flex flex-col gap-1 p-3 bg-zinc-950/30 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-zinc-300">FIREBASE_PROJECT_ID</span>
                <span className={`h-2 w-2 rounded-full ${isEnvActive('FIREBASE_PROJECT_ID') ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-500">
                <span>Firestore credentials target ID</span>
                <span className="font-mono text-zinc-400 truncate max-w-[150px]">
                  {isEnvActive('FIREBASE_PROJECT_ID') ? 'Loaded' : 'Missing'}
                </span>
              </div>
            </div>

            {/* FIREBASE_CLIENT_EMAIL */}
            <div className="flex flex-col gap-1 p-3 bg-zinc-950/30 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-zinc-300">FIREBASE_CLIENT_EMAIL</span>
                <span className={`h-2 w-2 rounded-full ${isEnvActive('FIREBASE_CLIENT_EMAIL') ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-500">
                <span>Service client email</span>
                <span className="font-mono text-zinc-400 truncate max-w-[150px]">
                  {isEnvActive('FIREBASE_CLIENT_EMAIL') ? 'Configured' : 'Missing'}
                </span>
              </div>
            </div>

            {/* FIREBASE_PRIVATE_KEY */}
            <div className="flex flex-col gap-1 p-3 bg-zinc-950/30 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-zinc-300">FIREBASE_PRIVATE_KEY</span>
                <span className={`h-2 w-2 rounded-full ${isEnvActive('FIREBASE_PRIVATE_KEY') ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-500">
                <span>Cryptographic service account key</span>
                <span className="font-mono text-emerald-400 text-[9px]">
                  {isEnvActive('FIREBASE_PRIVATE_KEY') ? '••••••••• [MASKED]' : 'Missing'}
                </span>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Raw Diagnostic Logs & Telemetries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Audit Raw Log Telemetry</CardTitle>
            <CardDescription>Live JSON logs generated by the system architecture auditor.</CardDescription>
          </div>
          <Terminal className="w-5 h-5 text-zinc-500" />
        </CardHeader>
        <CardContent>
          {diagnostics ? (
            <pre className="bg-zinc-950 p-5 rounded-2xl text-xs font-mono text-emerald-400/90 overflow-x-auto border border-white/5 leading-relaxed max-h-[350px]">
              {JSON.stringify(diagnostics, null, 2)}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 border border-dashed border-white/10 rounded-2xl">
              <RefreshCw className="w-8 h-8 animate-spin text-zinc-600 mb-3" />
              <p className="text-sm font-medium">Listening for handshake telemetry responses...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

