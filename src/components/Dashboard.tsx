import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Job, Article, Pin } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from './ui';
import { formatDistanceToNow } from 'date-fns';
import { CampaignIcon, ArticlesIcon, PinterestIcon, TrafficEngineIcon } from './CustomIcons';

export function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    
    // Subscribe to Jobs
    const qJobs = query(collection(db, 'jobs'), where('userId', '==', uid));
    const unsubJobs = onSnapshot(qJobs, (snap) => {
      setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)).sort((a,b) => b.createdAt - a.createdAt));
    });

    // Subscribe to Articles
    const qArticles = query(collection(db, 'articles'), where('userId', '==', uid));
    const unsubArticles = onSnapshot(qArticles, (snap) => {
      setArticles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article)).sort((a,b) => b.createdAt - a.createdAt));
    });

    // Subscribe to Pins
    const qPins = query(collection(db, 'pins'), where('userId', '==', uid));
    const unsubPins = onSnapshot(qPins, (snap) => {
      setPins(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pin)).sort((a,b) => b.createdAt - a.createdAt));
    });

    return () => { unsubJobs(); unsubArticles(); unsubPins(); };
  }, [auth.currentUser]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-[#1C1D21] border-white/5 rounded-3xl p-2 shadow-2xl relative overflow-hidden">
          <CardHeader className="pb-0 pt-6 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase tracking-widest text-[#6B6E7B] font-bold">Campaigns Executed</CardTitle>
            <CampaignIcon className="w-5 h-5 text-[#d7f941]" />
          </CardHeader>
          <CardContent className="pt-2 px-6 pb-6 flex items-end justify-between">
            <div className="text-5xl font-bold text-white tracking-tighter">{jobs.length}</div>
            <div className="text-xs font-bold text-[#d7f941] bg-[#d7f941]/10 px-2 py-1 rounded-md mb-1">+System</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1C1D21] border-white/5 rounded-3xl p-2 shadow-2xl relative overflow-hidden">
          <CardHeader className="pb-0 pt-6 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase tracking-widest text-[#6B6E7B] font-bold">Total Articles</CardTitle>
            <ArticlesIcon className="w-5 h-5 text-zinc-400" />
          </CardHeader>
          <CardContent className="pt-2 px-6 pb-6 flex items-end justify-between">
            <div className="text-5xl font-bold text-white tracking-tighter">{articles.length}</div>
            <div className="text-xs font-bold text-[#d7f941] bg-[#d7f941]/10 px-2 py-1 rounded-md mb-1 mb-1">Index</div>
          </CardContent>
        </Card>
        <Card className="bg-[#1C1D21] border-white/5 rounded-3xl p-2 shadow-2xl relative overflow-hidden">
          <CardHeader className="pb-0 pt-6 px-6 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase tracking-widest text-[#6B6E7B] font-bold">Generated Pins</CardTitle>
            <PinterestIcon className="w-5 h-5 text-zinc-400" />
          </CardHeader>
          <CardContent className="pt-2 px-6 pb-6 flex items-end justify-between">
            <div className="text-5xl font-bold text-white tracking-tighter">{pins.length}</div>
            <div className="text-xs font-bold text-[#d7f941] bg-[#d7f941]/10 px-2 py-1 rounded-md mb-1">Assets</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-[#1C1D21] border-white/5 rounded-3xl shadow-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between z-10 relative">
             <div className="space-y-1">
                <div className="text-xs uppercase tracking-widest text-[#6B6E7B] font-bold">Projected Traffic Volume</div>
                <div className="text-3xl font-bold text-white tracking-tight">84,428 <span className="text-sm font-medium text-zinc-500">Impressions</span></div>
             </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl border-white/10 text-xs">Today</Button>
                <Button variant="outline" size="sm" className="rounded-xl border-white/10 text-xs text-white">This Week</Button>
             </div>
          </div>
          {/* Mock Graph using SVG path and gradient */}
          <div className="absolute inset-x-0 bottom-0 top-24 pointer-events-none">
            <svg viewBox="0 0 800 200" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradientLime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d7f941" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#d7f941" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,150 C100,150 200,50 300,50 C400,50 450,120 550,100 C650,80 700,20 800,20 L800,200 L0,200 Z" fill="url(#gradientLime)" />
              <path d="M0,150 C100,150 200,50 300,50 C400,50 450,120 550,100 C650,80 700,20 800,20" fill="none" stroke="#d7f941" strokeWidth="3" vectorEffect="non-scaling-stroke" />
              
              {/* Highlight Dot */}
              <circle cx="550" cy="100" r="5" fill="#1C1D21" stroke="#d7f941" strokeWidth="3" />
            </svg>
            
            <div className="absolute top-[80px] left-[65%] transform -translate-x-1/2 -translate-y-full bg-white text-black text-xs font-bold py-1 px-3 rounded-lg shadow-xl mb-2 flex items-center justify-center">
              <span>8,420 Sessions</span>
            </div>
          </div>
        </Card>

        <Card className="bg-[#1C1D21] border-white/5 rounded-3xl shadow-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
             {/* Circular Progress Mock */}
             <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                 <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                     <circle cx="50" cy="50" r="40" fill="none" stroke="#25262B" strokeWidth="8" />
                     <circle cx="50" cy="50" r="40" fill="none" stroke="#d7f941" strokeWidth="8" strokeDasharray="251" strokeDashoffset="50" strokeLinecap="round" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <div className="text-3xl font-bold text-white tracking-tight">80%</div>
                     <div className="text-[10px] text-[#d7f941] font-bold">+2.34%</div>
                 </div>
             </div>
             <h3 className="text-white font-bold tracking-tight text-lg">SEO Score</h3>
             <p className="text-sm text-zinc-400 mt-1">Your average optimization score across all articles is excellent.</p>
        </Card>
      </div>

      <Card className="bg-[#1C1D21] border-white/5 rounded-3xl p-2 shadow-2xl">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-xl font-sans font-bold">Recent Campaigns (Phase 1)</CardTitle>
          <CardDescription className="text-zinc-400">Your latest keyword content and asset orchestration runs.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {jobs.length === 0 ? (
            <div className="text-zinc-500 text-sm mt-4">No campaigns run yet.</div>
          ) : (
            <div className="space-y-4 mt-6 border border-white/5 bg-white/[0.02] p-4 rounded-2xl">
              {jobs.slice(0, 5).map(job => (
                <div key={job.id} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-xl text-[#d7f941]">
                      <TrafficEngineIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white tracking-tight">{job.keyword}</p>
                      <p className="text-xs text-zinc-500">
                        {formatDistanceToNow(job.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest ${job.status === 'completed' ? 'bg-[#d7f941]/10 text-[#d7f941] border border-[#d7f941]/20' : job.status === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'}`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
