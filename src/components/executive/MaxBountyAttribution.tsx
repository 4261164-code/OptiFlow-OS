import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, DollarSign, Activity, AlertCircle, RefreshCw, BarChart, Trophy, Zap, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../../lib/auth';

export function MaxBountyAttribution() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchIntelligence();
  }, []);

  const fetchIntelligence = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/maxbounty/intelligence');
      const responseBody = await res.json();
      if (responseBody.success) {
        setData(responseBody.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full text-center p-12 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 rounded-xl mt-6">
         <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
         <p className="text-zinc-500 font-semibold text-sm uppercase">Aggregating Attribution Telemetry...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 mt-6">
      {/* KPI Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl">
           <div className="flex items-center text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <DollarSign className="w-4 h-4 mr-1 text-emerald-400" /> System EPC
           </div>
           <div className="text-3xl font-bold text-gray-900 dark:text-white">${data.epc.toFixed(2)}</div>
           <div className="text-xs text-zinc-500 mt-2">Network-wide average earnings per click</div>
        </div>

        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl">
           <div className="flex items-center text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <Activity className="w-4 h-4 mr-1 text-indigo-400" /> Conversion Rate
           </div>
           <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.conversionRate.toFixed(2)}%</div>
           <div className="text-xs text-zinc-500 mt-2">Global aggregate conversion rate</div>
        </div>

        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl">
           <div className="flex items-center text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <Target className="w-4 h-4 mr-1 text-purple-400" /> Rev. Per Visitor
           </div>
           <div className="text-3xl font-bold text-gray-900 dark:text-white">${data.revenuePerVisitor.toFixed(2)}</div>
           <div className="text-xs text-zinc-500 mt-2">Effective user yield</div>
        </div>

        <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl">
           <div className="flex items-center text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <BarChart className="w-4 h-4 mr-1 text-amber-400" /> Tracked Channels
           </div>
           <div className="text-3xl font-bold text-gray-900 dark:text-white">{Object.keys(data.revenuePerArticle).length}</div>
           <div className="text-xs text-zinc-500 mt-2">Active mapped traffic content endpoints</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Action Recommendations */}
        <div className="lg:col-span-1 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl space-y-4">
           <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide flex items-center mb-4">
              <Zap className="w-4 h-4 text-indigo-400 mr-2" /> AI Attribution Agent
           </h3>
           <div className="space-y-4">
             {data.aiRecommendations.map((rec: string, index: number) => (
                <div key={index} className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-850">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{rec}</p>
                </div>
             ))}
           </div>
        </div>

        {/* Offers Analysis */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide flex items-center mb-4">
                 <Trophy className="w-4 h-4 text-emerald-400 mr-2" /> Winning Offers Algorithm
              </h3>
              <div className="space-y-3">
                 {data.winningOffers.map((offer: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 border-b border-zinc-100 dark:border-zinc-850">
                       <div>
                         <span className="block text-sm font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline">{offer.name || offer.id}</span>
                         <span className="block text-[10px] text-zinc-500 uppercase mt-1">CVR: {offer.conversionRate.toFixed(1)}%</span>
                       </div>
                       <div className="text-right">
                         <span className="block text-sm font-bold text-zinc-900 dark:text-zinc-100">${offer.epc.toFixed(2)} EPC</span>
                       </div>
                    </div>
                 ))}
                 {data.winningOffers.length === 0 && <p className="text-xs text-zinc-500 italic">No conclusive winners yet.</p>}
              </div>
           </div>

           <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide flex items-center mb-4">
                 <AlertTriangle className="w-4 h-4 text-rose-500 mr-2" /> Decaying / Losing Offers
              </h3>
              <div className="space-y-3">
                 {data.losingOffers.map((offer: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 border-b border-zinc-100 dark:border-zinc-850">
                       <div>
                         <span className="block text-sm font-bold text-rose-600 dark:text-rose-400 cursor-pointer hover:underline">{offer.name || offer.id}</span>
                         <span className="block text-[10px] text-zinc-500 uppercase mt-1">CVR: {offer.conversionRate.toFixed(1)}%</span>
                       </div>
                       <div className="text-right">
                         <span className="block text-sm font-bold text-zinc-900 dark:text-zinc-100">${offer.epc.toFixed(2)} EPC</span>
                       </div>
                    </div>
                 ))}
                 {data.losingOffers.length === 0 && <p className="text-xs text-zinc-500 italic">No failing offers detected.</p>}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
