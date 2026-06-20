import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Transaction } from '../types';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

const NAMES = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"];
const INITIALS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function getAnonymizedName(uid: string) {
  if (!uid) return "Guest U.";
  // Deterministic name based on UID to maintain consistency
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  const nameIndex = Math.abs(hash) % NAMES.length;
  const initialIndex = Math.abs(hash >> 5) % INITIALS.length;
  return `${NAMES[nameIndex]} ${INITIALS[initialIndex]}.`;
}

export const LiveTicker: React.FC = () => {
  const [recentPayouts, setRecentPayouts] = useState<any[]>([]);

  useEffect(() => {
    // Fetch recent transactions and filter client-side to avoid complex composite index requirements
    const q = query(
      collection(db, "transactions"),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      const payouts = snap.docs
        .map(doc => ({ id: doc.id, ...(doc.data() as Transaction) }))
        .filter(t => t.status === "completed" && (t.type === "earn" || t.type === "bonus"))
        .slice(0, 20)
        .map(data => ({
          id: data.id,
          name: getAnonymizedName(data.userId),
          amount: (data.amount / 100).toFixed(2),
          type: data.type,
          timestamp: data.timestamp
        }));
      setRecentPayouts(payouts);
    }, (err) => {
      console.error("LiveTicker error:", err.message);
      setRecentPayouts([]);
    });

    return unsub;
  }, []);

  if (recentPayouts.length === 0) return null;

  // Duplicate items for a seamless loop
  const tickerItems = [...recentPayouts, ...recentPayouts];

  return (
    <div className="w-full bg-emerald-500/5 py-2.5 border-y border-emerald-500/10 overflow-hidden relative z-50">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#06070a] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#06070a] to-transparent z-10" />
      
      <motion.div 
        className="flex gap-16 items-center whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ 
          repeat: Infinity, 
          duration: 35, 
          ease: "linear" 
        }}
      >
        {tickerItems.map((p, idx) => (
          <div key={`${p.id}-${idx}`} className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
               <Zap className="w-2.5 h-2.5 text-emerald-400" />
            </div>
            <span className="text-zinc-100 font-medium text-[11px] tracking-tight">{p.name}</span>
            <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-[0.15em]">earned</span>
            <div className="flex items-center bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
              <span className="text-emerald-400 font-bold font-mono text-[11px]">${p.amount}</span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
