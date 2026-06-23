import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, AlertTriangle, FileText, BarChart, FileSignature, Users, Zap, LineChart } from 'lucide-react';
import { auth } from '../../lib/firebase';

interface ExecutiveReport {
  timestamp: string;
  revenue: {
    yesterday: number;
    last7Days: number;
    last30Days: number;
  };
  traffic: {
    topSources: Array<{ source: string; visits: number }>;
    fastestGrowingPages: Array<{ page: string; growth: number }>;
    highestCtrPages: Array<{ page: string; ctr: number }>;
  };
  affiliatePerformance: {
    highestEpcOffers: Array<{ offer: string; epc: number }>;
    highestRevenueOffers: Array<{ offer: string; revenue: number }>;
    underperformingOffers: Array<{ offer: string; reason: string }>;
  };
  contentPerformance: {
    topArticles: Array<{ title: string; views: number }>;
    decliningArticles: Array<{ title: string; drop: number }>;
    refreshOpportunities: Array<{ title: string; reason: string }>;
  };
  creatorPerformance: {
    topCreators: Array<{ name: string; revenue: number }>;
    conversionLeaders: Array<{ name: string; cvr: number }>;
    commissionLeaders: Array<{ name: string; commissions: number }>;
  };
  forecasting: {
    expectedMonthlyRevenue: number;
    expectedTrafficGrowth: number;
    expectedConversionGrowth: number;
  };
  actions: string[];
}

export const BusinessAnalystCard = () => {
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch('/api/analyst/generate-report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data && data.revenue) {
        setReport(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading || !report) {
    return (
      <div className="w-full bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 rounded-xl p-8 text-center mt-6">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
         <p className="mt-4 text-zinc-500 font-semibold text-sm uppercase">AI Analyst is compiling today's executive briefing...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
        <div>
          <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-100 flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            AI Executive Intelligence Brief
          </h2>
          <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">Generated: {new Date(report.timestamp).toLocaleString()}</p>
        </div>
        <button onClick={fetchReport} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">
          Refresh Brief
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl md:col-span-1 border-t-4 border-t-emerald-500">
           <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center"><TrendingUp className="w-4 h-4 mr-2"/> Revenue Pulse</h3>
           <div className="space-y-4">
              <div className="flex justify-between items-baseline border-b border-zinc-100 dark:border-zinc-850 pb-2">
                 <span className="text-zinc-600 dark:text-zinc-400 text-sm">Yesterday</span>
                 <span className="text-lg font-bold dark:text-white">${report.revenue.yesterday.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-zinc-100 dark:border-zinc-850 pb-2">
                 <span className="text-zinc-600 dark:text-zinc-400 text-sm">Last 7 Days</span>
                 <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">${report.revenue.last7Days.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2">
                 <span className="text-zinc-600 dark:text-zinc-400 text-sm">Monthly Run Rate</span>
                 <span className="text-xl font-black dark:text-white">${report.revenue.last30Days.toFixed(2)}</span>
              </div>
           </div>
        </div>

        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl md:col-span-1 border-t-4 border-t-cyan-500">
           <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center"><LineChart className="w-4 h-4 mr-2"/> Forecasting</h3>
           <div className="space-y-4">
              <div className="flex justify-between items-baseline border-b border-zinc-100 dark:border-zinc-850 pb-2">
                 <span className="text-zinc-600 dark:text-zinc-400 text-sm">EOM Projection</span>
                 <span className="text-lg font-bold dark:text-white text-cyan-500">${report.forecasting.expectedMonthlyRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-zinc-100 dark:border-zinc-850 pb-2">
                 <span className="text-zinc-600 dark:text-zinc-400 text-sm">Traffic Trajectory</span>
                 <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{report.forecasting.expectedTrafficGrowth}%</span>
              </div>
              <div className="flex justify-between items-baseline pt-2">
                 <span className="text-zinc-600 dark:text-zinc-400 text-sm">CVR Lift</span>
                 <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{report.forecasting.expectedConversionGrowth}%</span>
              </div>
           </div>
        </div>

        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl col-span-2 border-t-4 border-t-indigo-500 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
           <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center relative z-10"><Zap className="w-4 h-4 mr-2"/> Default Strategic Actions</h3>
           <ul className="space-y-3 relative z-10">
              {report.actions.map((action, i) => (
                <li key={i} className="flex items-start bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100/50 dark:border-indigo-800/30">
                   <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold mr-3">{i+1}</span>
                   <span className="text-zinc-800 dark:text-zinc-200 text-sm font-medium">{action}</span>
                </li>
              ))}
           </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl">
           <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center">
             <Trophy className="w-4 h-4 mr-2" /> Top Affiliate Offers
           </h3>
           <div className="space-y-4">
             {report.affiliatePerformance.highestRevenueOffers.map((o, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-2">
                   <span className="text-zinc-800 dark:text-zinc-200 text-sm font-bold">{o.offer}</span>
                   <span className="text-emerald-600 dark:text-emerald-400 font-bold">${o.revenue}</span>
                </div>
             ))}
             {report.affiliatePerformance.underperformingOffers.map((o, idx) => (
                <div key={idx} className="bg-rose-50 dark:bg-rose-900/10 p-3 rounded-lg border border-rose-100 dark:border-rose-900/30 mt-4">
                   <div className="font-bold text-rose-900 dark:text-rose-400 text-sm flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> Action Needed: {o.offer}</div>
                   <div className="text-xs text-rose-600 dark:text-rose-500 mt-1">{o.reason}</div>
                   <button className="mt-2 text-[10px] uppercase font-bold tracking-wider text-rose-100 bg-rose-500/80 px-2 py-1 rounded">Replace Offer</button>
                </div>
             ))}
           </div>
        </div>

        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl">
           <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center">
             <FileSignature className="w-4 h-4 mr-2" /> Content Intelligence
           </h3>
           <div className="space-y-4">
              {report.contentPerformance.topArticles.slice(0, 1).map((a, i) => (
                 <div key={i} className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-2">
                    <span className="text-zinc-800 dark:text-zinc-200 text-sm font-bold truncate pr-3">{a.title}</span>
                    <span className="text-blue-500 font-bold text-xs">{a.views} views</span>
                 </div>
              ))}
              {report.contentPerformance.decliningArticles.slice(0, 1).map((a, idx) => (
                 <div key={idx} className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-2">
                    <span className="text-zinc-800 dark:text-zinc-500 text-sm font-medium truncate pr-3">{a.title}</span>
                    <span className="text-rose-500 font-bold text-xs">-{a.drop}%</span>
                 </div>
              ))}
              {report.contentPerformance.refreshOpportunities.map((o, idx) => (
                 <div key={idx} className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30 mt-4">
                    <div className="font-bold text-amber-900 dark:text-amber-400 text-sm">{o.title}</div>
                    <div className="text-xs text-amber-600 dark:text-amber-500 mt-1">{o.reason}</div>
                    <button className="mt-2 text-[10px] uppercase font-bold tracking-wider text-amber-900 bg-amber-400/50 px-2 py-1 rounded">Send to Refresh Agent</button>
                 </div>
              ))}
           </div>
        </div>

        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl">
           <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center">
             <Users className="w-4 h-4 mr-2" /> Creator Performance
           </h3>
           <div className="space-y-4">
              <div className="mb-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">Top Earner</div>
              {report.creatorPerformance.topCreators.slice(0, 1).map((c, i) => (
                 <div key={i} className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-2">
                    <span className="text-zinc-800 dark:text-zinc-200 text-sm font-bold">{c.name}</span>
                    <span className="text-emerald-500 font-bold text-sm">${c.revenue}</span>
                 </div>
              ))}
              <div className="mt-4 mb-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">Conversion Leader</div>
              {report.creatorPerformance.conversionLeaders.slice(0, 1).map((c, i) => (
                 <div key={i} className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-2">
                    <span className="text-zinc-800 dark:text-zinc-200 text-sm font-bold">{c.name}</span>
                    <span className="text-indigo-500 font-bold text-sm">{c.cvr}% CVR</span>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
