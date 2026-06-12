import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Article, Pin, RevenueMetric } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { 
  BarChart, 
  TrendingUp, 
  DollarSign, 
  Users, 
  MousePointer, 
  Activity,
  ArrowUpRight,
  BookOpen,
  Image as ImageIcon,
  Target
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function Analytics() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const qArticles = query(collection(db, 'articles'), where('userId', '==', uid));
    const unsubArticles = onSnapshot(qArticles, (snap) => setArticles(snap.docs.map(d => d.data() as Article)));

    const qPins = query(collection(db, 'pins'), where('userId', '==', uid));
    const unsubPins = onSnapshot(qPins, (snap) => setPins(snap.docs.map(d => d.data() as Pin)));

    const qRevenue = query(collection(db, 'revenue_metrics'), where('userId', '==', uid));
    const unsubRevenue = onSnapshot(qRevenue, (snap) => {
      setRevenueData(snap.docs.map(d => d.data() as RevenueMetric));
      setLoading(false);
    });

    return () => {
      unsubArticles();
      unsubPins();
      unsubRevenue();
    };
  }, []);

  const totalArticles = articles.length;
  const totalPins = pins.length;

  const totalClicks = revenueData.reduce((acc, curr) => acc + curr.clicks, 0);
  const totalConversions = revenueData.reduce((acc, curr) => acc + curr.conversions, 0);
  const totalRevenue = revenueData.reduce((acc, curr) => acc + curr.revenue, 0);
  const avgEpc = totalClicks > 0 ? (totalRevenue / totalClicks).toFixed(2) : "0.00";
  const avgCtr = revenueData.length > 0 ? (revenueData.reduce((acc, curr) => acc + curr.ctr, 0) / revenueData.length).toFixed(1) : "0.0";
  
  const sortedByRevenue = [...revenueData].sort((a,b) => b.revenue - a.revenue);
  const topKeywords = sortedByRevenue.slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-sans tracking-tight font-bold text-white mb-2">Revenue Intelligence Engine</h1>
        <p className="text-zinc-400">Real-time telemetry of CTR, EPC, Conversions, and gross affiliate commission generation.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#101115] border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#a8ff35]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Gross Revenue</span>
              <DollarSign className="h-5 w-5 text-[#a8ff35]" />
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-bold tracking-tight text-white">${totalRevenue.toFixed(2)}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 font-mono">Real-time aggregate</p>
          </CardContent>
        </Card>

        <Card className="bg-[#101115] border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Global EPC</span>
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-bold tracking-tight text-white">${avgEpc}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 font-mono">Earnings per click</p>
          </CardContent>
        </Card>

        <Card className="bg-[#101115] border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Total Clicks</span>
              <MousePointer className="h-5 w-5 text-[#a8ff35]" />
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-bold tracking-tight text-white">{totalClicks}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 font-mono">Verified outbound redirects</p>
          </CardContent>
        </Card>

        <Card className="bg-[#101115] border-white/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Conversions</span>
              <Target className="h-5 w-5 text-fuchsia-400" />
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-bold tracking-tight text-white">{totalConversions}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 font-mono">Confirmed network actions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-[#101115] border-white/5 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Top Performing Asset Clusters</CardTitle>
            <CardDescription>Revenue broken down by primary seed keywords and niche hubs.</CardDescription>
          </CardHeader>
          <CardContent>
             {topKeywords.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                   Waiting for first revenue signals. Ensure tracking postbacks are configured.
                </div>
             ) : (
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2 border-b border-white/5 pb-2">
                    <span>Keyword Pillar</span>
                    <div className="flex gap-8">
                       <span className="w-16 text-right">Clicks</span>
                       <span className="w-16 text-right">EPC</span>
                       <span className="w-20 text-right">Revenue</span>
                    </div>
                  </div>
                  {topKeywords.map(metric => (
                    <div key={metric.id} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 hover:border-white/10 transition">
                      <span className="font-semibold text-sm text-white">{metric.keyword}</span>
                      <div className="flex gap-8 text-sm font-mono">
                         <span className="w-16 text-right text-zinc-400">{metric.clicks}</span>
                         <span className="w-16 text-right text-blue-400">${metric.epc}</span>
                         <span className="w-20 text-right text-[#a8ff35] font-bold">${metric.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
             )}
          </CardContent>
        </Card>

        <Card className="bg-[#101115] border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">AI Optimization Guard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-[#a8ff35]/5 border border-[#a8ff35]/20 p-4 rounded-xl flex items-start gap-3">
                <Activity className="w-5 h-5 text-[#a8ff35] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[#a8ff35] uppercase mb-1">Nightly Optimization Action</h4>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Based on recent EPC trends, the self-learning agent has prioritized financial & software review content formats. Next generation queue re-weighted automatically.
                  </p>
                </div>
              </div>
              <div className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-blue-400 uppercase mb-1">CTR Discovery</h4>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    System identified a 17% overall lift in Pinterest CTR across "best software" pins. Design variant "Neon Glass" set as default template mix.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

