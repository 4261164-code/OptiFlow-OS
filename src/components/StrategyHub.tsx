import React, { useState } from 'react';
import { 
  Shield, 
  TrendingUp, 
  Search, 
  Zap, 
  Target, 
  Layers, 
  ArrowRight, 
  Cpu, 
  ChevronRight, 
  Sparkles,
  BarChart3,
  Globe,
  RefreshCw,
  AlertCircle,
  FileText,
  Activity
} from 'lucide-react';
import { Button } from './ui';
import { apiFetch } from '../lib/auth';
import { motion, AnimatePresence } from 'motion/react';

interface StrategyBlueprint {
  summary: string;
  keyStrategiesToAdopt: Array<{
    name: string;
    whyItWorks: string;
    ourImprovements: string;
  }>;
  executionBlueprint: Array<{
    step: number;
    task: string;
    targetAgent: string;
  }>;
  impactAnalysis: {
    timeToImpact: string;
    revenueScore: number;
  };
}

export function StrategyHub() {
  const [keyword, setKeyword] = useState('');
  const [domain, setDomain] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [isAdopting, setIsAdopting] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [blueprint, setBlueprint] = useState<StrategyBlueprint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1); // 1: Input, 2: Audit, 3: Blueprint

  const handleRunAudit = async () => {
    if (!keyword || !domain) {
      setError("Please specify both a target keyword and a competitor domain.");
      return;
    }

    setIsAuditing(true);
    setError(null);
    setAuditResult(null);
    setBlueprint(null);
    setActiveStep(1);

    try {
      const response = await apiFetch('/api/strategy/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, domain })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Audit failed.");

      setAuditResult(data.audit);
      setActiveStep(2);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setIsAuditing(false);
    }
  };

  const handleAdoptStrategy = async () => {
    if (!auditResult) return;

    setIsAdopting(true);
    setError(null);

    try {
      const response = await apiFetch('/api/strategy/adopt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          auditData: auditResult,
          marketContext: `Dominating the "${keyword}" niche by identifying and leapfrogging ${domain}'s current strategy.`
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Adoption planning failed.");

      setBlueprint(data.blueprint);
      setActiveStep(3);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setIsAdopting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header Banner */}
      <div className="relative p-10 rounded-[40px] bg-[#090b10] border border-white/5 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono font-bold uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" />
              Intelligence Phase: {activeStep === 1 ? 'Discovery' : activeStep === 2 ? 'Analysis' : 'Execution'}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Strategy Adoption Hub
            </h1>
            <p className="text-zinc-400 max-w-2xl text-base leading-relaxed">
              Identify top-performing competitor strategies and autonomously adopt what works. 
              Our agents will analyze market gaps and provision a leapfrog execution blueprint.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mb-1">Success Propensity</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`h-1.5 w-6 rounded-full ${i <= 4 ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-zinc-800'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="mt-12 flex items-center gap-2 max-w-sm">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs transition-all duration-300 ${
                activeStep === step 
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                  : activeStep > step ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-900 text-zinc-600 border border-white/5'
              }`}>
                {step}
              </div>
              {step < 3 && <div className="flex-1 h-px bg-zinc-800" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Input Pane */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0b0e14] border border-white/5 rounded-[32px] p-8 shadow-xl relative group">
            <div className="absolute top-4 right-4 text-white/5 group-hover:text-blue-500/10 transition-colors">
              <Target className="w-12 h-12" />
            </div>
            
            <h2 className="text-lg font-bold text-white mb-6 font-mono tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-500" />
              DISCOVERY INPUT
            </h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1 font-bold">Target Keyword Cluster</label>
                <div className="relative">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. portable solar generators"
                    className="w-full bg-[#05070a] border border-white/5 focus:border-blue-500/50 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none transition-all placeholder:text-zinc-700"
                  />
                  <Zap className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1 font-bold">Competitor Domain</label>
                <div className="relative">
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. competitorsite.com"
                    className="w-full bg-[#05070a] border border-white/5 focus:border-blue-500/50 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none transition-all placeholder:text-zinc-700"
                  />
                  <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                </div>
              </div>

              <Button
                onClick={handleRunAudit}
                disabled={isAuditing || !keyword || !domain}
                className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
              >
                {isAuditing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    RUNNING AUDIT...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    START COMPETITOR AUDIT
                  </>
                )}
              </Button>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-4 flex items-start gap-3 text-xs"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          <div className="bg-zinc-900/30 border border-white/5 rounded-[24px] p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              System Status
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Market Crawler', status: 'online' },
                { label: 'Strategy Synthesizer', status: 'ready' },
                { label: 'Blueprint Engine', status: 'idle' }
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 font-mono italic">{s.label}</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[9px] font-bold uppercase">{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Dynamic Content Pane */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <AnimatePresence mode="wait">
            {!auditResult && !isAuditing && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#0b0e14]/50 border border-dashed border-white/10 rounded-[32px] p-20 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-800 mb-2">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-zinc-600">Awaiting Intelligence Feed</h3>
                <p className="text-sm text-zinc-700 max-w-sm">Enter a keyword and a competitor domain to start the autonomous strategy audit.</p>
              </motion.div>
            )}

            {isAuditing && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="bg-[#0b0e14] border border-white/5 rounded-[32px] p-20 flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Cpu className="w-8 h-8 text-blue-500 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-white font-mono tracking-tighter">AGENT DISPATCHED</p>
                  <p className="text-sm text-zinc-500 font-mono animate-pulse">Parsing Competitor DOM and SEM data matrices...</p>
                </div>
              </motion.div>
            )}

            {auditResult && !blueprint && (
              <motion.div 
                key="audit"
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-[#0b0e14] border border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[60px]" />
                  
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white">{auditResult.domain}</h3>
                        <p className="text-xs text-zinc-500 font-mono">Competitor Intelligence Profile</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-500 font-mono mb-1 uppercase tracking-widest">Growth Index</div>
                      <div className="text-2xl font-black text-blue-500">{auditResult.domainAuthority || 0}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Zap className="w-3 h-3 text-blue-500" /> Primary SEO Strategy
                      </h4>
                      <p className="text-white text-sm leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                        {auditResult.seoStrategy}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Target className="w-3 h-3 text-blue-500" /> Organic Tractions
                      </h4>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center h-[calc(100%-1.75rem)]">
                        <div className="text-3xl font-black text-white mb-1">{auditResult.organicTraffic}</div>
                        <p className="text-xs text-zinc-500">Estimated monthly reachable visits</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Layers className="w-3 h-3 text-blue-500" /> Core Ranking Clusters
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {auditResult.contentClusters?.map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-xl border border-white/5">
                          <div className="text-xs font-bold text-zinc-300">{c.clusterName}</div>
                          <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Score: {c.performanceScore}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-10 pt-8 border-t border-white/5">
                    <Button
                      onClick={handleAdoptStrategy}
                      disabled={isAdopting}
                      className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-6 rounded-2xl flex items-center justify-center gap-3 group text-sm tracking-widest shadow-lg shadow-blue-500/20"
                    >
                      {isAdopting ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          SYNTHESIZING ADOPTION BLUEPRINT...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                          ADOPT AND LEAPFROG STRATEGY
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {blueprint && (
              <motion.div 
                key="blueprint"
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {/* Impact HUD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#0b0e14] border border-white/5 rounded-[28px] p-6 flex flex-col justify-between">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">Time to Impact</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-white">{blueprint.impactAnalysis.timeToImpact}</span>
                      <span className="text-xs text-blue-500 font-mono font-bold uppercase">Estimated</span>
                    </div>
                  </div>
                  <div className="bg-[#0b0e14] border border-white/5 rounded-[28px] p-6 flex flex-col justify-between">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">Revenue Potential</span>
                    <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-black text-emerald-500">{blueprint.impactAnalysis.revenueScore}</span>
                    <span className="text-xs text-zinc-600 font-mono">/ 10</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white text-black rounded-[40px] p-10 space-y-10 shadow-2xl relative overflow-hidden">
                   <div className="absolute -top-20 -right-20 w-80 h-80 bg-black/5 rounded-full blur-[100px]" />
                   
                   <div className="space-y-4">
                     <div className="flex items-center gap-3">
                       <span className="px-3 py-1 bg-black text-white text-[10px] font-bold rounded-full font-mono">CONFIDENTIAL BLUEPRINT</span>
                       <div className="h-px flex-1 bg-black/10" />
                     </div>
                     <h3 className="text-3xl font-black tracking-tighter leading-tight pr-10">
                       {blueprint.summary}
                     </h3>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {blueprint.keyStrategiesToAdopt.map((s, i) => (
                       <div key={i} className="bg-black/5 p-6 rounded-[24px] space-y-3 border border-black/5">
                         <h4 className="font-black text-sm uppercase tracking-tight">{s.name}</h4>
                         <p className="text-[11px] text-zinc-700 leading-relaxed"><span className="font-bold">Logic:</span> {s.whyItWorks}</p>
                         <p className="text-[11px] text-green-700 font-bold leading-relaxed bg-green-50 p-2 rounded-lg border border-green-100">
                           <Sparkles className="w-3 h-3 inline mr-1" /> {s.ourImprovements}
                         </p>
                       </div>
                     ))}
                   </div>

                   <div className="space-y-6">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 flex items-center gap-2">
                       <Activity className="w-4 h-4" /> Autonomous Execution Pipeline
                     </h4>
                     <div className="space-y-3">
                       {blueprint.executionBlueprint.map((step, i) => (
                         <div key={i} className="flex items-center gap-4 p-5 bg-black/[0.03] rounded-2xl border border-black/5 group hover:bg-black font-medium transition duration-300">
                           <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-mono font-bold text-xs group-hover:bg-blue-500">
                             {step.step}
                           </div>
                           <div className="flex-1 text-sm group-hover:text-white transition-colors">{step.task}</div>
                           <div className="text-[10px] font-bold px-3 py-1 bg-black/10 rounded-full group-hover:bg-white/10 group-hover:text-blue-400 transition-all font-mono">
                             {step.targetAgent}
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>

                   <div className="pt-6">
                     <Button className="w-full bg-black text-white hover:bg-zinc-800 font-black py-7 rounded-[26px] flex items-center justify-center gap-3 text-sm tracking-[0.2em] shadow-xl">
                       PROVISION SYSTEM EXECUTION
                       <ChevronRight className="w-5 h-5" />
                     </Button>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
