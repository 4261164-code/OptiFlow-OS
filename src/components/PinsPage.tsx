import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { Pin } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from './ui';
import { formatDistanceToNow } from 'date-fns';
import { resolvePinImage, handleImageFallback } from '../lib/utils';
import { Copy, Check, Eye, ExternalLink, BookmarkCheck, TrendingUp, Image as ImageIcon, Bot, Wand2, Loader2, Activity, RefreshCw } from 'lucide-react';
import { PinterestIcon, CloverMascotIcon } from './CustomIcons';
import { addNotification } from '../lib/notifications';
import { apiFetch } from '../lib/auth';

export function PinsPage() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Custom AI creator states
  const [showCreator, setShowCreator] = useState(false);
  const [concept, setConcept] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genSuccess, setGenSuccess] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const qPins = query(collection(db, 'pins'), where('userId', '==', uid));
    const unsub = onSnapshot(qPins, (snap) => {
      setPins(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pin)).sort((a,b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, [auth.currentUser]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleCreateCustomPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!concept.trim()) {
      setGenError("A visual idea or style prompt is required.");
      return;
    }

    setIsGenerating(true);
    setGenError(null);
    setGenSuccess(false);

    try {
      const payload = {
        concept: concept.trim(),
        title: customTitle.trim() || undefined,
        description: customDesc.trim() || undefined,
        userId: auth.currentUser.uid
      };

      const response = await apiFetch('/api/distro/pins/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to generate custom Pinterest asset.");
      }

      const generatedPin = resData.pin;
      
      // Save custom pin object to Firestore
      const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const newPinId = 'pin-custom-' + generateId();

      await setDoc(doc(db, 'pins', newPinId), {
        title: generatedPin.title || "Custom AI Pin",
        description: generatedPin.description || "Generated via AI design studio.",
        concept: generatedPin.concept || concept,
        imageUrl: generatedPin.imageUrl || null,
        articleId: "custom-silo",
        jobId: "custom-job-" + Date.now().toString(),
        userId: auth.currentUser.uid,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // Fire celebratory system notification
      try {
        await addNotification(
          auth.currentUser.uid,
          'milestone',
          'AI Pinterest Asset Generated',
          `Your custom pin "${generatedPin.title}" has been successfully synthesized and compiled with high-fidelity visual assets.`
        );
      } catch (notifErr) {
        console.warn("Notification trigger failed:", notifErr);
      }

      // Reset form on success!
      setConcept('');
      setCustomTitle('');
      setCustomDesc('');
      setGenSuccess(true);
      setTimeout(() => setGenSuccess(false), 5000); // clear banner after 5s
      setShowCreator(false); // close the panel

    } catch (err: any) {
      console.error("Custom Pin creation failed:", err);
      setGenError(err?.message || "An unexpected error occurred during synthesis.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegeneratePin = async (pin: Pin) => {
    if (!auth.currentUser || !pin.concept) return;
    setRegeneratingId(pin.id);
    
    try {
      const response = await apiFetch('/api/distro/pins/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept: pin.concept, userId: auth.currentUser.uid })
      });

      if (response.status === 404) {
        throw new Error("Regeneration endpoint not found. Please contact support.");
      }
      
      const contentType = response.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text.substring(0, 100) || `Server returned invalid Response Status: ${response.status}`);
      }
      
      if (!response.ok) throw new Error(data.error || "Server error.");

      if (data.imageUrl) {
        await setDoc(doc(db, 'pins', pin.id), {
          ...pin,
          imageUrl: data.imageUrl,
          updatedAt: Date.now()
        });
      }
      addNotification(auth.currentUser.uid, 'milestone', 'Image Regenerated', 'Your Pin image was successfully updated with the new prompt.');
    } catch (err: any) {
      console.error("Failed to regenerate pin:", err);
      addNotification(auth.currentUser.uid, 'error', 'Failed to regenerate image', err.message);
    } finally {
      setRegeneratingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans tracking-tight font-bold text-white flex items-center gap-3">
            <PinterestIcon className="w-10 h-10 text-[#a8ff35]" />
            <span>Pinterest Creative Assets</span>
          </h1>
          <p className="text-zinc-400 text-sm">Download or publish high-converting visual assets modeled around affiliate keywords.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 bg-white/3 px-3.5 py-2 rounded-xl border border-white/5">
            <CloverMascotIcon className="w-5.5 h-5.5 text-[#a8ff35] animate-pulse stroke-[2.8]" />
            <span>Autopilot asset library</span>
          </span>
        </div>
      </div>

      {/* Creator Panel Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            setShowCreator(!showCreator);
            setGenError(null);
          }}
          className="px-5 py-3 rounded-xl bg-[#a8ff35] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#96e52e] hover:scale-[1.02] transition active:scale-[0.98] cursor-pointer flex items-center gap-2 shadow-lg hover:shadow-xl"
        >
          <Bot className="w-4 h-4 fill-current text-black" />
          <span>{showCreator ? "Dismiss Generator" : "Wand: Create Custom AI Pin"}</span>
        </button>
      </div>

      {/* Creator Expandable Box */}
      {showCreator && (
        <div className="bg-[#101115] border border-white/5 rounded-[28px] p-6 shadow-2xl space-y-5 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Subtle ambient gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#a8ff35]/3 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#a8ff35]/15 text-[#a8ff35] flex items-center justify-center font-mono font-bold">
                <Wand2 className="w-4 h-4" />
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-white">Custom Pinterest AI Designer</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium mt-1">
              Provide a visual theme/concept and watch the Gemini cognitive model generate viral titles, SEO bios, and high-fidelity 9:16 pin creatives.
            </p>
          </div>

          <form onSubmit={handleCreateCustomPin} className="space-y-4 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                  Visual Prompt & Image Concept <span className="text-[#a8ff35] font-extrabold">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. A gorgeous flat lay of clean workspace elements: pastel pink aesthetics, neon mechanical keyboard, fresh matcha latte, tech design, 4k photorealistic"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  className="w-full bg-[#18191E] border border-white/5 text-xs text-white rounded-xl p-3 placeholder-zinc-500 hover:border-white/10 focus:border-[#a8ff35] focus:ring-1 focus:ring-[#a8ff35] outline-none transition"
                />
                <p className="text-[9px] text-zinc-500 leading-normal italic">
                  Be descriptive! Include specific objects, color palettes (e.g. pink pastel, neon), styles (watercolor, photorealistic, 3D render) for high-veracity results.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                    Custom Pin Title <span className="text-zinc-600 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10 Daily Hacks for Creative Focus"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-[#18191E] border border-white/5 text-xs text-white rounded-xl p-3 placeholder-zinc-500 hover:border-white/10 focus:border-[#a8ff35] focus:ring-1 focus:ring-[#a8ff35] outline-none transition"
                  />
                  <p className="text-[9px] text-zinc-600">Leave empty to let Gemini auto-generate a high-CTR title based on your prompt.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                    Custom Pin Description <span className="text-zinc-650 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Discover our best guidelines to master design efficiency... #marketing #success"
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    className="w-full bg-[#18191E] border border-white/5 text-xs text-white rounded-xl p-3 placeholder-zinc-500 hover:border-white/10 focus:border-[#a8ff35] focus:ring-1 focus:ring-[#a8ff35] outline-none transition"
                  />
                  <p className="text-[9px] text-zinc-600">Leave empty to auto-compile high-volume viral search keywords and hashtags.</p>
                </div>
              </div>
            </div>

            {genError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                <span>{genError}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreator(false)}
                disabled={isGenerating}
                className="px-4 py-2 bg-transparent border border-white/5 hover:border-white/10 hover:bg-white/5 text-zinc-400 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="px-5 py-2.5 bg-[#a8ff35] text-black rounded-lg text-xs font-extrabold uppercase tracking-wider hover:bg-[#96e52e] hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-md"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Imagen Artist...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5 fill-current text-black" />
                    <span>Synthesize Pinterest Pin</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {genSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Success! Visual concept compiled perfectly. Your custom high-quality Pin is live below!</span>
        </div>
      )}
      
      {pins.length === 0 ? (
        <Card className="bg-[#101115] border-dashed border-white/5 py-16 text-center rounded-[28px]">
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-650">
              <ImageIcon className="w-7 h-7 stroke-[2.8]" />
            </div>
            <div>
              <p className="text-zinc-400 font-semibold text-sm">No creative pin assets available</p>
              <p className="text-zinc-600 text-xs mt-1 max-w-sm mx-auto">
                Once you construct a multi-module campaign, you will find concept assets and pins auto-rendered here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pins.map(pin => {
            return (
              <Card key={pin.id} className="border border-white/5 bg-[#101115] hover:border-[#a8ff35]/20 flex flex-col justify-between transition-all duration-300 rounded-[28px] overflow-hidden group shadow-xl">
                {/* 9:16 Pinterest Ratio Graphic Content */}
                <div className="relative aspect-[9/16] bg-zinc-950 overflow-hidden w-full group/image">
                  {/* Dark gradient vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent z-10" />
                  
                  <img 
                    src={resolvePinImage(pin.imageUrl, pin.concept || pin.title, pin.id)} 
                    onError={handleImageFallback}
                    alt={pin.concept || pin.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-[1.03]" 
                  />

                  {/* Quick copy overlay pill */}
                  <div className="absolute top-4 right-4 z-20">
                    <button 
                      onClick={() => copyToClipboard(pin.title + "\n" + pin.description, pin.id)}
                      className="h-10 px-4 rounded-full bg-black/75 border border-white/10 text-xs font-semibold text-white backdrop-blur flex items-center gap-1.5 hover:bg-black/95 transition cursor-pointer"
                    >
                      {copiedId === pin.id ? (
                        <>
                          <Check className="w-4.5 h-4.5 text-[#a8ff35] stroke-[2.8]" />
                          <span className="text-[#a8ff35]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4.5 h-4.5 text-zinc-300 stroke-[2.8]" />
                          <span>Copy Info</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Bottom visual overlay representing statistics */}
                  <div className="absolute bottom-5 inset-x-5 z-20 space-y-3">
                    {/* Interactive tag indicating status */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#a8ff35] uppercase tracking-wider bg-[#a8ff35]/15 px-2.5 py-1 rounded-lg border border-[#a8ff35]/20 font-mono">
                        Live Pipeline Asset
                      </span>
                    </div>

                    <h4 className="text-white font-bold text-lg leading-tight tracking-tight drop-shadow-md">
                      {pin.title}
                    </h4>

                  </div>
                </div>

                {/* Card footer description content if rendering frame info outside */}
                <div className="p-4 bg-[#101115] border-t border-white/5 flex items-center justify-between text-xs leading-none">
                  <span className="text-zinc-500 font-medium">Created {formatDistanceToNow(pin.createdAt, { addSuffix: true })}</span>
                  <div className="flex gap-3 items-center">
                    <button 
                      onClick={() => handleRegeneratePin(pin)}
                      disabled={regeneratingId === pin.id}
                      className="text-[#a8ff35] hover:text-[#96e52e] transition flex items-center gap-1 font-semibold disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${regeneratingId === pin.id ? 'animate-spin' : ''}`} />
                      <span>{regeneratingId === pin.id ? 'Regenerating...' : 'Regenerate'}</span>
                    </button>
                    {pin.imageUrl && (
                      <button 
                        onClick={() => copyToClipboard(pin.description, pin.id)}
                        className="text-zinc-400 hover:text-white transition flex items-center gap-1 font-semibold"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Paste Bio</span>
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
