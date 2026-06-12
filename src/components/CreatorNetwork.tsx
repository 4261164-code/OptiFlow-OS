import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input } from './ui';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Users, Bot, Heart, Plus, Globe, Shield, RefreshCw, Activity, Flame, UserCheck, MessageSquare } from 'lucide-react';
import { CreatorShowcase } from './CreatorShowcase';

interface FeedItem {
  id: string;
  creator: string;
  avatarLetter: string;
  niche: string;
  action: string;
  target: string;
  reach: string;
  engagement: string;
  liked?: boolean;
}

const INITIAL_FEED: FeedItem[] = [
  {
    id: "1",
    creator: "Julianne V.",
    avatarLetter: "J",
    niche: "SaaS & Remote Work",
    action: "syndicated a new pinning loop targeting",
    target: "Best Tailwind Schedules for Startups",
    reach: "+14,200 unique sessions",
    engagement: "4.8% CTR",
    liked: false
  },
  {
    id: "2",
    creator: "Marcus Mercer",
    avatarLetter: "M",
    niche: "Affiliate Wealth Systems",
    action: "joined the passive income collective board and repinned",
    target: "12 Sideline Hustles That Pay Daily",
    reach: "+45,100 impressions",
    engagement: "6.2% CTR",
    liked: true
  },
  {
    id: "3",
    creator: "Clara Wellness",
    avatarLetter: "C",
    niche: "Keto & Holistic Fitness",
    action: "deployed a joint syndicate campaign for",
    target: "7 Sugar-Free Keto Desserts that Tastes Real",
    reach: "+3,900 monthly views",
    engagement: "3.5% CTR",
    liked: false
  }
];

export function CreatorNetwork() {
  const [tabMode, setTabMode] = useState<'portfolios' | 'syndicate'>('portfolios');
  const [feed, setFeed] = useState<FeedItem[]>(INITIAL_FEED);
  const [syndicateNiches, setSyndicateNiches] = useState<string[]>(['SaaS & Tools', 'Wealth & Finance']);
  const [syndicateActive, setSyndicateActive] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [userProfile, setUserProfile] = useState({
    username: 'OptiFlow Member',
    status: 'Elite Automater'
  });

  useEffect(() => {
    // Load local storage states for syndicate niches and actions
    const cachedNiches = localStorage.getItem('syndicate_active_niches');
    if (cachedNiches) {
      try { setSyndicateNiches(JSON.parse(cachedNiches)); } catch(e) {}
    }
    const isAct = localStorage.getItem('syndicate_active_status');
    if (isAct !== null) {
      setSyndicateActive(isAct === 'true');
    }
    if (auth.currentUser?.displayName) {
      setUserProfile({
        username: auth.currentUser.displayName,
        status: 'Strategic Growth Syndicate Member'
      });
    }
  }, []);

  const toggleLike = (id: string) => {
    setFeed(feed.map(item => {
      if (item.id === id) {
        return { ...item, liked: !item.liked };
      }
      return item;
    }));
  };

  const toggleNiche = (niche: string) => {
    let updated = [...syndicateNiches];
    if (updated.includes(niche)) {
      updated = updated.filter(n => n !== niche);
    } else {
      updated.push(niche);
    }
    setSyndicateNiches(updated);
    localStorage.setItem('syndicate_active_niches', JSON.stringify(updated));
  };

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newItem: FeedItem = {
      id: Date.now().toString(),
      creator: userProfile.username,
      avatarLetter: userProfile.username.charAt(0).toUpperCase(),
      niche: syndicateNiches[0] || 'General Strategy',
      action: 'broadcasted a pinning synergy draft',
      target: newPostContent,
      reach: "Broadcasting to 42 syndicates...",
      engagement: "0% CTR (indexing)",
      liked: false
    };

    setFeed([newItem, ...feed]);
    setNewPostContent('');
  };

  const handleToggleSyndicate = () => {
    const nextState = !syndicateActive;
    setSyndicateActive(nextState);
    localStorage.setItem('syndicate_active_status', String(nextState));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-sans tracking-tight font-bold text-white mb-1.5">Creator Network</h1>
          <p className="text-xs text-zinc-400">Join elite co-sharing syndicates, trade assets and collaborate with expert creators immediately.</p>
        </div>
        
        {/* Toggle between Curated Creator Portfolios and Syndicate Live Feed */}
        <div className="bg-[#101115] p-1 rounded-2xl flex items-center border border-white/5 text-xs self-start sm:self-center">
          <button 
            onClick={() => setTabMode('portfolios')} 
            className={`px-4 py-2.5 rounded-xl font-bold transition duration-300 flex items-center gap-2 cursor-pointer ${tabMode === 'portfolios' ? 'bg-[#a8ff35] text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Creative Portfolios</span>
          </button>
          <button 
            onClick={() => setTabMode('syndicate')} 
            className={`px-4 py-2.5 rounded-xl font-bold transition duration-300 flex items-center gap-2 cursor-pointer ${tabMode === 'syndicate' ? 'bg-[#a8ff35] text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Syndicate Feed Mode</span>
          </button>
        </div>
      </div>

      {tabMode === 'portfolios' ? (
        <CreatorShowcase />
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Side: Profile & Syndicate parameters */}
          <div className="md:col-span-1 space-y-6">
            <Card className="border border-[#d7f941]/10">
              <CardHeader className="pb-4 bg-[#d7f941]/[0.01]">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono">Syndicate Hub Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-[#25262B] border border-white/10 flex items-center justify-center font-bold text-white uppercase text-sm">
                     {userProfile.username.charAt(0)}
                   </div>
                   <div>
                      <h3 className="font-semibold text-white text-sm">{userProfile.username}</h3>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">{userProfile.status}</p>
                   </div>
                </div>

                <div className="pt-3 border-t border-white/5 space-y-2">
                   <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-medium font-sans">Automatic Repin Loop:</span>
                      <button 
                        type="button" 
                        onClick={handleToggleSyndicate}
                        className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${syndicateActive ? 'bg-[#d7f941]' : 'bg-[#25262B]'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${syndicateActive ? 'translate-x-5' : 'translate-x-0'}`}></span>
                      </button>
                   </div>
                   <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                     When active, OptiFlow reciprocal loops auto-share high-quality pins from other certified members. In exchange, your pins are syndicated across their global boards.
                   </p>
                </div>

                {/* Loop Multiplier Statistics */}
                <div className="bg-[#111216] p-3.5 rounded-xl border border-white/5 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-zinc-400">Syndicate Multiplier:</span>
                       <span className="text-[#bce122] font-mono font-bold text-sm bg-[#d7f941]/5 px-2 py-0.5 rounded border border-[#d7f941]/10">
                         {syndicateActive ? '3.8x Velocity' : '1.0x (Disabled)'}
                       </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-zinc-400">Exchanged Repins:</span>
                       <span className="text-zinc-200 font-mono">{syndicateActive ? '142 pins' : '0 pins'}</span>
                    </div>
                </div>
              </CardContent>
            </Card>

            {/* Select syndicate niches */}
            <Card>
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-xs uppercase tracking-wider text-zinc-400 font-mono font-bold">Syndicate Niches</CardTitle>
                <CardDescription className="text-[11px] text-zinc-500">Enable niches where exchange pins should be shared.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                {['SaaS & Tools', 'Wealth & Finance', 'DIY & Crafts', 'Health & Fitness', 'Lifestyle & Travel'].map(niche => {
                   const isChecked = syndicateNiches.includes(niche);
                   return (
                      <button
                        type="button"
                        key={niche}
                        onClick={() => toggleNiche(niche)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold border transition ${isChecked ? 'bg-[#d7f941]/5 text-[#bce122] border-[#d7f941]/20' : 'bg-transparent text-zinc-400 border-white/5/80 hover:text-zinc-200'}`}
                      >
                        <span>{niche}</span>
                        {isChecked ? <UserCheck className="w-3.5 h-3.5 text-[#d7f941]" /> : <Plus className="w-3.5 h-3.5 text-zinc-650" />}
                      </button>
                   );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Live Network Feed & Synergies shares */}
          <div className="md:col-span-2 space-y-6">
            {/* Post composer */}
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handlePublishPost} className="space-y-4">
                  <div className="flex gap-3">
                     <div className="w-8 h-8 rounded-full bg-[#25262B] flex items-center justify-center font-bold text-zinc-300 text-xs">
                       {userProfile.username.charAt(0).toUpperCase()}
                     </div>
                     <input 
                       type="text"
                       placeholder="Broadcasting a new monetization angle or custom pin draft to the syndicate?"
                       value={newPostContent}
                       onChange={e => setNewPostContent(e.target.value)}
                       className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-0"
                     />
                  </div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-3">
                     <div className="text-[10px] uppercase font-mono tracking-widest font-semibold text-zinc-500 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-zinc-650" /> Syndicate Broadcaster: Active
                     </div>
                     <Button type="submit" size="sm">
                        Syndicate Broadcast
                     </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Feed List */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase font-mono font-semibold tracking-wider text-zinc-400 px-1 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#d7f941]" /> Live Syndicate Broadcast Synergy Feed
              </h3>

              {feed.map((item) => (
                <div key={item.id} className="p-5 rounded-2xl border border-white/5 bg-[#0A0A0C] space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#25262B] flex items-center justify-center text-white font-bold text-sm select-none border border-white/10">
                        {item.avatarLetter}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{item.creator}</span>
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] uppercase font-mono font-bold tracking-widest text-[#10B981] border border-[#d7f941]/10 bg-[#d7f941]/5">
                            {item.niche}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 font-sans">
                          {item.action} &ldquo;<span className="text-zinc-200 font-semibold">{item.target}</span>&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-[#111216]/80 p-3 rounded-xl border border-white/5 border-dashed text-[11px] font-mono text-zinc-500">
                     <div>
                       <span className="uppercase text-zinc-600 font-semibold block mb-0.5 tracking-wider">Syndicated Traffic Impact</span>
                       <span className="text-[#bce122] font-semibold">{item.reach}</span>
                     </div>
                     <div>
                       <span className="uppercase text-zinc-600 font-semibold block mb-0.5 tracking-wider">Conversion rate (CTR)</span>
                       <span className="text-zinc-150 font-bold">{item.engagement}</span>
                     </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1 border-t border-white/5 mt-2 text-xs text-zinc-500">
                     <button 
                       type="button" 
                       onClick={() => toggleLike(item.id)}
                       className={`flex items-center gap-1.5 transition ${item.liked ? 'text-red-500 font-semibold' : 'hover:text-zinc-300'}`}
                     >
                       <Heart className={`w-4 h-4 ${item.liked ? 'fill-current text-red-500' : ''}`} />
                       <span>{item.liked ? 'Voted' : 'Upvote Synergy'}</span>
                     </button>
                     <button type="button" className="flex items-center gap-1.5 hover:text-zinc-350 transition">
                        <MessageSquare className="w-4 h-4 text-zinc-650" />
                        <span>Request Joint Board invite</span>
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
