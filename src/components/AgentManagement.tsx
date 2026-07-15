import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from './ui';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { AgentLog } from '../types';
import { 
  Bot, 
  Search, 
  Edit3, 
  Image as ImageIcon, 
  Send, 
  BarChart, 
  Users, 
  Rocket, 
  Clock, 
  DollarSign, 
  Terminal, 
  Cpu, 
  HardDrive, 
  Activity, 
  Play, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { BrandingHexIcon } from './CustomIcons';

export function AgentManagement() {
  const [activeConsole, setActiveConsole] = useState<string>("All Workers");
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [runningAgents, setRunningAgents] = useState<Record<string, boolean>>({
    "Research Agent": true,
    "SEO Agent": true,
    "Writer Agent": true,
    "Pinterest Agent": true,
    "Image Agent": true,
    "Publishing Agent": true,
  });
  const [systemDiag, setSystemDiag] = useState<any>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Fetch real-time system diagnostics on mount
  useEffect(() => {
    fetch('/api/diagnostics')
      .then(res => res.json())
      .then(data => setSystemDiag(data))
      .catch(err => console.warn("Error fetching diagnostics on node page:", err));
  }, []);

  // Live Append Logs
  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const qLogs = query(
      collection(db, 'agent_logs'), 
      where('userId', '==', uid)
    );

    const unsubLogs = onSnapshot(qLogs, (snap) => {
      const activeLogs = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as AgentLog))
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-100); // Take the last 100 entries for the console terminal
      setLogs(activeLogs);
    }, (error) => {
      console.warn("Error subscribing to agent logs:", error);
    });

    return () => unsubLogs();
  }, []);

  // Roll terminal down on new logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const departments = [
    {
      name: "Content & Creative Hub",
      id: "content",
      agents: [
        { name: "Writer Agent", icon: Edit3, role: "Affiliate Narrative Copywriting Engine", speed: "2.4s", isCore: true },
        { name: "Pinterest Agent", icon: ImageIcon, role: "Pinterest Media Creative Composer", speed: "1.5s", isCore: false },
        { name: "Image Agent", icon: ImageIcon, role: "Concept Graphic Art Illustrator", speed: "3.1s", isCore: false },
      ]
    },
    {
      name: "Growth & SEO Lab",
      id: "growth",
      agents: [
        { name: "Research Agent", icon: Search, role: "Intent & LSI Semantic Analyst", speed: "1.2s", isCore: true },
        { name: "SEO Agent", icon: BrandingHexIcon, role: "Topological Map Silos Builder", speed: "1.8s", isCore: true },
        { name: "Traffic Scheduler Agent", icon: Rocket, role: "Broadcasting Chron Job Pipeline", speed: "0.5s", isCore: false },
      ]
    },
    {
      name: "Sovereign Execution",
      id: "ops",
      agents: [
        { name: "Publishing Agent", icon: Send, role: "WordPress & Telegram Deployer Node", speed: "1.0s", isCore: true },
        { name: "Creator Syndicate Agent", icon: Users, role: "Sub-syndication Webhook Node", speed: "1.4s", isCore: false },
      ]
    },
    {
      name: "Intelligence & Yield",
      id: "intelligence",
      agents: [
        { name: "Analytics Agent", icon: BarChart, role: "Enterprise Revenue Traffic Auditor", speed: "2.0s", isCore: false },
        { name: "Affiliate Matchmaker", icon: DollarSign, role: "Dynamic Link Ingestion Scrubber", speed: "0.8s", isCore: true },
      ]
    }
  ];

  const [expandedDepts, setExpandedDepts] = useState<string[]>(["content", "growth", "ops", "intelligence"]);

  const toggleDept = (id: string) => {
    setExpandedDepts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleToggleAgent = (name: string) => {
    setRunningAgents(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const filteredLogs = logs.filter(l => {
    if (activeConsole === "All Workers") return true;
    return l.agentType.toLowerCase().includes(activeConsole.split(' ')[0].toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans tracking-tight font-bold text-white flex items-center gap-3">
            <Bot className="w-10 h-10 text-[#a8ff35] stroke-[2.8]" />
            <span>Agent Control Management</span>
          </h1>
          <p className="text-zinc-400 text-sm">Monitor system loads, configure specific worker nodes, and audit live telemetry pipelines.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button 
              onClick={() => setLogs(prev => [
                ...prev, 
                { 
                  id: `sys-${Date.now()}`,
                  timestamp: Date.now(),
                  agentType: "System",
                  status: "warn",
                  message: "User forced diagnostic reset on all idle sockets.",
                  userId: 'system',
                  createdAt: Date.now(),
                  updatedAt: Date.now()
                }
              ])}
              variant="outline" 
              className="border-white/5 text-zinc-300 hover:text-white rounded-xl bg-white/3"
              size="sm"
            >
              <RefreshCw className="w-4.5 h-4.5 mr-1.5 animate-spin-slow stroke-[2.8]" />
              Troubleshoot Nodes
            </Button>
        </div>
      </div>

      {/* Real-time Node Relationship & System Load Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        {/* OpenAI Relationship Node */}
        <Card className="bg-[#101115] border-white/5 p-4 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-white/10 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#a8ff35]/3 rounded-full blur-2xl group-hover:bg-[#a8ff35]/6 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">
                OA
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">OpenAI Node</h3>
                <p className="text-[10px] text-zinc-500">Relationship & Load</p>
              </div>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-bold text-white font-mono">14%</span>
              <span className="text-[10px] text-zinc-500 ml-1">Limit load</span>
            </div>
            <span className="text-xs font-mono text-zinc-400 font-medium">Avg: 1.8s</span>
          </div>
          <div className="mt-2.5 w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: '14%' }} />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px]">
            <span className="text-zinc-500">Key Status:</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {systemDiag?.loadedEnvVars?.includes('OPENAI_API_KEY') ? 'Server Active' : 'Fallback / Offline'}
            </span>
          </div>
        </Card>

        {/* Gemini Primary Core */}
        <Card className="bg-[#101115] border-white/5 p-4 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-white/10 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/3 rounded-full blur-2xl group-hover:bg-sky-500/6 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs font-mono">
                GE
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Gemini Core</h3>
                <p className="text-[10px] text-zinc-500">Primary Model Brain</p>
              </div>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-bold text-white font-mono">8%</span>
              <span className="text-[10px] text-zinc-500 ml-1">Token load</span>
            </div>
            <span className="text-xs font-mono text-zinc-400 font-medium">Avg: 0.6s</span>
          </div>
          <div className="mt-2.5 w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full transition-all duration-1000" style={{ width: '8%' }} />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px]">
            <span className="text-zinc-500">Key Status:</span>
            <span className="font-mono text-sky-400 font-semibold">
              {systemDiag?.loadedEnvVars?.some((v: string) => v.includes('GEMINI')) ? 'Server Active' : 'Mock Mode'}
            </span>
          </div>
        </Card>

        {/* NVIDIA NIM Fallback */}
        <Card className="bg-[#101115] border-white/5 p-4 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-white/10 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/3 rounded-full blur-2xl group-hover:bg-purple-500/6 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs font-mono">
                NV
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">NVIDIA NIM</h3>
                <p className="text-[10px] text-zinc-500">Scale Fallback</p>
              </div>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500/40"></span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-bold text-white font-mono">0%</span>
              <span className="text-[10px] text-zinc-500 ml-1">Idle state</span>
            </div>
            <span className="text-xs font-mono text-zinc-400 font-medium">Avg: 1.4s</span>
          </div>
          <div className="mt-2.5 w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full transition-all duration-1000" style={{ width: '0%' }} />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px]">
            <span className="text-zinc-500">Key Status:</span>
            <span className="font-mono text-purple-400/75 font-semibold">
              {systemDiag?.loadedEnvVars?.includes('NVIDIA_API_KEY') ? 'Available' : 'Dormant'}
            </span>
          </div>
        </Card>

        {/* Local Queue Load */}
        <Card className="bg-[#101115] border-white/5 p-4 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-white/10 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/3 rounded-full blur-2xl group-hover:bg-amber-500/6 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Queue Load</h3>
                <p className="text-[10px] text-zinc-500">Process Pipelines</p>
              </div>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-bold text-white font-mono">
                {systemDiag?.workerStatus === 'Started' ? 'Active' : 'Idle'}
              </span>
              <span className="text-[10px] text-zinc-500 ml-1">Scheduler</span>
            </div>
            <span className="text-xs font-mono text-zinc-400 font-medium">Threads: 1/4</span>
          </div>
          <div className="mt-2.5 w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: '25%' }} />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px]">
            <span className="text-zinc-500">Firestore Hook:</span>
            <span className="font-mono text-amber-400 font-semibold">
              {systemDiag?.firestoreConnected ? 'Connected' : 'Pending'}
            </span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-8">
        {/* Left column: Agent list (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 font-sans flex items-center gap-2">
              <Bot className="w-5.5 h-5.5 text-[#a8ff35] stroke-[2.8]" />
              <span>Orchestrated AI Workers</span>
            </h2>
            <span className="text-[10px] font-bold text-[#a8ff35] bg-[#a8ff35]/15 px-2 py-0.5 rounded font-mono">
              {Object.values(runningAgents).filter(Boolean).length} Online
            </span>
          </div>

          <div className="space-y-4">
            {departments.map(dept => (
              <div key={dept.id} className="space-y-3">
                <button 
                  onClick={() => toggleDept(dept.id)}
                  className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-white/5 rounded-lg transition-colors group"
                >
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-zinc-300 transition-colors">{dept.name}</span>
                  <ChevronDown className={cn("w-4 h-4 text-zinc-600 transition-transform", expandedDepts.includes(dept.id) ? "rotate-180" : "")} />
                </button>

                {expandedDepts.includes(dept.id) && (
                  <div className="grid gap-3">
                    {dept.agents.map(agent => {
                      const isRunning = runningAgents[agent.name] !== false;
                      return (
                        <div 
                          key={agent.name}
                          className={cn(
                            "bg-[#101115] border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300", 
                            isRunning ? "border-white/5" : "border-white/5 opacity-55"
                          )}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                              isRunning ? "bg-[#a8ff35]/10 text-[#a8ff35]" : "bg-zinc-900 text-zinc-600"
                            )}>
                              <agent.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white text-sm">{agent.name}</h3>
                                {agent.isCore && (
                                  <span className="text-[8px] font-bold uppercase tracking-widest bg-zinc-800 text-zinc-400 px-1 py-0.5 rounded">Core</span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-500 font-medium leading-relaxed mt-0.5">{agent.role}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-0 border-white/5">
                            <div className="text-left sm:text-right text-xs">
                              <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Avg Latency</p>
                              <p className="text-zinc-300 font-mono font-medium mt-0.5">{agent.speed}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleToggleAgent(agent.name)}
                                className={cn(
                                  "h-8 text-[11px] font-bold px-3.5 rounded-lg border uppercase transition-colors",
                                  isRunning 
                                    ? "bg-red-500/5 hover:bg-red-500/10 border-red-500/25 text-red-400" 
                                    : "bg-[#a8ff35]/8 hover:bg-[#a8ff35]/15 border-[#a8ff35]/20 text-[#a8ff35]"
                                )}
                                size="sm"
                              >
                                {isRunning ? "Standby" : "Activate"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>


        {/* Right column: Interactive Sandbox Logs terminal (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 font-sans flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#a8ff35]" />
              <span>Diagnostic Telemetry Console</span>
            </h2>
            <button 
              onClick={() => {
                setLogs([]);
              }}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors uppercase font-mono tracking-wider font-semibold cursor-pointer"
            >
              Clear Buffer
            </button>
          </div>

          <Card className="bg-[#0b0c10] border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            {/* Terminal Tab switcher */}
            <div className="bg-[#101115] px-4 py-2 flex items-center gap-2 border-b border-white/5 overflow-x-auto scrollbar-none">
              {["All Workers", "Research", "SEO", "Writer", "Pinterest", "Publishing"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveConsole(tab)}
                  className={cn(
                    "px-2.5 py-1 rounded text-[10px] font-mono tracking-tight transition-all",
                    activeConsole === tab 
                      ? "bg-[#a8ff35]/15 text-[#a8ff35] border border-[#a8ff35]/25 font-bold" 
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/3"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Terminal Window content screen */}
            <div className="p-4 h-[440px] overflow-y-auto font-mono text-xs leading-relaxed space-y-2 select-text scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              <div className="text-[10px] text-zinc-600 mb-2 py-0.5 border-b border-white/3">
                // AFFILIATE-OS TELEMETRY PROTOCOL v2.8 (UNIX COMPATIBLE)
              </div>
              
              {filteredLogs.length === 0 ? (
                <div className="text-zinc-700 italic text-center pt-24 pb-24 text-[11px]">
                  No buffered outputs recorded for active channel.
                </div>
              ) : (
                filteredLogs.map((log, idx) => {
                  let badgeColor = "text-sky-400";
                  if (log.status === 'success') badgeColor = "text-[#a8ff35]";
                  if (log.status === 'warn') badgeColor = "text-amber-400";
                  if (log.status === 'error') badgeColor = "text-red-400";

                  const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour12: false });

                  return (
                    <div key={log.id || idx} className="flex items-start gap-2 hover:bg-white/[0.02] py-0.5 rounded px-1 transition-colors">
                      <span className="text-zinc-600 select-none text-[10px] font-semibold mt-0.5 shrink-0">{timeStr}</span>
                      <span className="text-[#6B6E7B] select-none text-[10px] font-bold shrink-0">[{log.agentType}]</span>
                      <div className="flex-1">
                        <span className={cn("text-zinc-300 whitespace-pre-wrap break-all", log.status === 'success' && "text-white")}>
                          {log.message}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={terminalEndRef} />
            </div>

            {/* Terminal Bottom Controls */}
            <div className="bg-[#101115] border-t border-white/5 py-3.5 px-4 flex items-center justify-between">
              <span className="text-[9px] font-semibold uppercase text-zinc-500 tracking-widest flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-[#a8ff35] animate-ping shrink-0" />
                <span>Socket Port: 3000 Loop</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 bg-white/3 px-2 py-1 rounded border border-white/5">
                  Buffer: {filteredLogs.length} lines
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
