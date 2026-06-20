import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Search, 
  Layers, 
  Workflow, 
  Bot, 
  History, 
  LineChart, 
  Users2, 
  ChevronRight,
  TrendingUp,
  ExternalLink,
  ChevronDown,
  LayoutDashboard,
  Cpu,
  Shield,
  Activity,
  Network,
  Settings,
  Bot as BotIcon,
  FileText,
  MousePointer2,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui';
import { 
  BubblyAppleIcon, 
  CloverMascotIcon, 
  BrandingHexIcon, 
  BrandingXIcon,
  DashboardIcon,
  CampaignIcon,
  AgentsIcon,
  ArticlesIcon,
  OffersIcon,
  PinterestIcon,
  PublishingIcon,
  AnalyticsIcon,
  TrafficEngineIcon,
  CreatorNetworkIcon
} from './CustomIcons';

// ----------------------------------------------------------------------
// 1. DEPARTMENT DATA DEFINITIONS
// ----------------------------------------------------------------------

const DEPARTMENTS = [
  {
    id: 'content',
    name: 'Content & Creative Hub',
    description: 'Autonomous narrative generation and visual asset composition.',
    icon: <FileText className="w-5 h-5" />,
    color: 'emerald',
    agents: [
      { name: "Narrative Writer", role: "Affiliate Copywriting Engine", icon: ArticlesIcon, status: "Active", href: "/articles" },
      { name: "Media Composer", role: "Pinterest & Social Visuals", icon: PinterestIcon, status: "Active", href: "/pins" },
      { name: "Asset Illustrator", role: "Concept Graphic Art", icon: CampaignIcon, status: "Standby", href: "/campaigns" }
    ]
  },
  {
    id: 'growth',
    name: 'Growth & SEO Lab',
    description: 'Programmatic search dominance and organic traffic orchestration.',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'indigo',
    agents: [
      { name: "SEO Pillar Architect", role: "Semantic Map Silos", icon: BrandingHexIcon, status: "Active", href: "/seo-clusters" },
      { name: "Intent Research Agent", role: "LSI & Keyword Discovery", icon: Search, status: "Active", href: "/keyword-explorer" },
      { name: "Traffic Engine", role: "Distribution & Indexing", icon: TrafficEngineIcon, status: "Active", href: "/traffic-engine" }
    ]
  },
  {
    id: 'ops',
    name: 'Sovereign Execution',
    description: 'Global deployment nodes and network-level synchronization.',
    icon: <Activity className="w-5 h-5" />,
    color: 'amber',
    agents: [
      { name: "Auto-Publisher Node", role: "WordPress & CMS Deployment", icon: PublishingIcon, status: "Active", href: "/publishing" },
      { name: "Creator Network", role: "Sub-syndication Webhooks", icon: CreatorNetworkIcon, status: "Ready", href: "/creator-network" },
      { name: "Automation Suite", role: "System-wide Workflow Sync", icon: Workflow, status: "Active", href: "/automation" }
    ]
  },
  {
    id: 'intelligence',
    name: 'Intelligence & Yield',
    description: 'Data-driven decision engines and profit maximization.',
    icon: <Shield className="w-5 h-5" />,
    color: 'rose',
    agents: [
      { name: "Yield Matchmaker", role: "Affiliate Deal Ingestion", icon: OffersIcon, status: "Active", href: "/offers" },
      { name: "Finance Auditor", role: "Revenue & Traffic Analytics", icon: AnalyticsIcon, status: "Active", href: "/analytics" },
      { name: "ExOS Strategic Core", role: "CEO Intelligence Partner", icon: Bot, status: "Live", href: "/agents" }
    ]
  }
];

// ----------------------------------------------------------------------
// 2. SUB-COMPONENTS
// ----------------------------------------------------------------------

function DepartmentSection({ dept, isExpanded, onToggle }: { dept: any, isExpanded: boolean, onToggle: () => void }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
  };

  return (
    <div className="bg-[#0c0d12] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl transition-all duration-500 hover:border-[#a8ff35]/20 group">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-10 cursor-pointer"
      >
          <div className="flex items-center space-x-8 text-left">
          <div className={`p-4 rounded-[24px] border ${colors[dept.color]} bg-white/5`}>
            {React.cloneElement(dept.icon as React.ReactElement<any>, { strokeWidth: 2.5, className: 'w-6 h-6' })}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white group-hover:text-[#a8ff35] transition-colors tracking-tight">{dept.name}</h3>
            <p className="text-sm text-zinc-400 mt-1 font-medium">{dept.description}</p>
          </div>
        </div>
        <motion.div 
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="p-3 rounded-2xl bg-white/5 text-zinc-500 group-hover:bg-[#a8ff35]/10 group-hover:text-[#a8ff35] transition-all"
        >
          <ChevronDown className="w-6 h-6" strokeWidth={2.5} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5"
          >
            <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-6 bg-black/20">
              {dept.agents.map((agent: any, idx: number) => {
                 const Icon = agent.icon;
                 return (
                  <Link 
                    key={idx}
                    to={agent.href}
                    className="bg-[#090a0d] border border-white/5 rounded-[32px] p-8 transition-all hover:bg-[#12141a] hover:border-[#a8ff35]/30 group/agent relative overflow-hidden active:scale-95"
                  >
                    <div className="flex items-start justify-between mb-8">
                      <div className="p-4 rounded-2xl bg-white/5 text-zinc-400 group-hover/agent:text-[#a8ff35] group-hover/agent:bg-[#a8ff35]/10 transition-all border border-transparent group-hover/agent:border-[#a8ff35]/20">
                        <Icon className="w-7 h-7" strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${
                          agent.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 
                          agent.status === 'Standby' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {agent.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2 group-hover/agent:translate-x-1 transition-transform tracking-tight">{agent.name}</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold uppercase tracking-wider">{agent.role}</p>
                    </div>
                    <div className="absolute top-2 right-2 p-6 opacity-0 group-hover/agent:opacity-5 transition-opacity">
                      <Icon className="w-24 h-24 text-[#a8ff35]" strokeWidth={2.5} />
                    </div>
                  </Link>
                 );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------------------------
// 3. MAIN COMPONENT
// ----------------------------------------------------------------------

interface AgentLauncherProps {
  onToggleToAnalytics?: () => void;
  activeCampaignsCount: number;
  completedArticlesCount: number;
}

export function AgentLauncher({ 
  onToggleToAnalytics, 
  activeCampaignsCount = 0, 
  completedArticlesCount = 0 
}: AgentLauncherProps) {
  const [expandedDepts, setExpandedDepts] = useState<string[]>(['content', 'growth']);

  const toggleDept = (id: string) => {
    setExpandedDepts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-fade-in">
      {/* 3.1 HEADER SECTION */}
      <header className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#12141a] to-[#08090d] border border-white/10 p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-[40%] h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-[#a8ff35] rounded-full blur-[140px] opacity-20" />
          <div className="absolute bottom-[-10%] right-[10%] w-[250px] h-[250px] bg-indigo-500 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-3 mb-6"
          >
            <div className="w-12 h-12 bg-[#a8ff35] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(168,255,53,0.3)]">
              <BotIcon className="text-black w-6 h-6" />
            </div>
            <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest">Autonomous Operations v4.0</span>
          </motion.div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-[-0.04em] text-white mb-8 leading-[0.9]">
            Agent Launch <span className="text-zinc-600">&</span> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">Orchestration</span>
          </h1>
          <p className="text-xl text-zinc-400 mb-10 leading-relaxed font-light tracking-tight max-w-2xl">
            Command your sovereign affiliate empire through specialized departmental AI clusters. 
            Deploy content silos and optimize distribution from a single command deck.
          </p>

          <div className="flex items-center space-x-12">
            <div className="flex flex-col">
              <span className="text-5xl font-bold text-white tracking-tighter">12</span>
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-[0.2em] mt-2">Active Nodes</span>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-5xl font-bold text-[#a8ff35] tracking-tighter">100%</span>
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-[0.2em] mt-2">System Health</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3.2 DEPARTMENTAL GRID */}
      <section className="space-y-6 mt-16">
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight uppercase">Operational Departments</h2>
            <p className="text-base text-zinc-400 mt-2 font-medium">Select a department to access specialized worker clusters.</p>
          </div>
          <button 
            onClick={() => setExpandedDepts(DEPARTMENTS.map(d => d.id))}
            className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:text-[#a8ff35] transition-colors"
          >
            Expand All Views
          </button>
        </div>

        <div className="space-y-6">
          {DEPARTMENTS.map(dept => (
            <DepartmentSection 
              key={dept.id}
              dept={dept}
              isExpanded={expandedDepts.includes(dept.id)}
              onToggle={() => toggleDept(dept.id)}
            />
          ))}
        </div>
      </section>

      {/* 3.3 SYSTEM STATS RIBBON */}
      <div className="flex items-center justify-center pt-10">
        <div className="flex items-center space-x-12 px-10 py-4 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl">
          <div className="flex items-center space-x-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500" />
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Core Engine: Optimizing</span>
          </div>
          <div className="flex items-center space-x-3">
             <div className="w-2 h-2 rounded-full bg-indigo-500" />
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Telemetry: Syncing</span>
          </div>
          <div className="flex items-center space-x-3">
             <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nodes: Standby</span>
          </div>
        </div>
      </div>
    </div>
  );
}

