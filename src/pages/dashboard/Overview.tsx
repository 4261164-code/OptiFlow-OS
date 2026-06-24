import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, where, limit } from 'firebase/firestore';
import { Activity, MousePointerClick, DollarSign, ExternalLink, RefreshCw, BarChart2, TrendingUp, LucideIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { IconWrapper } from '../../components/ui/IconWrapper';
import { cn } from '../../lib/utils';

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
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tighter">Overview</h1>
          <p className="text-sm text-zinc-400 mt-2">CEO Revenue Operations Center</p>
        </div>
        <button className="bg-primary text-black px-6 py-2.5 flex items-center rounded-lg font-bold text-sm transition-all hover:bg-primary-hover shadow-lg shadow-primary/10">
          <RefreshCw className="w-4 h-4 mr-2" />
          Sync Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Revenue Today" value={`$${metrics.revenueToday}`} icon={DollarSign} iconColor="text-emerald-500" />
        <MetricCard title="Revenue This Month" value={`$${metrics.revenueMonth}`} icon={DollarSign} iconColor="text-emerald-500" />
        <MetricCard title="Clicks Today" value={metrics.clicksToday.toString()} icon={MousePointerClick} iconColor="text-blue-500" />
        <MetricCard title="Conversions Today" value={metrics.conversionsToday.toString()} icon={Activity} iconColor="text-indigo-500" />
        <MetricCard title="Average EPC" value={`$${metrics.avgEpc}`} icon={TrendingUp} iconColor="text-amber-500" />
        <MetricCard title="Average CTR" value={`${metrics.avgCtr}%`} icon={BarChart2} iconColor="text-purple-500" />
        <MetricCard title="Published Articles" value={metrics.publishedArticles.toString()} icon={ExternalLink} iconColor="text-zinc-500" />
        <MetricCard title="Active Offers" value={metrics.activeOffers.toString()} icon={ExternalLink} iconColor="text-zinc-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="executive-card p-8">
          <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-8">Revenue Trend</h3>
          <div className="h-64 flex flex-col items-center justify-center text-zinc-600 gap-4">
             <BarChart2 className="w-12 h-12 opacity-20" />
             <p className="text-sm font-mono">No telemetry data available</p>
          </div>
        </div>

        <div className="executive-card p-8">
          <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-8">Traffic Trend</h3>
          <div className="h-64 flex flex-col items-center justify-center text-zinc-600 gap-4">
             <Activity className="w-12 h-12 opacity-20" />
             <p className="text-sm font-mono">No telemetry data available</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="executive-card p-8">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6">Top Articles</h3>
            <div className="space-y-4 text-zinc-600 font-mono text-sm">
               No articles found.
            </div>
         </div>
         <div className="executive-card p-8">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6">Top Offers</h3>
            <div className="space-y-4 text-zinc-600 font-mono text-sm">
               No offers found.
            </div>
         </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, iconColor }: { title: string, value: string | number, icon: LucideIcon, iconColor: string }) {
  return (
    <div className="executive-card p-5 flex flex-col justify-between">
       <div className="flex justify-between items-start mb-4">
         <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider">{title}</h3>
         <IconWrapper icon={icon} className={cn(iconColor)} />
       </div>
       <div className="text-2xl lg:text-3xl font-bold text-white tracking-tight font-mono">{value}</div>
    </div>
  )
}
