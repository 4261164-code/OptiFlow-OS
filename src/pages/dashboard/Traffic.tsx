import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function Traffic() {
  const sources = [
    { name: 'Google (SEO)', visits: 45000, rev: '$4,200', epc: '$0.09', conv: '1.2%' },
    { name: 'Pinterest', visits: 12000, rev: '$1,100', epc: '$0.09', conv: '1.4%' },
    { name: 'Direct', visits: 3000, rev: '$450', epc: '$0.15', conv: '2.1%' },
    { name: 'Email', visits: 8500, rev: '$1,800', epc: '$0.21', conv: '3.5%' },
  ];

  const pieData = [
    { name: 'Google', value: 45000, color: '#3b82f6' },
    { name: 'Pinterest', value: 12000, color: '#ef4444' },
    { name: 'Direct', value: 3000, color: '#8b5cf6' },
    { name: 'Email', value: 8500, color: '#10b981' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Traffic Intelligence</h1>
          <p className="text-sm text-zinc-400 mt-1">Know exactly where the money comes from.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111827] border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="text-xs uppercase bg-zinc-900/50 text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-bold">Source</th>
                  <th className="px-6 py-4 font-bold">Visits</th>
                  <th className="px-6 py-4 font-bold">Revenue</th>
                  <th className="px-6 py-4 font-bold">EPC</th>
                  <th className="px-6 py-4 font-bold">Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.name} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                    <td className="px-6 py-4 font-medium text-white">{s.name}</td>
                    <td className="px-6 py-4">{s.visits.toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-emerald-400">{s.rev}</td>
                    <td className="px-6 py-4 text-white">{s.epc}</td>
                    <td className="px-6 py-4 text-indigo-400">{s.conv}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#111827] border border-zinc-800 rounded-xl p-6 flex flex-col justify-center">
          <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6 text-center">Traffic by Source</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center text-xs text-zinc-400">
                 <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: d.color }}></span>
                 {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
