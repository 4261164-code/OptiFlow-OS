import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '../../components/ui';
import { Wallet, ArrowUpRight, ArrowDownRight, History, TrendingUp, Filter, IndianRupee, Landmark, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { Transaction, UserStats } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { cn } from '../../lib/utils';

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [lifetime, setLifetime] = useState(0);
  const [pending, setPending] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    // Listen to user stats
    const unsubStats = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserStats;
        setBalance(data.balance || 0);
        setLifetime(data.lifetimeEarned || 0);
        setPending(data.pendingBalance || 0);
      }
    });

    // Listen to transactions
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsubTx = onSnapshot(q, (snap) => {
      const txs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(txs);
      setLoading(false);
    });

    return () => {
      unsubStats();
      unsubTx();
    };
  }, []);

  // Mock data for chart - in real app, aggregate from transactions
  const chartData = [
    { name: 'Mon', earned: 450 },
    { name: 'Tue', earned: 320 },
    { name: 'Wed', earned: 850 },
    { name: 'Thu', earned: 1200 },
    { name: 'Fri', earned: 900 },
    { name: 'Sat', earned: 2100 },
    { name: 'Sun', earned: 1500 },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Balance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-[#a8ff35] to-[#7dbf25] border-none overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
             <Landmark className="w-24 h-24 text-black" />
           </div>
           <CardContent className="p-8 relative z-10 text-black">
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">Available Balance</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-bold font-mono">${(balance / 100).toFixed(2)}</span>
                <span className="text-sm font-bold opacity-70">USD</span>
              </div>
              <div className="mt-8 flex gap-3">
                 <Button className="bg-black text-white hover:bg-black/80 rounded-xl px-6 text-xs h-9">Withdraw</Button>
                 <Button variant="ghost" className="border border-black/20 text-black hover:bg-black/5 rounded-xl px-6 text-xs h-9">History</Button>
              </div>
           </CardContent>
        </Card>

        <Card className="bg-[#0d0e12] border-white/5 overflow-hidden relative">
           <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Pending Clearances</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-white">${(pending / 100).toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">Estimated clearance: <span className="text-zinc-400">2-4 business days</span></p>
           </CardContent>
        </Card>

        <Card className="bg-[#0d0e12] border-white/5 overflow-hidden relative">
           <CardContent className="p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#a8ff35]/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[#a8ff35]" />
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Lifetime Earnings</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-white">${(lifetime / 100).toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">Across <span className="text-[#a8ff35]">{transactions.length}</span> reward interactions</p>
           </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-[#0d0e12]/60 backdrop-blur-sm border-white/5 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white text-lg">Earnings Velocity</CardTitle>
                <CardDescription className="text-zinc-500 text-xs">Real-time Pulse credit acquisition over 7 days</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 text-[10px] rounded-lg bg-white/5 text-zinc-400">7D</Button>
                <Button variant="ghost" size="sm" className="h-8 text-[10px] rounded-lg text-zinc-600 hover:text-white">30D</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorEarned" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a8ff35" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a8ff35" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1B1E" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#4B4D52', fontSize: 10}} 
                      dy={10}
                    />
                    <YAxis 
                      hide
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1B1E', border: '1px solid #2D2E33', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#a8ff35' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="earned" 
                      stroke="#a8ff35" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorEarned)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0d0e12]/60 backdrop-blur-sm border-white/5">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
               <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-zinc-500" />
                  <CardTitle className="text-white text-lg">Transaction History</CardTitle>
               </div>
               <Button variant="ghost" size="sm" className="h-8 text-[10px] rounded-lg text-zinc-500 hover:text-white">
                  <Filter className="w-3.5 h-3.5 mr-2" /> Filter
               </Button>
            </CardHeader>
            <CardContent className="p-0">
               {loading ? (
                 <div className="p-12 flex justify-center"><div className="w-6 h-6 border-2 border-[#a8ff35] border-t-transparent rounded-full animate-spin" /></div>
               ) : transactions.length === 0 ? (
                 <div className="p-12 text-center text-zinc-600 text-sm">No transaction ledger entries found.</div>
               ) : (
                 <div className="divide-y divide-white/5">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/2 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            tx.amount > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          )}>
                             {tx.amount > 0 ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{tx.description}</p>
                            <p className="text-[10px] text-zinc-600">{new Date(tx.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                           <p className={cn(
                             "font-mono font-bold text-sm",
                             tx.amount > 0 ? "text-emerald-400" : "text-white"
                           )}>
                             {tx.amount > 0 ? '+' : ''}${(tx.amount / 100).toFixed(2)}
                           </p>
                           <span className={cn(
                             "text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded",
                             tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                             tx.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                             'bg-zinc-500/10 text-zinc-500'
                           )}>
                             {tx.status}
                           </span>
                        </div>
                      </div>
                    ))}
                 </div>
               )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info Section */}
        <div className="space-y-6">
          <Card className="bg-white/5 border-white/10 shadow-xl overflow-hidden">
             <div className="bg-[#a8ff35]/10 p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-3xl bg-black flex items-center justify-center mb-4">
                   <Shield className="w-8 h-8 text-[#a8ff35]" />
                </div>
                <h4 className="text-white font-bold leading-tight">Fraud Protection <br/> Shield Active</h4>
             </div>
             <CardContent className="p-6 space-y-4">
                <p className="text-zinc-500 text-[11px] leading-relaxed">
                  Every Pulse interaction is cryptographically verified against provider postbacks. High-velocity clicks or suspicious IP ranges may trigger a manual audit trail.
                </p>
                <div className="space-y-2">
                   <div className="flex items-center justify-between text-[10px] px-3 py-2 bg-black/40 rounded-lg">
                      <span className="text-zinc-500">Security Level</span>
                      <span className="text-[#a8ff35] font-bold">LEGACY-L3</span>
                   </div>
                   <div className="flex items-center justify-between text-[10px] px-3 py-2 bg-black/40 rounded-lg">
                      <span className="text-zinc-500">Last Audit</span>
                      <span className="text-zinc-300 font-bold">12m ago</span>
                   </div>
                </div>
             </CardContent>
          </Card>

          <div className="bg-gradient-to-br from-[#0d0e12] to-black rounded-2xl border border-white/5 p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-[#a8ff35]/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <h4 className="text-[#a8ff35] font-bold text-sm mb-2">Want to earn faster?</h4>
            <p className="text-zinc-500 text-xs mb-6 leading-relaxed">
              Unlock Silver Tier to receive a 1.5x multiplier on all offer commissions.
            </p>
            <Button className="w-full bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs h-10 group-hover:bg-zinc-800 transition-all">
              Upgrade Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
