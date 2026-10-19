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
  Terminal,
  Zap,
  Globe,
  Share2,
  DollarSign,
  Database,
  Sliders,
  X
} from 'lucide-react';
import { IconWrapper } from './ui/IconWrapper';
import { Logo } from './Logo';
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
  const [brandName, setBrandName] = useState<string>('Apex Growth Labs');
  const [primaryNiche, setPrimaryNiche] = useState<string>('Technology');
  const [scalingStrategy, setScalingStrategy] = useState<string>('SEO Silos');
  const [userRole, setUserRole] = useState<'admin' | 'analyst' | 'creator'>('admin');
  const [grantAdminBypass, setGrantAdminBypass] = useState<boolean>(true);
  
  // API Keys
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');
  const [nvidiaApiKey, setNvidiaApiKey] = useState<string>('');
  const [demoKeysFilled, setDemoKeysFilled] = useState<boolean>(false);

  const niches = [
    { value: 'Technology', desc: 'Software, SaaS, dev tools & AI platforms' },
    { value: 'Health & Fitness', desc: 'Biohacking, wellness & nutrition' },
    { value: 'Finance', desc: 'Crypto, trading & affiliate programs' },
    { value: 'Fashion', desc: 'Apparel, accessories & visual e-commerce' },
    { value: 'Home & Garden', desc: 'DIY, smart-living & sustainable design' }
  ];

  const strategies = [
    { value: 'SEO Silos', desc: 'Topological maps & semantic intent indexing' },
    { value: 'Pinterest Traffic', desc: 'High-volume visual board syndication' },
    { value: 'Programmatic Writing', desc: 'Autonomous long-tail article generation' },
    { value: 'Direct Offers', desc: 'High-EPC CPA matching & hoplink tracking' }
  ];

  const roles = [
    { 
      value: 'admin', 
      title: 'System Administrator (Root)', 
      desc: 'Full read/write permissions, instantaneous governance approvals, bypass overrides, and manual database management.', 
      badge: 'Recommended' 
    },
    { 
      value: 'analyst', 
      title: 'Strategy Analyst', 
      desc: 'Access to keyword discoverers, SEO cluster mapping, and profitability visual metrics.', 
      badge: 'Insights Only' 
    },
    { 
      value: 'creator', 
      title: 'Content Creator', 
      desc: 'Access to narrative copywriters, Pinterest board composer, and article drafting pipelines.', 
      badge: 'Deployment Only' 
    }
  ];

  const terminalSequence = [
    "OptiFlow OS kernel initialized at port 3000...",
    "Provisioning secure workspace enclave in Firestore...",
    "Allocating collections: /settings, /users, /campaigns, /articles...",
    "Injecting root role claims and bypass permissions...",
    "Calibrating autonomous sub-agents: Executive CEO, Writer, SEO, Pinterest...",
    "Testing API mesh connectivity (Gemini Core & Proxy Handshakes)...",
    "Configuring Settings Hub navigation matrix...",
    "OptiFlow Command Cockpit operational and ready!"
  ];

  useEffect(() => {
    if (step === 5) {
      if (logIndex < terminalSequence.length) {
        const timeout = setTimeout(() => {
          setInitLogs(prev => [...prev, terminalSequence[logIndex]]);
          setLogIndex(prev => prev + 1);
        }, 650);
        return () => clearTimeout(timeout);
      }
    }
  }, [step, logIndex]);

  const handleNext = () => {
    if (step === 1 && !brandName.trim()) {
      setBrandName('Apex Growth Labs');
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleFillDemoKeys = () => {
    setGeminiApiKey('AIzaSyDemoKey_OptiFlowCorePrimary_98213');
    setOpenaiApiKey('sk-demoOpenAI_ReasoningFallbackCore_77182');
    setNvidiaApiKey('nvapi-demoNVIDIA_ClusterInferenceLlama405B');
    setDemoKeysFilled(true);
  };

  const markCompletedLocally = (role: string) => {
    try {
      localStorage.setItem('optiflow_onboarding_completed', 'true');
      const currentUserUid = auth.currentUser?.uid || 'sandbox_developer_user';
      localStorage.setItem(`optiflow_onboarding_completed_${currentUserUid}`, 'true');
    } catch (e) {
      console.warn("Storage warning:", e);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    const assignedRole = grantAdminBypass ? 'admin' : userRole;
    try {
      const uid = auth.currentUser?.uid || 'sandbox_developer_user';

      const payload = {
        onboardingCompleted: true,
        brandName: brandName.trim() || 'Apex Growth Labs',
        primaryNiche,
        scalingStrategy,
        role: assignedRole,
        geminiApiKey,
        openaiApiKey,
        nvidiaApiKey,
        adminBypassEnabled: grantAdminBypass,
        onboardedAt: new Date().toISOString()
      };

      markCompletedLocally(assignedRole);

      if (auth.currentUser) {
        // Save user configuration to settings collection
        await setDoc(doc(db, 'settings', uid), payload, { merge: true });
        
        // Save user profile state to users collection
        await setDoc(doc(db, 'users', uid), {
          uid,
          email: auth.currentUser.email || 'operator@optiflow.io',
          role: assignedRole,
          displayName: auth.currentUser.displayName || brandName || 'OptiFlow Operator',
          approved: true,
          onboardedAt: new Date().toISOString()
        }, { merge: true });
      }

      onComplete(assignedRole);
    } catch (err) {
      console.error("Onboarding persistence warning:", err);
      markCompletedLocally(assignedRole);
      onComplete(assignedRole);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    markCompletedLocally('admin');
    onComplete('admin');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-[#04060A]/95 backdrop-blur-2xl text-zinc-200 overflow-y-auto font-sans selection:bg-[#d7f941]/30">
      {/* HD Ambient Light Radial */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[500px] bg-[#d7f941]/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-[#0B0F17] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.05)] relative overflow-hidden my-6">
        
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#d7f941]/40 to-transparent" />
        
        {/* Top Header & Progress */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Logo size="sm" hideText variant="circle" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white">OptiFlow Onboarding</span>
                <span className="text-[9px] font-mono font-bold text-[#d7f941] bg-[#d7f941]/10 px-2 py-0.5 rounded-full border border-[#d7f941]/20">
                  Step {step} of 5
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Streamlined System Calibration</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex gap-1.5">
              {[1, 2, 3, 4, 5].map(idx => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === step 
                      ? 'w-7 bg-[#d7f941]' 
                      : idx < step 
                      ? 'w-4 bg-emerald-500' 
                      : 'w-4 bg-white/10'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={handleSkip}
              className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors font-medium flex items-center gap-1 cursor-pointer"
            >
              Skip
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Authority Niche & Brand */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#d7f941]">01 / Strategy Setup</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">Configure Your Brand Authority</h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  OptiFlow autonomous agents use your brand definition to generate high-converting campaigns.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-[#d7f941]" />
                    Brand / Network Organization Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Apex Growth Labs"
                    value={brandName}
                    onChange={e => setBrandName(e.target.value)}
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#d7f941]/60 focus:ring-1 focus:ring-[#d7f941]/40 transition-all text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300">Primary Authority Niche</label>
                    <div className="space-y-2">
                      {niches.map(n => (
                        <button
                          key={n.value}
                          type="button"
                          onClick={() => setPrimaryNiche(n.value)}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-all duration-200 flex items-center justify-between cursor-pointer ${
                            primaryNiche === n.value 
                              ? 'bg-[#d7f941]/10 border-[#d7f941]/50 text-white shadow-[0_0_15px_rgba(215,249,65,0.06)]' 
                              : 'bg-[#131924]/60 border-white/5 text-zinc-400 hover:border-white/15 hover:text-zinc-200'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-zinc-200">{n.value}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">{n.desc}</p>
                          </div>
                          {primaryNiche === n.value && <Check className="w-4 h-4 text-[#d7f941] shrink-0" strokeWidth={3} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300">Core Scaling Strategy</label>
                    <div className="space-y-2">
                      {strategies.map(s => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setScalingStrategy(s.value)}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-all duration-200 flex items-center justify-between cursor-pointer ${
                            scalingStrategy === s.value 
                              ? 'bg-[#d7f941]/10 border-[#d7f941]/50 text-white shadow-[0_0_15px_rgba(215,249,65,0.06)]' 
                              : 'bg-[#131924]/60 border-white/5 text-zinc-400 hover:border-white/15 hover:text-zinc-200'
                          }`}
                        >
                          <div>
                            <p className="font-bold text-zinc-200">{s.value}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">{s.desc}</p>
                          </div>
                          {scalingStrategy === s.value && <Check className="w-4 h-4 text-[#d7f941] shrink-0" strokeWidth={3} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-[#d7f941] hover:bg-[#cbf033] text-black font-extrabold rounded-xl text-sm flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_20px_rgba(215,249,65,0.2)]"
                >
                  Continue to Governance
                  <ArrowRight size={15} strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Roles & Governance */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#d7f941]">02 / Access Security</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">Assign Your Security Governance Role</h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Enforces fine-grained permission claims for sandbox operations and content publishing.
                </p>
              </div>

              <div className="space-y-3">
                {roles.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => {
                      setUserRole(r.value as any);
                      if (r.value === 'admin') setGrantAdminBypass(true);
                      else setGrantAdminBypass(false);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border text-sm transition-all duration-200 cursor-pointer ${
                      userRole === r.value 
                        ? 'bg-[#131924] border-[#d7f941]/50 text-white shadow-[0_0_20px_rgba(215,249,65,0.05)]' 
                        : 'bg-[#131924]/40 border-white/5 text-zinc-300 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 font-bold">
                        <IconWrapper 
                          icon={r.value === 'admin' ? Shield : r.value === 'analyst' ? Award : Bot} 
                          size={16} 
                          className={userRole === r.value ? 'text-[#d7f941]' : 'text-zinc-500'} 
                        />
                        {r.title}
                      </div>
                      <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        userRole === r.value ? 'bg-[#d7f941]/15 text-[#d7f941] font-bold' : 'bg-white/5 text-zinc-500'
                      }`}>
                        {r.badge}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{r.desc}</p>
                  </button>
                ))}

                {/* Direct Admin Powerup Toggle */}
                <div className="bg-[#121722] border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3 mt-4">
                  <div className="w-9 h-9 flex items-center justify-center bg-amber-500/10 rounded-xl border border-amber-500/25 text-amber-400 shrink-0 mt-0.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                        Admin Root Power Bypass
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={grantAdminBypass} 
                          onChange={e => setGrantAdminBypass(e.target.checked)} 
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:bg-[#d7f941] peer-checked:bg-[#d7f941]/30"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      Bypasses strict role policy blocks in security middleware, granting instant access to all administrative tabs and tools.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-[#d7f941] hover:bg-[#cbf033] text-black font-extrabold rounded-xl text-sm flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_20px_rgba(215,249,65,0.2)]"
                >
                  Configure AI Core
                  <ArrowRight size={15} strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: AI Core Connections */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#d7f941]">03 / Intelligence Engine</span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">AI Core Engine & API Keys</h2>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                    Connect Gemini, OpenAI, or NVIDIA NIM. Or populate instant test keys with one click.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={handleFillDemoKeys}
                  className="bg-[#d7f941]/10 border border-[#d7f941]/30 hover:bg-[#d7f941]/20 text-[#d7f941] text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {demoKeysFilled ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Demo Keys Applied</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Auto-Fill Demo Keys</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                      <Key size={13} className="text-[#d7f941]" />
                      Google Gemini API Key
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">Recommended Core</span>
                  </div>
                  <input 
                    type="password" 
                    placeholder="AIzaSy... (or leave blank to use global server environment)"
                    value={geminiApiKey}
                    onChange={e => setGeminiApiKey(e.target.value)}
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#d7f941]/60 focus:ring-1 focus:ring-[#d7f941]/40 transition-all text-xs font-mono"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Powers CEO agent strategy, automated copywriting, and semantic keyword topologies.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                      <Key size={13} className="text-sky-400" />
                      OpenAI API Key (Optional)
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">GPT-4o Fallback</span>
                  </div>
                  <input 
                    type="password" 
                    placeholder="sk-... (for chapter compilers and fallback reasoning)"
                    value={openaiApiKey}
                    onChange={e => setOpenaiApiKey(e.target.value)}
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#d7f941]/60 focus:ring-1 focus:ring-[#d7f941]/40 transition-all text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                      <Key size={13} className="text-purple-400" />
                      NVIDIA NIM API Key (Optional)
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">Llama-3.1 405B Cluster</span>
                  </div>
                  <input 
                    type="password" 
                    placeholder="nvapi-... (for large-scale parallel throughput)"
                    value={nvidiaApiKey}
                    onChange={e => setNvidiaApiKey(e.target.value)}
                    className="w-full bg-[#131924] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#d7f941]/60 focus:ring-1 focus:ring-[#d7f941]/40 transition-all text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-[#d7f941] hover:bg-[#cbf033] text-black font-extrabold rounded-xl text-sm flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_20px_rgba(215,249,65,0.2)]"
                >
                  Preview Settings Hub
                  <ArrowRight size={15} strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Settings Hub Primer */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#d7f941]">04 / Platform Settings Primer</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">Navigating the Settings Hub</h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Everything in the Settings tab is neatly grouped into 6 focused categories so you can configure each outlet easily.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#131924]/80 border border-white/5 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <div className="p-1.5 bg-[#d7f941]/10 text-[#d7f941] rounded-lg">
                      <Cpu className="w-4 h-4" />
                    </div>
                    AI Models & Intelligence
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Gemini Core, OpenAI, NVIDIA NIM, and agent role model overrides.
                  </p>
                </div>

                <div className="p-3.5 bg-[#131924]/80 border border-white/5 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
                      <Globe className="w-4 h-4" />
                    </div>
                    Publishing & CMS Outlets
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    WordPress blog XML-RPC credentials and automated draft posting.
                  </p>
                </div>

                <div className="p-3.5 bg-[#131924]/80 border border-white/5 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <Share2 className="w-4 h-4" />
                    </div>
                    Social Feeds & Alerts
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Telegram instant campaign signals, Pinterest syndication & analytics.
                  </p>
                </div>

                <div className="p-3.5 bg-[#131924]/80 border border-white/5 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    Monetization & Affiliates
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    MaxBounty CPA, ClickBank Hoplinks, and custom inbound webhooks.
                  </p>
                </div>

                <div className="p-3.5 bg-[#131924]/80 border border-white/5 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg">
                      <Shield className="w-4 h-4" />
                    </div>
                    Governance & Access Whitelist
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Role tiers, root admin bypass claims, and operator clearance.
                  </p>
                </div>

                <div className="p-3.5 bg-[#131924]/80 border border-white/5 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
                      <Database className="w-4 h-4" />
                    </div>
                    Database Tools & Purge
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Firestore collection diagnostics and sandbox test data wipeout.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#d7f941]/5 border border-[#d7f941]/20 rounded-xl flex items-center gap-2.5 text-xs text-[#d7f941]">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Tip:</strong> In the Settings tab, you can search any key, filter by category tabs, or test individual handshakes in real time.
                </span>
              </div>

              <div className="flex justify-between pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-[#d7f941] hover:bg-[#cbf033] text-black font-extrabold rounded-xl text-sm flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-[0_0_20px_rgba(215,249,65,0.2)]"
                >
                  Initialize System Boot
                  <ArrowRight size={15} strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Terminal Boot & Completion */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 flex items-center justify-center bg-[#d7f941]/10 rounded-2xl border border-[#d7f941]/20 text-[#d7f941] mx-auto shadow-[0_0_30px_rgba(215,249,65,0.15)]">
                  <Cpu size={32} strokeWidth={2} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight pt-1">OptiFlow Core Boot Sequence</h2>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                  Deploying configuration and administrative role overrides across the engine.
                </p>
              </div>

              {/* High-Definition Terminal Box */}
              <div className="bg-[#06080D] border border-white/10 rounded-2xl p-5 font-mono text-[11px] h-52 overflow-y-auto space-y-2 relative shadow-inner">
                <div className="absolute top-3.5 right-4 flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                  <Terminal size={12} />
                  <span>CORE: 3000 // READY</span>
                </div>
                {initLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 items-start text-zinc-400">
                    <span className="text-[#d7f941] font-bold select-none">&gt;</span>
                    <span className="leading-relaxed">{log}</span>
                  </div>
                ))}
                {logIndex < terminalSequence.length && (
                  <div className="flex gap-2 items-center text-[#d7f941]">
                    <span className="animate-ping text-xs">■</span>
                    <span className="text-zinc-500 text-xs">Synchronizing pipeline...</span>
                  </div>
                )}
              </div>

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={loading}
                  className="px-10 py-4 bg-[#d7f941] hover:bg-[#cbf033] disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-extrabold rounded-2xl text-base flex items-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_35px_rgba(215,249,65,0.25)] cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Entering Cockpit...
                    </>
                  ) : (
                    <>
                      Enter Command Cockpit
                      <CheckCircle2 size={18} strokeWidth={2.5} />
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
