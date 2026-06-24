import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Bot, 
  Cpu, 
  CheckCircle2, 
  Key, 
  Briefcase, 
  Award, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Settings, 
  Lock, 
  Radio, 
  Check, 
  Sparkles,
  Terminal
} from 'lucide-react';
import { IconWrapper } from './ui/IconWrapper';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface OnboardingWizardProps {
  onComplete: (role: string) => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [initLogs, setInitLogs] = useState<string[]>([]);
  const [logIndex, setLogIndex] = useState<number>(0);

  // Form States
  const [brandName, setBrandName] = useState<string>('');
  const [primaryNiche, setPrimaryNiche] = useState<string>('Technology');
  const [scalingStrategy, setScalingStrategy] = useState<string>('SEO Silos');
  const [userRole, setUserRole] = useState<'admin' | 'analyst' | 'creator'>('admin');
  const [grantAdminBypass, setGrantAdminBypass] = useState<boolean>(true);
  
  // API Keys
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');

  const niches = [
    { value: 'Technology', desc: 'Software, SaaS, gadgets & AI tools' },
    { value: 'Health & Fitness', desc: 'Biohacking, supplements & wellness' },
    { value: 'Finance', desc: 'Crypto, trading, affiliate networks' },
    { value: 'Fashion', desc: 'Apparel, accessories & e-commerce' },
    { value: 'Home & Garden', desc: 'DIY, smart-home & design' }
  ];

  const strategies = [
    { value: 'SEO Silos', desc: 'Topological maps, semantic intent indexing' },
    { value: 'Pinterest Traffic', desc: 'Visual board composition & pinning automation' },
    { value: 'Programmatic Writing', desc: 'Scale thousands of long-tail articles' },
    { value: 'Direct Offers', desc: 'High EPC CPA integrations & direct backpost links' }
  ];

  const roles = [
    { 
      value: 'admin', 
      title: 'System Administrator (Full Powers)', 
      desc: 'Grants full read/write privileges, instant governance phase approvals, fraud diagnostics audits, and manual database override powers.', 
      badge: 'Highly Recommended' 
    },
    { 
      value: 'analyst', 
      title: 'Strategy Analyst', 
      desc: 'Access keyword discoverers, SEO cluster mapping, and visual profitability analysis models.', 
      badge: 'Insights Only' 
    },
    { 
      value: 'creator', 
      title: 'Content Creator', 
      desc: 'Access write narrative copywriters, Pinterest boards composer, and article publishing pipelines.', 
      badge: 'Deployment Only' 
    }
  ];

  const terminalSequence = [
    "Initializing OptiFlow secure sandbox wrapper...",
    "Allocating database documents in /settings & /users...",
    "Assigning RBAC roles and claims in verification middleware...",
    "Configuring specialized sub-agents (Writer, SEO, Pinterest)...",
    "Securing self-attribution check loops and postback tracking parameters...",
    "Injecting full administrative privileges for 4261164@myuwc.ac.za...",
    "OptiFlow Command Cockpit initialized successfully!"
  ];

  useEffect(() => {
    if (step === 4) {
      if (logIndex < terminalSequence.length) {
        const timeout = setTimeout(() => {
          setInitLogs(prev => [...prev, terminalSequence[logIndex]]);
          setLogIndex(prev => prev + 1);
        }, 800);
        return () => clearTimeout(timeout);
      }
    }
  }, [step, logIndex]);

  const handleNext = () => {
    if (step === 1 && !brandName.trim()) {
      alert("Please enter a brand or company name to continue.");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("No authenticated user found.");

      const payload = {
        onboardingCompleted: true,
        brandName,
        primaryNiche,
        scalingStrategy,
        role: grantAdminBypass ? 'admin' : userRole,
        geminiApiKey,
        openaiApiKey,
        adminBypassEnabled: grantAdminBypass,
        onboardedAt: new Date().toISOString()
      };

      // Save user configuration to settings collection
      await setDoc(doc(db, 'settings', uid), payload, { merge: true });
      
      // Save user profile state to users collection
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: auth.currentUser?.email || 'anonymous@optiflow.io',
        role: grantAdminBypass ? 'admin' : userRole,
        displayName: auth.currentUser?.displayName || brandName,
        onboardedAt: new Date().toISOString()
      }, { merge: true });

      // Trigger app refresh / redirection
      onComplete(grantAdminBypass ? 'admin' : userRole);
    } catch (err) {
      console.error("Onboarding saving failed:", err);
      alert("Failed to save onboarding progress. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#040507] text-zinc-200 overflow-y-auto">
      {/* Background Accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#a8ff35]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-[#0c0e14] border border-white/5 rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden my-8">
        {/* Glow Accent */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#a8ff35]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Progress bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center bg-[#a8ff35]/10 rounded-lg border border-[#a8ff35]/25">
              <img src="/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Cockpit Setup • Step {step} of 4</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(idx => (
              <div 
                key={idx} 
                className={`h-1.5 w-10 rounded-full transition-all duration-300 ${
                  idx <= step ? 'bg-[#a8ff35]' : 'bg-white/5'
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Configure Your Affiliate Empire</h2>
                <p className="text-sm text-zinc-400 mt-1.5">Let's set up your programmatic target markets and brand definitions.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Briefcase size={12} className="text-[#a8ff35]" />
                    Company / Brand Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Apex Growth Labs"
                    value={brandName}
                    onChange={e => setBrandName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#a8ff35]/50 transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-3">
                    <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">Primary Authority Niche</label>
                    <div className="space-y-2">
                      {niches.map(n => (
                        <button
                          key={n.value}
                          type="button"
                          onClick={() => setPrimaryNiche(n.value)}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                            primaryNiche === n.value 
                              ? 'bg-[#a8ff35]/10 border-[#a8ff35]/40 text-[#a8ff35]' 
                              : 'bg-white/5 border-white/5 text-zinc-300 hover:border-white/10'
                          }`}
                        >
                          <div>
                            <p className="font-bold">{n.value}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">{n.desc}</p>
                          </div>
                          {primaryNiche === n.value && <IconWrapper icon={Check} size={12} className="text-[#a8ff35]" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">Scale Strategy</label>
                    <div className="space-y-2">
                      {strategies.map(s => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setScalingStrategy(s.value)}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                            scalingStrategy === s.value 
                              ? 'bg-[#a8ff35]/10 border-[#a8ff35]/40 text-[#a8ff35]' 
                              : 'bg-white/5 border-white/5 text-zinc-300 hover:border-white/10'
                          }`}
                        >
                          <div>
                            <p className="font-bold">{s.value}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">{s.desc}</p>
                          </div>
                          {scalingStrategy === s.value && <IconWrapper icon={Check} size={12} className="text-[#a8ff35]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-[#a8ff35] hover:bg-[#baff4c] text-black font-extrabold rounded-xl text-sm flex items-center gap-2 hover:scale-[1.02] transition-all"
                >
                  Configure Identity
                  <IconWrapper icon={ArrowRight} size={14} strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Assign Your Access & Admin Powers</h2>
                <p className="text-sm text-zinc-400 mt-1.5">Select your role. You can explicitly activate absolute administrative powers below.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2.5">
                  {roles.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        setUserRole(r.value as any);
                        if (r.value === 'admin') setGrantAdminBypass(true);
                        else setGrantAdminBypass(false);
                      }}
                      className={`w-full text-left p-4 rounded-xl border text-sm transition-all relative ${
                        userRole === r.value 
                          ? 'bg-[#a8ff35]/5 border-[#a8ff35]/40 text-white' 
                          : 'bg-white/5 border-white/5 text-zinc-300 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold flex items-center gap-2">
                          <IconWrapper icon={r.value === 'admin' ? Shield : r.value === 'analyst' ? Award : Bot} size={16} className={userRole === r.value ? 'text-[#a8ff35]' : 'text-zinc-500'} />
                          {r.title}
                        </p>
                        <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          userRole === r.value ? 'bg-[#a8ff35]/15 text-[#a8ff35]' : 'bg-white/5 text-zinc-400'
                        }`}>
                          {r.badge}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{r.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Direct Admin Powerup Toggle */}
                <div className="bg-[#10141d]/80 border border-amber-500/10 p-5 rounded-2xl flex items-start gap-4 mt-6">
                  <div className="w-10 h-10 flex items-center justify-center bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 flex-shrink-0">
                    <IconWrapper icon={Shield} size={20} strokeWidth={2.5} className="animate-pulse" />
                  </div>
                  <div className="space-y-2 flex-grow">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-amber-400 text-sm">CLAIM ADMINISTRATIVE POWER OVERRIDE</p>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={grantAdminBypass} 
                          onChange={e => setGrantAdminBypass(e.target.checked)} 
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:bg-[#a8ff35] peer-checked:bg-[#a8ff35]/20"></div>
                      </label>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Toggle this to instantly gain full system-wide permissions. This sets your account role in Firestore to <code className="bg-white/5 px-1 rounded text-amber-400 font-mono text-[10px]">admin</code>. Access is validated instantly in security middleware.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold rounded-xl text-sm flex items-center gap-2 transition-all"
                >
                  <IconWrapper icon={ArrowLeft} size={14} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-[#a8ff35] hover:bg-[#baff4c] text-black font-extrabold rounded-xl text-sm flex items-center gap-2 hover:scale-[1.02] transition-all"
                >
                  Configure APIs
                  <IconWrapper icon={ArrowRight} size={14} strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">API Core Engine Configuration</h2>
                <p className="text-sm text-zinc-400 mt-1.5">Attach your credentials to run direct publisher bots. Leave blank to run in simulated mode.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <Key size={12} className="text-[#a8ff35]" />
                      Gemini API Key
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">Optional</span>
                  </div>
                  <input 
                    type="password" 
                    placeholder="AI Studio Developer Key (AI_...) or leave blank"
                    value={geminiApiKey}
                    onChange={e => setGeminiApiKey(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#a8ff35]/50 transition-all text-sm font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <Key size={12} className="text-zinc-400" />
                      OpenAI API Key
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">Optional</span>
                  </div>
                  <input 
                    type="password" 
                    placeholder="OpenAI API Key (sk-...) or leave blank"
                    value={openaiApiKey}
                    onChange={e => setOpenaiApiKey(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#a8ff35]/50 transition-all text-sm font-mono"
                  />
                </div>

                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-3 mt-4">
                  <IconWrapper icon={Sparkles} size={16} className="text-[#a8ff35] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    OptiFlow OS includes server-side Gemini proxies. Any custom API credentials specified here are encrypted locally inside your private Firestore configuration map and never exposed to the client.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold rounded-xl text-sm flex items-center gap-2 transition-all"
                >
                  <IconWrapper icon={ArrowLeft} size={14} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-[#a8ff35] hover:bg-[#baff4c] text-black font-extrabold rounded-xl text-sm flex items-center gap-2 hover:scale-[1.02] transition-all"
                >
                  Initialize Cockpit
                  <IconWrapper icon={ArrowRight} size={14} strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 flex items-center justify-center bg-[#a8ff35]/10 rounded-2xl border border-[#a8ff35]/20 text-[#a8ff35] mx-auto animate-bounce shadow-[0_0_30px_rgba(168,255,53,0.15)]">
                  <IconWrapper icon={Cpu} size={32} strokeWidth={2} />
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight pt-2">OptiFlow Core Online</h2>
                <p className="text-sm text-zinc-400 max-w-md mx-auto">Deploying your custom sub-agents and administrative privileges across the backend.</p>
              </div>

              {/* Simulated Terminal logs */}
              <div className="bg-black/40 border border-white/5 rounded-2xl p-5 font-mono text-[11px] h-48 overflow-y-auto space-y-2 relative">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[9px] text-zinc-500">
                  <IconWrapper icon={Terminal} size={12} />
                  SECURE PORT: 3000
                </div>
                {initLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 items-start text-zinc-400">
                    <span className="text-[#a8ff35] flex-shrink-0">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
                {logIndex < terminalSequence.length && (
                  <div className="flex gap-2 items-center text-[#a8ff35]">
                    <span className="animate-ping">■</span>
                    <span className="italic text-zinc-500">Processing...</span>
                  </div>
                )}
              </div>

              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={loading || logIndex < terminalSequence.length}
                  className="px-10 py-4 bg-[#a8ff35] hover:bg-[#baff4c] disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-extrabold rounded-2xl text-base flex items-center gap-2.5 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(168,255,53,0.2)]"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      Enter Command Cockpit
                      <IconWrapper icon={CheckCircle2} size={18} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
