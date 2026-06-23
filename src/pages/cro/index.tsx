import React from 'react';
import { TrendingUp, Settings2, Sparkles, MousePointerClick, ArrowUpCircle } from 'lucide-react';

export default function CROAgent() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <TrendingUp className="w-8 h-8 mr-3 text-orange-500" />
            Conversion Target Optimizer
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">A/B tests components, injects urgency banners, and calculates max allowable CPA.</p>
        </div>
        <div className="flex gap-3">
           <button className="bg-zinc-900 border border-white/10 hover:border-white/20 text-white px-4 py-2 rounded-xl flex items-center text-sm font-medium transition-all">
             <Settings2 className="w-4 h-4 mr-2" /> Global Tests
           </button>
           <button className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl flex items-center text-sm font-medium shadow-lg shadow-orange-500/20 transition-all">
             <Sparkles className="w-4 h-4 mr-2" /> Deploy Split
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {[
          { label: 'Active Live Tests', value: '4', icon: Sparkles, color: 'orange' },
          { label: 'Lift Generated (30d)', value: '+14.2%', icon: ArrowUpCircle, color: 'emerald' },
          { label: 'Total Conversions', value: '3,291', icon: MousePointerClick, color: 'blue' }
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
         <h2 className="text-lg font-bold text-white mb-6">Running A/B Variants</h2>
         <div className="space-y-4">
           {[ 
             { title: 'Button Color Testing - "Get Started"', var1: 'Blue (Control)', var2: 'Emerald (+4.1% CTR)', status: 'Winning' },
             { title: 'Headline Test - Homepage Hero', var1: '"Best Software"', var2: '"Unlock Revenue" (-1.2% CTR)', status: 'Losing' },
             { title: 'Urgency Banner on Affiliate List', var1: 'No Banner', var2: 'Limited Time Offer (+18% CTR)', status: 'Winner Declared' },
           ].map((item, i) => (
             <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
               <div className="flex flex-col">
                   <h4 className="text-sm font-bold text-white">{item.title}</h4>
                   <div className="flex gap-4 mt-2">
                      <span className="text-xs text-zinc-500">Var A: {item.var1}</span>
                      <span className="text-xs text-zinc-500">Var B: {item.var2}</span>
                   </div>
               </div>
               <button className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${item.status === 'Winner Declared' ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400'}`}>
                 {item.status === 'Winner Declared' ? 'Locked' : 'Halt Test'}
               </button>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
