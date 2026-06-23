import React, { useState } from 'react';
import { Target, Link, Zap, ExternalLink, Activity, Copy, CheckCircle2 } from 'lucide-react';

export function TrackingBoard() {
  const [offerUrl, setOfferUrl] = useState('https://maxbounty.com/offer/123');
  const [offerId, setOfferId] = useState('OFFER-123');
  const [contentId, setContentId] = useState('ARTICLE-A');
  const [source, setSource] = useState('pinterest');
  
  const [trackingLink, setTrackingLink] = useState('');
  const [copied, setCopied] = useState(false);

  const generateLink = () => {
     // Usually you'd host this under your own domain, running the Express app
     const base = window.location.origin; 
     const link = `${base}/api/tracking/click?offer_id=${encodeURIComponent(offerId)}&content_id=${encodeURIComponent(contentId)}&source=${encodeURIComponent(source)}&redirect=${encodeURIComponent(offerUrl)}`;
     setTrackingLink(link);
  };

  const copyToClipboard = () => {
    if (trackingLink) {
        navigator.clipboard.writeText(trackingLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  const simulatePostback = () => {
      // Send a fake postback
      const subid = Math.random().toString(36).substring(7); // Fake ID
      const payout = (Math.random() * (50 - 5) + 5).toFixed(2);
      const url = `/api/tracking/postback?subid=${subid}&payout=${payout}&network=maxbounty`;
      
      fetch(url)
        .then(res => res.text())
        .then(res => alert(`Postback Simulated: \n${res}\n\nCheck Growth Loop event stream for automated trigger.`))
        .catch(err => console.error(err));
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center">
            <Target className="w-6 h-6 mr-2 text-indigo-500" />
            SubID Trajectory Engine
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Generate tracking links and route network postbacks to internal event loops.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl">
             <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center">
                <Link className="w-4 h-4 mr-2" /> Generator
             </h3>
             <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Destination Offer URL</label>
                    <input 
                      type="url"
                      value={offerUrl}
                      onChange={(e) => setOfferUrl(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                 </div>
                 <div className="grid grid-cols-3 gap-3">
                     <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Offer ID</label>
                        <input 
                            value={offerId}
                            onChange={(e) => setOfferId(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Content ID</label>
                        <input 
                            value={contentId}
                            onChange={(e) => setContentId(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Source</label>
                        <input 
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                     </div>
                 </div>

                 <button 
                    onClick={generateLink}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition text-sm"
                 >
                    Generate Smart Link
                 </button>
                 
                 {trackingLink && (
                    <div className="mt-4 p-4 bg-zinc-50 dark:bg-[#0a0a0a] rounded-md border border-indigo-100 dark:border-indigo-900/30">
                       <label className="block text-xs font-bold uppercase text-indigo-500 mb-2">Generated Tracking link</label>
                       <div className="flex items-center space-x-2">
                           <input readOnly value={trackingLink} className="flex-1 bg-transparent text-sm text-zinc-600 dark:text-zinc-400 focus:outline-none truncate" />
                           <button onClick={copyToClipboard} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                           </button>
                       </div>
                    </div>
                 )}
             </div>
          </div>

          <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl">
             <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center">
                <Activity className="w-4 h-4 mr-2" /> Postback Simulator 
             </h3>
             <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                In a real environment, MaxBounty (or another network) will append <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-pink-500">?subid=123&payout=5.00</code> to your Server-to-Server postback URL.
             </p>
             <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
                 <div className="flex items-center space-x-3 mb-4 text-rose-600 dark:text-rose-400 font-medium text-sm">
                    <Zap className="w-5 h-5 flex-shrink-0" />
                    <span>Fire a simulated network conversion to trigger the Orchestrator.</span>
                 </div>
                 <button 
                    onClick={simulatePostback}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-medium py-2 px-4 rounded-md transition text-sm flex items-center justify-center shadow-lg shadow-rose-500/20"
                 >
                    <ExternalLink className="w-4 h-4 mr-2" /> Simulate Postback Request
                 </button>
             </div>
          </div>
      </div>
    </div>
  );
}
