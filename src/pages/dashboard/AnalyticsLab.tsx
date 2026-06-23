import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export function AnalyticsLab() {
  const keywordData = [
    { name: 'survey apps', searches: 15000, pos: 3, convRate: 2.1 },
    { name: 'make money online', searches: 45000, pos: 12, convRate: 0.5 },
    { name: 'best ai writers', searches: 8000, pos: 2, convRate: 4.5 },
  ];

  const trendData = [
    { name: 'Jan', clicks: 4000, rev: 2400 },
    { name: 'Feb', clicks: 3000, rev: 1398 },
    { name: 'Mar', clicks: 2000, rev: 9800 },
    { name: 'Apr', clicks: 2780, rev: 3908 },
    { name: 'May', clicks: 1890, rev: 4800 },
    { name: 'Jun', clicks: 2390, rev: 3800 },
    { name: 'Jul', clicks: 3490, rev: 4300 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Analytics Lab</h1>
          <p className="text-sm text-zinc-400 mt-1">Deep dive into performance data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-[#111827] border border-zinc-800 rounded-xl p-6">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6">Revenue & Clicks Trajectory</h3>
            <div className="h-72">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={trendData}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                   <XAxis dataKey="name" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                   <YAxis yAxisId="left" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                   <YAxis yAxisId="right" orientation="right" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                   <RechartsTooltip contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}} />
                   <Line yAxisId="left" type="monotone" dataKey="rev" stroke="#10b981" strokeWidth={3} dot={false} />
                   <Line yAxisId="right" type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={3} dot={false} />
                 </LineChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-[#111827] border border-zinc-800 rounded-xl p-6">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6">Keyword Performance</h3>
            <div className="h-72">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={keywordData} layout="vertical" margin={{ left: 40 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                   <XAxis type="number" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                   <YAxis type="category" dataKey="name" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                   <RechartsTooltip contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}} />
                   <Bar dataKey="searches" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
}
