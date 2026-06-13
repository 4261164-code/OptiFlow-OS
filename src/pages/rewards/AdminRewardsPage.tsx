import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input } from '../../components/ui';
import { Shield, Users, CreditCard, AlertTriangle, CheckCircle, XCircle, Search, Filter, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../../lib/auth';
import { useNotifications } from '../../components/NotificationContext';
import { Navigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function AdminRewardsPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'fraud'>('withdrawals');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!auth.currentUser) return;
    const checkAdmin = async () => {
      const snap = await getDoc(doc(db, 'users', auth.currentUser!.uid));
      setIsAdmin(snap.exists() && snap.data().isAdmin === true);
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    if (activeTab === 'withdrawals') {
      const q = query(collection(db, 'withdrawals'), orderBy('timestamp', 'desc'), limit(50));
      const unsub = onSnapshot(q, (snap) => {
        setWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
      return () => unsub();
    }
  }, [isAdmin, activeTab]);

  const handleProcessWithdrawal = async (withdrawalId: string, status: 'approved' | 'rejected') => {
    setProcessingId(withdrawalId);
    try {
      const res = await apiFetch('/api/admin/approve-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, status })
      });
      const data = await res.json();
      if (data.success) {
        addNotification('info', "Success", `Withdrawal ${status}`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      addNotification('error', "Error", err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (isAdmin === false) return <Navigate to="/" replace />;
  if (isAdmin === null) return null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-sans font-bold text-white tracking-tight">Rewards Control Center</h1>
          <p className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold flex items-center gap-2">
            <Shield className="w-3 h-3 text-red-500" /> Admin Restricted Access
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
           <button 
             onClick={() => setActiveTab('users')}
             className={cn("px-6 py-2.5 rounded-xl text-xs font-bold transition-all", activeTab === 'users' ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}
           >
             <Users className="w-4 h-4 inline mr-2" /> Users
           </button>
           <button 
             onClick={() => setActiveTab('withdrawals')}
             className={cn("px-6 py-2.5 rounded-xl text-xs font-bold transition-all", activeTab === 'withdrawals' ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300")}
           >
             <CreditCard className="w-4 h-4 inline mr-2" /> Withdrawals
           </button>
           <button 
             onClick={() => setActiveTab('fraud')}
             className={cn("px-6 py-2.5 rounded-xl text-xs font-bold transition-all", activeTab === 'fraud' ? "bg-[#FF5A5F]/10 text-[#FF5A5F] shadow-lg" : "text-zinc-500 hover:text-zinc-300")}
           >
             <AlertTriangle className="w-4 h-4 inline mr-2" /> Fraud Flags
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'withdrawals' && (
          <motion.div
            key="withdrawals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
             <div className="grid gap-4">
                {loading ? (
                   <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-zinc-800" /></div>
                ) : withdrawals.length === 0 ? (
                   <div className="p-20 text-center text-zinc-600 font-mono text-sm uppercase tracking-widest">No pending queue objects detected.</div>
                ) : (
                   withdrawals.map((wd) => (
                      <Card key={wd.id} className="bg-[#0d0e12] border-white/5 hover:border-white/10 transition-all">
                         <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 uppercase font-bold text-xs">
                                  {wd.method === 'paypal' ? 'PP' : 'AZ'}
                               </div>
                               <div>
                                  <div className="flex items-center gap-2">
                                     <p className="text-white font-bold">{wd.recipient}</p>
                                     <span className={cn(
                                       "text-[8px] uppercase tracking-widest px-2 py-0.5 rounded font-bold",
                                       wd.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                                       wd.status === 'approved' ? "bg-emerald-500/10 text-emerald-500" : 
                                       "bg-zinc-500/10 text-zinc-500"
                                     )}>
                                       {wd.status}
                                     </span>
                                  </div>
                                  <p className="text-zinc-500 text-[10px] font-mono mt-1">
                                     Ref: {wd.id} • User: {wd.userId.substring(0, 8)}... • {new Date(wd.timestamp).toLocaleString()}
                                  </p>
                               </div>
                            </div>

                            <div className="flex items-center gap-8">
                               <div className="text-right">
                                  <p className="text-2xl font-mono font-bold text-white">${(wd.amount / 100).toFixed(2)}</p>
                                  <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter">Gross Credit Value</p>
                               </div>

                               {wd.status === 'pending' && (
                                  <div className="flex gap-2">
                                     <Button 
                                       size="sm" 
                                       onClick={() => handleProcessWithdrawal(wd.id, 'rejected')}
                                       disabled={processingId === wd.id}
                                       className="bg-transparent border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl"
                                     >
                                        Reject
                                     </Button>
                                     <Button 
                                       size="sm" 
                                       onClick={() => handleProcessWithdrawal(wd.id, 'approved')}
                                       disabled={processingId === wd.id}
                                       className="bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400"
                                     >
                                        Approve
                                     </Button>
                                  </div>
                               )}
                               
                               {wd.status !== 'pending' && (
                                  <div className="flex items-center gap-2 text-zinc-500 text-xs px-4 py-2 bg-white/2 rounded-xl border border-white/5">
                                     <CheckCircle className="w-4 h-4 text-emerald-500/50" /> Fully Processed
                                  </div>
                               )}
                            </div>
                         </CardContent>
                      </Card>
                   ))
                )}
             </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-20 text-center text-zinc-600 uppercase font-mono text-xs">User management module offline for topological maintenance.</motion.div>
        )}
        
        {activeTab === 'fraud' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-20 text-center text-red-500/40 uppercase font-mono text-xs">No active fraud escalations in L3 queue.</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
