import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Activity, 
  Cpu, 
  ChevronRight, 
  BarChart3, 
  TrendingUp, 
  Layers, 
  Bot, 
  ExternalLink, 
  UserCheck, 
  AlertCircle, 
  Loader2,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Sliders,
  Mail,
  Lock,
  User,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IconWrapper } from './ui/IconWrapper';
import { signUpWithEmail, signInWithEmail } from '../lib/auth';
import { updateProfile } from 'firebase/auth';

interface LandingPageProps {
  handleLogin: () => void;
  handleGuestLogin: () => void;
  handleSandboxBypass: () => void;
  guestLoading: boolean;
  authError: string | null;
}

interface AgentLog {
  id: string;
  agent: string;
  status: 'idle' | 'working' | 'success';
  message: string;
  time: string;
}

export function LandingPage({ handleLogin, handleGuestLogin, handleSandboxBypass, guestLoading, authError }: LandingPageProps) {
  // Calculator States
  const [traffic, setTraffic] = useState<number>(5000);
  const [conversionRate, setConversionRate] = useState<number>(2.0);
  const [commission, setCommission] = useState<number>(45);

  // Email/Password Auth Modal States
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [authErrorLocal, setAuthErrorLocal] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorLocal(null);
    setAuthLoading(true);

    if (!email || !password) {
      setAuthErrorLocal('Please fill in all fields.');
      setAuthLoading(false);
      return;
    }

    if (authMode === 'signup' && password.length < 6) {
      setAuthErrorLocal('Password must be at least 6 characters.');
      setAuthLoading(false);
      return;
    }

    try {
      if (authMode === 'signup') {
        const user = await signUpWithEmail(email, password);
        if (displayName && user) {
          await updateProfile(user, { displayName });
        }
      } else {
        await signInWithEmail(email, password);
      }
      setShowAuthModal(false);
    } catch (err: any) {
      console.error(err);
      let cleanMsg = err.message || 'Authentication failed.';
      if (err.code === 'auth/email-already-in-use') {
        cleanMsg = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        cleanMsg = 'Invalid email or password. Please verify your details.';
      } else if (err.code === 'auth/invalid-email') {
        cleanMsg = 'Please enter a valid email address.';
      }
      setAuthErrorLocal(cleanMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Agent Simulator States
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [logs, setLogs] = useState<AgentLog[]>([
    { id: '1', agent: 'SEO Crawler', status: 'success', message: 'Discovered high-intent keyword cluster: "best CRM for solar installer"', time: 'Just now' },
    { id: '2', agent: 'Content Genius', status: 'working', message: 'Generating 2,400-word product comparison pillar...', time: 'Active' },
    { id: '3', agent: 'Traffic Engine', status: 'idle', message: 'Awaiting content publication...', time: 'Queued' },
    { id: '4', agent: 'Rev Copilot', status: 'idle', message: 'Analyzing affiliate URL performance...', time: 'Queued' }
  ]);

  // Handle simulated logs progress
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setLogs(prev => {
        const next = [...prev];
        const currentIndex = next.findIndex(l => l.status === 'working');
        
        if (currentIndex !== -1) {
          // Transition current working to success
          next[currentIndex].status = 'success';
          next[currentIndex].time = 'Completed';
          
          // Set next one to working
          const nextIndex = (currentIndex + 1) % next.length;
          next[nextIndex].status = 'working';
          next[nextIndex].time = 'Active';
          
          // Update messages with some random dynamic variations
          if (nextIndex === 0) {
            next[0].message = `Scanned niche database. Identified keyword: "alternative to ${['Notion', 'Monday.com', 'Salesforce', 'Hubspot'][Math.floor(Math.random() * 4)]}"`;
          } else if (nextIndex === 1) {
            next[1].message = `Assembling content structure with ${Math.floor(Math.random() * 5 + 8)} semantic anchor points...`;
          } else if (nextIndex === 2) {
            next[2].message = `Generated ${Math.floor(Math.random() * 4 + 4)} high-resolution Pinterest creatives & scheduled pins.`;
          } else if (nextIndex === 3) {
            next[3].message = `Swapped dead low-tier Amazon link with direct 30% affiliate checkout offering.`;
          }
        } else {
          // Start the first one
          next[0].status = 'working';
          next[0].time = 'Active';
        }
        return next;
      });
      setActiveStep(prev => (prev + 1) % 4);
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Calculations
  const baselineMonthlySales = (traffic * 30 * (conversionRate / 100));
  const baselineRevenue = baselineMonthlySales * commission;
  
  // OptiFlow optimization boosts conversion rate by 34% relatively
  const optimizedConversionRate = conversionRate * 1.34;
  const optimizedMonthlySales = (traffic * 30 * (optimizedConversionRate / 100));
  const optimizedRevenue = optimizedMonthlySales * commission;
  const monthlyLift = optimizedRevenue - baselineRevenue;

  return (
    <div className="min-h-screen bg-[#040507] text-zinc-200 font-sans selection:bg-[#a8ff35]/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#040507]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-white font-bold tracking-tight text-lg">
            <div className="w-8 h-8 flex items-center justify-center bg-[#a8ff35]/10 rounded-lg border border-[#a8ff35]/25 shadow-[0_0_15px_rgba(168,255,53,0.15)]">
              <img src="/logo.png" alt="OptiFlow Logo" className="w-5 h-5 object-contain" />
            </div>
            <span className="bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">OptiFlow OS</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setAuthMode('login'); setAuthErrorLocal(null); setShowAuthModal(true); }}
              className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors hidden sm:block px-3 py-1.5"
            >
              Sign In
            </button>
            <button 
              onClick={handleGuestLogin}
              disabled={guestLoading}
              className="text-xs font-bold uppercase tracking-wider bg-[#a8ff35] hover:bg-[#baff4c] hover:scale-[1.02] active:scale-[0.98] text-black px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-[0_4px_20px_rgba(168,255,53,0.15)]"
            >
              {guestLoading ? <Loader2 className="animate-spin" size={14} /> : "Start Building"}
            </button>
          </div>
        </div>
      </nav>

      {/* Auth Error Overlay */}
      {authError && (
        <div className="pt-24 px-6 max-w-3xl mx-auto relative z-50">
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl text-sm flex flex-col md:flex-row gap-4 items-start justify-between shadow-lg">
            <div className="flex gap-3 items-start">
              <IconWrapper icon={AlertCircle} size={20} className="flex-shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-bold text-red-300">Authentication Setup Required</p>
                <div className="mt-2 space-y-1.5 text-zinc-300 leading-relaxed">
                  {authError.split('\n').map((line, idx) => (
                    <p key={idx} className="opacity-90">{line}</p>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={handleSandboxBypass}
              className="mt-2 md:mt-0 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-[#a8ff35] border border-[#a8ff35]/30 hover:border-[#a8ff35]/50 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(168,255,53,0.1)] flex-shrink-0 self-end md:self-start"
            >
              Launch Demo Sandbox (Bypass)
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Radial Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[600px] bg-[#a8ff35]/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-5xl mx-auto space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-[10px] font-mono uppercase tracking-[0.25em] shadow-inner">
              <IconWrapper icon={Cpu} size={14} className="text-[#a8ff35]" strokeWidth={2.5} />
              Autonomous Media Operations OS
            </div>
            
            <h1 className="text-5xl sm:text-7xl md:text-[86px] font-bold text-white tracking-[-0.04em] leading-[0.9] font-sans">
              The Intelligent OS For <br />
              <span className="relative inline-block text-black bg-[#a8ff35] px-5 py-1.5 rounded-2xl md:rounded-[32px] mt-4 transform -rotate-1 shadow-lg">
                Affiliate Publishers
              </span>
            </h1>
            
            <p className="text-lg md:text-2xl text-zinc-400 leading-relaxed max-w-3xl mx-auto font-light tracking-tight pt-2">
              Scale programmatic content clusters, automate distribution pipelines, and dynamically optimize links in real time with specialized AI Agents.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 max-w-lg mx-auto">
              <button 
                onClick={() => { setAuthMode('signup'); setAuthErrorLocal(null); setShowAuthModal(true); }}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4.5 rounded-2xl bg-white hover:bg-zinc-100 text-black font-extrabold text-base transition-all group shadow-2xl shadow-white/5"
              >
                Launch App
                <IconWrapper icon={ChevronRight} size={18} className="transition-transform group-hover:translate-x-1" strokeWidth={3} />
              </button>
              <button 
                onClick={handleGuestLogin}
                disabled={guestLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-white/10 font-bold text-base transition-all hover:border-white/20"
              >
                {guestLoading ? (
                  <Loader2 className="animate-spin" size={18} strokeWidth={2.5} />
                ) : (
                  <IconWrapper icon={UserCheck} size={18} strokeWidth={2.5} className="text-[#a8ff35]" />
                )}
                Explore Developer Mode
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Agent Simulator & Core UI Mockup */}
      <section className="py-12 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="p-1 md:p-3 rounded-3xl bg-[#0e1117] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            {/* Header of our mock agent cockpit */}
            <div className="flex items-center justify-between border-b border-white/5 p-4 md:px-6">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <div className="h-4 w-px bg-white/10 ml-2" />
                <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
                  <span className="text-[#a8ff35]">●</span> RUNNING SIMULATION
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsSimulating(!isSimulating)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-300 border border-white/10 transition-colors"
                >
                  <IconWrapper icon={Activity} size={12} className={isSimulating ? "animate-pulse text-[#a8ff35]" : ""} />
                  {isSimulating ? 'PAUSE BOT' : 'RESUME BOT'}
                </button>
              </div>
            </div>

            {/* Dashboard Mockup Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-white/5">
              {/* Sidebar Agent Manifest */}
              <div className="lg:col-span-4 bg-[#0a0d13] p-6 space-y-4">
                <div className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider">Operational Agents</div>
                <div className="space-y-2">
                  {[
                    { name: 'SEO Keyword Crawler', desc: 'Finds niche authority opportunities', idx: 0 },
                    { name: 'Content Synthesis Engine', desc: 'Generates structured articles & posts', idx: 1 },
                    { name: 'Pinterest Traffic Automator', desc: 'Schedules boards & distributes assets', idx: 2 },
                    { name: 'Link Optimization Copilot', desc: 'Audits postbacks & rotates active offers', idx: 3 }
                  ].map((agent, i) => (
                    <div 
                      key={i} 
                      className={`p-3.5 rounded-xl border transition-all ${
                        activeStep === i 
                          ? 'bg-[#a8ff35]/5 border-[#a8ff35]/30 shadow-[0_0_15px_rgba(168,255,53,0.05)]' 
                          : 'bg-zinc-950/40 border-white/5 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-white">{agent.name}</span>
                        {activeStep === i && (
                          <span className="w-2 h-2 rounded-full bg-[#a8ff35] animate-ping" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 font-medium">{agent.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Central Real-Time Execution Console */}
              <div className="lg:col-span-8 bg-[#0d1016] p-6 flex flex-col justify-between min-h-[340px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider">Live Agent Telemetry Feed</span>
                    <span className="text-zinc-500 font-mono text-[10px]">60FPS / WEBSOCKET ACTIVE</span>
                  </div>
                  
                  <div className="space-y-3 font-mono text-xs">
                    {logs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`p-4 rounded-xl border transition-all ${
                          log.status === 'working' 
                            ? 'bg-[#a8ff35]/5 border-[#a8ff35]/20 text-white shadow-inner' 
                            : 'bg-zinc-950/30 border-white/5 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              log.status === 'working' ? 'bg-[#a8ff35] animate-pulse' : 'bg-zinc-600'
                            }`} />
                            <span className="font-bold text-zinc-300">{log.agent}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            log.status === 'working' 
                              ? 'bg-[#a8ff35]/15 text-[#a8ff35]' 
                              : log.status === 'success' 
                                ? 'bg-zinc-800 text-zinc-400' 
                                : 'bg-zinc-900 text-zinc-600'
                          }`}>
                            {log.status === 'working' ? 'Processing' : log.status === 'success' ? 'Ready' : 'Standby'}
                          </span>
                        </div>
                        <p className="text-zinc-300 font-sans mt-1">{log.message}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] text-zinc-500">
                          <span>Thread ID: t_0x99A_{log.id}</span>
                          <span>{log.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500 mt-4">
                  <div className="flex items-center gap-2">
                    <IconWrapper icon={CheckCircle2} size={14} className="text-[#a8ff35]" />
                    <span>Integrations Connected: WP (Local), Telegram, Pinterest, Google Analytics</span>
                  </div>
                  <span>Uptime: 100% (No crash instances detected)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Revenue Optimization Simulator */}
      <section className="py-24 relative overflow-hidden bg-[#06080b] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Interactive ROI Simulator
            </h2>
            <p className="text-zinc-400 font-light text-lg">
              OptiFlow OS boosts typical conversion rates by <span className="text-[#a8ff35] font-semibold">34%</span> on average via automated postbacks and smart link rotation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Control Panel (Sliders) */}
            <div className="lg:col-span-7 bg-[#0e1117] p-8 rounded-3xl border border-white/10 space-y-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-lg bg-[#a8ff35]/10 text-[#a8ff35]">
                    <IconWrapper icon={Sliders} size={18} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Adjust Traffic & Conversion Model</h3>
                </div>

                <div className="space-y-6">
                  {/* Traffic Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400 font-medium">Daily Clicks</span>
                      <span className="font-mono text-white font-bold bg-white/5 px-2.5 py-1 rounded-md">
                        {traffic.toLocaleString()}
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="100" 
                      max="20000" 
                      step="100"
                      value={traffic} 
                      onChange={(e) => setTraffic(Number(e.target.value))}
                      className="w-full accent-[#a8ff35] h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                      <span>100</span>
                      <span>10,000</span>
                      <span>20,000</span>
                    </div>
                  </div>

                  {/* Current CR Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400 font-medium">Baseline Conversion Rate</span>
                      <span className="font-mono text-white font-bold bg-white/5 px-2.5 py-1 rounded-md">
                        {conversionRate.toFixed(1)}%
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="10" 
                      step="0.1"
                      value={conversionRate} 
                      onChange={(e) => setConversionRate(Number(e.target.value))}
                      className="w-full accent-[#a8ff35] h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                      <span>0.5%</span>
                      <span>5.0%</span>
                      <span>10.0%</span>
                    </div>
                  </div>

                  {/* Commission Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400 font-medium">Average Commission Per Sale</span>
                      <span className="font-mono text-white font-bold bg-white/5 px-2.5 py-1 rounded-md">
                        ${commission}
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="250" 
                      step="5"
                      value={commission} 
                      onChange={(e) => setCommission(Number(e.target.value))}
                      className="w-full accent-[#a8ff35] h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                      <span>$5</span>
                      <span>$125</span>
                      <span>$250</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-start gap-3 mt-4">
                <IconWrapper icon={Sparkles} size={16} className="text-[#a8ff35] mt-0.5" />
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  OptiFlow continuously tracks conversions to train an internal ranking engine. Underperforming offers are flagged and rotated to maintain maximum RPM (Revenue Per Mille) dynamically.
                </p>
              </div>
            </div>

            {/* Results Output Screen */}
            <div className="lg:col-span-5 bg-gradient-to-b from-[#0e1117] to-[#0d1016] p-8 rounded-3xl border border-[#a8ff35]/15 flex flex-col justify-between relative overflow-hidden">
              {/* Highlight background light */}
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#a8ff35]/5 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-6">
                <span className="text-[#a8ff35] font-mono text-[10px] uppercase tracking-wider font-bold">Projected Monthly Outlook</span>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5">
                    <div className="text-zinc-400 text-xs mb-1">Standard Output (Without OptiFlow)</div>
                    <div className="text-2xl font-bold text-zinc-300">
                      ${Math.round(baselineRevenue).toLocaleString()}
                      <span className="text-sm font-normal text-zinc-500 font-mono ml-2">
                        ({Math.round(baselineMonthlySales)} sales / mo)
                      </span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#a8ff35]/5 border border-[#a8ff35]/20 relative">
                    <span className="absolute top-4 right-4 text-[10px] font-mono uppercase bg-[#a8ff35] text-black font-extrabold px-2 py-0.5 rounded-full">
                      +34% Lift
                    </span>
                    <div className="text-[#a8ff35] text-xs font-semibold mb-1">With OptiFlow OS Enabled</div>
                    <div className="text-3xl font-extrabold text-white">
                      ${Math.round(optimizedRevenue).toLocaleString()}
                      <span className="text-xs font-normal text-zinc-400 font-mono ml-2">
                        ({Math.round(optimizedMonthlySales)} sales)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net lift calculation panel */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="text-zinc-400 text-xs mb-1 uppercase tracking-wider font-mono">Net Monthly Profit Lift</div>
                <div className="text-5xl font-black text-[#a8ff35] tracking-tight">
                  +${Math.round(monthlyLift).toLocaleString()}
                </div>
                <p className="text-xs text-zinc-400 mt-2 font-light">
                  That's an extra <span className="text-white font-bold">${Math.round(monthlyLift * 12).toLocaleString()}</span> in pure commission margin added to your annual ledger.
                </p>

                <button 
                  onClick={() => { setAuthMode('signup'); setAuthErrorLocal(null); setShowAuthModal(true); }}
                  className="w-full mt-6 py-4 rounded-xl bg-[#a8ff35] hover:bg-[#baff4c] text-black font-extrabold text-sm transition-all flex items-center justify-center gap-2 group"
                >
                  Capture This Margin Now
                  <IconWrapper icon={ArrowRight} size={14} className="transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Bento Features Grid */}
      <section className="py-24 bg-[#040507]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Designed to Autonomously Govern Your Assets
              </h2>
              <p className="text-zinc-400 mt-4 text-base font-light">
                No complex scripting or server configuration. Launch specialized AI agents to discover keyword deficits, write, format, distribute, and verify conversions.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[#a8ff35] font-mono text-xs uppercase tracking-widest bg-[#a8ff35]/5 px-4 py-2 rounded-lg border border-[#a8ff35]/15">
              <IconWrapper icon={Activity} size={14} className="animate-pulse" strokeWidth={2.5} />
              All Sub-Systems Online
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                whileHover={{ y: -6 }}
                className="p-8 rounded-[32px] bg-[#0e1117] border border-white/5 hover:border-[#a8ff35]/30 transition-all hover:bg-[#12161f] group relative overflow-hidden flex flex-col justify-between min-h-[220px]"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#a8ff35]/10 text-[#a8ff35] flex items-center justify-center border border-[#a8ff35]/15 group-hover:bg-[#a8ff35]/20 transition-colors shadow-[0_0_15px_rgba(168,255,53,0.08)]">
                  <IconWrapper icon={feature.icon} size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-[#a8ff35] transition-colors">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed font-light">{feature.desc}</p>
                </div>
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                  <IconWrapper icon={feature.icon} size={80} strokeWidth={2.5} className="text-[#a8ff35]" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Stats Showcase */}
      <section className="py-20 border-y border-white/5 bg-[#06080b]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: 'Active Clusters Managed', value: '4,289' },
              { label: 'Pages Published Automatically', value: '180,410' },
              { label: 'Average Conversion Lift', value: '34.2%' },
              { label: 'Agent Server Uptime', value: '99.99%' },
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <div className="text-3xl md:text-5xl font-extrabold text-white tracking-tighter">{stat.value}</div>
                <div className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Immersive CTA */}
      <section className="py-36 relative overflow-hidden text-center bg-[#040507]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#a8ff35]/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 space-y-8">
          <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
            Ready to Automate <br />Your Publishing Empire?
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto font-light">
            Deploy specialized sub-agents on premium infrastructure. Establish a fully autonomous loop from SEO research to postback conversion.
          </p>
          <div className="pt-4">
            <button 
              onClick={() => { setAuthMode('signup'); setAuthErrorLocal(null); setShowAuthModal(true); }}
              className="px-12 py-5 rounded-2xl bg-[#a8ff35] hover:bg-[#baff4c] text-black font-extrabold text-lg tracking-tight shadow-[0_20px_50px_rgba(168,255,53,0.35)] transition-all flex items-center gap-3 mx-auto group hover:scale-105 active:scale-95"
            >
              Launch OptiFlow OS 
              <IconWrapper icon={ChevronRight} size={22} strokeWidth={3} className="transition-transform group-hover:translate-x-1" />
            </button>
            <p className="text-zinc-500 mt-6 font-mono text-[10px] uppercase tracking-[0.3em]">No Credit Card Required • Instant Developer Provisioning</p>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-zinc-500 text-xs bg-[#040507]">
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 mb-2">OptiFlow OS Architecture v4.2</p>
        <p>OptiFlow OS &copy; {new Date().getFullYear()}. Engineered for production scale. All rights reserved.</p>
      </footer>

      {/* Auth Modal Overlay */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-[#040507]/40 cursor-pointer"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md bg-[#0c0e14] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(168,255,53,0.1)] p-8 text-left z-10"
            >
              {/* Glow Accent */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#a8ff35]/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition"
              >
                <IconWrapper icon={X} size={16} />
              </button>

              {/* Logo / Header */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 flex items-center justify-center bg-[#a8ff35]/10 rounded-lg border border-[#a8ff35]/25">
                  <img src="/logo.png" alt="OptiFlow" className="w-5 h-5 object-contain" />
                </div>
                <span className="font-bold text-white tracking-tight">OptiFlow OS</span>
              </div>

              {/* Heading */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {authMode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {authMode === 'signup' 
                    ? 'Establish your automated affiliate publishing instance' 
                    : 'Sign in to access your dashboard cockpit'}
                </p>
              </div>

              {/* Tab Selector */}
              <div className="flex gap-1 bg-white/5 p-1 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setAuthErrorLocal(null); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    authMode === 'signup' 
                      ? 'bg-[#a8ff35] text-black shadow-lg' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthErrorLocal(null); }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    authMode === 'login' 
                      ? 'bg-[#a8ff35] text-black shadow-lg' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Sign In
                </button>
              </div>

              {/* Error Alert */}
              {authErrorLocal && (
                <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex gap-2 items-start">
                  <IconWrapper icon={AlertCircle} size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{authErrorLocal}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
                {authMode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-mono text-zinc-400">Full Name</label>
                    <div className="relative">
                      <IconWrapper icon={User} size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#a8ff35]/50 focus:ring-1 focus:ring-[#a8ff35]/20 transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-mono text-zinc-400">Email Address</label>
                  <div className="relative">
                    <IconWrapper icon={Mail} size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="email"
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#a8ff35]/50 focus:ring-1 focus:ring-[#a8ff35]/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-mono text-zinc-400">Password</label>
                  <div className="relative">
                    <IconWrapper icon={Lock} size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#a8ff35]/50 focus:ring-1 focus:ring-[#a8ff35]/20 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 bg-[#a8ff35] hover:bg-[#baff4c] disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {authLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : authMode === 'signup' ? (
                    'Establish Instance'
                  ) : (
                    'Authenticate Account'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-[10px] font-mono uppercase tracking-wider text-zinc-500">Or continue with</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              {/* Alternative Auth Methods */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    handleLogin();
                  }}
                  className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition"
                >
                  Google Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    handleGuestLogin();
                  }}
                  disabled={guestLoading}
                  className="py-3 px-4 bg-[#a8ff35]/5 hover:bg-[#a8ff35]/10 border border-[#a8ff35]/15 hover:border-[#a8ff35]/30 rounded-xl text-xs font-semibold text-[#a8ff35] flex items-center justify-center gap-2 transition"
                >
                  {guestLoading ? <Loader2 className="animate-spin" size={12} /> : 'Guest Mode'}
                </button>
              </div>

              {/* Sandbox Bypass Option */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    handleSandboxBypass();
                  }}
                  className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 hover:text-white transition cursor-pointer"
                >
                  ⚡ Direct Developer Sandbox Bypass
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
