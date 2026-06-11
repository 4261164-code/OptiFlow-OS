import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { Offer } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input } from './ui';
import { Plus, Loader2, Edit2, Trash2, Tag, Link2, Briefcase, Landmark, Check, RefreshCw } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';

export function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  // Form State
  const [brand, setBrand] = useState('');
  const [keyword, setKeyword] = useState('');
  const [link, setLink] = useState('');
  const [anchor, setAnchor] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    setLoading(true);
    const uid = auth.currentUser.uid;
    const qOffers = query(collection(db, 'offers'), where('userId', '==', uid));
    const unsub = onSnapshot(qOffers, (snap) => {
      const docs: Offer[] = [];
      snap.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() } as Offer);
      });
      setOffers(docs.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, [auth.currentUser]);

  const resetForm = () => {
    setBrand('');
    setKeyword('');
    setLink('');
    setAnchor('');
    setDescription('');
    setIsAdding(false);
    setEditingOfferId(null);
    setError(null);
  };

  const handleEdit = (offer: Offer) => {
    setBrand(offer.brand);
    setKeyword(offer.keyword);
    setLink(offer.link);
    setAnchor(offer.anchor || '');
    setDescription(offer.description || '');
    setEditingOfferId(offer.id);
    setIsAdding(true);
  };

  const handleDelete = async (offerId: string) => {
    if (!window.confirm("Are you sure you want to delete this offer? It will no longer be matched by the Link Agent.")) {
      return;
    }
    const path = `offers/${offerId}`;
    try {
      await deleteDoc(doc(db, 'offers', offerId));
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!brand.trim() || !keyword.trim() || !link.trim()) {
      setError("Brand, keyword trigger, and url link are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const uid = auth.currentUser.uid;
    const now = Date.now();

    try {
      if (editingOfferId) {
        const docRef = doc(db, 'offers', editingOfferId);
        await updateDoc(docRef, {
          brand: brand.trim(),
          keyword: keyword.trim(),
          link: link.trim(),
          anchor: anchor.trim() || null,
          description: description.trim() || null,
          updatedAt: now
        });
      } else {
        await addDoc(collection(db, 'offers'), {
          brand: brand.trim(),
          keyword: keyword.trim(),
          link: link.trim(),
          anchor: anchor.trim() || null,
          description: description.trim() || null,
          userId: uid,
          createdAt: now,
          updatedAt: now
        });
      }
      resetForm();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while saving the offer.");
      handleFirestoreError(err, OperationType.WRITE, 'offers');
    } finally {
      setSubmitting(false);
    }
  };

  const seedSampleOffers = async () => {
    if (!auth.currentUser) return;
    setSubmitting(true);
    setError(null);
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
    } catch (err: any) {
      console.error(err);
      setError("Failed to seed sample offers: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-sans tracking-tight font-bold tracking-tight text-white mb-1">Affiliate Offers Index</h1>
          <p className="text-zinc-400 text-sm">Configure marketing offers, custom brands, and internal link triggers targetable by SEOLinkAgent.</p>
        </div>
        {!isAdding && (
          <div className="flex gap-3">
            {offers.length === 0 && (
              <Button variant="outline" size="sm" onClick={seedSampleOffers} disabled={submitting}>
                {submitting ? <Loader2 className="w-5 h-5 mr-1.5 animate-spin stroke-[2.8]" /> : <RefreshCw className="w-5 h-5 mr-1.5 stroke-[2.8]" />}
                Seed Sample Offers
              </Button>
            )}
            <Button size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="w-5 h-5 mr-1.5 stroke-[2.8]" /> Add Offer
            </Button>
          </div>
        )}
      </div>

      {isAdding && (
        <Card className="border border-white/5 bg-[#0d0d0f] max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg text-white font-semibold">
              {editingOfferId ? "Edit Affiliate Offer" : "Register New Offer"}
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Fill in the keyword trigger and link URL. SEOLinkAgent will naturally inject this link into generated articles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase font-medium text-zinc-400">Brand / Product</label>
                  <Input 
                    placeholder="e.g. Canva Pro" 
                    value={brand} 
                    onChange={(e) => setBrand(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs uppercase font-medium text-zinc-400">Keyword Trigger</label>
                  <Input 
                    placeholder="e.g. graphic design" 
                    value={keyword} 
                    onChange={(e) => setKeyword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-zinc-400">Offer / Affiliate URL</label>
                <div className="relative">
                  <Input 
                    placeholder="https://partner.canva.com/your-code" 
                    value={link} 
                    onChange={(e) => setLink(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-zinc-400">Custom Link Anchor text (Optional)</label>
                <Input 
                  placeholder="e.g. Canva Design Suite (Defaults to match keyword if blank)" 
                  value={anchor} 
                  onChange={(e) => setAnchor(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-medium text-zinc-400">Notes / Rules (Optional)</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-white/5 bg-[#1C1D21] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7f941]"
                  placeholder="e.g. Only inject into digital marketing or blogging posts."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={resetForm} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                  {editingOfferId ? "Update Offer" : "Save Offer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
        </div>
      ) : offers.length === 0 ? (
        <Card className="bg-[#121214] border-dashed border-white/5 py-12">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-xl bg-[#1C1D21] border border-white/5 flex items-center justify-center text-zinc-600">
              <Link2 className="w-7 h-7 stroke-[2.8]" />
            </div>
            <div>
              <p className="text-zinc-300 font-semibold text-sm">No affiliate offers found</p>
              <p className="text-zinc-500 text-xs mt-1 max-w-md">
                Add your brand partnerships, affiliate links, and custom redirect rules. Seed sample offers to pre-populate typical links instantly!
              </p>
            </div>
            <div className="flex gap-3">
              <Button size="sm" onClick={() => setIsAdding(true)}>
                Add First Offer
              </Button>
              <Button variant="secondary" size="sm" onClick={seedSampleOffers}>
                Seed Sample Network
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <Card key={offer.id} className="border border-white/5 bg-[#0d0d0f] flex flex-col justify-between hover:border-white/10 transition duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#d7f941]/10 text-[#bce122] border border-[#d7f941]/20">
                      <Tag className="w-4 h-4 stroke-[2.8]" />
                      {offer.keyword}
                    </span>
                    <CardTitle className="text-lg text-white font-sans tracking-tight mt-1">{offer.brand}</CardTitle>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(offer)}>
                      <Edit2 className="w-4.5 h-4.5 stroke-[2.8]" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400" onClick={() => handleDelete(offer.id)}>
                      <Trash2 className="w-4.5 h-4.5 stroke-[2.8]" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-zinc-400 text-xs line-clamp-2 min-h-[32px]">
                    {offer.description || "No description provided."}
                  </p>
                  
                  {offer.anchor && (
                    <div className="text-[10px] text-zinc-500 font-medium mt-2">
                      Anchor override: <span className="text-zinc-300 italic">"{offer.anchor}"</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5/65 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 truncate max-w-[180px]">
                    <Link2 className="w-4.5 h-4.5 text-zinc-650 flex-shrink-0 stroke-[2.8]" />
                    <span className="truncate">{offer.link}</span>
                  </div>
                  <a 
                    href={offer.link} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[11px] font-bold text-[#bce122] hover:text-emerald-300 transition"
                  >
                    Test URL
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
