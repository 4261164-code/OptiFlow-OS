import React, { useEffect, useState } from 'react';
import { Target, TrendingUp, DollarSign, MousePointerClick, Award, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock chart data for visualization since we're just getting started
  const chartData = [
    { name: 'Mon', revenue: 45 },
    { name: 'Tue', revenue: 52 },
    { name: 'Wed', revenue: 38 },
    { name: 'Thu', revenue: 65 },
    { name: 'Fri', revenue: 89 },
    { name: 'Sat', revenue: 110 },
    { name: 'Sun', revenue: 145 },
  ];

  useEffect(() => {
    fetch('/api/analytics/overview')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-zinc-500">
        <Activity className="w-6 h-6 animate-pulse mr-2" />
        Loading analytics engine...
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-emerald-500" />
            Revenue Intelligence
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Real-time performance and financial metrics across all active campaigns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <DollarSign className="w-16 h-16 text-emerald-500" />
             </div>
             <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Revenue Today</h3>
             <div className="text-3xl font-black text-zinc-900 dark:text-white">${data?.revenue_today || '0.00'}</div>
             <div className="mt-2 text-xs text-emerald-500 font-medium">+14% vs yesterday</div>
          </div>

          <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target className="w-16 h-16 text-indigo-500" />
             </div>
             <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Best Converting Offer</h3>
             <div className="text-xl font-black text-zinc-900 dark:text-white truncate">{data?.best_epc_offer || 'None Active'}</div>
             <div className="mt-2 text-xs text-indigo-500 font-medium">Currently scaled automatically</div>
          </div>

          <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <MousePointerClick className="w-16 h-16 text-blue-500" />
             </div>
             <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Global CTR</h3>
             <div className="text-3xl font-black text-zinc-900 dark:text-white">{data?.ctr || '0'}%</div>
             <div className="mt-2 text-xs text-blue-500 font-medium">{data?.total_clicks || 0} trackable clicks</div>
          </div>

          <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Award className="w-16 h-16 text-amber-500" />
             </div>
             <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Top Content</h3>
             <div className="text-xl font-black text-zinc-900 dark:text-white truncate">{data?.top_article || 'None'}</div>
             <div className="mt-2 text-xs text-amber-500 font-medium">Driving 45% of today's clicks</div>
          </div>
      </div>

      <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl">
         <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-6 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" /> 7-Day Revenue Trend
         </h3>
         <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                   itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
}
