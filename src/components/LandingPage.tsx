import React from 'react';
import { BrandingHexIcon } from './CustomIcons';
import { Shield, Zap, Sparkles, ChevronRight, BarChart3, TrendingUp, Layers, Bot, ExternalLink, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
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
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#a8ff35]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-mono uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#a8ff35]" />
              The Autonomous Affiliate Platform
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
              Scale your content with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a8ff35] to-[#4ade80]">AI Agents</span>.
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              Automate SEO clusters, publish to WordPress, generate visual pins, and match high-ticket affiliate offers instantly from a single command center.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a 
                href={window.location.origin} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold text-sm transition-all group"
              >
                <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                Open App in New Tab
              </a>
              <button 
                onClick={handleGuestLogin}
                disabled={guestLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#a8ff35]/10 hover:bg-[#a8ff35]/20 text-[#a8ff35] border border-[#a8ff35]/30 font-bold text-sm transition-all"
              >
                {guestLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
                Developer Access
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 border-t border-white/5 bg-[#090b10]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white tracking-tight">Intelligence at Scale</h2>
            <p className="text-zinc-400 mt-4 max-w-xl mx-auto">Deploy specialized sub-agents to handle your content pipeline from research to revenue.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Layers, title: 'SEO Clustering', desc: 'Automatically map and generate hierarchical keyword silos for maximum site authority.' },
              { icon: Bot, title: 'Autonomous Publishing', desc: 'Direct webhook integration with WordPress. Drafts, images, and formatting handled seamlessly.' },
              { icon: BarChart3, title: 'Intel Digest', desc: 'Paste raw PDF reports or CSV matrices and have AI parse out strategic optimization blueprints.' },
              { icon: Zap, title: 'Offer Matchmaking', desc: 'Connect with high-ticket programs. AI reads your content and slots in the highest converting offers.' },
              { icon: TrendingUp, title: 'Traffic Engine', desc: 'Distribution agents that re-format your pillars into social snippets and interactive modules.' },
              { icon: Shield, title: 'Secure & Sandboxed', desc: 'Runs in isolated containers. Connect your API keys entirely on the client, never stored plainly.' },
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-[32px] bg-[#0c0d12] border border-white/5 hover:border-[#a8ff35]/20 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-[#a8ff35]/10 text-[#a8ff35] flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-32 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[#a8ff35]/5" />
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-6">Ready to scale your affiliate network?</h2>
          <p className="text-lg text-zinc-400 mb-8">Stop writing manually. Start deploying agents today.</p>
          <button 
            onClick={handleLogin}
            className="px-8 py-4 rounded-2xl bg-[#a8ff35] hover:bg-[#97ea28] text-black font-extrabold text-sm tracking-wider shadow-[0_0_40px_rgba(168,255,53,0.3)] transition-all uppercase flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            Launch AffiliateOS <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 border-t border-white/5 text-center text-zinc-500 text-xs">
        <p>AffiliateOS &copy; {new Date().getFullYear()}. Engineered for production scale.</p>
      </footer>
    </div>
  );
}
