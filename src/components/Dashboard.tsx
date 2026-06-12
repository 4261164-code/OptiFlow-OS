import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  TrendingUp, TrendingDown, Activity, ArrowUpRight, DollarSign, 
  Users, Globe, Zap, Cpu, Shield, AlertTriangle, FileText, CheckCircle2,
  BarChart3, RefreshCw, Layers, Database, Box, Server, Clock, Search
} from 'lucide-react';
import { motion } from 'motion/react';

// Custom metric card component
const MetricCard = ({ title, value, trend, trendValue, icon: Icon, subtitle }: any) => (
  <div className="relative overflow-hidden rounded-[14px] border border-white/5 bg-[#0D1117] p-5 shadow-sm transition-all hover:bg-[#111827]">
    <div className="flex items-center justify-between">
      <span className="text-[12px] font-medium tracking-tight text-zinc-400">{title}</span>
      <Icon className="h-4 w-4 text-zinc-500" />
    </div>
    <div className="mt-4 flex items-baseline gap-2">
      <span className="text-2xl font-semibold tracking-tight text-white">{value}</span>
      {trend && (
        <span className={`text-[11px] font-medium flex items-center ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend === 'up' ? <TrendingUp className="mr-0.5 h-3 w-3" /> : <TrendingDown className="mr-0.5 h-3 w-3" />}
          {trendValue}
        </span>
      )}
    </div>
    {subtitle && <p className="mt-1 text-[10px] text-zinc-500">{subtitle}</p>}
  </div>
);

// Section Header component
const SectionHeader = ({ title, subtitle }: any) => (
  <div className="mb-6 flex flex-col gap-1 border-b border-white/5 pb-4">
    <h2 className="text-[15px] font-semibold tracking-tight text-white">{title}</h2>
    <p className="text-[12px] text-zinc-400">{subtitle}</p>
  </div>
);

export function Dashboard() {
  const [loading, setLoading] = useState(true);

  // Fake "boot" effect for premium feel
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">Initializing Enterprise Core...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-12 pb-20 font-sans selection:bg-white/10" style={{ letterSpacing: "-0.01em" }}>
      
      {/* HERO SECTION: CEO COMMAND CENTER */}
      <section className="relative overflow-hidden rounded-[20px] border border-white/5 bg-[#0D1117] p-8 shadow-2xl mt-4">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-white opacity-[0.01] blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col justify-between md:flex-row md:items-end">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-500">Live Operating System</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white lg:text-5xl" style={{ letterSpacing: "-0.03em" }}>
              Enterprise Revenue Operating System
            </h1>
            <p className="text-[14px] leading-relaxed text-zinc-400">
              Unified intelligence across traffic, revenue, automation, AI agents, infrastructure, and growth systems.
            </p>
          </div>
          
          <div className="mt-8 flex gap-3 md:mt-0">
            <button className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-white/10">
              <RefreshCw className="mr-2 h-3.5 w-3.5 text-zinc-400" />
              Sync Telemetry
            </button>
            <button className="flex items-center justify-center rounded-lg bg-white px-4 py-2 text-[12px] font-medium text-black transition-colors hover:bg-zinc-200">
              Generate Report
            </button>
          </div>
        </div>

        {/* Hero Metrics */}
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="space-y-1 border-l border-white/10 pl-4">
            <p className="text-[11px] font-medium text-zinc-500">Current Revenue</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-white">$142,854<span className="text-[14px] text-zinc-500">.00</span></p>
              <span className="text-[11px] text-emerald-400">+12.4%</span>
            </div>
          </div>
          <div className="space-y-1 border-l border-white/10 pl-4">
            <p className="text-[11px] font-medium text-zinc-500">Profit Margin</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-white">68.4%</p>
              <span className="text-[11px] text-emerald-400">+2.1%</span>
            </div>
          </div>
          <div className="space-y-1 border-l border-white/10 pl-4">
            <p className="text-[11px] font-medium text-zinc-500">System Reliability</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-white">99.99%</p>
              <span className="text-[11px] text-emerald-400">Stable</span>
            </div>
          </div>
          <div className="space-y-1 border-l border-white/10 pl-4">
            <p className="text-[11px] font-medium text-zinc-500">Growth Score</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-white">94/100</p>
              <span className="text-[11px] text-emerald-400">Optimal</span>
            </div>
          </div>
        </div>
      </section>

      {/* REVENUE INTELLIGENCE */}
      <section>
        <SectionHeader title="Revenue Intelligence" subtitle="Real-time financial telemetry and forecasting models." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Revenue Today" value="$8,432" trend="up" trendValue="14%" icon={DollarSign} subtitle="Target: $7,500" />
          <MetricCard title="Projected Month" value="$215k" trend="up" trendValue="8%" icon={TrendingUp} subtitle="Based on current velocity" />
          <MetricCard title="Average LTV" value="$425.50" trend="up" trendValue="2.4%" icon={Users} subtitle="Per acquired customer" />
          <MetricCard title="Blended CAC" value="$42.10" trend="down" trendValue="-5.1%" icon={Activity} subtitle="Target: < $50" />
        </div>
        {/* Placeholder for interactive chart frame */}
        <div className="mt-4 h-[300px] w-full rounded-[14px] border border-white/5 bg-[#0D1117] flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />
             <div className="text-center relative z-10">
                <BarChart3 className="mx-auto w-8 h-8 text-zinc-700 mb-3" />
                <span className="text-[12px] text-zinc-500 font-mono tracking-widest uppercase">Revenue Time Series Engine Offline</span>
             </div>
        </div>
      </section>

      {/* TRAFFIC INTELLIGENCE */}
      <section>
        <SectionHeader title="Traffic Intelligence" subtitle="Global audience routing and acquisition paths." />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="col-span-1 space-y-4">
             <MetricCard title="Global Sessions" value="284,591" trend="up" trendValue="18%" icon={Globe} subtitle="Last 30 days" />
             <MetricCard title="Conversion Rate" value="3.42%" trend="up" trendValue="1.2%" icon={Zap} subtitle="Session to Lead" />
             <MetricCard title="Traffic Health" value="A+" trend="up" trendValue="Stable" icon={Shield} subtitle="Bot ratio < 1.2%" />
          </div>
          <div className="col-span-2 rounded-[14px] border border-white/5 bg-[#0D1117] p-5">
            <h3 className="text-[12px] font-medium text-zinc-400 mb-5">Acquisition Channels</h3>
            <div className="space-y-4">
              {[
                { name: 'Organic Search', value: '45%', amount: '128k', color: '#10B981' },
                { name: 'Pinterest Engine', value: '25%', amount: '71k', color: '#8B5CF6' },
                { name: 'Paid Social', value: '15%', amount: '42k', color: '#3B82F6' },
                { name: 'Direct / Referral', value: '15%', amount: '42k', color: '#6B7280' },
              ].map((channel, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-32 text-[12px] font-medium text-white">{channel.name}</div>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: channel.value, backgroundColor: channel.color }} />
                  </div>
                  <div className="w-16 text-right text-[12px] text-zinc-400 font-mono">{channel.amount}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AFFILIATE COMMAND CENTER & AI OPERATIONS */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Affiliate Command */}
        <section>
          <SectionHeader title="Affiliate Command" subtitle="Network performance and offer decay." />
          <div className="rounded-[14px] border border-white/5 bg-[#0D1117] overflow-hidden">
             <table className="w-full text-left text-[12px] text-zinc-400">
               <thead className="bg-[#111827] text-[11px] uppercase tracking-wider">
                 <tr>
                   <th className="px-5 py-3 font-medium">Network</th>
                   <th className="px-5 py-3 font-medium text-right">EPC</th>
                   <th className="px-5 py-3 font-medium text-right">Earnings</th>
                   <th className="px-5 py-3 font-medium text-right">Decay</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {[
                   { name: 'MaxBounty', epc: '$1.42', earnings: '$12,450', decay: 'Low' },
                   { name: 'Impact Radius', epc: '$0.85', earnings: '$4,120', decay: 'Med' },
                   { name: 'PartnerStack', epc: '$2.15', earnings: '$8,940', decay: 'High' },
                   { name: 'ClickBank', epc: '$0.45', earnings: '$1,200', decay: 'Crit' },
                 ].map((net, i) => (
                   <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                     <td className="px-5 py-3 text-white font-medium">{net.name}</td>
                     <td className="px-5 py-3 text-right font-mono text-emerald-400">{net.epc}</td>
                     <td className="px-5 py-3 text-right font-mono text-white">{net.earnings}</td>
                     <td className="px-5 py-3 text-right">
                       <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                         net.decay === 'Low' ? 'bg-emerald-500/10 text-emerald-500' :
                         net.decay === 'Med' ? 'bg-amber-500/10 text-amber-500' :
                         'bg-rose-500/10 text-rose-500'
                       }`}>
                         {net.decay}
                       </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </section>

        {/* AI Operations */}
        <section>
          <SectionHeader title="AI Operations Center" subtitle="Model inference routing and token telemetry." />
          <div className="rounded-[14px] border border-white/5 bg-[#0D1117] p-5">
             <div className="space-y-5">
               <div className="flex items-center justify-between">
                 <div>
                   <h3 className="text-[13px] font-medium text-white">Gemini 3.1 Pro</h3>
                   <p className="text-[11px] text-zinc-500">Primary Core Routing</p>
                 </div>
                 <div className="text-right">
                   <p className="font-mono text-[13px] text-emerald-400">12.4M tokens</p>
                   <p className="text-[10px] text-zinc-500">Active / Online</p>
                 </div>
               </div>
               <div className="flex items-center justify-between border-t border-white/5 pt-4">
                 <div>
                   <h3 className="text-[13px] font-medium text-white">Claude 3.5 Sonnet</h3>
                   <p className="text-[11px] text-zinc-500">Secondary Generation</p>
                 </div>
                 <div className="text-right">
                   <p className="font-mono text-[13px] text-white">4.1M tokens</p>
                   <p className="text-[10px] text-zinc-500">Active / Online</p>
                 </div>
               </div>
               <div className="flex items-center justify-between border-t border-white/5 pt-4">
                 <div>
                   <h3 className="text-[13px] font-medium text-white">DeepSeek V3</h3>
                   <p className="text-[11px] text-zinc-500">Code/Logic Evaluation</p>
                 </div>
                 <div className="text-right">
                   <p className="font-mono text-[13px] text-white">1.8M tokens</p>
                   <p className="text-[10px] text-zinc-500">Active / Online</p>
                 </div>
               </div>
             </div>
          </div>
        </section>
      </div>

      {/* AUTONOMOUS AGENTS */}
      <section>
        <SectionHeader title="Autonomous Agents" subtitle="Workflow status for programmatic entity operators." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: "Revenue Agent", target: "MaxBounty Deals", status: "Active", efficiency: "98%" },
            { name: "SEO Content Agent", target: "Blog Matrix", status: "Active", efficiency: "94%" },
            { name: "Pinterest Agent", target: "Visual Boards", status: "Throttled", efficiency: "72%" },
            { name: "Healing Agent", target: "Broken Links", status: "Sleeping", efficiency: "100%" },
          ].map((agent, i) => (
            <div key={i} className="rounded-[14px] border border-white/5 bg-[#0D1117] p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded bg-[#111827] flex items-center justify-center border border-white/5">
                  <Cpu className="w-4 h-4 text-zinc-400" />
                </div>
                <span className={`h-2 w-2 rounded-full ${
                  agent.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]' : 
                  agent.status === 'Sleeping' ? 'bg-zinc-500' : 'bg-amber-500'
                }`} />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold text-white">{agent.name}</h4>
                <p className="text-[11px] text-zinc-500 mb-3">{agent.target}</p>
                <div className="flex items-center justify-between text-[11px] border-t border-white/5 pt-3">
                  <span className="text-zinc-400">Efficiency</span>
                  <span className="font-mono text-emerald-400">{agent.efficiency}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SYSTEM DIAGNOSTICS & AUDIT LEDGER */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* System Diagnostics */}
        <section className="col-span-1">
          <SectionHeader title="System Diagnostics" subtitle="Infrastructure observability." />
          <div className="rounded-[14px] border border-white/5 bg-[#0D1117] p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-medium text-white">
                <span>CPU Utilization</span>
                <span className="font-mono text-zinc-400">42%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[42%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-medium text-white">
                <span>Memory Allocation</span>
                <span className="font-mono text-zinc-400">76%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[76%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-medium text-white">
                <span>Database Latency</span>
                <span className="font-mono text-emerald-400">12ms</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[12%]" />
              </div>
            </div>
          </div>
        </section>

        {/* Audit Ledger */}
        <section className="col-span-2">
          <SectionHeader title="Audit Ledger" subtitle="Immutable event stream of critical actions." />
          <div className="rounded-[14px] border border-white/5 bg-[#0D1117] overflow-hidden p-2">
            {[
              { action: "Compliance Policy Update", user: "system_admin", time: "2m ago", status: "Verified" },
              { action: "Payout Dispersal", user: "finance_agent", time: "14m ago", status: "Verified" },
              { action: "API Key Rotation", user: "system_admin", time: "1h ago", status: "Warning" },
              { action: "Mass Content Publish", user: "editor_agent", time: "3h ago", status: "Redacted" },
            ].map((event, i) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/5 cursor-default">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    event.status === 'Verified' ? 'bg-emerald-500' :
                    event.status === 'Warning' ? 'bg-amber-500' : 'bg-rose-500'
                  }`} />
                  <div>
                    <h4 className="text-[12px] font-medium text-white">{event.action}</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{event.user}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] text-zinc-400 font-mono">{event.time}</span>
                  <span className="text-[10px] text-zinc-600 font-medium">{event.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
}

