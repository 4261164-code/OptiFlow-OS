import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/auth';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { addNotification } from '../lib/notifications';
import { Loader2, ArrowRight, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CampaignIcon, ArticlesIcon, AgentsIcon } from './CustomIcons';
import { SEOChat } from './SEOChat';

function generateId() {
  return Array.from({ length: 20 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))).join('');
}

export function CampaignBuilder() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'repurpose'>('create');
  const navigate = useNavigate();

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<{
    status: string;
    error?: string;
    createdAt?: number;
    updatedAt?: number;
    keyword?: string;
  } | null>(null);

  const [form, setForm] = useState({
    keyword: '',
    articleLength: 2000,
    seoLevel: 'High',
    country: 'United States',
    language: 'English',
    tone: 'Professional & Engaging',
    numPins: 5,
    numImages: 2,
    hasFaq: true,
    internalLinks: true,
    externalLinks: true,
    affiliateOffers: 'Pinterest Traffic Tools',
    autoPublish: false,
    existingArticleTitle: '',
    existingArticleContent: ''
  });

  const handleRun = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!form.keyword.trim() || !auth.currentUser) return;

    setLoading(true);
    const userId = auth.currentUser.uid;
    const jobId = generateId();
    const now = Date.now();

    const payload = {
      ...form,
      jobId,
      // If we are in create mode, clear external article info to avoid mismatch
      existingArticleTitle: activeTab === 'repurpose' ? form.existingArticleTitle : '',
      existingArticleContent: activeTab === 'repurpose' ? form.existingArticleContent : ''
    };

    setActiveJobId(jobId);

    try {
      // 1. Create initial pending job record in Firestore (under authenticated user context)
      await setDoc(doc(db, 'jobs', jobId), {
        keyword: form.keyword,
        status: 'pending',
        userId,
        createdAt: now,
        updatedAt: now
      });

      // 2. Set up real-time listener to job execution document
      const unsub = onSnapshot(doc(db, 'jobs', jobId), (docSnap) => {
        if (docSnap.exists()) {
          const val = docSnap.data();
          setJobProgress({
            status: val.status,
            error: val.error,
            createdAt: val.createdAt,
            updatedAt: val.updatedAt,
            keyword: val.keyword
          });

          if (val.status === 'completed') {
            unsub();
            setTimeout(() => {
              navigate('/articles');
              setLoading(false);
              setActiveJobId(null);
              setJobProgress(null);
            }, 2500);
          } else if (val.status === 'error') {
            unsub();
            setLoading(false);
          }
        }
      }, (err) => {
        console.error("Firestore listening failed:", err);
      });

      // 3. Call backend pipeline orchestrator to run agents (returns full generated payload on success)
      const response = await apiFetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const contentType = response.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text.substring(0, 100) || `Server returned invalid Response Status: ${response.status}`);
      }
      
      if (!response.ok) throw new Error(data.error || "Failed to generate campaign content");

      // 4. Save generated Article record in Firestore safely
      const articleId = data.articleId || 'art-' + generateId();
      await setDoc(doc(db, 'articles', articleId), {
        title: data.article?.title || form.keyword,
        content: data.article?.content || "",
        keyword: form.keyword,
        jobId: jobId,
        userId: userId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // 5. Save generated Pinterest Pins in Firestore safely
      if (data.pins && Array.isArray(data.pins)) {
        await Promise.all(data.pins.map(async (pin: any) => {
          const pinId = pin.id || generateId();
          await setDoc(doc(db, 'pins', pinId), {
            title: pin.title || "",
            description: pin.description || "",
            concept: pin.concept || "",
            imageUrl: pin.imageUrl || null,
            articleId,
            jobId,
            userId,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }));
      }

      // 6. Complete Job state in Firestore to trigger redirection
      await setDoc(doc(db, 'jobs', jobId), {
        status: 'completed',
        articleId,
        updatedAt: Date.now()
      }, { merge: true });

      // Trigger high-CTR Campaign Milestone alert
      try {
        if (userId) {
          await addNotification(
            userId,
            'milestone',
            'Campaign Content Pipeline Succeeded',
            `Successfully compiled deep LSI research data and drafted strategic high-conversion layout for keyword: "${form.keyword}". Pinterest media sets synced and ready.`
          );
        }
      } catch (notifErr) {
        console.error("Failed to send campaign success notification:", notifErr);
      }

    } catch (err: any) {
      console.error(err);
      
      // Register error state in logs and notifications
      try {
        if (userId) {
          await addNotification(
            userId,
            'error',
            'Campaign Content Pipeline Failed',
            `Generation for keyword "${form.keyword}" crashed. Reason: ${err?.message || String(err)}`
          );
        }
      } catch (notifErr) {
        console.error("Failed to send campaign error notification:", notifErr);
      }

      // Attempt to register error state in local firestore record
      try {
        await setDoc(doc(db, 'jobs', jobId), {
          status: 'error',
          error: err.message || String(err),
          updatedAt: Date.now()
        }, { merge: true });
      } catch (innerErr) {
        console.error("Failed to register error state in DB:", innerErr);
      }

      setLoading(false);
      setActiveJobId(null);
      setJobProgress(null);
    }
  };

  // Tracking steps
  const steps = [
    { id: 'pending', label: 'Campaign Queueing', description: 'Provisioning executor engine...' },
    { id: 'running', label: 'Allocating System Agents', description: 'Spinning up active web-scraping & semantic intelligence workers...' },
    { id: 'research', label: 'Autonomous Niche Research', description: 'Searching competitor landscapes & generating contextual semantic maps...' },
    { id: 'writing', label: 'SEO Writer & Copy-Monetizer', description: 'Drafting core structural blog-post while injecting anchor affiliate loops...' },
    { id: 'pinterest', label: 'Pinterest Pins Structure & Graphics', description: 'Modeling conversion vectors and rendering visual pin layers...' },
    { id: 'completed', label: 'Campaign Serialization', description: 'Publishing optimized components seamlessly to the active dashboard.' }
  ];

  const stepIds = ['pending', 'running', 'research', 'writing', 'pinterest', 'completed'];
  const currentStepIndex = jobProgress ? stepIds.indexOf(jobProgress.status) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-sans font-bold tracking-tight text-white">Campaign Builder</h1>
        <p className="text-[#6B6E7B]">Configure parameters or ingest pre-written copy to deploy the autonomous content factory.</p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex bg-[#141518] p-1.5 rounded-2xl border border-white/5 max-w-md mx-auto shadow-xl">
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'create' ? 'bg-[#25262B] text-white shadow-md' : 'text-zinc-500 hover:text-zinc-200'}`}
          disabled={loading}
        >
          <AgentsIcon className="w-4 h-4" />
          <span>Autonomous SEO Agent</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('repurpose')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'repurpose' ? 'bg-[#25262B] text-white shadow-md' : 'text-zinc-500 hover:text-zinc-200'}`}
          disabled={loading}
        >
          <ArticlesIcon className="w-4 h-4" />
          <span>Ingest & Repurpose Copy</span>
        </button>
      </div>

      {!loading ? (
        <div className="space-y-6">
          {activeTab === 'create' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg"><CampaignIcon className="w-4 h-4 mr-2 text-[#d7f941]" /> Primary Target SEO Keyword</CardTitle>
                  <CardDescription>Our research agent will analyze search intent and project conversions based on this target phrase.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input 
                    value={form.keyword}
                    onChange={(e) => setForm({...form, keyword: e.target.value})}
                    placeholder="e.g. why pinterest still wins for affiliate traffic"
                    className="text-lg py-6"
                    disabled={loading}
                    required
                  />
                  <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                    <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold font-mono">Not sure where to start?</h4>
                    <p className="text-sm text-zinc-400">
                      Use the conversational SEO Agent Consultant on the right to dial in your perfect keyword strategy before deploying the campaign. The Agent will ask you about your niche, goals, and domain authority to formulate the perfect topic.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <SEOChat />
            </div>
          ) : (
            <Card className="border border-[#d7f941]/10 bg-[#d7f941]/[0.01]">
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-white">
                  <ArticlesIcon className="w-4 h-4 mr-2 text-[#d7f941]" /> Ingest Pre-Written Copy
                </CardTitle>
                <CardDescription>Paste your article copy below. OptiFlow will monetize the links, handle LSI keywords, and generate Pinterest Pins with graphics and concept images.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-zinc-400 font-semibold font-mono">Affiliate / SEO Target Keyword</label>
                  <Input 
                    value={form.keyword}
                    onChange={(e) => setForm({...form, keyword: e.target.value})}
                    placeholder="e.g. Pinterest Affiliate Traffic"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-zinc-400 font-semibold font-mono">Article Title</label>
                  <Input 
                    value={form.existingArticleTitle}
                    onChange={(e) => setForm({...form, existingArticleTitle: e.target.value})}
                    placeholder="e.g. Why Pinterest Still Wins for Affiliate Traffic and Conversions"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-zinc-400 font-semibold font-mono">Article Body Code / Markdown / Text Paste</label>
                  <textarea 
                    value={form.existingArticleContent}
                    onChange={(e) => setForm({...form, existingArticleContent: e.target.value})}
                    placeholder="Paste your full text draft here..."
                    className="flex min-h-[160px] w-full rounded-xl border border-white/10 bg-[#141518] px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#d7f941]"
                    disabled={loading}
                    required
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-md flex items-center">Content Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-xs uppercase tracking-widest text-[#6B6E7B] font-bold">Article Length</label>
                     <Input type="number" min="500" max="5000" value={form.articleLength} onChange={e => setForm({...form, articleLength: parseInt(e.target.value) || 2000})} disabled={loading || activeTab === 'repurpose'} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs uppercase tracking-wider text-[#6B6E7B] font-bold">SEO Level</label>
                     <select className="flex h-11 w-full rounded-xl border border-white/10 bg-[#141518] px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#d7f941]" value={form.seoLevel} onChange={e => setForm({...form, seoLevel: e.target.value})} disabled={loading}>
                       <option>High</option>
                       <option>Medium</option>
                       <option>Standard</option>
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs uppercase tracking-widest text-[#6B6E7B] font-bold">Country</label>
                     <Input value={form.country} onChange={e => setForm({...form, country: e.target.value})} disabled={loading || activeTab === 'repurpose'} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs uppercase tracking-widest text-[#6B6E7B] font-bold">Language</label>
                     <Input value={form.language} onChange={e => setForm({...form, language: e.target.value})} disabled={loading || activeTab === 'repurpose'} />
                  </div>
                </div>
                <div className="space-y-1">
                   <label className="text-xs uppercase tracking-widest text-[#6B6E7B] font-bold">Tone of Voice</label>
                   <Input value={form.tone} onChange={e => setForm({...form, tone: e.target.value})} disabled={loading || activeTab === 'repurpose'} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-md flex items-center">Output & Monetization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-xs uppercase tracking-widest text-[#6B6E7B] font-bold">Pinterest Pins</label>
                     <Input type="number" min="0" max="25" value={form.numPins} onChange={e => setForm({...form, numPins: parseInt(e.target.value) || 0})} disabled={loading} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs uppercase tracking-widest text-[#6B6E7B] font-bold">Generated Images</label>
                     <Input type="number" min="0" max="10" value={form.numImages} onChange={e => setForm({...form, numImages: parseInt(e.target.value) || 0})} disabled={loading} />
                  </div>
                </div>
                <div className="space-y-1">
                   <label className="text-xs uppercase tracking-widest text-[#6B6E7B] font-bold">Affiliate Offer Context</label>
                   <Input placeholder="e.g. MaxBounty Signup" value={form.affiliateOffers} onChange={e => setForm({...form, affiliateOffers: e.target.value})} disabled={loading} />
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-2">
                   <label className="flex items-center space-x-3 text-sm text-zinc-300">
                      <input type="checkbox" checked={form.hasFaq} onChange={e => setForm({...form, hasFaq: e.target.checked})} disabled={loading || activeTab === 'repurpose'} className="rounded bg-[#141518] border-white/10 text-[#d7f941] focus:ring-[#d7f941] h-4 w-4" />
                      <span>Include FAQ Section</span>
                   </label>
                   <label className="flex items-center space-x-3 text-sm text-zinc-300">
                      <input type="checkbox" checked={form.internalLinks} onChange={e => setForm({...form, internalLinks: e.target.checked})} disabled={loading} className="rounded bg-[#141518] border-white/10 text-[#d7f941] focus:ring-[#d7f941] h-4 w-4" />
                      <span>Internal Linking</span>
                   </label>
                   <label className="flex items-center space-x-3 text-sm text-zinc-300">
                      <input type="checkbox" checked={form.externalLinks} onChange={e => setForm({...form, externalLinks: e.target.checked})} disabled={loading} className="rounded bg-[#141518] border-white/10 text-[#d7f941] focus:ring-[#d7f941] h-4 w-4" />
                      <span>External Linking</span>
                   </label>
                   <label className="flex items-center space-x-3 text-sm text-zinc-500">
                      <input type="checkbox" checked={form.autoPublish} onChange={e => setForm({...form, autoPublish: e.target.checked})} disabled={loading} className="rounded bg-[#141518] border-white/10 h-4 w-4" />
                      <span>Auto Publish (Phase 2)</span>
                   </label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" onClick={handleRun} size="lg" disabled={loading || !form.keyword.trim()} className="py-7 px-12 text-base rounded-2xl">
              <CampaignIcon className="w-5 h-5 mr-3 text-black" />
              Deploy Campaign Factory
            </Button>
          </div>
        </div>
      ) : (
        <Card className="bg-[#1C1D21] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden max-w-2xl mx-auto">
          {/* Animated Gradient Accent */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#d7f941] to-transparent animate-pulse" />

          <div className="text-center space-y-3 pb-8 border-b border-white/5 mb-8">
            <div className="w-16 h-16 bg-[#d7f941]/10 rounded-2xl flex items-center justify-center mx-auto border border-[#d7f941]/20">
              <RefreshCw className="w-8 h-8 animate-spin text-[#d7f941]" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              Autonomous Campaign Active
            </h2>
            <p className="text-zinc-400 text-sm max-w-md mx-auto">
              Your parameters have been successfully queued. System workers are executing the pipeline stages fully isolated in the background.
            </p>
          </div>

          {jobProgress?.error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-sm text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-1">Execution Cancelled</span>
                <p className="text-xs text-red-500/80 font-mono">{jobProgress.error}</p>
                <Button 
                  onClick={() => {
                    setLoading(false);
                    setActiveJobId(null);
                    setJobProgress(null);
                  }}
                  variant="outline" 
                  size="sm" 
                  className="mt-3 border-red-500/20 text-red-400 hover:bg-red-500/10"
                >
                  Return to Builder
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs font-mono font-semibold uppercase text-zinc-500 px-1">
                <span>Active Target: {form.keyword}</span>
                <span>Job Instance ID: {activeJobId?.substring(0, 8)}</span>
              </div>

              <div className="space-y-5 relative pl-4 border-l border-white/5">
                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStepIndex;
                  const isActive = idx === currentStepIndex && jobProgress?.status !== 'error';
                  const isUpcoming = idx > currentStepIndex;

                  return (
                    <div key={idx} className="relative flex gap-4 transition-all duration-300">
                      {/* Interactive bullet status */}
                      <div className="absolute -left-[25px] top-1 flex items-center justify-center w-5 h-5 rounded-full bg-[#1C1D21] border border-white/5">
                        {isCompleted && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#d7f941] shadow-lg shadow-[#d7f941]/50" />
                        )}
                        {isActive && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#d7f941] animate-ping" />
                        )}
                        {isUpcoming && (
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                        )}
                      </div>

                      <div className={`space-y-1 ${isActive ? 'opacity-100' : isCompleted ? 'opacity-60' : 'opacity-30'}`}>
                        <h4 className={`text-sm font-bold tracking-tight ${isActive ? 'text-[#d7f941]' : 'text-white'}`}>
                          {step.label}
                        </h4>
                        <p className="text-xs text-zinc-400 leading-normal">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {jobProgress?.status === 'completed' && (
                <div className="pt-4 flex items-center gap-3 justify-center text-sm font-medium text-[#d7f941] border-t border-white/5 animate-pulse mt-4">
                  <CheckCircle className="w-5 h-5" />
                  <span>Success! Content operational. Redirecting to dashboard...</span>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
