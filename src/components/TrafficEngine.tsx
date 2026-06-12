import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input } from './ui';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2, Rocket, Search, Clock, ListPlus, Share2, Award, Activity, Copy, ExternalLink, CheckCircle } from 'lucide-react';

interface RecommendedBoard {
  name: string;
  estimatedViews: string;
}

interface SeoTrigger {
  type: string;
  suggestion: string;
}

interface TrafficResult {
  keyword: string;
  trafficPotential: string;
  monthlySearchVolume: string;
  viralScore: number;
  bestPostingTimes: string[];
  optimumFrequency: string;
  recommendedBoards: RecommendedBoard[];
  seoTriggers: SeoTrigger[];
  backlinkStrategy: string;
}

interface CloakedLink {
  tag: string;
  originalUrl: string;
  cloakedUrl: string;
}

const DEFAULT_TRAFFIC_REPORT: TrafficResult = {
  keyword: "pinterest affiliate traffic",
  trafficPotential: "High",
  monthlySearchVolume: "24,000",
  viralScore: 92,
  bestPostingTimes: ["2:00 PM EST", "8:30 PM EST", "11:00 PM EST"],
  optimumFrequency: "3 pins per day",
  recommendedBoards: [
    { name: "SaaS Marketing Growth Syndicate", estimatedViews: "1.2M views/mo" },
    { name: "Affiliate Income Mastery", estimatedViews: "650k views/mo" },
    { name: "Pinterest Creators & Bloggers", estimatedViews: "2.5M views/mo" }
  ],
  seoTriggers: [
    { type: "Headline Curiosity Hook", suggestion: "How We Scaled Secret Pinterest Boards to $15k/mo on Autopilot" },
    { type: "LSI Description Bullet", suggestion: "High-ticket pin advertising, organic pinterest loop, affiliate marketing tricks" }
  ],
  backlinkStrategy: "Promote pinning campaign links in targeted Reddit threads (like r/Pinterest, r/affiliatemarketing) and submit pins directly to Pinterest collective shares groups to trigger instant algorithmic indexes."
};

export function TrafficEngine() {
  const [loading, setLoading] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [customKeyword, setCustomKeyword] = useState('');
  const [userKeywords, setUserKeywords] = useState<string[]>([]);
  const [result, setResult] = useState<TrafficResult | null>(null);

  // Link Cloaker State
  const [rawAffiliateUrl, setRawAffiliateUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [cloakedLinks, setCloakedLinks] = useState<CloakedLink[]>([]);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    // Load last report from storage
    const cached = localStorage.getItem('last_traffic_engine_report');
    if (cached) {
      try {
        setResult(JSON.parse(cached));
      } catch (e) {}
    } else {
      setResult(DEFAULT_TRAFFIC_REPORT);
    }

    // Load cloaked links from storage
    const cachedLinks = localStorage.getItem('cloaked_affiliate_links');
    if (cachedLinks) {
       try {
         setCloakedLinks(JSON.parse(cachedLinks));
       } catch (e) {}
    }

    // Load completed jobs for selection
    const fetchKeywords = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(collection(db, 'jobs'), where('userId', '==', auth.currentUser.uid));
        const snap = await getDocs(q);
        const kws = new Set<string>();
        snap.docs.forEach(doc => {
          const d = doc.data();
          if (d.keyword && d.status === 'completed') {
            kws.add(d.keyword);
          }
        });
        setUserKeywords(Array.from(kws));
      } catch (e) {
        console.error("Error loading user keywords:", e);
      }
    };
    fetchKeywords();
  }, []);

  const handleRun = async (keywordToRun: string) => {
    if (!keywordToRun.trim()) return;
    setLoading(true);
    try {
      const resp = await fetch('/api/traffic-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keyword: keywordToRun,
          userId: auth.currentUser?.uid
        })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to fetch traffic stats");
      
      setResult(data);
      localStorage.setItem('last_traffic_engine_report', JSON.stringify(data));
    } catch (e: any) {
      alert("AI Traffic Engine analysis failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloak = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawAffiliateUrl.trim() || !customSlug.trim()) return;

    const hostname = window.location.origin;
    const cleanSlug = customSlug.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const cloakedUrl = `${hostname}/go/${cleanSlug}`;

    const newLink: CloakedLink = {
      tag: cleanSlug,
      originalUrl: rawAffiliateUrl,
      cloakedUrl
    };

    const updated = [newLink, ...cloakedLinks];
    setCloakedLinks(updated);
    localStorage.setItem('cloaked_affiliate_links', JSON.stringify(updated));

    setRawAffiliateUrl('');
    setCustomSlug('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const currentKeyword = customKeyword || selectedKeyword;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-sans tracking-tight font-bold tracking-tight text-white mb-2">Traffic Engine</h1>
        <p className="text-zinc-400">Amplify your indexing velocity, plan board strategies, and configure cloaked redirect flows.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Side: Campaign selector, optimization settings, and URL cloaker */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-xs uppercase tracking-wider text-zinc-400 font-mono font-bold">Velocity Controller</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold font-sans">Campaign Keyword</label>
                <select
                  className="flex h-10 w-full rounded-md border border-white/5 bg-[#1C1D21] px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#d7f941]"
                  value={selectedKeyword}
                  onChange={(e) => {
                    setSelectedKeyword(e.target.value);
                    setCustomKeyword('');
                  }}
                  disabled={loading}
                >
                  <option value="">-- Select Campaign --</option>
                  {userKeywords.map(kw => (
                    <option key={kw} value={kw}>{kw}</option>
                  ))}
                </select>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-3 text-xs text-zinc-600 uppercase font-mono">or</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold font-sans">Free-Form SEO Term</label>
                <Input
                  placeholder="e.g. passive income strategies"
                  value={customKeyword}
                  onChange={(e) => {
                    setCustomKeyword(e.target.value);
                    setSelectedKeyword('');
                  }}
                  disabled={loading}
                />
              </div>

              <Button
                className="w-full mt-2"
                disabled={loading || !currentKeyword}
                onClick={() => handleRun(currentKeyword)}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculating Velocity...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2 text-[#bce122]" />
                    Query Traffic Engine
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Link Cloaker Card */}
          <Card className="border border-[#d7f941]/10">
            <CardHeader className="pb-3 border-b border-white/5 bg-[#d7f941]/[0.01]">
              <CardTitle className="flex items-center text-sm font-semibold text-white">
                <Share2 className="w-4 h-4 mr-2 text-[#bce122]" /> Affiliate Link Cloaker
              </CardTitle>
              <CardDescription>Convert visual-repelling long affiliate links to neat relative paths.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <form onSubmit={handleCloak} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-mono text-zinc-500">Long Affiliate URL</label>
                  <Input 
                    placeholder="https://hop.clickbank.net/?affiliate=optiflow&offer=7..." 
                    value={rawAffiliateUrl}
                    onChange={e => setRawAffiliateUrl(e.target.value)}
                    className="text-xs h-9 font-mono bg-[#111216]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase font-mono text-zinc-500">Custom redirection slug</label>
                  <div className="flex rounded-md bg-[#111216] border border-white/5 items-center pl-3">
                    <span className="text-xs text-zinc-600 font-mono select-none">/go/</span>
                    <input 
                      type="text"
                      placeholder="keto-plan"
                      value={customSlug}
                      onChange={e => setCustomSlug(e.target.value)}
                      className="flex-1 text-xs h-9 bg-transparent border-0 font-mono text-zinc-200 pl-1 focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>
                <Button type="submit" size="sm" className="w-full mt-1">
                  Create Cloaked URL
                </Button>
              </form>

              {/* Show Cloaked Links List */}
              {cloakedLinks.length > 0 && (
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold block">Active Redirects</span>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {cloakedLinks.map((link, idx) => (
                      <div key={idx} className="bg-[#111216] p-2.5 rounded-lg border border-white/5 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <code className="text-[#bce122] font-bold">/go/{link.tag}</code>
                          <button 
                            type="button" 
                            onClick={() => copyToClipboard(link.cloakedUrl)}
                            className="text-zinc-500 hover:text-zinc-200 transition"
                          >
                            {copiedLink === link.cloakedUrl ? (
                              <CheckCircle className="w-3.5 h-3.5 text-[#d7f941]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-600 truncate font-mono">{link.originalUrl}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Analytical Traffic Dashboard Output */}
        <div className="md:col-span-2 space-y-6">
          {result ? (
            <div className="space-y-6">
              {/* Overall metric blocks */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Pinterest volume</span>
                    <div className="text-xl font-mono text-zinc-100 mt-1 font-bold">{result.monthlySearchVolume}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Organic potential</span>
                    <div className="text-xl text-[#bce122] mt-1 font-semibold">{result.trafficPotential}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Traffic viral index</span>
                    <div className="text-xl font-mono text-white mt-1 font-bold flex items-center justify-between">
                      <span>{result.viralScore}%</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#d7f941] animate-pulse inline-block"></span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Timing and Scheduler Layout */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base">
                    <Clock className="w-4 h-4 mr-2 text-[#bce122]" /> Visual Pinterest Scheduler
                  </CardTitle>
                  <CardDescription>Optimal times to trigger maximum viral distribution loops based on audience locations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    {result.bestPostingTimes.map((time, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-white/5 bg-[#111216] flex flex-col justify-between">
                        <span className="text-[10px] uppercase text-zinc-500 font-mono font-bold tracking-wider">Slot #{idx + 1}</span>
                        <div className="text-base text-white font-mono font-bold mt-2 flex items-center justify-between">
                          <span>{time}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-[#d7f941]/5 border border-[#d7f941]/10 text-xs text-zinc-300 rounded-lg flex justify-between items-center">
                    <span>Target posting frequency:</span>
                    <strong className="text-white bg-[#1C1D21] border border-white/5 px-3 py-1 rounded font-mono font-bold">{result.optimumFrequency}</strong>
                  </div>
                </CardContent>
              </Card>

              {/* Group board opportunities */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base">
                    <Activity className="w-4 h-4 mr-2 text-[#bce122]" /> Targeted Collaborative Boards
                  </CardTitle>
                  <CardDescription>Join these Pinterest Group Boards to immediately access pre-warmed audiences in your niche.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="divide-y divide-zinc-900">
                    {result.recommendedBoards && result.recommendedBoards.map((board, bIdx) => (
                      <div key={bIdx} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                        <div>
                          <p className="font-semibold text-sm text-zinc-200">{board.name}</p>
                          <p className="text-xs text-zinc-500 font-mono font-medium">{board.estimatedViews}</p>
                        </div>
                        <a
                          href="https://www.pinterest.com/"
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-xs text-white bg-[#1C1D21] hover:bg-[#25262B] border border-white/5 py-1.5 px-3 rounded-lg flex items-center gap-1 transition"
                        >
                          Find Invite <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Title triggers and Copy hooks */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase font-mono text-zinc-400">SEO & Headline Optimization Loops</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.seoTriggers && result.seoTriggers.map((trig, tIdx) => (
                    <div key={tIdx} className="space-y-1">
                      <span className="text-[10px] font-mono tracking-widest font-bold text-zinc-500 bg-[#111216] border border-white/5 px-2 py-0.5 rounded-md inline-block uppercase">{trig.type}</span>
                      <p className="text-sm text-zinc-300 bg-[#111216] p-3 rounded-lg border border-white/5 leading-relaxed font-sans">{trig.suggestion}</p>
                    </div>
                  ))}
                  <div className="bg-[#0D0D0F] p-4 rounded-xl border border-white/5/80 space-y-2">
                     <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">Syndicate & Index Strategy</span>
                     <p className="text-xs text-zinc-400 leading-relaxed font-sans">{result.backlinkStrategy}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl bg-[#09090B]">
              <Search className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm">No traffic reports generated.</p>
              <p className="text-zinc-600 text-xs mt-1">Select or query a campaign above to build high-converting Pinterest structures.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
