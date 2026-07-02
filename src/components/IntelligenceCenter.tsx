import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  Cpu, 
  Activity, 
  FileCheck, 
  RefreshCw, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Brain,
  Download,
  Terminal,
  Layers,
  Check
} from 'lucide-react';
import { Button } from './ui';
import { auth } from '../lib/firebase';
import { apiFetch } from '../lib/auth';
import { motion, AnimatePresence } from 'motion/react';

interface KPICard {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

interface OptimizationTask {
  title: string;
  agent: string;
  impact: string;
  effort: string;
  description: string;
  suggestedAction: string;
}

interface AnalysisResult {
  overview: string;
  outlook: number;
  kpis: KPICard[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  optimizations: OptimizationTask[];
}

export function IntelligenceCenter() {
  const [docType, setDocType] = useState<'weekly-report' | 'seo-plan' | 'sponsorships' | 'custom'>('weekly-report');
  const [pasteText, setPasteText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // High-fidelity pre-loaded professional example text based on docType to make it immediately usable/interactive
  const defaultTexts = {
    'weekly-report': `OptiFlow OS Performance Digest - Week 22
- Main Target: Outdoor Adventure Gear & Solar Power Systems
- Total Traffic: 48,290 visits (+14.2% week-on-week)
- Key issues: Bounce rate high (72%) on the 'best portable solar chargers' subtopic list.
- Pinterest campaign generated 1,220 clicks, down by 8.4% likely due to title metadata format truncation during bulk sync on accounts.
- Top Affiliate conversions: EcoSolar Starter Kit generated $2,450.00 with 4.1% CTR. Outdoor hiking boots conversions stagnant at under 0.8%.
- Needs immediate recommendation for content siloing and matching high-paying sponsorships.`,
    'seo-plan': `SEO Strategy Roadmap & Semantic Cluster Outline
Pillar Topic: Sustainable Forestry & Off-Grid Living Systems
Core Keywords: off-grid tools, eco-friendly solar hub, sustainable living strategy
Silo structure draft:
- Off-grid appliances (high search intent, difficulty ~45)
- DIY solar setups for cabins (informational search volume ~12k)
We need to generate high conversion keywords, match best high-ticket directories, and draft optimal Pinterest branding cards immediately to rank with clean visual guides.`,
    'sponsorships': `Sponsorship & Affiliate Directory Analysis - Q2
Matched Bounties with CTR limits:
1. GoalZero Solar Systems affiliate campaign: 12% revenue payout, requires high authority landing page.
2. Patagonia Activewear affiliate syndicate: 8% payout, conversion rate index 7.2/10. Needs better internal link density in hiking guides.
3. EcoFuel Portable Generators: flat $150 credit per acquisition, needs high-converting FAQ section and SEO cluster map.`,
    'custom': `Enter any strategy document, copy-pasted PDF report, Google Sheet CSV data, or project brief here for deep optimization and agent recommendations...`
  };

  const handleDocTypeChange = (type: 'weekly-report' | 'seo-plan' | 'sponsorships' | 'custom') => {
    setDocType(type);
    setPasteText(defaultTexts[type]);
  };

  // Initialize with weekly report text
  React.useEffect(() => {
    if (!pasteText) {
      setPasteText(defaultTexts['weekly-report']);
    }
  }, []);

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [deployingTaskIndex, setDeployingTaskIndex] = useState<number | null>(null);
  const [deployedTasks, setDeployedTasks] = useState<Record<number, boolean>>({});
  const [agentLogs, setAgentLogs] = useState<string[]>([]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    setAgentLogs([]);
    
    // Aesthetic log streaming to give it an immersive tactical agent feel
    const logs = [
      "⚡ [Intelligence Core] Mounting document stream reader...",
      "🔍 [Agent Parser] Segmenting text and identifying entity vectors...",
      "🤖 [Gemini Controller] Consulting expert models with temperature parameters...",
      "🧮 [KPI Engine] Extracting numeric correlations and SWOT matrices...",
      "💡 [Strategy Optimizer] Generating actionable sub-agent dispatch procedures..."
    ];

    logs.forEach((logContent, index) => {
      setTimeout(() => {
        setAgentLogs(prev => [...prev, logContent]);
      }, index * 950);
    });

    try {
      const response = await apiFetch('/api/intel/digest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentText: pasteText,
          docType: docType
        })
      });

      const data = await response.json().catch(() => ({ error: "Failed to parse API response" }));
      if (!response.ok) {
        throw new Error(data.error || "Server returned failure code.");
      }

      setResult(data.analysis);
      setIsAnalyzing(false);

    } catch (err: any) {
      console.warn("API fail:", err);
      setError(err?.message || String(err));
      setResult(null);
      setIsAnalyzing(false);
    }
  };

  const deployAgentTask = async (index: number, task: OptimizationTask) => {
    setDeployingTaskIndex(index);
    setAgentLogs(prev => [...prev, `[System] Dispatching task: ${task.suggestedAction} to /api/seeds...`]);

    try {
      // 1. Call POST /api/seeds to initiate the content generation pipeline
      const response = await apiFetch('/api/seeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: task.suggestedAction,
          seoLevel: "High",
          numPins: 3
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to dispatch seed");

      const jobId = data.jobId;
      setAgentLogs(prev => [...prev, `[Job] Queued with ID: ${jobId}. Polling /api/queue...`]);

      // 2. Poll GET /api/queue for real-time status updates
      const pollInterval = setInterval(async () => {
        try {
          const queueRes = await apiFetch(`/api/queue?jobId=${jobId}`);
          const queueData = await queueRes.json();
          
          if (queueData.success && queueData.queue.length > 0) {
            const jobStatus = queueData.queue[0].status;
            
            setAgentLogs(prev => [...prev, `[Job ${jobId}] Status: ${jobStatus}`]);
            
            if (jobStatus === 'completed' || jobStatus === 'error') {
              clearInterval(pollInterval);
              setDeployedTasks(prev => ({ ...prev, [index]: true }));
              setDeployingTaskIndex(null);
              if (jobStatus === 'completed') {
                setAgentLogs(prev => [...prev, `✔️ [Task Success] Optimization active for ${task.suggestedAction}`]);
              } else {
                setAgentLogs(prev => [...prev, `❌ [Task Failed] Optimization failed for ${task.suggestedAction}`]);
              }
            }
          }
        } catch (pollErr) {
          console.warn("Polling error:", pollErr);
        }
      }, 2000);

    } catch (err: any) {
      setAgentLogs(prev => [...prev, `[System] Error: ${err.message}`]);
      setDeployingTaskIndex(null);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER SECTION WITH MATTE COBALT METADATA BANNER */}
      <div className="relative p-8 rounded-[32px] bg-gradient-to-r from-[#090b10] to-[#040507] border border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#a8ff35]/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#a8ff35]/10 text-[#a8ff35] text-[10px] font-mono font-bold uppercase tracking-wider">
              <Brain className="w-3.5 h-3.5" />
              Intelligence Core // Premium
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Document Optimization & Report Digest
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Enable autonomous sub-agents to digest PDF plans, weekly reports, sheets, and CSV documents. Extract analytical telemetry and deploy optimizations directly.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#a8ff35] shadow-lg shadow-black/45">
              <Cpu className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* THREE BENTO INPUT SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left pane: File drag and select or paste content */}
        <div className="lg:col-span-8 bg-[#090a0d] border border-white/5 rounded-[32px] p-6.5 space-y-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#a8ff35]/10 text-[#a8ff35] flex items-center justify-center">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <p className="text-sm font-bold text-white uppercase tracking-wider font-mono">Source Document Feed</p>
            </div>
            
            <span className="text-[10px] text-zinc-500 font-mono">MAX SIZE // 32MB</span>
          </div>

          {/* Doc Type Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'weekly-report', label: 'Weekly Analytics', icon: TrendingUp },
              { id: 'seo-plan', label: 'SEO & PDF Plans', icon: Layers },
              { id: 'sponsorships', label: 'Sponsorship CSV', icon: Activity },
              { id: 'custom', label: 'Custom Intel', icon: Sparkles }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleDocTypeChange(tab.id as any)}
                className={`py-3.5 px-3 rounded-2xl border text-left flex flex-col justify-between h-24 transition duration-300 ${
                  docType === tab.id
                    ? 'border-[#a8ff35] bg-[#a8ff35]/10 text-white shadow-md'
                    : 'border-white/5 bg-[#0d0e12]/60 hover:bg-[#121317] text-zinc-400 hover:text-white'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${docType === tab.id ? 'text-[#a8ff35]' : 'text-zinc-500'}`} />
                <span className="text-[11px] font-bold font-mono tracking-wide mt-2">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Simulated File Drop Target */}
          <div className="border border-dashed border-white/10 hover:border-[#a8ff35]/50 bg-black/35 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition duration-200">
            <Upload className="w-8 h-8 text-zinc-500 mb-2 animate-bounce" />
            <p className="text-xs text-white font-semibold">Drag & Drop PDF, Document or Strategy spreadsheet</p>
            <p className="text-[10px] text-zinc-500 font-mono mt-1">Accepts .pdf, .docx, .csv, .xlsx, .txt</p>
          </div>

          {/* Pasted Document Text Area */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#6B6E7B] font-bold pl-1">
              Document Text Segment
            </label>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste Weekly PDF, Sheets report details, analytics matrices here..."
              className="w-full min-h-[180px] bg-[#0c0d11]/80 rounded-2xl border border-white/5 focus:border-[#a8ff35]/40 text-xs text-zinc-300 p-4.5 focus:outline-none font-mono leading-relaxed"
            />
          </div>

          {/* Action Trigger Deck */}
          <div className="flex items-center justify-between pt-2 border-t border-white/3">
            <p className="text-[10.5px] text-zinc-500 font-medium">
              Uses high-fidelity <span className="text-[#a8ff35] font-mono">gemini-2.5-flash</span> multimodal processor
            </p>
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !pasteText.trim()}
              className="bg-[#a8ff35] hover:bg-[#97ea28] text-black font-extrabold text-xs tracking-wider px-6.5 py-4.5 rounded-2xl flex items-center gap-2 group shadow-lg shadow-[#a8ff35]/15 font-mono"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  COMPILING REPORT...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  RUN DIGITAL OPTIMIZATION
                  <ArrowRight className="w-3.5 h-3.5 text-black transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right pane: Interactive live console log */}
        <div className="lg:col-span-4 bg-[#090a0d] border border-white/5 rounded-[32px] p-6.5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-500" />
                <p className="text-xs font-bold text-white uppercase font-mono tracking-widest">Active System Logs</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#a8ff35] animate-ping" />
            </div>

            <div className="bg-[#050608] border border-white/5 rounded-2xl p-4.5 min-h-[320px] max-h-[380px] overflow-y-auto space-y-3 font-mono text-[10px] text-zinc-400">
              {agentLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-2">
                  <Brain className="w-6 h-6 text-zinc-650 animate-pulse" />
                  <p className="text-zinc-650 uppercase font-bold tracking-widest text-[9px]">Silo System Standby</p>
                  <p className="text-zinc-700 text-[9.5px]">Upload some materials and trigger deep optimization to broadcast command cycles.</p>
                </div>
              ) : (
                agentLogs.map((log, i) => (
                  <div key={i} className="leading-relaxed whitespace-pre-line border-b border-white/[0.02] pb-1.5 last:border-none">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-zinc-900/40 rounded-2xl border border-white/5 p-4 space-y-2 text-xs">
            <p className="font-bold text-white text-[11px] font-mono uppercase tracking-wider">Syndicated Output Mode</p>
            <p className="text-zinc-400 text-[10.5px]">
              Document digesting parses structural tables, CSV listings, and raw transcripts. Re-mapped insights populate campaign blueprints instantly.
            </p>
          </div>
        </div>
      </div>

      {/* ERROR FEEDBACK BAR */}
      {error && (
        <div className="bg-[#a8ff35]/10 border border-[#a8ff35]/25 text-[#a8ff35] rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-bold">Sandbox Mode System Simulation</p>
            <p className="text-zinc-300 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* RENDER DYNAMIC ANALYSIS MATRICES - HD 4K QUALITY */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* 1. EXECUTIVE OVERVIEW + OUTLOOK HUD */}
            <div className="bg-gradient-to-br from-[#0c0d12] to-[#08090b] border border-white/5 rounded-[32px] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#a8ff35]/5 rounded-full blur-[80px]" />
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                <div className="md:col-span-8 space-y-4">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-[#a8ff35]" />
                    <span className="text-xs uppercase font-bold font-mono tracking-widest text-white">Executive Strategy Synopsis</span>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed font-sans pr-4">
                    {result.overview}
                  </p>
                </div>
                <div className="md:col-span-4 bg-[#050608]/90 border border-white/5 rounded-2xl p-6.5 flex flex-col justify-between h-40">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="font-mono text-[9px] uppercase tracking-wider">Strategic Outlook Health</span>
                    <TrendingUp className="w-3.5 h-3.5 text-[#a8ff35]" />
                  </div>
                  <div>
                    <div className="text-5xl font-black text-white font-mono flex items-end tracking-tighter">
                      {result.outlook}
                      <span className="text-[#a8ff35] text-xl font-bold ml-1">%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 mt-3.5 overflow-hidden">
                      <div className="bg-[#a8ff35] h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_#a8ff35]" style={{ width: `${result.outlook}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. KPIS DECK MATRIX */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {result.kpis.map((kpi, idx) => (
                <div 
                  key={idx}
                  className="bg-[#090a0d] border border-white/5 hover:border-[#a8ff35]/25 rounded-[22px] p-5.5 relative transition duration-300 shadow-md flex flex-col justify-between h-32"
                >
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider font-semibold">{kpi.label}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold text-white tracking-tight">{kpi.value}</p>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      kpi.trend === 'up' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : kpi.trend === 'down' 
                          ? 'bg-rose-500/10 text-rose-400' 
                          : 'bg-zinc-500/10 text-zinc-400'
                    }`}>
                      {kpi.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 3. DIAGNOSTIC SWOT GRID */}
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Layers className="w-4.5 h-4.5 text-zinc-400" />
                  Silo SWOT Diagnostics Grid
                </h2>
                <p className="text-xs text-zinc-500">Internal strengths and external market vectors parsed from documentation text.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="bg-[#090a0d] border-l-3 border-emerald-500/50 rounded-2xl p-5 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 font-mono tracking-wider">Strengths [S]</span>
                  <ul className="space-y-2 text-xs text-zinc-400 list-disc list-inside">
                    {result.swot.strengths.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                {/* Weaknesses */}
                <div className="bg-[#090a0d] border-l-3 border-rose-500/50 rounded-2xl p-5 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-rose-400 font-mono tracking-wider">Weaknesses [W]</span>
                  <ul className="space-y-2 text-xs text-zinc-400 list-disc list-inside">
                    {result.swot.weaknesses.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                {/* Opportunities */}
                <div className="bg-[#090a0d] border-l-3 border-[#a8ff35]/50 rounded-2xl p-5 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-[#a8ff35] font-mono tracking-wider">Opportunities [O]</span>
                  <ul className="space-y-2 text-xs text-zinc-400 list-disc list-inside">
                    {result.swot.opportunities.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                {/* Threats */}
                <div className="bg-[#090a0d] border-l-3 border-amber-500/50 rounded-2xl p-5 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-amber-400 font-mono tracking-wider">Threats [T]</span>
                  <ul className="space-y-2 text-xs text-zinc-400 list-disc list-inside">
                    {result.swot.threats.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 4. OPTIMIZATION RECOMMENDATIONS DECK */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <CheckCircle2 className="w-5.5 h-5.5 text-[#a8ff35]" />
                  Deployable Optimization Procedures
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Trigger automated sub-agents directly from this panel to execute strategies formulated by the core auditor.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {result.optimizations.map((task, idx) => {
                  const isDeployed = !!deployedTasks[idx];
                  const isDeploying = deployingTaskIndex === idx;

                  return (
                    <div 
                      key={idx}
                      className="bg-[#101115] border border-white/5 hover:border-[#a8ff35]/35 rounded-[32px] p-6.5 flex flex-col justify-between transition duration-300 shadow-xl group relative overflow-hidden"
                    >
                      {/* Floating glow */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#a8ff35]/2 rounded-full pointer-events-none group-hover:bg-[#a8ff35]/5" />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-[#a8ff35] bg-[#a8ff35]/5 border border-[#a8ff35]/12 px-2.5 py-1 rounded-full font-mono">
                            {task.agent}
                          </span>
                          
                          <div className="flex gap-2">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase font-mono bg-zinc-800/60 px-2 py-0.5 rounded-md">
                              IMPACT: {task.impact}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase font-mono bg-zinc-800/60 px-2 py-0.5 rounded-md">
                              EFFORT: {task.effort}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="text-base font-bold text-white group-hover:text-[#a8ff35] transition duration-200">
                            {task.title}
                          </h3>
                          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                            {task.description}
                          </p>
                        </div>

                        <div className="bg-[#090a0d] border border-white/3 rounded-xl p-3 flex items-center justify-between text-[11px] font-mono select-none">
                          <span className="text-zinc-500 uppercase">SUGGESTED TARGET:</span>
                          <span className="text-white font-bold">{task.suggestedAction}</span>
                        </div>
                      </div>

                      <div className="pt-6">
                        <Button
                          disabled={isDeployed || isDeploying}
                          onClick={() => deployAgentTask(idx, task)}
                          className={`w-full justify-center text-xs py-4.5 rounded-2xl font-bold tracking-wider ${
                            isDeployed 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isDeploying 
                                ? 'bg-[#a8ff35]/20 text-white cursor-not-allowed'
                                : 'bg-[#a8ff35] hover:bg-[#97ea28] text-black shadow-md shadow-[#a8ff35]/5'
                          }`}
                        >
                          {isDeployed ? (
                            <div className="flex items-center gap-1.5 justify-center">
                              <Check className="w-4 h-4 text-emerald-400" />
                              OPTIMIZATION ACTIVE
                            </div>
                          ) : isDeploying ? (
                            <div className="flex items-center gap-2 justify-center">
                              <RefreshCw className="w-4 h-4 animate-spin text-[#a8ff35]" />
                              DISPATCHING Core...
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 justify-center">
                              <Cpu className="w-4 h-4 text-black" />
                              DEPLOY RECOMMENDED ACTION
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
