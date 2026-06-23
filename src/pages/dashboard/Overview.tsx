import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, where, limit } from 'firebase/firestore';
import { Activity, MousePointerClick, DollarSign, ExternalLink, RefreshCw, BarChart2, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Overview() {
  const [metrics, setMetrics] = useState({
    revenueToday: 0,
    revenueMonth: 0,
    clicksToday: 0,
    conversionsToday: 0,
    avgEpc: 0,
    avgCtr: 0,
    publishedArticles: 0,
    activeOffers: 0,
  });

  const chartData: any[] = [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-sm text-zinc-400 mt-1">CEO Revenue Operations Center</p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 flex items-center rounded-md font-medium text-sm transition-colors">
          <RefreshCw className="w-4 h-4 mr-2" />
          Sync Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Revenue Today" value={`$${metrics.revenueToday}`} icon={<DollarSign className="w-5 h-5 text-emerald-500" />} />
        <MetricCard title="Revenue This Month" value={`$${metrics.revenueMonth}`} icon={<DollarSign className="w-5 h-5 text-emerald-500" />} />
        <MetricCard title="Clicks Today" value={metrics.clicksToday.toString()} icon={<MousePointerClick className="w-5 h-5 text-blue-500" />} />
        <MetricCard title="Conversions Today" value={metrics.conversionsToday.toString()} icon={<Activity className="w-5 h-5 text-indigo-500" />} />
        <MetricCard title="Average EPC" value={`$${metrics.avgEpc}`} icon={<TrendingUp className="w-5 h-5 text-amber-500" />} />
        <MetricCard title="Average CTR" value={`${metrics.avgCtr}%`} icon={<BarChart2 className="w-5 h-5 text-purple-500" />} />
        <MetricCard title="Published Articles" value={metrics.publishedArticles.toString()} icon={<ExternalLink className="w-5 h-5 text-zinc-500" />} />
        <MetricCard title="Active Offers" value={metrics.activeOffers.toString()} icon={<ExternalLink className="w-5 h-5 text-zinc-500" />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-[#111827] border border-zinc-800 rounded-xl p-6">
          <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6">Revenue Trend</h3>
          <div className="h-64 flex items-center justify-center text-zinc-600">No data available</div>
        </div>

        <div className="bg-[#111827] border border-zinc-800 rounded-xl p-6">
          <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6">Traffic Trend</h3>
          <div className="h-64 flex items-center justify-center text-zinc-600">No data available</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
         <div className="bg-[#111827] border border-zinc-800 rounded-xl p-6">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-4">Top Articles</h3>
            <div className="space-y-4 text-zinc-600">
               No articles found.
            </div>
         </div>
         <div className="bg-[#111827] border border-zinc-800 rounded-xl p-6">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-4">Top Offers</h3>
            <div className="space-y-4 text-zinc-600">
               No offers found.
            </div>
         </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-[#111827] border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
       <div className="flex justify-between items-start mb-4">
         <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider">{title}</h3>
         {icon}
       </div>
       <div className="text-2xl lg:text-3xl font-bold text-white tracking-tight">{value}</div>
    </div>
  )
}
