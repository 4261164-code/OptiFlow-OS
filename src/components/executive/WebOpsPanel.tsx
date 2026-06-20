
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, ShieldAlert, Cpu, Search, CheckCircle2, AlertTriangle, Zap, Server } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';

export const WebOpsPanel: React.FC = () => {
  const [patches, setPatches] = useState<any[]>([]);
  const [seoLogs, setSeoLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'patches' | 'seo'>('patches');

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const qPatches = query(collection(db, 'webops_patches'), where('userId', '==', uid), orderBy('timestamp', 'desc'), limit(10));
    const unsubPatches = onSnapshot(qPatches, (snap) => {
      setPatches(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qSeo = query(collection(db, 'webops_seo_logs'), where('userId', '==', uid), orderBy('timestamp', 'desc'), limit(10));
    const unsubSeo = onSnapshot(qSeo, (snap) => {
      setSeoLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubPatches();
      unsubSeo();
    };
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">WebOps Autonomous Layer</h2>
            <p className="text-[10px] text-zinc-500 font-mono">Observe • Diagnose • Repair • Optimize</p>
          </div>
        </div>
        <div className="flex space-x-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button 
            onClick={() => setActiveTab('patches')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeTab === 'patches' ? 'bg-indigo-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Patches
          </button>
          <button 
            onClick={() => setActiveTab('seo')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeTab === 'seo' ? 'bg-indigo-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            SEO Logs
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {activeTab === 'patches' ? (
          patches.length > 0 ? (
            patches.map((patch) => (
              <motion.div 
                key={patch.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl relative overflow-hidden group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {patch.status === 'applied' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
                    )}
                    <span className="text-[11px] font-mono font-bold text-zinc-300">{patch.target}</span>
                  </div>
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    patch.riskLevel === 'low' ? 'bg-emerald-500/10 text-emerald-400' :
                    patch.riskLevel === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-rose-500/10 text-rose-400'
                  }`}>
                    {patch.riskLevel} risk
                  </span>
                </div>
                
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] text-zinc-400">{patch.patchType.replace('_', ' ')}: {JSON.stringify(patch.change)}</p>
                  <p className="text-[9px] text-zinc-600 italic">Reason: {patch.executionReason || 'Observability heuristic'}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-900 flex justify-between items-center">
                  <span className="text-[9px] text-zinc-600 font-mono">{new Date(patch.timestamp).toLocaleTimeString()}</span>
                  <span className={`text-[9px] font-bold ${patch.status === 'applied' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {patch.status.toUpperCase()}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center space-y-3 py-12">
              <Zap className="w-8 h-8 opacity-20" />
              <p className="text-xs">No autonomous patches yet.<br/>System is operating within nominal bounds.</p>
            </div>
          )
        ) : (
          seoLogs.length > 0 ? (
            seoLogs.map((log) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Search className="w-4 h-4 text-indigo-400" />
                  <span className="text-[11px] font-bold text-zinc-100">SEO Asset Optimization</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <p className="text-[10px] text-zinc-300 font-bold">New Meta Title:</p>
                    <p className="text-[10px] text-zinc-500">{log.metaTags?.title}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {log.contentSuggestions?.map((s: string, idx: number) => (
                      <div key={idx} className="flex items-center space-x-2 text-[9px] text-zinc-400 bg-zinc-900 px-2 py-1 rounded">
                        <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-2 text-[9px] text-zinc-600 font-mono text-right">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center space-y-3 py-12">
              <Server className="w-8 h-8 opacity-20" />
              <p className="text-xs">Waiting for next SEO scan...</p>
            </div>
          )
        )}
      </div>

      <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-bold text-emerald-500 uppercase">Agent Active</span>
        </div>
        <div className="text-[9px] text-zinc-600 flex items-center space-x-1 font-mono">
          <Cpu className="w-3 h-3" />
          <span>v1.0-WebOps</span>
        </div>
      </div>
    </div>
  );
};
