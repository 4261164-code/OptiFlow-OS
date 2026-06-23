import React from 'react';
import { RefreshCw, Settings2, FileSignature, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function ContentRefreshAgent() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <RefreshCw className="w-8 h-8 mr-3 text-purple-500" />
            Content Refresh Agent
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">Autonomous detection of decaying content and automatic SEO rewriting.</p>
        </div>
        <div className="flex gap-3">
           <button className="bg-zinc-900 border border-white/10 hover:border-white/20 text-white px-4 py-2 rounded-xl flex items-center text-sm font-medium transition-all">
             <Settings2 className="w-4 h-4 mr-2" /> Schedule Settings
           </button>
           <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl flex items-center text-sm font-medium shadow-lg shadow-purple-500/20 transition-all">
             <RefreshCw className="w-4 h-4 mr-2" /> Trigger Sweep
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {[
          { label: 'Articles Scanned', value: '1,204', icon: FileSignature, color: 'purple' },
          { label: 'Decaying Identified', value: '42', icon: AlertTriangle, color: 'amber' },
          { label: 'Refreshed Today', value: '8', icon: CheckCircle2, color: 'emerald' }
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
         <h2 className="text-lg font-bold text-white mb-6">Decaying Content Queue</h2>
         <div className="space-y-4">
           {[ 
             { title: 'Top 10 CRM Tools 2023', rankDrop: '-4 spots', estTrafficLoss: '340 visits/mo', rewritePriority: 'High' },
             { title: 'Best Email Marketing Platforms', rankDrop: '-2 spots', estTrafficLoss: '120 visits/mo', rewritePriority: 'Medium' },
             { title: 'Hubspot vs Salesforce Comparison', rankDrop: '-1 spot', estTrafficLoss: '45 visits/mo', rewritePriority: 'Low' },
           ].map((item, i) => (
             <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
               <div className="flex flex-col">
                   <h4 className="text-sm font-bold text-white">{item.title}</h4>
                   <div className="flex gap-4 mt-2">
                      <span className="text-xs text-rose-400 flex items-center"><ArrowRight className="w-3 h-3 mr-1 inline transform rotate-45"/> {item.rankDrop}</span>
                      <span className="text-xs text-zinc-500">Loss: {item.estTrafficLoss}</span>
                   </div>
               </div>
               <button className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-xs font-bold transition-colors">
                 Force Rewrite
               </button>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
