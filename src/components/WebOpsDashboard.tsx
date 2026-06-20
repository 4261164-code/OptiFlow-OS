import React, { useEffect, useState } from "react";
import { Activity, Clock, Activity as ActivityIcon, CheckCircle2, AlertTriangle, XCircle, Terminal } from "lucide-react";

interface WebOpsEvent {
  timestamp: string;
  type: string;
  message: string;
  severity: "info" | "warning" | "error" | "success";
  service: string;
}

export function WebOpsDashboard() {
  const [events, setEvents] = useState<WebOpsEvent[]>([]);
  const [systemHealth, setSystemHealth] = useState(100);
  const [latency, setLatency] = useState(45);
  const [activeFixes, setActiveFixes] = useState(0);
  const [telemetryMode, setTelemetryMode] = useState<"CONNECTING" | "AUTHENTIC" | "SIMULATION">("CONNECTING");

  useEffect(() => {
    let ws: WebSocket | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    // Generate initial dummy data
    const initialEvents: WebOpsEvent[] = [
      { timestamp: new Date().toISOString(), type: "SYSTEM_START", message: "WebOps autonomous subsystem connecting...", severity: "info", service: "core" }
    ];
    setEvents(initialEvents);

    const startMockStream = () => {
      setTelemetryMode("SIMULATION");
      setEvents(prev => [{ timestamp: new Date().toISOString(), type: "SIMULATION_MODE_ENTERED", message: "WebOps stream fallback activated. Telemetry is local.", severity: "error", service: "client" }, ...prev]);
      
      fallbackInterval = setInterval(() => {
        const msTimestamp = new Date().toISOString();
        const rand = Math.random();

        let newEvent: WebOpsEvent | null = null;
        if (rand > 0.8) {
          newEvent = { timestamp: msTimestamp, type: "TRAFFIC_SPIKE", message: "Incoming traffic spike detected on /go routes.", severity: "info", service: "api" };
        } else if (rand > 0.6) {
          newEvent = { timestamp: msTimestamp, type: "AUTO_FIX_INIT", message: "Initiating auto-scaling group capacity increase.", severity: "warning", service: "workers" };
          setActiveFixes(prev => prev + 1);
        } else if (rand > 0.4) {
          newEvent = { timestamp: msTimestamp, type: "CIRCUIT_BREAKER", message: "Circuit breaker cleared for ThirdPartyAPI.", severity: "success", service: "network" };
          setActiveFixes(prev => Math.max(0, prev - 1));
        }

        if (newEvent) { setEvents(prev => [newEvent!, ...prev].slice(0, 50)); }
        setLatency(prev => Math.max(10, Math.min(300, Math.round(prev + (Math.random() - 0.5) * 20))));
        setSystemHealth(prev => Math.max(70, Math.min(100, Math.round(prev + (Math.random() - 0.2) * 5))));
      }, 3000);
    };

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${protocol}//${window.location.host}/webops-stream`);

      ws.onopen = () => {
        console.log("Connected to WebOps live stream.");
        setTelemetryMode("AUTHENTIC");
      };

      ws.onmessage = (msg) => {
        try {
          const event: WebOpsEvent = JSON.parse(msg.data);
          setEvents(prev => [event, ...prev].slice(0, 100));
          if (event.type.includes("LATENCY")) {
            setLatency(Math.max(10, Math.min(300, latency + 15)));
          }
          if (event.type.includes("AUTO_FIX")) {
            setActiveFixes(prev => prev + 1);
            setTimeout(() => setActiveFixes(prev => Math.max(0, prev - 1)), 5000);
          }
        } catch (e) {
          console.error("Failed to parse WebOps event", e);
        }
      };

      ws.onerror = () => {
        console.warn("WebSocket connection failed, falling back to local simulation.");
        if (!fallbackInterval) startMockStream();
      };
      
      ws.onclose = () => {
        if (!fallbackInterval) startMockStream();
      };

    } catch (err) {
      console.warn("WebSocket not supported or failed, falling back to simulation.");
      startMockStream();
    }

    return () => {
      if (ws) ws.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  return (
    <div className="p-6 text-white min-h-screen relative">
      {telemetryMode === "SIMULATION" && (
        <div className="mb-6 bg-red-950/50 border border-red-500/50 rounded-xl p-4 flex items-center justify-between text-red-400 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <h3 className="font-bold font-mono">BACKEND OFFLINE</h3>
              <p className="text-sm opacity-80">Telemetry is simulated. Data is not authoritative.</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-red-500/10 rounded-full text-xs font-mono border border-red-500/20">
            SIMULATION_MODE
          </div>
        </div>
      )}

      <div className="flex items-center space-x-3 mb-6">
        <Activity className="w-8 h-8 text-[#bce122]" />
        <h1 className="text-2xl font-bold font-mono">WebOps Autonomous Subsystem</h1>
        {telemetryMode === "AUTHENTIC" && (
          <span className="ml-4 px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-mono">
            VERIFIED_STREAM
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-black border border-white/10 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-zinc-400 font-mono">System Health</span>
            <ActivityIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-4xl font-bold tracking-tight">{systemHealth}%</div>
            <div className="text-xs text-zinc-500 mt-2">Overall subsystem vitality</div>
          </div>
        </div>

        <div className="bg-black border border-white/10 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-zinc-400 font-mono">Global Latency</span>
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <div className="text-4xl font-bold tracking-tight">{latency}ms</div>
            <div className="text-xs text-zinc-500 mt-2">Average response time</div>
          </div>
        </div>

        <div className="bg-black border border-white/10 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-zinc-400 font-mono">Active Fixes</span>
            <Terminal className="w-5 h-5 text-[#bce122]" />
          </div>
          <div>
            <div className="text-4xl font-bold tracking-tight">{activeFixes}</div>
            <div className="text-xs text-zinc-500 mt-2">In-flight automated remediations</div>
          </div>
        </div>
      </div>

      <div className="bg-black border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4 font-mono">Live System Feed</h2>
        <div className="space-y-3 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {events.map((e, i) => (
            <div key={i} className="p-4 bg-zinc-900 border border-white/5 rounded-lg flex items-start gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="mt-1 shrink-0">
                {e.severity === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {e.severity === "warning" && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                {e.severity === "error" && <XCircle className="w-5 h-5 text-red-400" />}
                {e.severity === "info" && <ActivityIcon className="w-5 h-5 text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className="text-xs font-mono font-bold text-zinc-300">{e.type}</span>
                  <span className="text-[10px] font-mono text-zinc-500">{new Date(e.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-zinc-400">{e.message}</p>
              </div>
              <div className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono uppercase text-zinc-500 shrink-0">
                {e.service}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
