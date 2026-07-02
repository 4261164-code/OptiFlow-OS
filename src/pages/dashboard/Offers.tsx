import React, { useState, useEffect } from 'react';
import { Target, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, limit } from 'firebase/firestore';

export function Offers() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOffers() {
      try {
        const offersSnap = await getDocs(query(collection(db, 'offers'), limit(50)));
        const loaded: any[] = [];
        offersSnap.forEach(doc => {
          loaded.push({ id: doc.id, ...doc.data() });
        });
        setOffers(loaded);
      } catch (e) {
        console.error("Failed to load offers:", e);
      } finally {
        setLoading(false);
      }
    }
    loadOffers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Offer Intelligence</h1>
          <p className="text-sm text-zinc-400 mt-1">Automatic EPC swapping and network intelligence</p>
        </div>
      </div>

      <div className="bg-[#111827] border border-zinc-800 rounded-xl overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs uppercase bg-zinc-900/50 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-bold">Offer / Brand</th>
                <th className="px-6 py-4 font-bold">Link</th>
                <th className="px-6 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {offers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-zinc-600">No offers found.</td>
                </tr>
              ) : (
                offers.map(offer => (
                  <tr key={offer.id} className="border-b border-zinc-800">
                    <td className="px-6 py-4 text-white font-medium">{offer.brand || offer.anchor || 'Unknown'}</td>
                    <td className="px-6 py-4 text-zinc-400 max-w-xs truncate">{offer.link || '-'}</td>
                    <td className="px-6 py-4 text-emerald-400 font-bold">Active</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-20">
            <Zap className="w-24 h-24 text-indigo-500" />
         </div>
         <div className="relative z-10">
           <h3 className="text-indigo-400 font-bold uppercase tracking-wider text-xs mb-2 flex items-center">
             <Target className="w-4 h-4 mr-2" />
             AI Recommendations
           </h3>
           <p className="text-sm text-zinc-300">Run the OptiFlow pipeline to automatically match relevant offers.</p>
         </div>
      </div>
    </div>
  );
}
