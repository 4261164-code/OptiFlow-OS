import React, { useState } from 'react';
import { Search, Hash, Globe, FileText, ArrowRight, Loader2, Activity, Camera } from 'lucide-react';

export function RapidApiTools() {
  const [seoTopic, setSeoTopic] = useState('');
  const [seoResult, setSeoResult] = useState<any>(null);
  const [seoLoading, setSeoLoading] = useState(false);

  const [leadArea, setLeadArea] = useState('New York');
  const [leadSearch, setLeadSearch] = useState('Hotel');
  const [leadResult, setLeadResult] = useState<any>(null);
  const [leadLoading, setLeadLoading] = useState(false);

  const [densityUrl, setDensityUrl] = useState('');
  const [densityResult, setDensityResult] = useState<any>(null);
  const [densityLoading, setDensityLoading] = useState(false);

  const [igUsername, setIgUsername] = useState('');
  const [igMaxId, setIgMaxId] = useState('');
  const [igResult, setIgResult] = useState<any>(null);
  const [igLoading, setIgLoading] = useState(false);

  const [pinKeyword, setPinKeyword] = useState('cats and dogs');
  const [pinNum, setPinNum] = useState(20);
  const [pinResult, setPinResult] = useState<any>(null);
  const [pinLoading, setPinLoading] = useState(false);

  const handleSeoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seoTopic) return;
    
    setSeoLoading(true);
    setSeoResult(null);
    try {
      const res = await fetch('/api/rapidapi/seo-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: seoTopic })
      });
      const data = await res.json();
      setSeoResult(data);
    } catch (err) {
      console.error(err);
      setSeoResult({ error: 'Failed to generate SEO data' });
    } finally {
      setSeoLoading(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadArea || !leadSearch) return;

    setLeadLoading(true);
    setLeadResult(null);
    try {
      const res = await fetch(`/api/rapidapi/lead-generation?area=${encodeURIComponent(leadArea)}&search=${encodeURIComponent(leadSearch)}`);
      const data = await res.json();
      setLeadResult(data);
    } catch (err) {
      console.error(err);
      setLeadResult({ error: 'Failed to find leads' });
    } finally {
      setLeadLoading(false);
    }
  };

  const handleDensitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!densityUrl) return;

    setDensityLoading(true);
    setDensityResult(null);
    try {
      const res = await fetch(`/api/rapidapi/seo-density?url=${encodeURIComponent(densityUrl)}`);
      const data = await res.json();
      setDensityResult(data);
    } catch (err) {
      console.error(err);
      setDensityResult({ error: 'Failed to fetch density data' });
    } finally {
      setDensityLoading(false);
    }
  };

  const handleIgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!igUsername) return;

    setIgLoading(true);
    setIgResult(null);
    try {
      const res = await fetch('/api/rapidapi/instagram-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: igUsername, maxId: igMaxId })
      });
      const data = await res.json();
      setIgResult(data);
    } catch (err) {
      console.error(err);
      setIgResult({ error: 'Failed to fetch Instagram posts' });
    } finally {
      setIgLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinKeyword) return;

    setPinLoading(true);
    setPinResult(null);
    try {
      const res = await fetch(`/api/rapidapi/pinterest-boards?keyword=${encodeURIComponent(pinKeyword)}&num=${pinNum}`);
      const data = await res.json();
      setPinResult(data);
    } catch (err) {
      console.error(err);
      setPinResult({ error: 'Failed to fetch Pinterest boards' });
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 mt-8">
      {/* SEO Generator */}
      <div className="bg-[#111827] border border-zinc-800 rounded-xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-500">
          <Hash className="w-32 h-32 text-indigo-400" />
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">SEO Meta Generator</h3>
            <p className="text-xs text-zinc-400">Powered by RapidAPI</p>
          </div>
        </div>

        <form onSubmit={handleSeoSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Target Topic</label>
            <div className="relative">
              <input 
                type="text" 
                value={seoTopic}
                onChange={(e) => setSeoTopic(e.target.value)}
                placeholder="e.g., How to lose weight fast"
                className="w-full bg-[#1A2234] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={seoLoading || !seoTopic}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {seoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Generate Meta Data
          </button>
        </form>

        {seoResult && (
          <div className="mt-4 p-4 bg-[#1A2234] rounded-lg border border-zinc-800/50 max-h-64 overflow-y-auto">
            <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
              {JSON.stringify(seoResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Lead Generation */}
      <div className="bg-[#111827] border border-zinc-800 rounded-xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-500">
          <Globe className="w-32 h-32 text-emerald-400" />
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Search className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Local Lead Finder</h3>
            <p className="text-xs text-zinc-400">Powered by RapidAPI</p>
          </div>
        </div>

        <form onSubmit={handleLeadSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Area / City</label>
              <input 
                type="text" 
                value={leadArea}
                onChange={(e) => setLeadArea(e.target.value)}
                placeholder="New York"
                className="w-full bg-[#1A2234] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Business Type</label>
              <input 
                type="text" 
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                placeholder="Hotel"
                className="w-full bg-[#1A2234] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={leadLoading || !leadArea || !leadSearch}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {leadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Find Local Leads
          </button>
        </form>

        {leadResult && (
          <div className="mt-4 p-4 bg-[#1A2234] rounded-lg border border-zinc-800/50 max-h-64 overflow-y-auto">
            <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
              {JSON.stringify(leadResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* SEO Keyword Density */}
      <div className="bg-[#111827] border border-zinc-800 rounded-xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-500">
          <Activity className="w-32 h-32 text-blue-400" />
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Keyword Density</h3>
            <p className="text-xs text-zinc-400">Powered by RapidAPI</p>
          </div>
        </div>

        <form onSubmit={handleDensitySubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Target URL</label>
            <input 
              type="url" 
              value={densityUrl}
              onChange={(e) => setDensityUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-[#1A2234] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button 
            type="submit" 
            disabled={densityLoading || !densityUrl}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {densityLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            Analyze Density
          </button>
        </form>

        {densityResult && (
          <div className="mt-4 p-4 bg-[#1A2234] rounded-lg border border-zinc-800/50 max-h-64 overflow-y-auto">
            <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
              {JSON.stringify(densityResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Instagram Posts */}
      <div className="bg-[#111827] border border-zinc-800 rounded-xl p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-500">
          <Camera className="w-32 h-32 text-pink-400" />
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
            <Camera className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Instagram Posts</h3>
            <p className="text-xs text-zinc-400">Powered by RapidAPI</p>
          </div>
        </div>

        <form onSubmit={handleIgSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Username</label>
              <input 
                type="text" 
                value={igUsername}
                onChange={(e) => setIgUsername(e.target.value)}
                placeholder="keke"
                className="w-full bg-[#1A2234] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Max ID (Optional)</label>
              <input 
                type="text" 
                value={igMaxId}
                onChange={(e) => setIgMaxId(e.target.value)}
                placeholder=""
                className="w-full bg-[#1A2234] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={igLoading || !igUsername}
            className="w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {igLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            Fetch Posts
          </button>
        </form>

        {igResult && (
          <div className="mt-4 p-4 bg-[#1A2234] rounded-lg border border-zinc-800/50 max-h-64 overflow-y-auto">
            <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
              {JSON.stringify(igResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Pinterest Boards */}
      <div className="bg-[#111827] border border-zinc-800 rounded-xl p-6 relative overflow-hidden group lg:col-span-2">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-500">
          <Hash className="w-32 h-32 text-red-500" />
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <Hash className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Pinterest Boards Tracker</h3>
            <p className="text-xs text-zinc-400">Powered by RapidAPI</p>
          </div>
        </div>

        <form onSubmit={handlePinSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Keyword</label>
              <input 
                type="text" 
                value={pinKeyword}
                onChange={(e) => setPinKeyword(e.target.value)}
                placeholder="cats and dogs"
                className="w-full bg-[#1A2234] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Number of Results</label>
              <input 
                type="number" 
                value={pinNum}
                onChange={(e) => setPinNum(parseInt(e.target.value) || 20)}
                placeholder="20"
                min="1"
                max="50"
                className="w-full bg-[#1A2234] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={pinLoading || !pinKeyword}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {pinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
            Search Pinterest Boards
          </button>
        </form>

        {pinResult && (
          <div className="mt-4 p-4 bg-[#1A2234] rounded-lg border border-zinc-800/50 max-h-64 overflow-y-auto">
            <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
              {JSON.stringify(pinResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
