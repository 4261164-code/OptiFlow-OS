import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input } from './ui';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Sparkles, Loader2, DollarSign, Search, Award, Shield, CheckCircle2, ChevronRight, Calculator, FileText } from 'lucide-react';

interface Program {
  name: string;
  network: string;
  payout: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  epcEstimate: string;
  pitch: string;
  signUpUrl: string;
}

interface AffiliateResult {
  keyword: string;
  niche: string;
  recommendedStrategy: string;
  programs: Program[];
  lsiKeywords: string[];
}

const PRESETS: Record<string, AffiliateResult> = {
  "pinterest traffic": {
    keyword: "pinterest traffic",
    niche: "Digital Marketing & Traffic Generation",
    recommendedStrategy: "Promote visual courses, Pinterest schedule tools, and automation SaaS. Focus content on high-quality pins, driving traffic directly to detailed tutorial review boards containing affiliate links.",
    programs: [
      {
        name: "Tailwind Scheduler",
        network: "ShareASale",
        payout: "15% recurring lifetime",
        difficulty: "Easy",
        epcEstimate: "$2.10",
        pitch: "The gold standard for Pinterest and Instagram pinning schedules. Highly recommended on visual niches because it saves hours utilizing automation queues and smart loop loops.",
        signUpUrl: "https://www.google.com/search?q=Tailwind+affiliate+program"
      },
      {
        name: "Pin Practical Course",
        network: "Teachable / Direct",
        payout: "40% commission per sale",
        difficulty: "Medium",
        epcEstimate: "$4.50",
        pitch: "High-ticket pin advertising and organic sales funnels training program. Excellent for driving cold Pinterest traffic into webinar-based converters.",
        signUpUrl: "https://www.google.com/search?q=Pin+Practical+affiliate+program"
      },
      {
        name: "Canva Pro",
        network: "Impact",
        payout: "$36 per annually sub",
        difficulty: "Easy",
        epcEstimate: "$1.80",
        pitch: "Everyone creating pins uses Canva. Simply include canvas-style design templates in your articles and link to their free trial to convert easily.",
        signUpUrl: "https://www.google.com/search?q=Canva+affiliate+program"
      }
    ],
    lsiKeywords: ["pin scheduling", "canva templates", "pinterest boards", "autopublish queue", "viral pinning strategy"]
  }
};

export function AffiliateMatch() {
  const [loading, setLoading] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [customKeyword, setCustomKeyword] = useState('');
  const [userKeywords, setUserKeywords] = useState<string[]>([]);
  const [result, setResult] = useState<AffiliateResult | null>(null);
  const [monthlyTraffic, setMonthlyTraffic] = useState(10000);
  const [customConversion, setCustomConversion] = useState(1.5); // 1.5% conversion rate
  const [avgSaleValue, setAvgSaleValue] = useState(50); // average product cost in USD

  useEffect(() => {
    // Load past reports from LocalStorage on mount
    const cached = localStorage.getItem('last_affiliate_match_report');
    if (cached) {
      try {
        setResult(JSON.parse(cached));
      } catch (e) {
        // use default
      }
    } else {
      setResult(PRESETS["pinterest traffic"]);
    }

    // Load user's campaign keywords from Firebase
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

  const handleMatch = async (keywordToRun: string) => {
    if (!keywordToRun.trim()) return;
    setLoading(true);
    try {
      const resp = await fetch('/api/affiliate-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keywordToRun })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to fetch matches");
      
      setResult(data);
      localStorage.setItem('last_affiliate_match_report', JSON.stringify(data));
    } catch (e: any) {
      alert("AI Matchmaker failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const currentKeyword = customKeyword || selectedKeyword;

  // Estimates for calculation
  const totalConversions = Math.round(monthlyTraffic * (customConversion / 100));
  const estimatedEarnings = Math.round(totalConversions * avgSaleValue * 0.3); // assume 30% average payout payout

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-sans tracking-tight font-bold tracking-tight text-white mb-2">Affiliate Matchmaker</h1>
        <p className="text-zinc-400">Deploy elite AI agent systems to map and acquire the most lucrative affiliate campaigns for your keyword space.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Control Panel */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono">Selector & Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Active Campaigns</label>
                <select
                  className="flex h-10 w-full rounded-md border border-white/5 bg-[#1C1D21] px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#d7f941]"
                  value={selectedKeyword}
                  onChange={(e) => {
                    setSelectedKeyword(e.target.value);
                    setCustomKeyword('');
                  }}
                  disabled={loading}
                >
                  <option value="">-- Choose active campaign --</option>
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
                <label className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Custom Keyword Search</label>
                <div className="relative">
                  <Input
                    placeholder="e.g. weight loss keto diet"
                    value={customKeyword}
                    onChange={(e) => {
                      setCustomKeyword(e.target.value);
                      setSelectedKeyword('');
                    }}
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                className="w-full mt-2"
                disabled={loading || !currentKeyword}
                onClick={() => handleMatch(currentKeyword)}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Niches...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 text-[#bce122]" />
                    Query AI Matchmaker
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Calculator Card */}
          <Card className="border border-[#d7f941]/10">
            <CardHeader className="pb-3 border-b border-white/5 bg-[#d7f941]/[0.01]">
              <CardTitle className="flex items-center text-sm font-semibold text-white">
                <Calculator className="w-4 h-4 mr-2 text-[#bce122]" /> Commission Calculator
              </CardTitle>
              <CardDescription>Estimate earnings based on Pinterest traffic conversion rates.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Monthly Clicks</label>
                  <Input 
                    type="number" 
                    value={monthlyTraffic} 
                    onChange={e => setMonthlyTraffic(parseInt(e.target.value) || 0)} 
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Conv. Rate %</label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={customConversion} 
                    onChange={e => setCustomConversion(parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Average Payout Sale ($)</label>
                <Input 
                  type="number" 
                  value={avgSaleValue} 
                  onChange={e => setAvgSaleValue(parseInt(e.target.value) || 1)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="bg-[#111216] p-3.5 rounded-xl border border-white/5 space-y-2 mt-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Conversions:</span>
                  <span className="font-mono text-zinc-200">{totalConversions} sales/mo</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400 border-t border-white/5 pt-2 text-sm font-semibold">
                  <span className="text-[#bce122] font-sans">Est. Commissions:</span>
                  <span className="font-mono text-white text-base">${estimatedEarnings.toLocaleString()}/mo</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Matchmaker Report Output */}
        <div className="md:col-span-2 space-y-6">
          {result ? (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="p-6 rounded-2xl border border-white/5 bg-[#0d0d0f] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#d7f941]/5 rounded-full filter blur-3xl -z-10 origin-top-right"></div>
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest text-[#bce122] border border-[#d7f941]/20 bg-[#d7f941]/5 rounded-full font-mono">
                    Niche: {result.niche}
                  </div>
                </div>
                <h2 className="text-2xl font-sans tracking-tight font-bold text-white mt-3 mb-2">
                  Monetization Strategy Report: <span className="text-[#bce122] font-sans tracking-tight italic">"{result.keyword}"</span>
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed font-sans">{result.recommendedStrategy}</p>
              </div>

              {/* Programs list */}
              <div>
                <h3 className="text-xs uppercase font-mono font-semibold tracking-wider text-zinc-400 mb-4 px-1">Top-Partner Matches Discovered</h3>
                <div className="space-y-4">
                  {result.programs && result.programs.map((prog, idx) => (
                    <div key={idx} className="p-5 rounded-xl border border-white/5 bg-[#0A0A0C] hover:border-white/10 transition space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white text-lg">{prog.name}</h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-tight text-[#bce122] border border-[#d7f941]/10 bg-[#d7f941]/[0.02]">
                              Network: {prog.network}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1.5 text-xs text-zinc-500">
                            <span className="flex items-center"><DollarSign className="w-3.5 h-3.5 mr-0.5 text-[#d7f941]" /> Payout: {prog.payout}</span>
                            <span>•</span>
                            <span className="flex items-center"><Shield className="w-3.5 h-3.5 mr-0.5 text-yellow-500" /> Difficulty: {prog.difficulty}</span>
                            {prog.epcEstimate && (
                              <>
                                <span>•</span>
                                <span>Est. EPC: <strong className="text-zinc-300 font-mono">{prog.epcEstimate}</strong></span>
                              </>
                            )}
                          </div>
                        </div>
                        <a 
                          href={prog.signUpUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="flex items-center text-xs text-white bg-[#25262B] hover:bg-zinc-700 border border-white/10 px-3 py-1.5 rounded-lg transition"
                        >
                          Sign Up Offer <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </a>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed bg-[#111216] p-3 rounded-lg border border-white/5 border-dashed">
                        <strong className="text-zinc-300 font-sans block mb-0.5 font-semibold text-[10px] uppercase font-mono tracking-widest">Matchmaker Pitch</strong>
                        {prog.pitch}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* LSI Suggestion Chips */}
              {result.lsiKeywords && result.lsiKeywords.length > 0 && (
                <div className="p-5 rounded-xl border border-white/5 bg-[#0d0d0f] space-y-3">
                  <h4 className="flex items-center text-xs text-zinc-400 font-semibold uppercase tracking-wider font-mono">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-[#d7f941]" /> SEO Latent Semantic Indexing (LSI) Insertion List
                  </h4>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {result.lsiKeywords.map((lsi, i) => (
                      <span key={i} className="text-xs font-mono py-1 px-2.5 rounded-lg bg-[#1C1D21] border border-white/5 text-zinc-300">
                        {lsi}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl bg-[#09090B]">
              <Search className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm">No affiliate reports analyzed yet.</p>
              <p className="text-zinc-600 text-xs mt-1">Select or search a keyword above to run the Matchmaker agent.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
