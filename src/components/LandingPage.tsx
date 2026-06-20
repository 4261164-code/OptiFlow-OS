import React from 'react';
import { BrandingHexIcon } from './CustomIcons';
import { Shield, Activity, Cpu, ChevronRight, BarChart3, TrendingUp, Layers, Bot, ExternalLink, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  handleLogin: () => void;
  handleGuestLogin: () => void;
  guestLoading: boolean;
  authError: string | null;
}

export function LandingPage({ handleLogin, handleGuestLogin, guestLoading, authError }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#040507] text-zinc-200 font-sans selection:bg-[#a8ff35]/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#040507]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold tracking-tight text-lg">
            <div className="w-8 h-8 bg-[#a8ff35]/10 flex items-center justify-center rounded-lg border border-[#a8ff35]/20 shadow-[0_0_10px_rgba(168,255,53,0.1)]">
              <BrandingHexIcon className="w-5 h-5 text-[#a8ff35]" />
            </div>
            AffiliateOS
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogin}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block"
            >
              Sign In
            </button>
            <button 
              onClick={handleGuestLogin}
              disabled={guestLoading}
              className="text-xs font-bold uppercase tracking-wider bg-[#a8ff35] hover:bg-[#97ea28] text-black px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            >
              {guestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Start Building"}
            </button>
          </div>
        </div>
      </nav>

      {/* Auth Error Overlay if any */}
      {authError && (
        <div className="pt-24 px-6 max-w-3xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-300">Authentication Issue</p>
              <p className="mt-1 opacity-90">{authError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-40 pb-28 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[#a8ff35]/15 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-5xl mx-auto space-y-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-[10px] font-mono uppercase tracking-[0.2em]">
              <Cpu className="w-3.5 h-3.5 text-[#a8ff35]" strokeWidth={2.5} />
              Autonomous Infrastructure v4.2
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold text-white tracking-[-0.04em] leading-[0.95]">
              The Operating System for <span className="text-black bg-[#a8ff35] px-4 rounded-2xl">Affiliates</span>.
            </h1>
            
            <p className="text-xl md:text-2xl text-zinc-400 leading-relaxed max-w-3xl mx-auto font-light tracking-tight">
              Scale content clusters, publish autonomously, and match high-ticket offers with specialized AI agents.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
              <a 
                href={window.location.origin} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold text-base transition-all group shadow-2xl shadow-white/10"
              >
                <ExternalLink className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.5} />
                Open Dashboard
              </a>
              <button 
                onClick={handleGuestLogin}
                disabled={guestLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-[#a8ff35]/5 hover:bg-[#a8ff35]/10 text-[#a8ff35] border border-[#a8ff35]/20 font-bold text-base transition-all hover:border-[#a8ff35]/40"
              >
                {guestLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                ) : (
                  <UserCheck className="w-5 h-5" strokeWidth={2.5} />
                )}
                Developer Access
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 border-t border-white/5 bg-[#06080b]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">Built for speed, engineered for scale.</h2>
              <p className="text-zinc-500 mt-6 text-lg">Deploy specialized sub-agents to handle your content pipeline from research to revenue.</p>
            </div>
            <div className="flex items-center gap-2 text-[#a8ff35] font-mono text-xs uppercase tracking-widest bg-[#a8ff35]/5 px-4 py-2 rounded-lg border border-[#a8ff35]/10">
              <Activity className="w-4 h-4 animate-pulse" strokeWidth={2.5} />
              Systems Online
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Layers, title: 'SEO Clustering', desc: 'Automatically map and generate hierarchical keyword silos for maximum site authority.' },
              { icon: Bot, title: 'Autonomous Publishing', desc: 'Direct webhook integration with WordPress. Drafts, images, and formatting handled seamlessly.' },
              { icon: BarChart3, title: 'Intel Digest', desc: 'Paste raw PDF reports or CSV matrices and have AI parse out strategic optimization blueprints.' },
              { icon: Activity, title: 'Offer Matchmaking', desc: 'Connect with high-ticket programs. AI reads your content and slots in the highest converting offers.' },
              { icon: TrendingUp, title: 'Traffic Engine', desc: 'Distribution agents that re-format your pillars into social snippets and interactive modules.' },
              { icon: Shield, title: 'Secure Vault', desc: 'Runs in isolated containers. Connect your API keys entirely on the client, never stored plainly.' },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -8 }}
                className="p-10 rounded-[40px] bg-[#0e1117] border border-white/10 hover:border-[#a8ff35]/40 transition-all hover:bg-[#12161f] group relative overflow-hidden shadow-xl"
              >
                <div className="w-16 h-16 rounded-3xl bg-[#a8ff35]/10 text-[#a8ff35] flex items-center justify-center mb-8 border border-[#a8ff35]/20 group-hover:bg-[#a8ff35]/20 transition-colors shadow-[0_0_15px_rgba(168,255,53,0.1)]">
                  <feature.icon className="w-8 h-8" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight group-hover:text-[#a8ff35] transition-colors">{feature.title}</h3>
                <p className="text-zinc-400 text-base leading-relaxed font-medium">{feature.desc}</p>
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                  <feature.icon className="w-24 h-24 text-[#a8ff35]" strokeWidth={2.5} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-y border-white/5 bg-[#040507]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: 'Active Clusters', value: '4.2k+' },
            { label: 'Pages Published', value: '180k' },
            { label: 'Conversion Lift', value: '34%' },
            { label: 'Agent Uptime', value: '99.9%' },
          ].map((stat, i) => (
            <div key={i} className="space-y-2">
              <div className="text-4xl font-bold text-white tracking-tighter">{stat.value}</div>
              <div className="text-zinc-400 font-mono text-[11px] uppercase tracking-[0.25em]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-40 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#a8ff35]/5" />
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight mb-10">Ready to automate your publishing network?</h2>
          <button 
            onClick={handleLogin}
            className="px-12 py-6 rounded-3xl bg-[#a8ff35] hover:bg-[#97ea28] text-black font-extrabold text-lg tracking-tight shadow-[0_20px_50px_rgba(168,255,53,0.3)] transition-all flex items-center gap-3 mx-auto disabled:opacity-50 group hover:scale-105 active:scale-95"
          >
            Launch AffiliateOS <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
          </button>
          <p className="text-zinc-500 mt-10 font-mono text-xs uppercase tracking-[0.3em]">No credit card required for developer tier</p>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 border-t border-white/5 text-center text-zinc-500 text-xs">
        <p>AffiliateOS &copy; {new Date().getFullYear()}. Engineered for production scale.</p>
      </footer>
    </div>
  );
}
