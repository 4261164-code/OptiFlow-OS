import React from 'react';
import { Target, ArrowRight, Zap, RefreshCw } from 'lucide-react';

export function Offers() {
  const offers: any[] = [];

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
                <th className="px-6 py-4 font-bold">Offer</th>
                <th className="px-6 py-4 font-bold">Clicks</th>
                <th className="px-6 py-4 font-bold">Conversions</th>
                <th className="px-6 py-4 font-bold">EPC</th>
                <th className="px-6 py-4 font-bold">Revenue</th>
                <th className="px-6 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-zinc-600">No offers found.</td>
              </tr>
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
           <p className="text-sm text-zinc-300">No active AI recommendations at this time.</p>
         </div>
      </div>
    </div>
  );
}
