import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, Cpu, Globe, Activity, CheckCircle2 } from 'lucide-react';

export function ProductionLoading() {
  const [stage, setStage] = useState(0);
  const steps = [
    { icon: <Shield className="w-5 h-5" />, text: "Authenticating Secure Execution Environment..." },
    { icon: <Cpu className="w-5 h-5" />, text: "Initializing Autonomous Agent Clusters..." },
    { icon: <Globe className="w-5 h-5" />, text: "Syncing Global Affiliate Nodes..." },
    { icon: <Activity className="w-5 h-5" />, text: "Optimizing Traffic Engines..." },
    { icon: <CheckCircle2 className="w-5 h-5" />, text: "System Ready. Welcome, CEO." }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStage(prev => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="fixed inset-0 bg-[#06070a] z-[9999] flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#a8ff35]/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-12 relative z-10"
      >
        {/* Core Logo Animation */}
        <div className="flex flex-col items-center">
          <motion.div 
            animate={{ 
              rotate: [0, 90, 180, 270, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-4 border-[#a8ff35] border-t-transparent rounded-full flex items-center justify-center p-4"
          >
            <div className="w-full h-full border-4 border-indigo-500 border-b-transparent rounded-full animate-spin" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-2xl font-bold tracking-[0.2em] text-white uppercase"
          >
            Affiliate<span className="text-[#a8ff35]">OS</span>
          </motion.h1>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2">Next-Gen Sovereign Enterprise</p>
        </div>

        {/* Progress Stages */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div 
              key={stage}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center space-x-4 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm"
            >
              <div className="text-[#a8ff35]">
                {steps[stage].icon}
              </div>
              <p className="text-sm font-medium text-zinc-300">{steps[stage].text}</p>
            </motion.div>
          </AnimatePresence>

          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: `${((stage + 1) / steps.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-[#a8ff35] to-indigo-500 shadow-[0_0_20px_rgba(168,255,53,0.5)]"
            />
          </div>
        </div>

        {/* System Logs (Faint) */}
        <div className="flex flex-col space-y-1">
          <p className="text-[9px] font-mono text-zinc-600">UUID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
          <p className="text-[9px] font-mono text-zinc-600">ENCRYPTION: AES-256-GCM ACTIVE</p>
          <p className="text-[9px] font-mono text-zinc-600">KERNAL: AS-LNX-0.98.2 READY</p>
        </div>
      </motion.div>
    </div>
  );
}
