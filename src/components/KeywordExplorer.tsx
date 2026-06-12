import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Layers, 
  Compass, 
  Loader2, 
  BookmarkCheck, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Calendar, 
  PieChart, 
  Globe, 
  Volume2,
  FileText,
  Badge,
  ChevronRight,
  Filter,
  Users,
  Trophy
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from './ui';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useNotifications } from './NotificationContext';
import { addNotification } from '../lib/notifications';

interface KeywordCompetitor {
  domain: string;
  organicTraffic: string;
  domainAuthority: number;
  seoStrategy: string;
  commonKeywords: {
    keyword: string;
    position: number;
    volume: string;
    kd: number;
  }[];
  contentClusters: {
    clusterName: string;
    performanceScore: number;
    pagesCount: number;
    primaryIntent: string;
  }[];
}

interface KeywordResearchResult {
  keyword: string;
  volume: string;
  difficulty: number;
  cpc: string;
  globalTrend: 'up' | 'down' | 'stable';
  searchIntent: string;
  intentAnalysis: string;
  priority: string;
  metrics: {
    pinterestPotential: number;
    seoPotential: number;
    affiliateFit: number;
  };
  semanticClusters: {
    subtopic: string;
    keywords: string[];
    difficulty: number;
    intent: string;
    monetizationHook: string;
  }[];
  suggestedSponsors: {
    niche: string;
    payoutModel: string;
    hookAngle: string;
    estimatedCpa: string;
  }[];
  pinterestCreativeConcepts: {
    conceptTitle: string;
    visualPalette: string;
    layoutDescription: string;
    seoTags: string[];
  }[];
  competitors?: KeywordCompetitor[];
  contentOutline: {
    pillarTitle: string;
    structuredSections: { heading: string; detail: string; focusKeyword: string }[];
  };
}

interface SavedKeyword {
  id: string;
  keyword: string;
  payloadJson: string;
  createdAt: number;
  userId: string;
  isTracked?: boolean;
  trendThresholdType?: 'volume' | 'cpc' | 'pinterestPotential' | 'seoPotential';
  trendThresholdValue?: number;
  isAlertTriggered?: boolean;
  updatedAt?: number;
}

export function KeywordExplorer() {
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('United States');
  const [language, setLanguage] = useState('English');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'semantic' | 'sponsors' | 'pinterest' | 'outline' | 'competitors'>('overview');
  const [researchData, setResearchData] = useState<KeywordResearchResult | null>(null);
  const [savedKeywords, setSavedKeywords] = useState<SavedKeyword[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Core Alert Configuration State variables
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [alertTracked, setAlertTracked] = useState(false);
  const [alertType, setAlertType] = useState<'volume' | 'cpc' | 'pinterestPotential' | 'seoPotential'>('volume');
  const [alertThreshold, setAlertThreshold] = useState(10000);

  // Competitor Analysis State
  const [customCompetitor, setCustomCompetitor] = useState('');
  const [isAuditingCompetitor, setIsAuditingCompetitor] = useState(false);
  const [competitorAuditError, setCompetitorAuditError] = useState<string | null>(null);

  const { addNotification } = useNotifications();

  // Load user saved keyword searches from firestore
  useEffect(() => {
    if (!auth.currentUser) return;
    const qCol = query(
      collection(db, 'keywords'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(qCol, (snapshot) => {
      const items: SavedKeyword[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          keyword: d.keyword,
          payloadJson: d.payloadJson,
          createdAt: d.createdAt,
          userId: d.userId,
          isTracked: d.isTracked,
          trendThresholdType: d.trendThresholdType,
          trendThresholdValue: d.trendThresholdValue,
          isAlertTriggered: d.isAlertTriggered,
          updatedAt: d.updatedAt
        });
      });
      // Sort newest search first
      items.sort((a, b) => b.createdAt - a.createdAt);
      setSavedKeywords(items);

      // Dynamically sync loaded alerts if active saved ID is set
      if (selectedSavedId) {
        const matchingDoc = items.find(doc => doc.id === selectedSavedId);
        if (matchingDoc) {
          setAlertTracked(matchingDoc.isTracked || false);
          setAlertType(matchingDoc.trendThresholdType || 'volume');
          setAlertThreshold(matchingDoc.trendThresholdValue ?? 10000);
          
          // If the payload changed from a simulation, let's refresh the active view
          try {
            const parsed = JSON.parse(matchingDoc.payloadJson);
            setResearchData(parsed);
          } catch(e) {}
        }
      }
    }, (error) => {
      console.error("Firestore loading error for keywords:", error);
    });

    return unsubscribe;
  }, [selectedSavedId, auth.currentUser]);

  const handleQuickSearch = (kw: string) => {
    setKeyword(kw);
    triggerKeywordResearch(kw, country, language);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    triggerKeywordResearch(keyword.trim(), country, language);
  };

  const triggerKeywordResearch = async (targetKw: string, targetCountry: string, targetLanguage: string) => {
    setIsSearching(true);
    setSearchError(null);
    setSaveStatus(null);
    setSelectedSavedId(null);
    setAlertTracked(false);

    try {
      const response = await fetch('/api/keyword-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: targetKw,
          country: targetCountry,
          language: targetLanguage,
          userId: auth.currentUser?.uid
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errMsg = "Failed to process deep keyword analysis model.";
        if (contentType && contentType.includes("application/json")) {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } else {
          errMsg = `Server error ${response.status} (non-JSON response). The server is likely restarting. Please try again.`;
        }
        throw new Error(errMsg);
      }

      const resData = await response.json();

      setResearchData(resData.analysis);
      setActiveTab('overview');

      // Autofind if we already have it in saved keywords to map selectedSavedId
      const matchedSaved = savedKeywords.find(k => k.keyword.toLowerCase() === targetKw.toLowerCase());
      if (matchedSaved) {
        setSelectedSavedId(matchedSaved.id);
        setAlertTracked(matchedSaved.isTracked || false);
        setAlertType(matchedSaved.trendThresholdType || 'volume');
        setAlertThreshold(matchedSaved.trendThresholdValue ?? 10000);
      }

      // Add small alert toast or notification to indicate successful search
      try {
        await addNotification(
          'info',
          `Analysis Concluded: "${targetKw}"`,
          `High-fidelity search volume index and content blueprint generated for ${targetCountry}.`
        );
      } catch (notifErr) {
        console.warn("Notification failed inside explorer:", notifErr);
      }

    } catch (err: any) {
      console.error("Keyword Explorer request failed:", err);
      setSearchError(err?.message || "An unexpected engine error occurred. Check settings or retry.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveWorkspace = async () => {
    if (!auth.currentUser || !researchData) return;
    setSaveStatus('saving');

    try {
      const keywordId = 'kw-' + researchData.keyword.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
      await setDoc(doc(db, 'keywords', keywordId), {
        keyword: researchData.keyword,
        payloadJson: JSON.stringify(researchData),
        userId: auth.currentUser.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isTracked: false,
        trendThresholdType: 'volume',
        trendThresholdValue: 10000,
        isAlertTriggered: false
      });

      setSelectedSavedId(keywordId);
      setAlertTracked(false);
      setAlertType('volume');
      setAlertThreshold(10000);

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);

      await addNotification(
        'milestone',
        'Keyword Diagnostic Saved',
        `Niche keywords for "${researchData.keyword}" stored into your permanent tactical planning workspace.`
      );
    } catch (err: any) {
      console.error("Save failure:", err);
      setSaveStatus('error');
    }
  };

  const handleSaveAlertRules = async () => {
    if (!auth.currentUser || !selectedSavedId) return;
    try {
      await setDoc(doc(db, 'keywords', selectedSavedId), {
        isTracked: alertTracked,
        trendThresholdType: alertType,
        trendThresholdValue: alertThreshold,
        updatedAt: Date.now()
      }, { merge: true });

      await addNotification(
        'milestone',
        'Trend Monitors Configured',
        `Real-time watching rules saved for "${researchData?.keyword}".`
      );
    } catch (err) {
      console.error("Failed to update tracking preferences:", err);
    }
  };

  const handleDeleteKeyword = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'keywords', id));
      if (selectedSavedId === id) {
        setSelectedSavedId(null);
        setAlertTracked(false);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const loadSavedKeyword = (savedItem: SavedKeyword) => {
    try {
      const parsed = JSON.parse(savedItem.payloadJson);
      setResearchData(parsed);
      setKeyword(savedItem.keyword);
      setSelectedSavedId(savedItem.id);
      setAlertTracked(savedItem.isTracked || false);
      setAlertType(savedItem.trendThresholdType || 'volume');
      setAlertThreshold(savedItem.trendThresholdValue ?? 10000);
      setActiveTab('overview');
      setSearchError(null);
    } catch (err) {
      console.error("Failed to parse keyword payload", err);
    }
  };

  const handleAuditCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCompetitor.trim() || !researchData) return;
    setIsAuditingCompetitor(true);
    setCompetitorAuditError(null);

    try {
      const targetDomain = customCompetitor.trim().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      const response = await fetch('/api/keywords/audit-competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: researchData.keyword,
          competitorDomain: targetDomain,
          userId: auth.currentUser?.uid
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errMsg = "Custom audit encountered an engine issue.";
        if (contentType && contentType.includes("application/json")) {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } else {
          errMsg = `Server returned status ${response.status} (non-JSON response). The server is likely booting up. Please try again in 5 seconds.`;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();

      // Append new auditor result to local competitors
      const updatedCompetitors = [
        ...(researchData.competitors || []),
        data.auditResult
      ];

      // Update current state
      const updatedResearchData = {
        ...researchData,
        competitors: updatedCompetitors
      };
      setResearchData(updatedResearchData);
      setCustomCompetitor('');

      // If we are currently reviewing a saved query in the database, automatically merge this update into firestore!
      if (selectedSavedId) {
        await setDoc(doc(db, 'keywords', selectedSavedId), {
          payloadJson: JSON.stringify(updatedResearchData),
          updatedAt: Date.now()
        }, { merge: true });
      }

      await addNotification(
        'milestone',
        'Competitor Audited',
        `Deep intelligence report generated for "${targetDomain}" content silos.`
      );
    } catch (err: any) {
      console.error("Competitor audit failed:", err);
      setCompetitorAuditError(err.message || "Auditing error.");
    } finally {
      setIsAuditingCompetitor(false);
    }
  };

  const demoPresets = [
    "best portable solar generators",
    "minimalist mechanical keyboard mods",
    "healthy matcha smoothie recipes",
    "saas side hustles for developers"
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* 1. HEADER SECTION */}
      <div className="relative p-8 rounded-[32px] bg-gradient-to-r from-[#090b10] to-[#040507] border border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#a8ff35]/3 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#a8ff35]/15 text-[#a8ff35] text-[10px] font-mono font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              Niche Research // Multi-Channel SEO
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Keyword Explorer Model
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Unveil high-yield transactional search terms, viral Pinterest creative blueprints, ready-to-inject affiliate partnerships, and optimized content maps using cognitive AI.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#0d0e12] border border-white/5 py-2 px-3 rounded-2xl">
            <Activity className="w-4 h-4 text-[#a8ff35] animate-pulse" />
            <span className="text-[10px] font-mono font-extrabold text-zinc-400 uppercase tracking-wide">Ready for analysis</span>
          </div>
        </div>
      </div>

      {/* 2. CORE EXPLORER CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT SEARCH PANEL & HISTORIC SEARCHES Workspace */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-[#090a0d] border border-white/5 rounded-[28px] overflow-hidden p-6 space-y-6">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a8ff35] font-mono">Control Dashboard</span>
              <h2 className="text-lg font-extrabold text-white tracking-tight mt-1">SEO Query Generator</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 font-mono">Keyword Phrase</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. eco friendly travel gear"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-full bg-[#111216] border border-white/5 text-xs text-white rounded-xl py-3.5 pl-10 pr-4 placeholder-zinc-500 focus:border-[#a8ff35] focus:outline-none transition font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 font-mono">Territory</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#111216] border border-white/5 text-xs text-zinc-300 rounded-xl p-3 focus:border-[#a8ff35] focus:outline-none"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="France">France</option>
                    <option value="Germany">Germany</option>
                    <option value="Global">Global Index</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 font-mono">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-[#111216] border border-white/5 text-xs text-zinc-300 rounded-xl p-3 focus:border-[#a8ff35] focus:outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Español</option>
                    <option value="French">Français</option>
                    <option value="German">Deutsch</option>
                    <option value="Italian">Italiano</option>
                    <option value="Portuguese">Português</option>
                  </select>
                </div>
              </div>

              {searchError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{searchError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-3.5 rounded-xl bg-[#a8ff35] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#97ea28] active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Search Intents...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-current text-black" />
                    <span>Run Deep Keyword Model</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Presets */}
            <div className="space-y-2 border-t border-white/[0.03] pt-4">
              <span className="text-[9px] font-extrabold font-mono uppercase tracking-wider text-zinc-500">Popular Niche Primers</span>
              <div className="flex flex-wrap gap-1.5">
                {demoPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickSearch(preset)}
                    className="px-2.5 py-1.5 bg-[#121318] hover:bg-[#1c1d25] border border-white/3 text-[10px] text-zinc-300 rounded-lg hover:text-[#a8ff35] transition text-left truncate max-w-full"
                  >
                    # {preset}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* HISTORICAL WORKSPACE COLLECTIONS PANEL */}
          <Card className="bg-[#090a0d] border border-white/5 rounded-[28px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a8ff35] font-mono">Workspace Storage</span>
                <h3 className="text-sm font-extrabold text-white tracking-tight mt-1">Saved Keyword Reports</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold">{savedKeywords.length}</span>
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {savedKeywords.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center space-y-2 bg-black/10">
                  <BookmarkCheck className="w-5 h-5 text-zinc-750" />
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">No cached keywords</p>
                  <p className="text-[9px] text-zinc-500 max-w-[180px]">Run a model query above and click "Save to Workspace" to keep historic logs.</p>
                </div>
              ) : (
                savedKeywords.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadSavedKeyword(item)}
                    className="p-3 bg-[#111216] hover:bg-[#18191f] border border-white/3 rounded-xl flex items-center justify-between group cursor-pointer transition relative overflow-hidden"
                  >
                    <div className="space-y-1 truncate pr-3">
                      <div className="flex items-center gap-1.5 truncate">
                        <p className="text-xs font-bold text-white group-hover:text-[#a8ff35] transition truncate">
                          {item.keyword}
                        </p>
                        {item.isTracked && (
                          <span className="relative flex h-2 w-2 flex-shrink-0" title={item.isAlertTriggered ? "Trend Threshold Hit!" : "Active Trend Monitor"}>
                            {item.isAlertTriggered ? (
                              <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                              </>
                            ) : (
                              <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </>
                            )}
                          </span>
                        )}
                      </div>
                      <span className="text-[8.5px] text-zinc-500 font-mono flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(item.createdAt).toLocaleDateString()}
                        {item.isTracked && (
                          <span className={`${item.isAlertTriggered ? 'text-rose-400' : 'text-emerald-400'} font-bold text-[8px] uppercase tracking-wider pl-1 font-mono`}>
                            {item.isAlertTriggered ? '• Spiked' : '• Monitoring'}
                          </span>
                        )}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteKeyword(item.id, e)}
                      className="p-2 bg-transparent text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                      title="Delete saved keyword"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT ANALYSIS DATA GRID DISPLAY */}
        <div className="lg:col-span-8">
          {isSearching ? (
            <div className="bg-[#090a0d] border border-white/5 rounded-[32px] p-20 flex flex-col items-center justify-center text-center space-y-5 animate-pulse min-h-[500px]">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-[#a8ff35] animate-spin" />
                <Sparkles className="w-5 h-5 text-[#a8ff35] absolute top-1 right-0 animate-ping" />
              </div>
              <div className="space-y-2 max-w-sm">
                <p className="font-extrabold text-white text-sm uppercase tracking-wider font-mono">Cognitive Pipeline Computing</p>
                <p className="text-xs text-zinc-500">
                  Calling Gemini models to check search intent, cataloging related semantic nodes, discovering sponsorships, and drafting customized creative visual concepts...
                </p>
              </div>
            </div>
          ) : !researchData ? (
            <div className="bg-[#090a0d] border border-white/5 rounded-[32px] p-16 flex flex-col items-center justify-center text-center space-y-4 min-h-[500px]">
              <div className="w-16 h-16 rounded-[22px] bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 mb-2">
                <Search className="w-8 h-8 opacity-75" />
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-lg font-extrabold text-white tracking-tight">Keyword Explorer Standby</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Generate live analysis to harvest keyword metrics. Enter search queries or click a primer theme on the left panel to begin.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* ANALYSIS HUD METRICS CELL */}
              <div className="bg-gradient-to-br from-[#0c0d12] to-[#08090b] border border-white/5 rounded-[32px] p-6.5 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#a8ff35]/3 rounded-full blur-[80px]" />
                
                {/* Header & Save Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-4.5 relative z-10">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#a8ff35] font-mono tracking-wider">Analysis Result</span>
                    <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                      {researchData.keyword}
                    </h3>
                  </div>

                  <Button
                    onClick={handleSaveWorkspace}
                    disabled={saveStatus === 'saved' || saveStatus === 'saving'}
                    className={`text-xs px-5 py-3 rounded-xl border font-bold transition flex items-center gap-2 ${
                      saveStatus === 'saved'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-white'
                    }`}
                  >
                    {saveStatus === 'saving' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : saveStatus === 'saved' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Saved in Workspace
                      </>
                    ) : (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        Save to Workspace
                      </>
                    )}
                  </Button>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                  <div className="bg-[#111216] border border-white/3 rounded-2xl p-4.5 flex flex-col justify-between h-24">
                    <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider">Monthly Searches</span>
                    <span className="text-xl font-bold text-white leading-tight font-mono">{researchData.volume}</span>
                  </div>

                  <div className="bg-[#111216] border border-white/3 rounded-2xl p-4.5 flex flex-col justify-between h-24">
                    <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider">SEO Difficulty (KD%)</span>
                    <div className="flex items-end justify-between">
                      <span className="text-xl font-bold text-white leading-tight font-mono">{researchData.difficulty}%</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        researchData.difficulty < 40 
                          ? 'bg-emerald-500/10 text-emerald-400' 
                          : researchData.difficulty < 70 
                            ? 'bg-yellow-500/10 text-yellow-500' 
                            : 'bg-red-500/10 text-red-500'
                      }`}>
                        {researchData.difficulty < 40 ? 'Easy' : researchData.difficulty < 70 ? 'Moderate' : 'Hard'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#111216] border border-white/3 rounded-2xl p-4.5 flex flex-col justify-between h-24">
                    <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider">Average CPC (USD)</span>
                    <span className="text-xl font-bold text-white leading-tight font-mono">{researchData.cpc}</span>
                  </div>

                  <div className="bg-[#111216] border border-white/3 rounded-2xl p-4.5 flex flex-col justify-between h-24">
                    <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wider">Global Trend</span>
                    <div className="flex items-center gap-1.5">
                      {researchData.globalTrend === 'up' ? (
                        <>
                          <TrendingUp className="w-5 h-5 text-[#a8ff35]" />
                          <span className="text-sm font-bold text-[#a8ff35] font-mono uppercase">Growing</span>
                        </>
                      ) : researchData.globalTrend === 'down' ? (
                        <>
                          <TrendingDown className="w-5 h-5 text-rose-500" />
                          <span className="text-sm font-bold text-rose-500 font-mono uppercase">Decline</span>
                        </>
                      ) : (
                        <>
                          <Activity className="w-5 h-5 text-zinc-400" />
                          <span className="text-sm font-bold text-zinc-400 font-mono uppercase">Stable</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Search intent & priorities summary */}
                <div className="bg-black/20 border border-white/3 p-4 rounded-xl space-y-2 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">Search Intent Psychology</span>
                    <span className="text-[10.5px] uppercase font-black text-[#a8ff35] font-mono tracking-wider">
                      {researchData.searchIntent}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-xs font-sans leading-relaxed">
                    {researchData.intentAnalysis}
                  </p>
                </div>

                {/* 3. REAL-TIME TREND WATCHERS */}
                <div className="bg-gradient-to-r from-[#0d0f14] to-[#040508] border border-white/5 rounded-2xl p-5 space-y-4 relative z-10 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#a8ff35]/2 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#a8ff35]/10 text-[#a8ff35]">
                        <Volume2 className="w-4 h-4 text-[#a8ff35]" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold font-mono uppercase tracking-wider text-zinc-500">Intelligent Telemetry</span>
                        <h4 className="text-xs font-extrabold text-white uppercase tracking-tight">Real-Time Trend Monitor</h4>
                      </div>
                    </div>

                    {selectedSavedId ? (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                        alertTracked 
                          ? savedKeywords.find(k => k.id === selectedSavedId)?.isAlertTriggered 
                            ? 'bg-rose-500/15 text-rose-400' 
                            : 'bg-emerald-500/15 text-emerald-400' 
                          : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          alertTracked 
                            ? savedKeywords.find(k => k.id === selectedSavedId)?.isAlertTriggered 
                              ? 'bg-rose-400 animate-pulse' 
                              : 'bg-emerald-400 animate-ping' 
                            : 'bg-zinc-650'
                        }`} />
                        {alertTracked 
                          ? savedKeywords.find(k => k.id === selectedSavedId)?.isAlertTriggered ? 'Threshold Hit' : 'Active Monitor' 
                          : 'Inactive'
                        }
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 text-[9px] font-mono font-bold uppercase tracking-wide">Locked</span>
                    )}
                  </div>

                  {!selectedSavedId ? (
                    <div className="p-4 rounded-xl border border-dashed border-white/5 bg-black/10 text-center space-y-2">
                      <p className="text-xs text-zinc-400">
                        ⚡ Want live trend warnings? Click <strong className="text-white">"Save to Workspace"</strong> above.
                      </p>
                      <p className="text-[10px] text-zinc-500 leading-normal max-w-sm mx-auto">
                        Once saved, configure specific thresholds. The automated search engine will monitor indices in real-time, instantly issuing multi-channel notifications and audio signals.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        {/* 1. Track Toggle */}
                        <div className="md:col-span-3 space-y-1.5">
                          <label className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 font-mono font-bold">Watch Status</label>
                          <button
                            type="button"
                            onClick={() => setAlertTracked(!alertTracked)}
                            className={`w-full py-2 px-3 rounded-lg border text-[10px] font-extrabold uppercase tracking-wider font-mono transition flex items-center justify-center gap-2 ${
                              alertTracked
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-[#111216] border border-white/5 text-zinc-450 hover:text-white'
                            }`}
                          >
                            {alertTracked ? '🔔 Watching On' : '🔕 Watching Off'}
                          </button>
                        </div>

                        {/* 2. Metric Type Selection */}
                        <div className="md:col-span-4 space-y-1.5">
                          <label className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 font-mono font-bold font-mono">Telemetry Indicator</label>
                          <select
                            disabled={!alertTracked}
                            value={alertType}
                            onChange={(e) => setAlertType(e.target.value as any)}
                            className="w-full bg-[#111216] border border-white/10 text-xs text-zinc-350 rounded-lg py-2.5 px-3 focus:outline-none focus:border-[#a8ff35] disabled:opacity-40 disabled:cursor-not-allowed font-medium font-sans"
                          >
                            <option value="volume">Monthly Searches</option>
                            <option value="cpc">Cost-Per-Click rate ($)</option>
                            <option value="pinterestPotential">Pinterest Referral Potential (1-10)</option>
                            <option value="seoPotential">Google Web SEO Index (1-10)</option>
                          </select>
                        </div>

                        {/* 3. Level Level */}
                        <div className="md:col-span-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 font-mono font-bold">Alert Threshold</label>
                            <span className="text-[8px] font-mono text-zinc-500 pr-1 truncate">
                              (Cur: {alertType === 'volume' ? researchData.volume : alertType === 'cpc' ? researchData.cpc : alertType === 'pinterestPotential' ? (researchData.metrics.pinterestPotential || 9) : (researchData.metrics.seoPotential || 8)})
                            </span>
                          </div>
                          <input
                            disabled={!alertTracked}
                            type="number"
                            value={alertThreshold}
                            onChange={(e) => setAlertThreshold(Number(e.target.value))}
                            className="w-full bg-[#111216] border border-white/10 text-xs text-white rounded-lg py-2 px-3 focus:outline-none focus:border-[#a8ff35] disabled:opacity-40 disabled:cursor-not-allowed font-bold font-mono"
                          />
                        </div>

                        {/* Update rule button */}
                        <div className="md:col-span-2">
                          <button
                            type="button"
                            onClick={handleSaveAlertRules}
                            className="w-full py-2.5 rounded-lg bg-[#a8ff35] hover:bg-[#8ee025] text-black font-extrabold text-[10px] uppercase tracking-wider transition duration-200 cursor-pointer text-center"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION TABS SYSTEM */}
              <div className="flex border-b border-white/[0.04] gap-1 overflow-x-auto scrollbar-none">
                {[
                  { id: 'overview', label: 'Potential Channels', icon: PieChart },
                  { id: 'semantic', label: 'Semantic Silos', icon: Layers },
                  { id: 'sponsors', label: 'Affiliate Sponsors', icon: Activity },
                  { id: 'pinterest', label: 'Pinterest Concepts', icon: Compass },
                  { id: 'outline', label: 'Content Outline', icon: FileText },
                  { id: 'competitors', label: 'Competitor Intel', icon: Users }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-3 px-4.5 rounded-t-xl text-[11px] font-extrabold uppercase font-mono tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-[#a8ff35] text-white bg-[#a8ff35]/5'
                        : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-[#a8ff35]' : 'text-zinc-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* RENDER ACTIVE TAB CELL */}
              <Card className="bg-[#090a0d] border border-white/5 rounded-[28px] p-6.5 min-h-[300px]">
                
                {/* 1. CHANNEL POTENTIAL TAB */}
                {activeTab === 'overview' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-sm font-extrabold text-white uppercase font-mono tracking-wider">Potential Channels Metrics</h4>
                      <p className="text-xs text-zinc-500">Predicted scores mapping overall niche fitness indexes for each traffic source.</p>
                    </div>

                    <div className="space-y-4 max-w-xl">
                      {/* SEO Potential */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-sky-400" />
                            Google Web SEO Rank Potential
                          </span>
                          <span className="font-mono text-[#a8ff35] font-bold">{researchData.metrics.seoPotential || 8}/10</span>
                        </div>
                        <div className="w-full bg-zinc-950 rounded-full h-3 overflow-hidden border border-white/5">
                          <div className="bg-sky-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(researchData.metrics.seoPotential || 8) * 10}%` }} />
                        </div>
                      </div>

                      {/* Pinterest Potential */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white flex items-center gap-2">
                            <Compass className="w-3.5 h-3.5 text-rose-500" />
                            Pinterest Visual Referral Index
                          </span>
                          <span className="font-mono text-[#a8ff35] font-bold">{researchData.metrics.pinterestPotential || 9}/10</span>
                        </div>
                        <div className="w-full bg-zinc-950 rounded-full h-3 overflow-hidden border border-white/5">
                          <div className="bg-rose-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(researchData.metrics.pinterestPotential || 9) * 10}%` }} />
                        </div>
                      </div>

                      {/* Affiliate Fit */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-amber-500" />
                            Affiliate Program Sponsorship Fit
                          </span>
                          <span className="font-mono text-[#a8ff35] font-bold">{researchData.metrics.affiliateFit || 9}/10</span>
                        </div>
                        <div className="w-full bg-zinc-950 rounded-full h-3 overflow-hidden border border-white/5">
                          <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(researchData.metrics.affiliateFit || 9) * 10}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#111216] border border-white/5 text-xs text-zinc-400 leading-relaxed max-w-2xl">
                      <p className="font-extrabold text-white uppercase font-mono text-[10px] tracking-wider mb-1.5">Model Recommendation Strategy:</p>
                      {researchData.metrics.pinterestPotential >= 8 ? (
                        <span>This topic displays a **high indexing score on Pinterest**. We suggest creating at least 3 custom vertical pin graphics with vibrant pastel overlays to capitalize on immediate click-referrals while your editorial post gets indexed by Google.</span>
                      ) : (
                        <span>Focus heavily on **Search Engine Optimization** pillars. Difficulty indexes suggest targeting long-tail semantic LSI subtopics map to convert highly specific buyer search intents.</span>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. SEMANTIC SILOS TAB */}
                {activeTab === 'semantic' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-sm font-extrabold text-white uppercase font-mono tracking-wider">Semantic Clusters & LSI Subtopics</h4>
                      <p className="text-xs text-zinc-500">Related lookup nodes that should form your core silo directories to bypass tough keyword scores.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {researchData.semanticClusters?.map((node, idx) => (
                        <div key={idx} className="p-5.5 bg-[#111216] border border-white/3 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{node.subtopic}</span>
                              <span className="text-[10px] uppercase font-mono py-0.5 px-2 rounded bg-zinc-800 text-zinc-400 font-bold">
                                KD: {node.difficulty}%
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5">
                              {node.keywords.map((kw, i) => (
                                <span key={i} className="px-2 py-0.5 bg-black/35 text-[10px] text-zinc-400 font-mono rounded">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-white/[0.04] pt-3 text-[11px] text-zinc-400 leading-relaxed font-sans">
                            <span className="font-bold text-[#a8ff35] font-mono uppercase tracking-wider text-[9px] block">Monetization Angle:</span>
                            {node.monetizationHook}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. AFFILIATE SPONSORS TAB */}
                {activeTab === 'sponsors' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-sm font-extrabold text-white uppercase font-mono tracking-wider">Matched Affiliate Partnerships</h4>
                      <p className="text-xs text-zinc-500">Commission structures and sponsorship pitch orientations curated to boost CTR conversions.</p>
                    </div>

                    <div className="space-y-4">
                      {researchData.suggestedSponsors?.map((sponsor, idx) => (
                        <div key={idx} className="p-5 bg-[#111216] border border-white/3 rounded-[20px] flex flex-col md:flex-row gap-5 md:items-center justify-between shadow-sm">
                          <div className="space-y-2 max-w-xl">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#a8ff35]/10 text-[#a8ff35] flex items-center justify-center font-mono font-bold text-xs uppercase">
                                {sponsor.niche.substring(0, 2)}
                              </div>
                              <h5 className="text-sm font-bold text-white">{sponsor.niche}</h5>
                            </div>
                            
                            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                              <span className="text-[#a8ff35] font-mono font-bold uppercase text-[9px] block">Reader Hook Angle:</span>
                              {sponsor.hookAngle}
                            </p>
                          </div>

                          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-white/[0.04] pt-3.5 md:pt-0 md:pl-6.5 shrink-0 gap-1 min-w-[150px]">
                            <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">Sponsor Offer Payout</span>
                            <span className="text-sm font-bold text-[#a8ff35] font-mono">{sponsor.payoutModel}</span>
                            <span className="text-[9.5px] text-zinc-400 font-medium italic mt-1 font-mono">{sponsor.estimatedCpa}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. PINTEREST CREATIVE CONCEPTS */}
                {activeTab === 'pinterest' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-sm font-extrabold text-[#E60023] uppercase font-mono tracking-wider">Pinterest Graphics Strategy</h4>
                      <p className="text-xs text-zinc-500">Visual design concepts aligned with current vertical pin algorithms to grab attention.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {researchData.pinterestCreativeConcepts?.map((concept, idx) => (
                        <div key={idx} className="p-5.5 bg-[#111216] border border-white/3 rounded-[24px] space-y-4 shadow-sm flex flex-col justify-between">
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-sm font-extrabold text-white leading-snug">{concept.conceptTitle}</p>
                              <span className="p-1 rounded-md bg-[#E60023]/10 text-[#E60023]">
                                <Compass className="w-4 h-4 fill-current text-current" />
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs text-zinc-400 font-sans">
                              <p className="leading-relaxed">
                                <strong className="text-zinc-300 font-bold">Palette Suggestions:</strong> {concept.visualPalette}
                              </p>
                              <p className="leading-relaxed">
                                <strong className="text-zinc-300 font-bold">Layout Grid:</strong> {concept.layoutDescription}
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-white/[0.04] pt-3 flex flex-wrap gap-1">
                            {concept.seoTags?.map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 bg-black/45 text-[9px] text-[#22c55e] font-mono rounded font-bold">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. CONTENT OUTLINE TAB */}
                {activeTab === 'outline' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h4 className="text-sm font-extrabold text-white uppercase font-mono tracking-wider">Autonomous Article Wireframe</h4>
                      <p className="text-xs text-zinc-500">Curated outlines built by SEO core auditing models to guarantee maximum ranking benchmarks.</p>
                    </div>

                    <div className="p-4 bg-black/35 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">H1 Title Pillar Proposal:</span>
                      <h5 className="text-base font-extrabold text-white leading-normal">{researchData.contentOutline?.pillarTitle}</h5>
                    </div>

                    <div className="space-y-3.5 relative pl-4 before:absolute before:left-1 before:top-3 before:bottom-3 before:w-[1px] before:bg-white/5">
                      {researchData.contentOutline?.structuredSections?.map((sec, idx) => (
                        <div key={idx} className="relative space-y-1 bg-[#111216] border border-white/3 rounded-xl p-4 shadow-sm">
                          <span className="absolute -left-7 top-4 w-4.5 h-4.5 rounded-full bg-[#a8ff35] text-black font-mono font-extrabold text-[9.5px] flex items-center justify-center shadow-lg shadow-[#a8ff35]/20">
                            {idx + 1}
                          </span>
                          
                          <div className="flex items-center justify-between">
                            <h6 className="text-xs font-bold text-white uppercase font-mono tracking-wide">{sec.heading}</h6>
                            <span className="text-[9px] bg-black/45 text-zinc-400 font-mono px-2 py-0.5 rounded">
                              Focus: {sec.focusKeyword}
                            </span>
                          </div>

                          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed pt-1">
                            {sec.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. COMPETITOR INTEL TAB */}
                {activeTab === 'competitors' && (
                  <div className="space-y-6 animate-in fade-in duration-200 text-left">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.04] pb-4">
                      <div>
                        <h4 className="text-sm font-extrabold text-white uppercase font-mono tracking-wider">Competitor Rank Intelligence</h4>
                        <p className="text-xs text-zinc-500">Analyze competing authority sites ranking for this keyword cluster and study their high-performing silos.</p>
                      </div>

                      {/* Interactive Custom Auditor Tool */}
                      <form onSubmit={handleAuditCompetitor} className="flex gap-2 w-full md:w-auto">
                        <input
                          type="text"
                          required
                          value={customCompetitor}
                          onChange={(e) => setCustomCompetitor(e.target.value)}
                          placeholder="Audit custom domain (e.g. nichecritic.com)"
                          className="bg-[#111216] border border-white/5 text-xs text-white rounded-lg py-2 px-3 placeholder-zinc-500 focus:border-[#a8ff35] focus:outline-none min-w-[220px]"
                        />
                        <button
                          type="submit"
                          disabled={isAuditingCompetitor}
                          className="px-4 py-2 rounded-lg bg-[#a8ff35] hover:bg-[#96e32d] text-black font-extrabold text-[10px] uppercase tracking-wider font-mono transition disabled:opacity-55 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                        >
                          {isAuditingCompetitor ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <Search className="w-3.5 h-3.5" />
                              <span>Audit Competitor</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {competitorAuditError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] uppercase font-mono tracking-wide rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{competitorAuditError}</span>
                      </div>
                    )}

                    {(!researchData.competitors || researchData.competitors.length === 0) ? (
                      <div className="p-8 border border-dashed border-white/5 rounded-2xl text-center space-y-3 bg-black/10">
                        <Users className="w-8 h-8 text-zinc-600 mx-auto" strokeWidth={1.5} />
                        <p className="text-xs text-zinc-400 font-bold">No competitor strategies crawled yet for this keyword report.</p>
                        <p className="text-[10px] text-zinc-500 text-center max-w-sm mx-auto">Use the custom domain auditor above to capture and persist technical competitor ranking insights instantly.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {researchData.competitors.map((comp, idx) => (
                          <div key={idx} className="bg-[#111216] border border-white/3 rounded-[24px] p-5.5 space-y-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#a8ff35]/2 rounded-full blur-xl pointer-events-none" />

                            {/* Competitor Header Metrics */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.04] pb-4.5">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-[#a8ff35]">
                                  <Globe className="w-4 h-4 text-[#a8ff35]" />
                                </div>
                                <div className="space-y-0.5 text-left">
                                  <h5 className="text-[14px] font-black text-white leading-none">{comp.domain}</h5>
                                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">SEO Competitor Root</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3.5 flex-wrap">
                                <div className="bg-black/35 border border-white/5 px-4 py-2 rounded-xl text-left min-w-[100px]">
                                  <span className="text-[8px] font-mono text-zinc-500 block uppercase font-bold tracking-wider">Organic Traffic</span>
                                  <span className="text-xs font-bold text-white font-mono">{comp.organicTraffic}</span>
                                </div>
                                <div className="bg-black/35 border border-white/5 px-4 py-2 rounded-xl text-left min-w-[90px]">
                                  <span className="text-[8px] font-mono text-zinc-500 block uppercase font-bold tracking-wider">Domain Auth (DA)</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-[#a8ff35] font-mono">{comp.domainAuthority}</span>
                                    <span className={`text-[7.5px] px-1 rounded uppercase font-bold font-mono ${
                                      comp.domainAuthority >= 60 ? 'bg-[#a8ff35]/10 text-[#a8ff35]' : 'bg-zinc-800 text-zinc-400'
                                    }`}>
                                      {comp.domainAuthority >= 60 ? 'High' : 'Mid'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Keywords & Content Silos side-by-side */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5 text-left">
                              {/* Left: Key Rankings */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-1.5">
                                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a8ff35] font-mono">Ranking Keyword Targets</span>
                                </div>
                                <div className="bg-black/25 border border-white/3 rounded-xl overflow-hidden">
                                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                                    <thead>
                                      <tr className="bg-black/40 text-zinc-500 font-mono text-[8.5px] font-bold uppercase tracking-wider">
                                        <th className="p-2.5 pl-3">Keyword</th>
                                        <th className="p-2.5 text-center">Pos</th>
                                        <th className="p-2.5 text-right font-mono">Vol</th>
                                        <th className="p-2.5 text-right pr-3 font-mono">KD%</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                      {comp.commonKeywords?.map((kw, kwIdx) => (
                                        <tr key={kwIdx} className="hover:bg-white/[0.01] transition-all">
                                          <td className="p-2.5 pl-3 font-medium text-white truncate max-w-[120px]">{kw.keyword}</td>
                                          <td className="p-2.5 text-center font-bold">
                                            <span className={`inline-flex items-center justify-center rounded-md font-mono text-[9.5px] px-1.5 py-0.5 ${
                                              kw.position === 1 ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 
                                              kw.position <= 3 ? 'bg-zinc-300/10 text-zinc-300 border border-zinc-300/10' : 'text-zinc-500 bg-zinc-900/50'
                                            }`}>
                                              #{kw.position}
                                            </span>
                                          </td>
                                          <td className="p-2.5 text-right font-mono text-zinc-400 text-[11px]">{kw.volume}</td>
                                          <td className="p-2.5 text-right pr-3 text-[11px] font-mono font-bold">
                                            <span className={kw.kd >= 65 ? 'text-red-400' : kw.kd >= 40 ? 'text-yellow-500' : 'text-emerald-400'}>
                                              {kw.kd}%
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Right: Content Silos / Clusters */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-sky-450 animate-pulse" />
                                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a8ff35] font-mono">Top Traffic Silos</span>
                                </div>
                                <div className="space-y-2.5">
                                  {comp.contentClusters?.map((cl, clIdx) => (
                                    <div key={clIdx} className="p-3 bg-black/20 border border-white/3 rounded-xl flex items-center justify-between">
                                      <div className="space-y-0.5 text-left truncate">
                                        <div className="flex items-center gap-2 truncate">
                                          <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                                          <p className="text-xs font-bold text-white truncate">{cl.clusterName}</p>
                                        </div>
                                        <span className="text-[9px] font-mono text-zinc-500 uppercase block tracking-wider font-bold">
                                          {cl.primaryIntent} Intent • {cl.pagesCount} optimized pages
                                        </span>
                                      </div>

                                      <div className="bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-white/5 text-right font-mono shrink-0">
                                        <span className="text-[7px] text-zinc-500 leading-none block uppercase font-extrabold font-mono">Silo Score</span>
                                        <span className="text-[11px] text-[#a8ff35] font-black">{cl.performanceScore}/10</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Core Strategy Callout */}
                            <div className="p-3.5 bg-black/35 rounded-xl border border-white/3 text-left">
                              <span className="text-[9px] font-mono text-[#a8ff35] font-black uppercase tracking-widest block mb-1">Observed SEO Strategy:</span>
                              <p className="text-zinc-300 text-xs font-sans leading-relaxed">
                                {comp.seoStrategy}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </Card>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
