import React from 'react';
import { Brain, CheckCircle, XCircle, Play } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export function AIBrain() {
  const dispatchJob = async (type: string, payload: any) => {
    try {
      await addDoc(collection(db, 'jobs'), {
        type,
        payload,
        status: 'pending',
        created_at: Date.now(),
        retry_count: 0
      });
      alert(`Job ${type} dispatched successfully.`);
    } catch (error) {
      console.error('Error dispatching job:', error);
      alert('Failed to dispatch job.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Brain</h1>
          <p className="text-sm text-zinc-400 mt-1">ChatGPT + Business Analyst operating your platform.</p>
        </div>
      </div>

      <div className="bg-[#111827] border border-zinc-800 rounded-xl overflow-hidden mb-6 p-8">
        <div className="flex items-center mb-6">
           <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mr-4">
             <Brain className="w-6 h-6 text-indigo-500" />
           </div>
           <div>
              <h2 className="text-xl font-bold text-white">Daily Intelligence Report</h2>
              <p className="text-sm text-zinc-400">Generated 2 hours ago</p>
           </div>
        </div>

        <div className="prose prose-invert max-w-none">
           <p className="text-lg text-zinc-300 leading-relaxed mb-6">
             Good morning. Revenue has increased <strong>17%</strong> in the last 24 hours. The top performing article is <strong>King Opinion Review</strong>, heavily driven by the <strong>Survey Lead CPA</strong> offer. 
           </p>
           <p className="text-zinc-400 mb-8">
             Based on yesterday's performance, I have compiled a list of suggested actions to capitalize on this momentum and patch underperforming assets.
           </p>
        </div>

        <div className="space-y-4">
           <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 flex items-center justify-between">
              <div>
                 <h4 className="text-white font-medium mb-1">1. Publish 5 more survey reviews.</h4>
                 <p className="text-sm text-zinc-500">We are indexing well for "Survey apps". Creating a cluster will dominate the SERP.</p>
              </div>
              <div className="flex space-x-2">
                 <button onClick={() => dispatchJob('generate_content', { action: 'cluster', keyword: 'survey apps' })} className="bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors">
                   <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                 </button>
                 <button className="bg-rose-600/20 text-rose-500 hover:bg-rose-600/30 px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors">
                   <XCircle className="w-4 h-4 mr-1.5" /> Reject
                 </button>
                 <button onClick={() => dispatchJob('generate_content', { action: 'cluster', keyword: 'survey apps' })} className="bg-indigo-600/20 text-indigo-500 hover:bg-indigo-600/30 px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors">
                   <Play className="w-4 h-4 mr-1.5" /> Run Auto
                 </button>
              </div>
           </div>

           <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 flex items-center justify-between">
              <div>
                 <h4 className="text-white font-medium mb-1">2. Replace Offer X.</h4>
                 <p className="text-sm text-zinc-500">EPC has dropped 40% below baseline. Recommend swapping to Offer Y.</p>
              </div>
              <div className="flex space-x-2">
                 <button onClick={() => dispatchJob('offer_swap', { targetOffer: 'offerX', newOffer: 'offerY' })} className="bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors">
                   <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                 </button>
                 <button className="bg-rose-600/20 text-rose-500 hover:bg-rose-600/30 px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors">
                   <XCircle className="w-4 h-4 mr-1.5" /> Reject
                 </button>
                 <button onClick={() => dispatchJob('offer_swap', { targetOffer: 'offerX', newOffer: 'offerY' })} className="bg-indigo-600/20 text-indigo-500 hover:bg-indigo-600/30 px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors">
                   <Play className="w-4 h-4 mr-1.5" /> Run Auto
                 </button>
              </div>
           </div>

           <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 flex items-center justify-between">
              <div>
                 <h4 className="text-white font-medium mb-1">3. Refresh Article Y.</h4>
                 <p className="text-sm text-zinc-500">Search console data shows high impressions but low CTR. Suggest title rewrite.</p>
              </div>
              <div className="flex space-x-2">
                 <button onClick={() => dispatchJob('seo_refresh', { articleId: 'articleY', action: 'rewrite_title' })} className="bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors">
                   <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                 </button>
                 <button className="bg-rose-600/20 text-rose-500 hover:bg-rose-600/30 px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors">
                   <XCircle className="w-4 h-4 mr-1.5" /> Reject
                 </button>
                 <button onClick={() => dispatchJob('seo_refresh', { articleId: 'articleY', action: 'rewrite_title' })} className="bg-indigo-600/20 text-indigo-500 hover:bg-indigo-600/30 px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors">
                   <Play className="w-4 h-4 mr-1.5" /> Run Auto
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
