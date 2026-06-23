import React from 'react';
import { Network, Link2, Settings2, GitBranch, ShieldAlert } from 'lucide-react';

export default function InternalLinkingAgent() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <Network className="w-8 h-8 mr-3 text-emerald-500" />
            Internal Linking Agent
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">Semantic analysis of content clusters to auto-inject contextual internal links.</p>
        </div>
        <div className="flex gap-3">
           <button className="bg-zinc-900 border border-white/10 hover:border-white/20 text-white px-4 py-2 rounded-xl flex items-center text-sm font-medium transition-all">
             <Settings2 className="w-4 h-4 mr-2" /> Silo Configurations
           </button>
           <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center text-sm font-medium shadow-lg shadow-emerald-500/20 transition-all">
             <GitBranch className="w-4 h-4 mr-2" /> Run Link Injector
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {[
          { label: 'Total Internal Links', value: '14,293', icon: Link2, color: 'emerald' },
          { label: 'Orphan Pages', value: '3', icon: ShieldAlert, color: 'rose' },
          { label: 'Avg Links Per Page', value: '12.4', icon: Network, color: 'blue' }
        ].map((k, i) => (
          <div key={i} className="bg-[#0B1017] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${k.color}-500/5 rounded-full blur-3xl group-hover:bg-${k.color}-500/10 transition-colors duration-500`} />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3 bg-${k.color}-500/10 rounded-xl`}>
                <k.icon className={`w-6 h-6 text-${k.color}-400`} />
              </div>
            </div>
            <h3 className="text-zinc-400 text-sm font-medium relative z-10">{k.label}</h3>
            <p className="text-3xl font-bold text-white mt-1 tracking-tight relative z-10">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#0B1017] border border-white/5 rounded-2xl p-6">
         <h2 className="text-lg font-bold text-white mb-6">Orphan Pages Detected</h2>
         <div className="space-y-4">
           {[ 
             { title: 'Privacy Policy Update', category: 'Legal', discovered: '2 days ago' },
             { title: 'Black Friday Deals 2024 (Draft)', category: 'Campaigns', discovered: '4 hrs ago' },
             { title: 'Old Webinar Replay', category: 'Uncategorized', discovered: '1 month ago' },
           ].map((item, i) => (
             <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
               <div className="flex flex-col">
                   <h4 className="text-sm font-bold text-white">{item.title}</h4>
                   <div className="flex gap-4 mt-2">
                      <span className="text-xs text-zinc-500">Folder: {item.category}</span>
                      <span className="text-xs text-zinc-500">Discovered: {item.discovered}</span>
                   </div>
               </div>
               <button className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition-colors">
                 Auto-Link
               </button>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
