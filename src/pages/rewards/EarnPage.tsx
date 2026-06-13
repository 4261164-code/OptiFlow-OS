import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input } from '../../components/ui';
import { Coins, Flame, Star, Zap, Landmark, ExternalLink, ShieldCheck, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../../lib/auth';
import { useNotifications } from '../../components/NotificationContext';
import { cn } from '../../lib/utils';

export default function EarnPage() {
  const [balance, setBalance] = useState(0);
  const [streak, setStreak] = useState(0);
  const [claimedToday, setClaimedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBalance(data.balance || 0);
        setStreak(data.streakDays || 0);
        setClaimedToday(data.streakClaimedToday || false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleClaimStreak = async () => {
    setClaiming(true);
    try {
      const res = await apiFetch('/api/claim-streak', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addNotification('milestone', "Streak Bonus!", data.message);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      addNotification('error', "Claim Failed", err.message);
    } finally {
      setClaiming(false);
    }
  };

  const offers = [
    {
      id: 'offer-1',
      title: 'Premium Survey Pulse',
      description: 'Complete a high-fidelity market research survey about AI tools.',
      reward: '$2.50',
      category: 'Surveys',
      provider: 'PollFish',
      difficulty: 'Easy'
    },
    {
      id: 'offer-2',
      title: 'Crypto App Signup',
      description: 'Download and verify your account on a top-tier crypto exchange.',
      reward: '$15.00',
      category: 'Signups',
      provider: 'AdGem',
      difficulty: 'Medium'
    },
    {
      id: 'offer-3',
      title: 'Mobile Adventure Quest',
      description: 'Reach Level 20 in this epic fantasy RPG mobile game.',
      reward: '$8.75',
      category: 'Games',
      provider: 'OfferToro',
      difficulty: 'Hard'
    },
    {
      id: 'offer-4',
      title: 'Quick Content View',
      description: 'Watch a short video about the latest marketing trends.',
      reward: '$0.15',
      category: 'Videos',
      provider: 'Lootably',
      difficulty: 'Easy'
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#a8ff35]/10 via-[#0d0e12] to-black border border-white/5 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#a8ff35]/10 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a8ff35]/10 border border-[#a8ff35]/20 text-[#a8ff35] text-xs font-bold uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" /> Earning Potential Active
            </div>
            <h1 className="text-4xl md:text-5xl font-sans font-bold tracking-tight text-white leading-tight">
              Turn your interactions <br /> into <span className="text-[#a8ff35]">Pulse Credits</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-xl">
              Complete high-reward tasks, take research surveys, and maintain your daily streak to maximize your payouts.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[24px] flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-[#a8ff35]/20 flex items-center justify-center mb-3">
                <Coins className="w-5 h-5 text-[#a8ff35]" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Pulse Balance</span>
              <span className="text-2xl font-mono font-bold text-white">${(balance / 100).toFixed(2)}</span>
            </div>
            <div className={cn(
              "bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[24px] flex flex-col items-center justify-center text-center transition-all duration-500",
              claimedToday ? "border-emerald-500/30" : "animate-pulse border-[#a8ff35]/30"
            )}>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors",
                claimedToday ? "bg-emerald-500/20" : "bg-[#a8ff35]/20"
              )}>
                <Flame className={cn("w-5 h-5", claimedToday ? "text-emerald-400" : "text-[#a8ff35]")} />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Streak Day</span>
              <span className="text-2xl font-mono font-bold text-white">{streak}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Bonus Section */}
      <AnimatePresence>
        {!claimedToday && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
          >
            <Card className="bg-[#a8ff35]/10 border-[#a8ff35]/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4">
                <Star className="w-12 h-12 text-[#a8ff35]/20 rotate-12" />
              </div>
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#a8ff35] flex items-center justify-center shadow-[0_0_30px_rgba(168,255,53,0.3)]">
                    <Gift className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">Claim your Daily Pulse!</h3>
                    <p className="text-zinc-400 text-sm">Maintain your {streak + 1} day streak to earn larger bonuses.</p>
                  </div>
                </div>
                <Button 
                  onClick={handleClaimStreak} 
                  disabled={claiming}
                  className="bg-[#a8ff35] text-black font-bold h-12 px-10 rounded-2xl shadow-xl hover:bg-[#92ec1d] transition-all"
                >
                  {claiming ? "Claiming..." : "Claim Daily Bonus"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offers Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-sans font-bold text-white flex items-center gap-3">
            Available Tasks <span className="text-xs font-mono font-normal bg-white/5 py-1 px-2 rounded-lg text-zinc-500">{offers.length} active</span>
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full border-white/5">Filter</Button>
            <Button variant="outline" size="sm" className="rounded-full border-white/5">Sort</Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {offers.map((offer) => (
            <Card key={offer.id} className="bg-[#0d0e12]/60 backdrop-blur-sm border border-white/5 hover:border-[#a8ff35]/30 transition-all duration-300 group overflow-hidden">
              <div className="h-1 bg-white/5 group-hover:bg-[#a8ff35]/30 transition-all" />
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#a8ff35] bg-[#a8ff35]/5 px-2 py-0.5 rounded border border-[#a8ff35]/10">
                    {offer.category}
                  </span>
                  <span className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded",
                    offer.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                    offer.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-red-500/10 text-red-400'
                  )}>
                    {offer.difficulty}
                  </span>
                </div>
                <CardTitle className="text-lg text-white font-bold leading-tight group-hover:text-[#a8ff35] transition-colors">{offer.title}</CardTitle>
                <CardDescription className="text-zinc-500 text-xs mt-1">{offer.provider}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-zinc-400 text-xs line-clamp-3 h-[48px]">
                  {offer.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold">Reward</span>
                    <span className="text-xl font-mono font-bold text-[#a8ff35]">{offer.reward}</span>
                  </div>
                  <Button size="sm" className="bg-white/5 hover:bg-[#a8ff35] hover:text-black rounded-xl border border-white/10 group-hover:shadow-[0_0_15px_rgba(168,255,53,0.2)]">
                    Start <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Trust Banner */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-[#a8ff35]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Verified Offers</h4>
            <p className="text-xs text-zinc-500 uppercase tracking-tighter">Every endpoint cryptographically vetted</p>
          </div>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-[#a8ff35]">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Instant Crediting</h4>
            <p className="text-xs text-zinc-500 uppercase tracking-tighter">Atomic state logic for real-time pulses</p>
          </div>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-[#a8ff35]">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Infinite Scaling</h4>
            <p className="text-xs text-zinc-500 uppercase tracking-tighter">No earnings cap across L3 reward sets</p>
          </div>
        </div>
      </div>
    </div>
  );
}
