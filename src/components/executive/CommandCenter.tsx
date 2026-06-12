import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, where } from 'firebase/firestore';
import { 
  Target, 
  Brain, 
  Activity, 
  Plus, 
  CheckCircle2, 
  History, 
  Cpu,
  UserCheck,
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StrategicMemory, CEOTarget, OrganizationNode } from '../../types';
import { CEOChat } from './CEOChat';

export function CommandCenter() {
  const [memory, setMemory] = useState<StrategicMemory[]>([]);
  const [targets, setTargets] = useState<CEOTarget[]>([]);
  const [nodes, setNodes] = useState<OrganizationNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTarget, setShowAddTarget] = useState(false);
  const [newTarget, setNewTarget] = useState({ title: '', description: '', priority: 'medium' as any });

  useEffect(() => {
    if (!auth.currentUser) return;

    // Strategic Memory Subscription
    const qMemory = query(
      collection(db, 'strategic_memory'), 
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubMemory = onSnapshot(qMemory, (snap) => {
      const sorted = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as StrategicMemory))
        .sort((a, b) => b.createdAt - a.createdAt);
      setMemory(sorted);
    }, (error) => {
      console.warn("Error in strategic memory subscription:", error);
    });

    // Targets Subscription
    const qTargets = query(
      collection(db, 'ceo_targets'), 
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubTargets = onSnapshot(qTargets, (snap) => {
      const sorted = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as CEOTarget))
        .sort((a, b) => {
          // Sort by critical/high/medium/low priority
          const priorityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
          return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        });
      setTargets(sorted);
    }, (error) => {
      console.warn("Error in targets subscription:", error);
    });

    // Organization Nodes (Agents/Systems)
    const qNodes = query(
      collection(db, 'agent_nodes'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubNodes = onSnapshot(qNodes, (snap) => {
      const dbNodes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrganizationNode));
      
      if (dbNodes.length === 0) {
        // Seed if empty
        const mockNodes: Omit<OrganizationNode, 'id'>[] = [
          { name: 'Executive Planner', role: 'Strategy Logic', type: 'agent', status: 'online', efficiency: 0.98, lastActive: Date.now(), userId: auth.currentUser!.uid, personality: "Analytical, calm, proactive", learnedData: "Prefer high-ticket CPA offers" },
          { name: 'Memory Core', role: 'Context Storage', type: 'system', status: 'online', efficiency: 1.0, lastActive: Date.now(), userId: auth.currentUser!.uid, personality: "Systematic, efficient", learnedData: "Optimized for speed" },
          { name: 'SEO Architect', role: 'Structure Designer', type: 'agent', status: 'online', efficiency: 0.92, lastActive: Date.now() - 5000, userId: auth.currentUser!.uid, personality: "Creative, detailed", learnedData: "Prefers long-tail keywords" },
          { name: 'Traffic Dispatch', role: 'Link Management', type: 'agent', status: 'busy', efficiency: 0.85, lastActive: Date.now(), userId: auth.currentUser!.uid, personality: "Fast, precise", learnedData: "High EPC traffic patterns" },
          { name: 'VideoAgent', role: 'Video Generation', type: 'agent', status: 'online', efficiency: 0.95, lastActive: Date.now(), userId: auth.currentUser!.uid, personality: "Visual, creative", learnedData: "Optimized for cinematic shots" },
          { name: 'ReelAgent', role: 'Short Content Gen', type: 'agent', status: 'online', efficiency: 0.90, lastActive: Date.now(), userId: auth.currentUser!.uid, personality: "Fast, trend-oriented", learnedData: "Optimized for viral pacing" },
        ];
        mockNodes.forEach(node => addDoc(collection(db, 'agent_nodes'), node));
      } else {
        setNodes(dbNodes);
      }
    }, (error) => {
      console.warn("Error in nodes subscription:", error);
    });
    
    setLoading(false);

    return () => {
      unsubMemory();
      unsubTargets();
      unsubNodes();
    };
  }, []);

  const handleAddTarget = async () => {
    if (!newTarget.title) return;
    try {
      await addDoc(collection(db, 'ceo_targets'), {
        ...newTarget,
        status: 'active',
        metrics: [{ label: 'Progress', current: 0, target: 100, unit: '%' }],
        userId: auth.currentUser?.uid || 'guest',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setShowAddTarget(false);
      setNewTarget({ title: '', description: '', priority: 'medium' });
    } catch (err) {
      console.error("Failed to add target:", err);
    }
  };

  const toggleTargetStatus = async (targetId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'active' ? 'reached' : 'active';
      await updateDoc(doc(db, 'ceo_targets', targetId), { 
        status: nextStatus,
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  return (
    <div className="space-y-16 pb-24 max-w-7xl mx-auto px-6">
      {/* 1. HERO SECTION: OPERATIONAL STATUS */}
      <header className="space-y-6">
         <div className="flex items-center justify-between">
           <h1 className="text-3xl font-extrabold tracking-tighter text-white">Executive Command</h1>
           <span className="px-3 py-1 bg-[#a8ff35]/10 text-[#a8ff35] text-[10px] font-bold uppercase tracking-widest rounded-full border border-[#a8ff35]/20">OS: ExCore v4.0.1</span>
         </div>
         <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {nodes.map((node) => (
             <motion.div 
               key={node.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl relative overflow-hidden backdrop-blur-md group hover:border-[#a8ff35]/20 transition-colors"
             >
               <div className="flex items-start justify-between relative z-10">
                 <div className="space-y-1">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{node.role}</span>
                   <h3 className="text-sm font-bold text-white flex items-center">
                     {node.type === 'agent' ? <Cpu className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />}
                     {node.name}
                   </h3>
                 </div>
                 <div className={`h-2 w-2 rounded-full ${node.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : node.status === 'busy' ? 'bg-amber-500' : 'bg-rose-500'}`} />
               </div>
               
               <div className="mt-8 space-y-2">
                 <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                   <span>EFFICIENCY</span>
                   <span className="text-zinc-200">{(node.efficiency * 100).toFixed(0)}%</span>
                 </div>
                 <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${node.efficiency * 100}%` }}
                     className={`h-full ${node.efficiency > 0.9 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                   />
                 </div>
               </div>
             </motion.div>
           ))}
         </section>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* 2. CORE DIRECTIVES (TARGETS) */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center text-zinc-900 dark:text-white">
              <Target className="w-5 h-5 mr-2 text-rose-500" />
              Strategic Directives
            </h2>
            <button 
              onClick={() => setShowAddTarget(true)}
              className="p-1.5 bg-[#d7f941] text-black rounded-lg hover:scale-105 transition-transform cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {showAddTarget && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-6 bg-[#111] border border-white/10 rounded-2xl space-y-4 shadow-2xl"
                >
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Initialize New Directive</h3>
                  <div className="space-y-4">
                    <input 
                      placeholder="Directive Title (e.g., SEO Market Dominance)"
                      className="w-full bg-black/50 border border-white/5 p-3 rounded-xl text-sm focus:outline-none focus:border-[#d7f941]"
                      value={newTarget.title}
                      onChange={e => setNewTarget({...newTarget, title: e.target.value})}
                    />
                    <textarea 
                      placeholder="Strategy Description..."
                      className="w-full bg-black/50 border border-white/5 p-3 rounded-xl text-sm h-24 focus:outline-none focus:border-[#d7f941]"
                      value={newTarget.description}
                      onChange={e => setNewTarget({...newTarget, description: e.target.value})}
                    />
                    <div className="flex justify-between items-center gap-4">
                      <select 
                        className="bg-black/50 border border-white/5 p-2 rounded-xl text-xs text-zinc-400"
                        value={newTarget.priority}
                        onChange={e => setNewTarget({...newTarget, priority: e.target.value})}
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                        <option value="critical">Critical Path</option>
                      </select>
                      <div className="space-x-2">
                        <button onClick={() => setShowAddTarget(false)} className="px-4 py-2 text-xs text-zinc-500">Cancel</button>
                        <button onClick={handleAddTarget} className="px-6 py-2 text-xs bg-[#d7f941] text-black font-bold rounded-xl active:scale-95">Set Target</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {targets.length === 0 && !showAddTarget ? (
              <div className="p-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl opacity-50 space-y-4">
                <Target className="w-12 h-12 mx-auto text-zinc-600" />
                <p className="text-zinc-500 font-mono text-sm tracking-tight">No active directives found. Initiate sequence.</p>
              </div>
            ) : (
              targets.map((target) => (
                <motion.div 
                  layout
                  key={target.id}
                  className={`p-6 border rounded-3xl transition-all relative group ${target.status === 'reached' ? 'bg-zinc-100 dark:bg-emerald-950/10 border-emerald-500/20' : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-white/5'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${target.priority === 'critical' ? 'bg-rose-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                          {target.priority}
                        </span>
                        {target.status === 'reached' && <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-full">Completed</span>}
                      </div>
                      <h3 className={`text-lg font-bold leading-tight ${target.status === 'reached' ? 'line-through opacity-50' : ''}`}>{target.title}</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mt-1">{target.description}</p>
                    </div>
                    
                    <button 
                      onClick={() => toggleTargetStatus(target.id, target.status)}
                      className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${target.status === 'reached' ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-white/5 hover:bg-[#d7f941] hover:text-black cursor-pointer'}`}
                    >
                      {target.status === 'reached' ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-5 h-5 opacity-40 group-hover:opacity-100" />}
                    </button>
                  </div>

                  {target.metrics && target.metrics.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 grid grid-cols-2 gap-8">
                       {target.metrics.map((m, i) => (
                         <div key={i} className="space-y-2">
                           <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                             <span>{m.label}</span>
                             <span className="text-zinc-900 dark:text-zinc-300">{m.current}/{m.target}{m.unit}</span>
                           </div>
                           <div className="w-full h-1.5 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${(m.current / m.target) * 100}%` }}
                               className="h-full bg-[#d7f941]"
                             />
                           </div>
                         </div>
                       ))}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </section>
        
        {/* 3. STRATEGIC MEMORY (SOUL LOG) */}
        <aside className="space-y-6">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Brain className="w-5 h-5 text-indigo-400" />
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-indigo-500/20 rounded-full"
              />
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Active Strategic Memory</h2>
          </div>

          <div className="space-y-4">
            {memory.length === 0 ? (
              <div className="p-8 text-center bg-zinc-50 dark:bg-white/5 rounded-3xl border border-dashed border-zinc-800">
                <History className="w-8 h-8 mx-auto text-zinc-700 mb-3" />
                <p className="text-[12px] text-zinc-500 font-mono">Standby... System is accumulating context from agent iterations.</p>
              </div>
            ) : (
              memory.map((entry, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={entry.id} 
                  className="p-5 border border-gray-100 dark:border-white/5 bg-white dark:bg-zinc-900/50 rounded-2xl space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{entry.topic}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">{new Date(entry.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                    "{entry.insight}"
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-white/5">
                    <div className="flex items-center space-x-1">
                      <UserCheck className="w-3 h-3 text-zinc-500" />
                      <span className="text-[9px] text-zinc-500 font-medium">{entry.sourceAgent || 'Logic Core'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Activity className="w-3 h-3 text-emerald-400" />
                      <span className="text-[9px] text-emerald-400 font-bold">{(entry.reliability * 100).toFixed(0)}% VALID</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </aside>

        {/* 4. CEO SOUL CHAT */}
        <section className="lg:col-span-1 space-y-6">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Soul Interface</h2>
          </div>
          <CEOChat />
        </section>

      </div>
    </div>
  );
}
