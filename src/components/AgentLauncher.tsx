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
    <div className="bg-[#101115] border border-white/5 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:border-white/10 group">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 cursor-pointer"
      >
        <div className="flex items-center space-x-5 text-left">
          <div className={`p-3 rounded-2xl border ${colors[dept.color]}`}>
            {dept.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-[#a8ff35] transition-colors">{dept.name}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{dept.description}</p>
          </div>
        </div>
        <motion.div 
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="p-2 rounded-xl bg-white/5 text-zinc-500"
        >
          <ChevronDown className="w-5 h-5" />
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
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/20">
              {dept.agents.map((agent: any, idx: number) => (
                <Link 
                  key={idx}
                  to={agent.href}
                  className="bg-[#090a0d] border border-white/5 rounded-2xl p-4 transition-all hover:bg-[#12141a] hover:border-[#a8ff35]/30 group/agent relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-white/5 text-zinc-400 group-hover/agent:text-[#a8ff35] group-hover/agent:bg-[#a8ff35]/10 transition-all">
                      <agent.icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                        agent.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        agent.status === 'Standby' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {agent.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1 group-hover/agent:translate-x-1 transition-transform">{agent.name}</h4>
                    <p className="text-[10px] text-zinc-500 leading-normal">{agent.role}</p>
                  </div>
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover/agent:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-[#a8ff35]" />
                  </div>
                </Link>
              ))}
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
      <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#101115] to-[#050608] border border-white/5 p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-[40%] h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-[#a8ff35] rounded-full blur-[120px]" />
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

          <h1 className="text-5xl font-black tracking-tight text-white mb-6 uppercase">
            Agent Launch <span className="text-zinc-600">&</span> Orchestration
          </h1>
          <p className="text-lg text-zinc-400 mb-8 leading-relaxed font-medium">
            Command your sovereign affiliate empire through specialized departmental AI clusters. 
            Deploy content silos, optimize traffic distribution, and manage financial intelligence nodes from a single strategic command deck.
          </p>

          <div className="flex items-center space-x-6">
            <div className="flex flex-col">
              <span className="text-3xl font-black text-white">12</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Nodes</span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-3xl font-black text-[#a8ff35]">100%</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">System Health</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3.2 DEPARTMENTAL GRID */}
      <div className="space-y-6 mt-16">
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight uppercase">Operational Departments</h2>
            <p className="text-sm text-zinc-500 mt-1">Select a department to access specialized worker clusters.</p>
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
      </div>

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

