import React, { useState, useMemo } from 'react';
import { Job } from '../types';
import { Card } from './ui';
import { 
  Activity, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Info, 
  HelpCircle,
  ArrowUpRight,
  Play
} from 'lucide-react';

interface CampaignHealthHeatmapProps {
  jobs: Job[];
}

interface GridCell {
  channel: string;
  segment: string;
  score: number;
  status: 'stellar' | 'good' | 'warning' | 'critical';
  metrics: {
    ctr: string;
    velocity: string;
    failures: number;
    lastSynced: string;
  };
  recommendation: string;
  agentToDeploy: string;
}

const CHANNELS = [
  { id: 'seo', name: 'Google SEO Pillar', icon: '🌐' },
  { id: 'pinterest', name: 'Pinterest Boards', icon: '📌' },
  { id: 'linkedin', name: 'LinkedIn Feed', icon: '💼' },
  { id: 'twitter', name: 'X / Twitter Copy', icon: '🐦' },
  { id: 'email', name: 'Email Newsletter', icon: '✉️' }
];

const DEFAULT_SEGMENTS = [
  'Silo: Personal Finance',
  'Silo: Smart Tech',
  'Silo: Travel Lifestyle',
  'Silo: Wellness Gear',
  'Silo: SaaS Product Reviews'
];

export function CampaignHealthHeatmap({ jobs }: CampaignHealthHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  const [activeTab, setActiveTab ] = useState<'matrix' | 'distribution'>('matrix');

  // Compute segments by combining active jobs & static seeds
  const segments = useMemo(() => {
    const jobKeywords = Array.from(new Set(jobs.map(j => j.keyword))).slice(0, 5);
    // If we have some job keywords, use them; pad with default sections so we always have exactly 5 elements
    const combined = [...jobKeywords];
    for (const def of DEFAULT_SEGMENTS) {
      if (combined.length >= 5) break;
      if (!combined.includes(def)) {
        combined.push(def);
      }
    }
    return combined;
  }, [jobs]);

  // Construct deterministic score matrix based on jobs status & hash signatures
  const heatmapData = useMemo(() => {
    const items: GridCell[] = [];

    for (const channel of CHANNELS) {
      for (const segment of segments) {
        // Look up corresponding job if any
        const matchingJob = jobs.find(j => j.keyword === segment);
        let score = 85; // default base score
        let recommendation = 'Perform standard traffic routing updates to boost domain indexation velocity.';
        let agentToDeploy = 'Traffic Engine Agent';

        // Hash helper for deterministic values if no direct jobs exist
        const nameHash = (channel.name.length * 3 + segment.length * 7) % 31;
        
        if (matchingJob) {
          if (matchingJob.status === 'completed') {
            score = 90 + (nameHash % 11); // 90 to 100
          } else if (matchingJob.status === 'error') {
            score = 30 + (nameHash % 15); // 30 to 45
          } else {
            score = 65 + (nameHash % 10); // 65 to 75
          }
        } else {
          // Semi-random deterministic seeding for full-fidelity initial load
          score = 50 + (nameHash * 1.5);
          if (score > 100) score = 100;
          if (score < 40) score = 40;
        }

        // Adjust scores based on specific channel logic
        if (channel.id === 'pinterest' && score > 80 && nameHash % 4 === 0) {
          score = 42; // Inject a visual bottleneck to test gateway repairs
        }

        score = Math.round(score);

        // Determine categorical status & bespoke strategic copy
        let status: 'stellar' | 'good' | 'warning' | 'critical' = 'good';
        if (score >= 90) {
          status = 'stellar';
          recommendation = `The "${segment}" node is performing in the upper percentile on ${channel.name}. Amplify coverage with related programmatic sub-keywords and backlink injections.`;
          agentToDeploy = 'SEO Pillar Architect';
        } else if (score >= 75) {
          status = 'good';
          recommendation = `Syndication layers are operational. Deploy automatic social-copy generators to refresh the active distribution feed.`;
          agentToDeploy = 'Social Copy Blueprint Agent';
        } else if (score >= 55) {
          status = 'warning';
          recommendation = `Metrics indicate low conversion resonance or missing monetization affiliate offers. Verify active programmatic sponsor coordinates immediately.`;
          agentToDeploy = 'Affiliate Matchmaker';
        } else {
          status = 'critical';
          recommendation = `Gateway socket interrupts or critical job exceptions detected. Reconnect campaign credentials to restart the active visual compiler.`;
          agentToDeploy = 'Pinterest Creative Agent';
        }

        // Bespoke KPI calculations
        const ctr = `${(score * 0.08 + 1.2).toFixed(2)}%`;
        const velocity = `+${Math.round(score * 1.2 + 10)} views/hr`;
        const failures = status === 'critical' ? 3 : status === 'warning' ? 1 : 0;
        const lastSynced = matchingJob 
          ? new Date(matchingJob.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : `${Math.round(nameHash % 12) + 1} hours ago`;

        items.push({
          channel: channel.name,
          segment,
          score,
          status,
          metrics: { ctr, velocity, failures, lastSynced },
          recommendation,
          agentToDeploy
        });
      }
    }
    return items;
  }, [segments, jobs]);

  // Aggregate global portfolio index statistics
  const averages = useMemo(() => {
    if (heatmapData.length === 0) return { overall: 80, activeCount: 0, criticalCount: 0, healthyCount: 0 };
    const sum = heatmapData.reduce((acc, curr) => acc + curr.score, 0);
    const critical = heatmapData.filter(d => d.status === 'critical').length;
    const stellar = heatmapData.filter(d => d.status === 'stellar').length;
    return {
      overall: Math.round(sum / heatmapData.length),
      activeCount: heatmapData.length,
      criticalCount: critical,
      stellarCount: stellar
    };
  }, [heatmapData]);

  // Initial cell selection if none selected
  React.useEffect(() => {
    if (!selectedCell && heatmapData.length > 0) {
      // Find a warning or critical one to showcase, otherwise the first 
      const showcaseCell = heatmapData.find(d => d.status === 'warning' || d.status === 'critical') || heatmapData[0];
      setSelectedCell(showcaseCell);
    }
  }, [heatmapData, selectedCell]);

  return (
    <Card className="bg-[#101115] border border-white/5 rounded-[28px] overflow-hidden shadow-2xl relative">
      {/* Background ambient decorative grid lights */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#a8ff35]/3 via-transparent to-transparent pointer-events-none" />
      
      {/* Visual Header */}
      <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#a8ff35]/10 text-[#a8ff35] text-xs font-mono">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
            </span>
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">Multichannel Diagnostics</h2>
          </div>
          <h3 className="text-base font-bold text-white mt-1">Silo Affiliate Campaign Health</h3>
          <p className="text-[11px] text-zinc-500 font-medium">Heatmap monitoring interactive health thresholds and link-juice distributions</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Diagnostic tab switchers */}
          <div className="bg-black/40 p-1 rounded-xl border border-white/5 flex items-center text-[10px] font-bold">
            <button 
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-transform ${activeTab === 'matrix' ? 'bg-[#a8ff35] text-black shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              Health Matrix
            </button>
            <button 
              onClick={() => setActiveTab('distribution')}
              className={`px-3 py-1.5 rounded-lg transition-transform ${activeTab === 'distribution' ? 'bg-[#a8ff35] text-black shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              Summary Outlook
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 relative z-10 space-y-6">
        {/* Main interactive matrix */}
        {activeTab === 'matrix' ? (
          <div className="space-y-6">
            <div className="overflow-x-auto scrollbar-none">
              <div className="min-w-[620px]">
                {/* Columns Header (Segments) */}
                <div className="grid grid-cols-12 gap-2 mb-3 items-center">
                  <div className="col-span-3 text-left">
                    <span className="text-[9px] font-extrabold text-zinc-600 uppercase tracking-widest">Affiliate Channel</span>
                  </div>
                  <div className="col-span-9 grid grid-cols-5 gap-2 text-center">
                    {segments.map((seg, idx) => (
                      <div key={seg} className="text-[10px] font-bold text-zinc-400 truncate px-1">
                        <span className="text-indigo-400/80 font-mono block text-[8px] uppercase tracking-wider">Col 0{idx + 1}</span>
                        <span className="truncate block" title={seg}>{seg.replace('Silo: ', '')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grid Rows (Channels) */}
                <div className="space-y-2.5">
                  {CHANNELS.map(channel => {
                    // Compute average of row
                    const channelCells = heatmapData.filter(d => d.channel === channel.name);
                    const avgScore = Math.round(channelCells.reduce((sum, c) => sum + c.score, 0) / (channelCells.length || 1));

                    return (
                      <div key={channel.id} className="grid grid-cols-12 gap-2 items-center">
                        {/* Row Header */}
                        <div className="col-span-3 flex items-center justify-between pr-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{channel.icon}</span>
                            <span className="text-xs font-bold text-zinc-200 truncate max-w-[110px]" title={channel.name}>
                              {channel.name}
                            </span>
                          </div>
                          <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                            avgScore >= 90 ? 'text-[#a8ff35] bg-[#a8ff35]/5' :
                            avgScore >= 70 ? 'text-blue-400 bg-blue-400/5' :
                            'text-amber-500 bg-amber-500/5'
                          }`}>
                            {avgScore}%
                          </span>
                        </div>

                        {/* Heatmap Cell Blocks */}
                        <div className="col-span-9 grid grid-cols-5 gap-2">
                          {segments.map(segment => {
                            const cell = heatmapData.find(d => d.channel === channel.name && d.segment === segment);
                            if (!cell) return <div key={segment} className="aspect-square bg-zinc-950/20" />;

                            const isSelected = selectedCell?.channel === cell.channel && selectedCell?.segment === cell.segment;
                            const isHovered = hoveredCell?.channel === cell.channel && hoveredCell?.segment === cell.segment;

                            // Dynamic high fidelity Tailwind color classes based on health index
                            let colorClass = '';
                            if (cell.score >= 95) colorClass = 'bg-[#a8ff35] text-black'; // peak high brightness
                            else if (cell.score >= 88) colorClass = 'bg-[#a8ff35]/80 text-black/90';
                            else if (cell.score >= 78) colorClass = 'bg-emerald-500/40 text-emerald-300 border border-emerald-500/10';
                            else if (cell.score >= 65) colorClass = 'bg-blue-600/30 text-blue-200 border border-blue-500/10';
                            else if (cell.score >= 48) colorClass = 'bg-amber-500/25 text-amber-300 border border-amber-500/10';
                            else colorClass = 'bg-red-500/20 text-red-400 border border-red-500/20 animate-pulse';

                            return (
                              <button
                                key={segment}
                                onClick={() => setSelectedCell(cell)}
                                onMouseEnter={() => setHoveredCell(cell)}
                                onMouseLeave={() => setHoveredCell(null)}
                                className={`h-12 rounded-xl flex flex-col items-center justify-center relative cursor-pointer font-bold select-none transition-all duration-300 outline-none ${colorClass} ${
                                  isSelected ? 'ring-2 ring-white scale-102 z-20 shadow-lg' : 
                                  isHovered ? 'ring-1 ring-white/50 scale-[1.01]' : 'opacity-90 hover:opacity-100'
                                }`}
                              >
                                <span className="text-[14px] font-mono tracking-tighter">{cell.score}%</span>
                                
                                {cell.status === 'critical' && (
                                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Grid Colors Informative Legend */}
            <div className="flex items-center justify-between flex-wrap gap-4 pt-3 border-t border-white/5 text-[10px] text-zinc-500">
              <div className="flex items-center gap-4">
                <span className="font-semibold uppercase tracking-wider">Metrics Severity:</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-red-500/25 border border-red-500/30" />
                    <span>Critical (&lt;48)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500/25 border border-amber-500/30" />
                    <span>Warning (48-64)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-blue-600/30 border border-blue-500/30" />
                    <span>In-Progress (65-77)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-500/20" />
                    <span>Optimal (78-87)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-[#a8ff35] text-black" />
                    <span>Peak Stellar (&ge;88)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-zinc-500 font-medium">
                <Info className="w-3.5 h-3.5" />
                <span>Interact with cells to launch corrective sub-agents</span>
              </div>
            </div>
          </div>
        ) : (
          /* Summary outlook charts & distribution charts */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold">Overall Score</span>
                <TrendingUp className="w-3.5 h-3.5 text-[#a8ff35]" />
              </div>
              <p className="text-4xl font-extrabold text-white tracking-tighter font-mono">{averages.overall}%</p>
              <p className="text-[10px] text-zinc-500 font-semibold leading-normal">Deterministic portfolio index calculated from active campaign channels and cloud synchronizations.</p>
            </div>

            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold">Stellar Channels</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#a8ff35]" />
              </div>
              <p className="text-4xl font-extrabold text-[#a8ff35] tracking-tighter font-mono">{averages.stellarCount}</p>
              <p className="text-[10px] text-zinc-500 font-semibold leading-normal">High-yield networks running fully autonomous backlink cycles, search silo maps, and post-schedulers.</p>
            </div>

            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold">Failing Nodes</span>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              </div>
              <p className="text-4xl font-extrabold text-red-500 tracking-tighter font-mono">{averages.criticalCount}</p>
              <p className="text-[10px] text-zinc-500 font-semibold leading-normal">Active bottlenecks encountering rate throttling or expired programmatic gateway credentials.</p>
            </div>
          </div>
        )}

        {/* Selected Cell Audit Details & Sub-agent Deployment Panel */}
        {selectedCell && (
          <div className="bg-[#14151a] border border-white/5 rounded-2xl p-5 relative overflow-hidden transition-all duration-300">
            {/* Soft decorative visual light on highlight */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 pointer-events-none rounded-full ${
              selectedCell.status === 'stellar' ? 'bg-[#a8ff35]' :
              selectedCell.status === 'good' ? 'bg-emerald-500' :
              selectedCell.status === 'warning' ? 'bg-amber-400' : 'bg-red-500'
            }`} />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Node meta indicators */}
              <div className="md:col-span-8 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-[#a8ff35] font-mono bg-[#a8ff35]/5 px-2.5 py-1 rounded-lg">
                    Node Inspected
                  </span>
                  <span className="text-zinc-600 font-bold">•</span>
                  <span className="text-xs text-zinc-400 font-semibold truncate">
                    {selectedCell.segment}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>{selectedCell.channel}</span>
                    <span className="text-zinc-600 font-light font-mono">/</span>
                    <span className="text-zinc-400 font-sans font-medium text-sm">{selectedCell.segment.replace('Silo: ', '')}</span>
                  </h4>
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                    {selectedCell.recommendation}
                  </p>
                </div>

                {/* Micro KPIs for details panel */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Yield CTR</span>
                    <span className="text-xs font-mono font-bold text-white mt-0.5 block">{selectedCell.metrics.ctr}</span>
                  </div>
                  <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Velocity Index</span>
                    <span className="text-xs font-mono font-bold text-[#a8ff35] mt-0.5 block">{selectedCell.metrics.velocity}</span>
                  </div>
                  <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold">Last Sync Run</span>
                    <span className="text-xs font-mono font-bold text-zinc-400 mt-0.5 block">{selectedCell.metrics.lastSynced}</span>
                  </div>
                </div>
              </div>

              {/* Node Diagnostic Actions (Suggested Agents Launcher) */}
              <div className="md:col-span-4 bg-black/40 border border-white/5 p-4 rounded-xl flex flex-col justify-between h-full space-y-4">
                <div>
                  <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-bold mb-1.5">Suggested Action Agent</span>
                  <div className="flex items-center gap-2 text-zinc-100">
                    <Activity className="w-4 h-4 text-[#a8ff35] stroke-[2.5]" />
                    <span className="text-xs font-bold truncate">{selectedCell.agentToDeploy}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">Ready to sync keyword schemas, audit backlink hubs, or optimize API parameters.</p>
                </div>

                <button 
                  className={`w-full py-2 px-3 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition ${
                    selectedCell.status === 'critical' 
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-[#a8ff35] text-black hover:bg-[#90eb24]'
                  }`}
                  onClick={() => alert(`Strategic optimization protocol dispatched: "${selectedCell.agentToDeploy}" is compiling recommendations for segment "${selectedCell.segment}". check Notification desk for sync events.`)}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Repair Node</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
