import React from 'react';
import { ToggleLeft, ToggleRight, Play } from 'lucide-react';

export function Automations() {
  const automations = [
    { id: 1, name: 'SEO Optimizer', desc: 'Monitors CTR and rankings, queues updates automatically.', status: 'enabled' },
    { id: 2, name: 'Content Generator', desc: 'Drafts articles for missing cluster nodes.', status: 'enabled' },
    { id: 3, name: 'Offer Optimizer', desc: 'Swaps offers based on real-time EPC drops.', status: 'disabled' },
    { id: 4, name: 'Pinterest Publisher', desc: 'Creates and pins graphics for new published posts.', status: 'enabled' },
    { id: 5, name: 'Revenue Analyzer', desc: 'Sends daily AI summary of profit sources.', status: 'enabled' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Automations</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage autonomous workflows.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
         {automations.map(auto => (
             <div key={auto.id} className="bg-[#111827] border border-zinc-800 rounded-xl p-6 flex items-center justify-between">
                 <div>
                     <h3 className="text-lg font-bold text-white flex items-center">
                         {auto.name}
                         {auto.status === 'enabled' ? (
                            <span className="ml-3 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-500">Enabled</span>
                         ) : (
                            <span className="ml-3 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-zinc-500/10 text-zinc-500">Disabled</span>
                         )}
                     </h3>
                     <p className="text-sm text-zinc-400 mt-1">{auto.desc}</p>
                 </div>
                 <div className="flex items-center space-x-4">
                     <button className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center text-sm font-medium bg-indigo-500/10 px-4 py-2 rounded-lg">
                        <Play className="w-4 h-4 mr-2" /> Run Now
                     </button>
                     <button className="text-zinc-500 hover:text-white transition-colors">
                         {auto.status === 'enabled' ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft className="w-8 h-8" />}
                     </button>
                 </div>
             </div>
         ))}
      </div>
    </div>
  );
}
