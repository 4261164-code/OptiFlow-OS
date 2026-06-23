import React from 'react';
import { DollarSign, Settings2, Sigma, Activity, PieChart } from 'lucide-react';

export default function ForecastAgent() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <DollarSign className="w-8 h-8 mr-3 text-cyan-500" />
            Revenue Forecaster
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">Predictive yield modeling based on current traffic trajectories and historical EPC.</p>
        </div>
        <div className="flex gap-3">
           <button className="bg-zinc-900 border border-white/10 hover:border-white/20 text-white px-4 py-2 rounded-xl flex items-center text-sm font-medium transition-all">
             <Settings2 className="w-4 h-4 mr-2" /> Model Params
           </button>
           <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl flex items-center text-sm font-medium shadow-lg shadow-cyan-500/20 transition-all">
             <Sigma className="w-4 h-4 mr-2" /> Recalculate Trajectory
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {[
          { label: 'EOM Revenue Prediction', value: '$24,500.00', icon: DollarSign, color: 'cyan' },
          { label: 'Variance confidence', value: '± 4.2%', icon: Activity, color: 'indigo' },
          { label: 'Top Contributor', value: 'Software List', icon: PieChart, color: 'emerald' }
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
         <h2 className="text-lg font-bold text-white mb-6">Traffic-Yield Projections</h2>
         <div className="space-y-4">
           {[ 
             { title: 'Best CRM for Startups', currentRev: '$1,240', projected: '$2,800', velocity: 'Accelerating' },
             { title: 'Email vs SMS Marketing', currentRev: '$840', projected: '$900', velocity: 'Stagnant' },
             { title: 'ClickFunnels Review', currentRev: '$3,100', projected: '$4,500', velocity: 'Accelerating' },
           ].map((item, i) => (
             <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
               <div className="flex flex-col">
                   <h4 className="text-sm font-bold text-white">{item.title}</h4>
                   <div className="flex gap-4 mt-2">
                      <span className="text-xs text-zinc-500">Yield ytd: {item.currentRev}</span>
                      <span className="text-xs text-cyan-400 font-bold">Proj EOM: {item.projected}</span>
                   </div>
               </div>
               <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${item.velocity === 'Accelerating' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                 {item.velocity}
               </span>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
