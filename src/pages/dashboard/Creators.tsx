import React from 'react';
import { Users, Award, DollarSign } from 'lucide-react';

export function Creators() {
  const creators = [
    { name: 'Creator A', clicks: 8500, leads: 420, rev: '$1,200', comm: '$360' },
    { name: 'Creator B', clicks: 6200, leads: 280, rev: '$850', comm: '$255' },
    { name: 'Creator C', clicks: 4100, leads: 150, rev: '$400', comm: '$120' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Creator Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-1">Optilink affiliate network management.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         <div className="bg-[#111827] border border-zinc-800 rounded-xl p-6 relative overflow-hidden col-span-2">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6">Active Creators</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="text-xs uppercase bg-zinc-900/50 text-zinc-500 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-bold">Creator</th>
                    <th className="px-6 py-4 font-bold">Clicks</th>
                    <th className="px-6 py-4 font-bold">Leads</th>
                    <th className="px-6 py-4 font-bold">Generated Rev</th>
                    <th className="px-6 py-4 font-bold">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((c) => (
                    <tr key={c.name} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                      <td className="px-6 py-4 font-medium text-white">{c.name}</td>
                      <td className="px-6 py-4">{c.clicks.toLocaleString()}</td>
                      <td className="px-6 py-4">{c.leads}</td>
                      <td className="px-6 py-4 text-white">{c.rev}</td>
                      <td className="px-6 py-4 font-bold text-emerald-400">{c.comm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         </div>

         <div className="bg-[#111827] border border-zinc-800 rounded-xl p-6 relative">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Award className="w-24 h-24 text-amber-500" />
             </div>
             <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6 flex items-center">
                <Award className="w-4 h-4 mr-2" /> Leaderboard
             </h3>
             <div className="space-y-4">
                 {creators.map((c, i) => (
                     <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                         <div className="flex items-center space-x-3">
                             <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-zinc-400 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-zinc-800'}`}>
                                 {i + 1}
                             </div>
                             <span className="text-white font-medium">{c.name}</span>
                         </div>
                         <span className="text-emerald-400 font-bold">{c.rev}</span>
                     </div>
                 ))}
             </div>
             <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
                 <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                     Manage Payouts & Bonuses &rarr;
                 </button>
             </div>
         </div>
      </div>
    </div>
  );
}
