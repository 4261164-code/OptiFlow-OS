import React from 'react';
import { Mail, Settings2, Play, Users, BarChart3, Clock } from 'lucide-react';

export default function EmailMarketingAgent() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <Mail className="w-8 h-8 mr-3 text-blue-500" />
            Email Marketing Agent
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">Autonomous email sequence drafting, personalization, and deliverability optimization.</p>
        </div>
        <div className="flex gap-3">
           <button className="bg-zinc-900 border border-white/10 hover:border-white/20 text-white px-4 py-2 rounded-xl flex items-center text-sm font-medium transition-all">
             <Settings2 className="w-4 h-4 mr-2" /> Configure
           </button>
           <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center text-sm font-medium shadow-lg shadow-blue-500/20 transition-all">
             <Play className="w-4 h-4 mr-2" /> Start Campaign
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {[
          { label: 'Active Sequences', value: '12', icon: Play, change: '+3' },
          { label: 'Total Subscribers', value: '45.2K', icon: Users, change: '+1.2K' },
          { label: 'Avg Open Rate', value: '38.4%', icon: BarChart3, change: '+2.1%' }
        ].map((k, i) => (
          <div key={i} className="bg-[#0B1017] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors duration-500" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <k.icon className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded-md">{k.change}</span>
            </div>
            <h3 className="text-zinc-400 text-sm font-medium relative z-10">{k.label}</h3>
            <p className="text-3xl font-bold text-white mt-1 tracking-tight relative z-10">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#0B1017] border border-white/5 rounded-2xl p-6">
         <h2 className="text-lg font-bold text-white mb-6">Upcoming Automated Dispatches</h2>
         <div className="space-y-4">
           {[ 
             { title: 'Welcome Sequence - Day 1', audience: 'New Affiliates', time: 'In 2 hours', status: 'Pending' },
             { title: 'Weekly Newsletter', audience: 'All Subscribers', time: 'Tomorrow, 9:00 AM', status: 'Scheduled' },
             { title: 'Abandoned Cart Recovery', audience: 'Cart Abandoners', time: 'Continuous', status: 'Active' },
           ].map((task, i) => (
             <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-lg border border-white/10 bg-zinc-900 flex items-center justify-center">
                   <Clock className="w-5 h-5 text-zinc-400" />
                 </div>
                 <div>
                   <h4 className="text-sm font-bold text-white">{task.title}</h4>
                   <p className="text-xs text-zinc-500 mt-0.5">Audience: {task.audience}</p>
                 </div>
               </div>
               <div className="flex items-center gap-6">
                 <span className="text-xs text-zinc-400 font-mono">{task.time}</span>
                 <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${
                   task.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                   task.status === 'Scheduled' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                 }`}>{task.status}</span>
               </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
