import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { Article, Offer } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from './ui';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp, Loader2, Link2, Sparkles, CheckCircle, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

export function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Optimization feedback states
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<{ id: string; message: string } | null>(null);
  const [seedingId, setSeedingId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const qArticles = query(collection(db, 'articles'), where('userId', '==', uid));
    const unsub = onSnapshot(qArticles, (snap) => {
      setArticles(
        snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article))
          .sort((a, b) => b.createdAt - a.createdAt)
      );
    });
    return () => unsub();
  }, [auth.currentUser]);

  const handleRunSEOLinkAgent = async (article: Article) => {
    if (!auth.currentUser) return;
    setOptimizingId(article.id);
    setErrorStatus(null);
    setSuccessId(null);

    try {
      const uid = auth.currentUser.uid;

      // Fetch offers locally since the backend cannot assume DB permissions
      const offersRef = collection(db, 'offers');
      const q = query(offersRef, where("userId", "==", uid));
      const offersSnap = await getDocs(q);
      const offers = offersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (offers.length === 0) {
        setErrorStatus({
          id: article.id,
          message: "No offers found in your index. Add offers first under the 'Affiliate Offers' tab or click the quick seed below."
        });
        setOptimizingId(null);
        return;
      }

      // Call the centralized stateless server-side SEOLinkAgent
      const response = await fetch('/api/seo-link-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleContent: article.content,
          offers: offers
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to parse and optimize article content.");
      }

      // Directly update firestore article content
      const articleRef = doc(db, 'articles', article.id);
      await updateDoc(articleRef, {
        content: data.optimizedContent,
        updatedAt: Date.now()
      });

      setSuccessId(article.id);
      // Automatically clear success indicator after 4 seconds
      setTimeout(() => {
        setSuccessId(null);
      }, 4000);

    } catch (err: any) {
      console.error(err);
      setErrorStatus({
        id: article.id,
        message: err.message || "Failed to reach monetization engine."
      });
    } finally {
      setOptimizingId(null);
    }
  };

  const seedStandardOffers = async (article: Article) => {
    if (!auth.currentUser) return;
    setSeedingId(article.id);
    setErrorStatus(null);
    const uid = auth.currentUser.uid;
    const now = Date.now();
    const batch = writeBatch(db);

    const sampleOffers = [
      {
        brand: "Canva Pro",
        keyword: "graphic design",
        link: "https://partner.canva.com/c/optiflow-seo-design",
        anchor: "Canva Pro Graphic Design Suite",
        description: "The ultimate tool for creating pinterest graphics and digital assets."
      },
      {
        brand: "Shopify E-commerce",
        keyword: "e-commerce",
        link: "https://shopify.pxf.io/optiflow-seo-ecommerce",
        anchor: "Shopify 14-Day Free Trial",
        description: "Premium host and platform for online dropshipping and custom storefronts."
      },
      {
        brand: "Hostinger Hosting",
        keyword: "web hosting",
        link: "https://hostinger.com/optiflow-seo-hosting",
        anchor: "Hostinger Premium Web Hosting Plan",
        description: "Affordable and fast cloud hosting perfect for launching WordPress blogs."
      }
    ];

    try {
      for (const item of sampleOffers) {
        const newDocRef = doc(collection(db, 'offers'));
        batch.set(newDocRef, {
          ...item,
          userId: uid,
          createdAt: now,
          updatedAt: now
        });
      }
      await batch.commit();
      
      // Clear seeding state and trigger search immediately
      setSeedingId(null);
      // Run the link agent since we just seeded it
      const refreshedArticle = articles.find(a => a.id === article.id) || article;
      handleRunSEOLinkAgent(refreshedArticle);
    } catch (err: any) {
      console.error(err);
      setErrorStatus({
        id: article.id,
        message: "Failed to automatically seed offers: " + err.message
      });
      setSeedingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-sans font-bold tracking-tight text-white mb-2">Generated Articles</h1>
          <p className="text-[#6B6E7B] text-sm">Review, publish, and target your SEO posts with contextual links.</p>
        </div>
        <Button asChild size="sm" variant="outline" className="border-white/10 text-zinc-300 rounded-xl">
          <Link to="/offers" className="flex items-center gap-1.5 text-xs uppercase font-semibold tracking-wider">
            <Link2 className="w-4 h-4" /> Edit Link triggers
          </Link>
        </Button>
      </div>
      
      {articles.length === 0 ? (
        <Card className="bg-[#1C1D21] border-dashed border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-zinc-500 mb-6 font-semibold">You haven't generated any articles yet.</p>
            <Button asChild size="lg" className="rounded-2xl">
              <Link to="/new">Launch Campaign</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {articles.map(article => {
            const isExpanded = expandedId === article.id;
            const isOptimizing = optimizingId === article.id;
            const isSuccess = successId === article.id;
            const isSeeding = seedingId === article.id;
            const hasError = errorStatus?.id === article.id;

            return (
              <Card key={article.id} className="transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-1 text-white tracking-tight">{article.title}</CardTitle>
                      <CardDescription className="text-[#6B6E7B] text-xs font-semibold uppercase tracking-wider">
                        Target keyword: <span className="text-white">{article.keyword}</span> • {formatDistanceToNow(article.createdAt, { addSuffix: true })}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setExpandedId(isExpanded ? null : article.id)} className="rounded-full">
                      {isExpanded ? <ChevronUp className="text-zinc-400" /> : <ChevronDown className="text-zinc-400" />}
                    </Button>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="border-t border-white/5 pt-6 space-y-6">
                    {/* SEOLinkAgent Control Deck */}
                    <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-white tracking-wide">
                          <Sparkles className="w-4 h-4 text-[#d7f941] animate-pulse" />
                          <span>SEOLinkAgent Monetizer</span>
                        </div>
                        <p className="text-xs text-zinc-400 max-w-xl">
                          Scans this article, parses triggers, and attaches conversion optimized affiliate or internal links matching your Offers collection index.
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {isSuccess ? (
                          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d7f941]/10 text-[#d7f941] border border-[#d7f941]/20 text-xs font-bold uppercase tracking-wider">
                            <CheckCircle className="w-4 h-4" />
                            Optimized!
                          </div>
                        ) : (
                          <Button 
                            className="transition text-xs font-bold uppercase tracking-wider rounded-xl" 
                            size="sm" 
                            onClick={() => handleRunSEOLinkAgent(article)}
                            disabled={isOptimizing || isSeeding}
                          >
                            {isOptimizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            Run SEOLinkAgent
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Inline warnings/error options */}
                    {hasError && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>{errorStatus.message}</span>
                        </div>
                        {errorStatus.message.includes("No offers found") && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-amber-500/30 text-amber-300 hover:bg-amber-500/20 bg-transparent text-[10px] py-1 h-auto"
                              onClick={() => seedStandardOffers(article)}
                              disabled={isSeeding}
                            >
                              {isSeeding ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                              Seeding & Run
                            </Button>
                            <Button 
                              asChild 
                              variant="outline" 
                              size="sm" 
                              className="border-white/10 text-zinc-300 hover:bg-[#25262B] bg-transparent text-[10px] py-1 h-auto"
                            >
                              <Link to="/offers">Configure Custom</Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Article content renderer */}
                    <div className="prose prose-sm max-w-none prose-invert bg-[#141518] p-8 rounded-3xl border border-white/5">
                      <ReactMarkdown>{article.content}</ReactMarkdown>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
