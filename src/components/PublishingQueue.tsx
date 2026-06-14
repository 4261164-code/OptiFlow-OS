import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { Article, Pin } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { resolvePinImage, handleImageFallback } from '../lib/utils';
import { 
  Send, 
  Clock, 
  CheckCircle, 
  Loader2, 
  Settings, 
  Compass, 
  AlertCircle, 
  ExternalLink,
  Search,
  BookOpen,
  Image as ImageIcon,
  Check,
  RefreshCw,
  AlertOctagon,
  Twitter,
  Linkedin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ContentCalendarView } from './ContentCalendarView';
import { apiFetch } from '../lib/auth';

interface SocialDistributionSectionProps {
  item: any;
  collectionName: 'articles' | 'pins';
  hasTwitterSetup: boolean;
  hasLinkedInSetup: boolean;
  opLoading: Record<string, boolean>;
  generateSocialCopy: (id: string, collectionName: 'articles' | 'pins') => Promise<void>;
  publishToTwitter: (id: string, text: string, collectionName: 'articles' | 'pins') => Promise<void>;
  publishToLinkedIn: (id: string, text: string, collectionName: 'articles' | 'pins') => Promise<void>;
}

function SocialDistributionSection({
  item,
  collectionName,
  hasTwitterSetup,
  hasLinkedInSetup,
  opLoading,
  generateSocialCopy,
  publishToTwitter,
  publishToLinkedIn
}: SocialDistributionSectionProps) {
  const [twitterText, setTwitterText] = useState(item.twitterPostContent || '');
  const [linkedinText, setLinkedinText] = useState(item.linkedinPostContent || '');
  const [isEditing, setIsEditing] = useState(false);

  // Sync state if item updates in Firestore
  useEffect(() => {
    if (item.twitterPostContent && !twitterText) {
      setTwitterText(item.twitterPostContent);
    }
    if (item.linkedinPostContent && !linkedinText) {
      setLinkedinText(item.linkedinPostContent);
    }
  }, [item.twitterPostContent, item.linkedinPostContent]);

  const genOpKey = `${item.id}_gen_social`;
  const twitterOpKey = `${item.id}_twitter`;
  const linkedinOpKey = `${item.id}_linkedin`;

  const isGenLoading = opLoading[genOpKey];
  const isTwLoading = opLoading[twitterOpKey];
  const isLiLoading = opLoading[linkedinOpKey];

  const twStatus = item.twitterStatus || 'idle';
  const liStatus = item.linkedinStatus || 'idle';

  const hasCopy = !!item.twitterPostContent || !!item.linkedinPostContent;

  return (
    <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <span>𝕏 (Twitter) & LinkedIn Distribution Engine</span>
        </h4>
        
        {!hasCopy ? (
          <button
            onClick={() => generateSocialCopy(item.id, collectionName)}
            disabled={isGenLoading}
            className="text-xs font-semibold text-black bg-[#d7f941] hover:bg-[#bce122] disabled:opacity-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
          >
            {isGenLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
            ) : (
              <span>Generate Social Copy ON REQUEST</span>
            )}
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-[10px] uppercase font-bold text-[#d7f941] border border-[#d7f941]/30 hover:bg-[#d7f941]/5 px-2.5 py-1 rounded transition cursor-pointer"
          >
            {isEditing ? 'Finish Customizing' : 'Customize Narrative'}
          </button>
        )}
      </div>

      {hasCopy && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* X/Twitter distribution channel */}
          <div className="bg-[#1C1D21]/30 border border-white/5/40 p-3 rounded-lg flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Twitter className="w-3.5 h-3.5 text-zinc-400" />
                  <span>X (Twitter) Narrative</span>
                </span>
                
                {twStatus === 'published' && item.twitterUrl ? (
                  <a href={item.twitterUrl} target="_blank" rel="noreferrer" referrerPolicy="no-referrer" className="text-xs text-sky-400 hover:underline flex items-center gap-1">
                    <span>View Tweet</span>
                    <ExternalLink className="w-3" />
                  </a>
                ) : (
                  <span className={`text-[10px] font-semibold ${twStatus === 'publishing' ? 'text-amber-500' : 'text-zinc-500'}`}>
                    {twStatus === 'publishing' ? 'Sending tweet...' : 'Draft ready'}
                  </span>
                )}
              </div>

              {isEditing ? (
                <textarea
                  value={twitterText}
                  onChange={(e) => setTwitterText(e.target.value)}
                  maxLength={280}
                  className="w-full text-xs text-zinc-200 bg-[#0F0F12] border border-white/5 rounded p-2 focus:ring-1 focus:ring-[#d7f941] h-24 focus:outline-none"
                />
              ) : (
                <p className="text-xs text-zinc-400 leading-relaxed bg-[#0F0F12]/60 p-2.5 rounded border border-white/5/50 font-mono select-all">
                  {twitterText || item.twitterPostContent}
                </p>
              )}
            </div>

            {item.twitterError && (
              <p className="text-[10px] text-red-400 border-l border-red-500 pl-2 mt-2 break-all">{item.twitterError}</p>
            )}

            <div className="mt-3 pt-2 border-t border-white/5/40 flex justify-end">
              <button
                onClick={() => publishToTwitter(item.id, twitterText || item.twitterPostContent, collectionName)}
                disabled={isTwLoading || twStatus === 'publishing'}
                className="text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                {isTwLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                ) : twStatus === 'published' ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-[#d7f941]" />
                    <span>Re-share to 𝕏</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Publish to 𝕏</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* LinkedIn distribution channel */}
          <div className="bg-[#1C1D21]/30 border border-white/5/40 p-3 rounded-lg flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-[#0077b5]" />
                  <span>LinkedIn Narrative</span>
                </span>
                
                {liStatus === 'published' && item.linkedinUrl ? (
                  <a href={item.linkedinUrl} target="_blank" rel="noreferrer" referrerPolicy="no-referrer" className="text-xs text-[#0077b5] hover:underline flex items-center gap-1">
                    <span>View Post</span>
                    <ExternalLink className="w-3" />
                  </a>
                ) : (
                  <span className={`text-[10px] font-semibold ${liStatus === 'publishing' ? 'text-amber-500' : 'text-zinc-500'}`}>
                    {liStatus === 'publishing' ? 'Broadcasting post...' : 'Draft ready'}
                  </span>
                )}
              </div>

              {isEditing ? (
                <textarea
                  value={linkedinText}
                  onChange={(e) => setLinkedinText(e.target.value)}
                  className="w-full text-xs text-zinc-200 bg-[#0F0F12] border border-white/5 rounded p-2 focus:ring-1 focus:ring-[#d7f941] h-24 focus:outline-none"
                />
              ) : (
                <p className="text-xs text-zinc-400 leading-relaxed bg-[#0F0F12]/60 p-2.5 rounded border border-white/5/50 font-mono whitespace-pre-wrap select-all line-clamp-5">
                  {linkedinText || item.linkedinPostContent}
                </p>
              )}
            </div>

            {item.linkedinError && (
              <p className="text-[10px] text-red-400 border-l border-red-500 pl-2 mt-2 break-all">{item.linkedinError}</p>
            )}

            <div className="mt-3 pt-2 border-t border-white/5/40 flex justify-end">
              <button
                onClick={() => publishToLinkedIn(item.id, linkedinText || item.linkedinPostContent, collectionName)}
                disabled={isLiLoading || liStatus === 'publishing'}
                className="text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                {isLiLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin text-white" />
                ) : liStatus === 'published' ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-[#d7f941]" />
                    <span>Re-share to LinkedIn</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Publish to LinkedIn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PublishingQueue() {
  const [activeTab, setActiveTab] = useState<'articles' | 'pins' | 'calendar'>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [integrationSettings, setIntegrationSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  
  // Local operation loaders mapped by ID + operation (e.g. "artId_wp")
  const [opLoading, setOpLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    // Load integration settings
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setIntegrationSettings(snap.data());
        }
      } catch (e) {
        console.error("Failed to load settings in queue", e);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();

    // Listen to Articles
    const qArticles = query(collection(db, 'articles'), where('userId', '==', uid));
    const unsubArticles = onSnapshot(qArticles, (snap) => {
      setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() } as Article)).sort((a, b) => b.createdAt - a.createdAt));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'articles');
    });

    // Listen to Pins
    const qPins = query(collection(db, 'pins'), where('userId', '==', uid));
    const unsubPins = onSnapshot(qPins, (snap) => {
      setPins(snap.docs.map(d => ({ id: d.id, ...d.data() } as Pin)).sort((a, b) => b.createdAt - a.createdAt));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'pins');
    });

    return () => {
      unsubArticles();
      unsubPins();
    };
  }, []);

  const hasWordPressSetup = integrationSettings?.wordpressUrl && integrationSettings?.wordpressUsername && integrationSettings?.wordpressPassword;
  const hasTelegramSetup = integrationSettings?.telegramToken && integrationSettings?.telegramChatId;
  const hasPinterestSetup = !!integrationSettings?.pinterestToken;
  const hasTwitterSetup = !!integrationSettings?.twitterToken;
  const hasLinkedInSetup = !!integrationSettings?.linkedinToken;

  const [pinterestBoards, setPinterestBoards] = useState<{ id: string, name: string }[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [selectedBoards, setSelectedBoards] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!integrationSettings?.pinterestToken || !auth.currentUser) return;
    const loadBoards = async () => {
      setLoadingBoards(true);
      try {
        const response = await apiFetch('/api/pinterest-boards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pinterestToken: integrationSettings.pinterestToken,
            userId: auth.currentUser?.uid
          })
        });
        const data = await response.json();
        if (data.boards) {
          setPinterestBoards(data.boards);
          if (data.boards.length > 0) {
            const initial: Record<string, string> = {};
            pins.forEach(pin => {
              initial[pin.id] = data.boards[0].id;
            });
            setSelectedBoards(prev => ({ ...initial, ...prev }));
          }
        }
      } catch (e) {
        console.error("Failed to load Pinterest boards", e);
      } finally {
        setLoadingBoards(false);
      }
    };
    loadBoards();
  }, [integrationSettings?.pinterestToken, pins.length]);

  const publishToPinterestDirect = async (id: string, title: string, description: string, imageUrl: string | undefined) => {
    if (!hasPinterestSetup) return;
    const boardId = selectedBoards[id] || (pinterestBoards.length > 0 ? pinterestBoards[0].id : '');
    if (!boardId) {
      alert("Please select a Pinterest Board to publish this Pin.");
      return;
    }
    const opKey = `${id}_pin`;
    setOpLoading(prev => ({ ...prev, [opKey]: true }));

    try {
      const docRef = doc(db, 'pins', id);
      await setDoc(docRef, { 
        pinterestStatus: 'publishing',
        pinterestError: null 
      }, { merge: true });

      const response = await apiFetch('/api/publish-pinterest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pinterestToken: integrationSettings.pinterestToken,
          userId: auth.currentUser?.uid,
          boardId,
          title,
          description,
          imageUrl
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to publish Pin directly");
      }

      await setDoc(docRef, { 
        pinterestStatus: 'published',
        pinterestUrl: result.link 
      }, { merge: true });

    } catch (err: any) {
      console.error(err);
      await setDoc(doc(db, 'pins', id), { 
        pinterestStatus: 'error',
        pinterestError: err.message 
      }, { merge: true });
    } finally {
      setOpLoading(prev => ({ ...prev, [opKey]: false }));
    }
  };

  const filteredArticles = articles.filter(art => 
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    art.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPins = pins.filter(pin => 
    pin.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    pin.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const publishToWordPress = async (id: string, title: string, content: string, collectionName: 'articles' | 'pins') => {
    if (!hasWordPressSetup) return;
    const opKey = `${id}_wp`;
    setOpLoading(prev => ({ ...prev, [opKey]: true }));

    try {
      // 1. Mark in DB as publishing
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, { 
        wordpressStatus: 'publishing',
        wordpressError: null 
      }, { merge: true });

      // 2. HTTP POST
      const response = await apiFetch('/api/publish-wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          wordpressUrl: integrationSettings.wordpressUrl,
          wordpressUsername: integrationSettings.wordpressUsername,
          wordpressPassword: integrationSettings.wordpressPassword,
          wordpressSandboxMode: integrationSettings.wordpressSandboxMode
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to publish");
      }

      // 3. Mark in DB as published
      await setDoc(docRef, { 
        wordpressStatus: 'published',
        wordpressUrl: result.link 
      }, { merge: true });

    } catch (err: any) {
      console.error(err);
      // Mark as error
      await setDoc(doc(db, collectionName, id), { 
        wordpressStatus: 'error',
        wordpressError: err.message 
      }, { merge: true });
    } finally {
      setOpLoading(prev => ({ ...prev, [opKey]: false }));
    }
  };

  const publishToTelegram = async (id: string, text: string, imageUrl: string | undefined, collectionName: 'articles' | 'pins') => {
    if (!hasTelegramSetup) return;
    const opKey = `${id}_tg`;
    setOpLoading(prev => ({ ...prev, [opKey]: true }));

    try {
      // 1. Mark in DB as publishing
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, { 
        telegramStatus: 'publishing',
        telegramError: null 
      }, { merge: true });

      // Generate message block
      const finalMessage = imageUrl 
        ? `<b>[OPTIFLOW PIN SENT]</b>\n\n<b>${text}</b>\n\n<a href="${imageUrl}">[Pin Creative Artwork]</a>`
        : `<b>[NEW OPTIFLOW ARTICLE PUBLISHED]</b>\n\n<b>${text}</b>`;

      // 2. HTTP POST
      const response = await apiFetch('/api/publish-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: finalMessage,
          telegramToken: integrationSettings.telegramToken,
          telegramChatId: integrationSettings.telegramChatId
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to publish");
      }

      // 3. Mark in DB as published
      await setDoc(docRef, { 
        telegramStatus: 'published',
        telegramUrl: result.link || `https://t.me/${integrationSettings.telegramChatId}`
      }, { merge: true });

    } catch (err: any) {
      console.error(err);
      await setDoc(doc(db, collectionName, id), { 
        telegramStatus: 'error',
        telegramError: err.message 
      }, { merge: true });
    } finally {
      setOpLoading(prev => ({ ...prev, [opKey]: false }));
    }
  };

  const generateSocialCopy = async (id: string, collectionName: 'articles' | 'pins') => {
    const opKey = `${id}_gen_social`;
    setOpLoading(prev => ({ ...prev, [opKey]: true }));
    try {
      const response = await apiFetch('/api/distro/social-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          collection: collectionName,
          userId: auth.currentUser?.uid
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate social media copy");
      }
    } catch (err) {
      console.error("Social generation error:", err);
    } finally {
      setOpLoading(prev => ({ ...prev, [opKey]: false }));
    }
  };

  const publishToTwitter = async (id: string, text: string, collectionName: 'articles' | 'pins') => {
    const opKey = `${id}_twitter`;
    setOpLoading(prev => ({ ...prev, [opKey]: true }));
    try {
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, { 
        twitterStatus: 'publishing',
        twitterError: null 
      }, { merge: true });

      const response = await apiFetch('/api/publish-twitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          text,
          collection: collectionName,
          userId: auth.currentUser?.uid
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to publish to Twitter/X");
      }

      await setDoc(docRef, { 
        twitterStatus: 'published',
        twitterUrl: result.link 
      }, { merge: true });

    } catch (err: any) {
      console.error(err);
      await setDoc(doc(db, collectionName, id), { 
        twitterStatus: 'error',
        twitterError: err.message 
      }, { merge: true });
    } finally {
      setOpLoading(prev => ({ ...prev, [opKey]: false }));
    }
  };

  const publishToLinkedIn = async (id: string, text: string, collectionName: 'articles' | 'pins') => {
    const opKey = `${id}_linkedin`;
    setOpLoading(prev => ({ ...prev, [opKey]: true }));
    try {
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, { 
        linkedinStatus: 'publishing',
        linkedinError: null 
      }, { merge: true });

      const response = await apiFetch('/api/publish-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          text,
          collection: collectionName,
          userId: auth.currentUser?.uid
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to publish to LinkedIn");
      }

      await setDoc(docRef, { 
        linkedinStatus: 'published',
        linkedinUrl: result.link 
      }, { merge: true });

    } catch (err: any) {
      console.error(err);
      await setDoc(doc(db, collectionName, id), { 
        linkedinStatus: 'error',
        linkedinError: err.message 
      }, { merge: true });
    } finally {
      setOpLoading(prev => ({ ...prev, [opKey]: false }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans tracking-tight font-bold tracking-tight text-white mb-2">Publishing Queue</h1>
          <p className="text-zinc-400">Manage article distribution across WordPress and social platforms.</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link to="/settings" className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white bg-[#1C1D21] border border-white/5 px-3 py-2 rounded-lg transition">
            <Settings className="w-5 h-5 stroke-[2.8]" />
            <span>Manage Integrations</span>
          </Link>
        </div>
      </div>

      {/* Integration Warnings */}
      {!loadingSettings && (!hasWordPressSetup || !hasTelegramSetup) && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-4 pb-4 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5 stroke-[2.8]" />
            <div className="text-sm">
              <span className="font-semibold text-amber-500">Integrations Missing!</span>
              <p className="text-zinc-400 mt-1">
                To unlock live publishing, please go to <Link to="/settings" className="text-amber-500 underline font-semibold hover:text-amber-400">Settings</Link> to configure your WordPress credentials or Telegram bot credentials.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation and Search controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#121214] border border-white/5 p-2 rounded-xl">
        <div className="flex bg-[#1C1D21] p-1 rounded-lg flex-wrap gap-1">
          <button 
            onClick={() => setActiveTab('articles')}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'articles' ? 'bg-[#25262B] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <BookOpen className="w-5.5 h-5.5 stroke-[2.8]" />
            <span>Articles</span>
            {articles.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-[#25262B] border border-white/5 text-zinc-300 ml-1">
                {articles.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('pins')}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'pins' ? 'bg-[#25262B] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <ImageIcon className="w-5.5 h-5.5 stroke-[2.8]" />
            <span>Pinterest Pins</span>
            {pins.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-[#25262B] border border-white/5 text-zinc-300 ml-1">
                {pins.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'calendar' ? 'bg-[#25262B] text-[#d7f941] border border-[#d7f941]/20 shadow-sm font-extrabold' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Clock className="w-5.5 h-5.5 stroke-[2.8]" />
            <span>Content Calendar</span>
            {(articles.filter(a => a.scheduledDate).length + pins.filter(p => p.scheduledDate).length) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#d7f941] text-black font-extrabold ml-1">
                {articles.filter(a => a.scheduledDate).length + pins.filter(p => p.scheduledDate).length}
              </span>
            )}
          </button>
        </div>

        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500 stroke-[2.5]" />
          <input 
            type="text"
            placeholder="Search keywords or titles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#1C1D21] border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#d7f941]"
          />
        </div>
      </div>

      {activeTab === 'articles' ? (
        <div className="space-y-4">
          {filteredArticles.length === 0 ? (
            <Card className="border-dashed border-2 border-white/5/60 bg-transparent text-center py-16">
              <CardContent>
                <BookOpen className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 font-medium">No articles available</p>
                <p className="text-xs text-zinc-600 mt-1">Generate dynamic campaigns to produce article assets.</p>
              </CardContent>
            </Card>
          ) : (
            filteredArticles.map(art => {
              const wpStatus = art.wordpressStatus || 'idle';
              const tgStatus = art.telegramStatus || 'idle';
              const wpOpKey = `${art.id}_wp`;
              const tgOpKey = `${art.id}_tg`;

              return (
                <Card key={art.id} className="border border-white/5 hover:border-white/10/80 transition-all bg-[#0e0e10]">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-wider text-[#d7f941] bg-[#d7f941]/10 px-2 py-0.5 rounded font-mono font-medium">Article</span>
                          <span className="text-xs text-zinc-500">{formatDistanceToNow(art.createdAt, { addSuffix: true })}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mt-1.5">{art.title}</h3>
                        <p className="text-zinc-500 text-sm mt-0.5">Primary Keyword: <span className="text-zinc-300 font-semibold">{art.keyword}</span></p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="border-t border-white/5/85 pt-4 pb-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* WordPress Channel */}
                      <div className="flex flex-col justify-between bg-[#1C1D21]/30 p-3 rounded-lg border border-white/5/40">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-semibold text-zinc-400">WordPress Integration</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              {wpStatus === 'idle' && (
                                <span className="inline-flex items-center text-xs text-zinc-500 font-medium">
                                  <Clock className="w-3.5 h-3.5 mr-1 text-zinc-600" /> Ready to publish
                                </span>
                              )}
                              {wpStatus === 'publishing' && (
                                <span className="inline-flex items-center text-xs text-amber-500 font-medium">
                                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-amber-500" /> Distributing...
                                </span>
                              )}
                              {wpStatus === 'published' && (
                                <span className="inline-flex items-center text-xs text-[#d7f941] font-medium">
                                  <CheckCircle className="w-3.5 h-3.5 mr-1 text-[#d7f941]" /> Active Post
                                </span>
                              )}
                              {wpStatus === 'error' && (
                                <span className="inline-flex items-center text-xs text-red-500 font-medium">
                                  <AlertOctagon className="w-3.5 h-3.5 mr-1 text-red-500" /> Failed
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {wpStatus === 'published' && art.wordpressUrl && (
                            <a 
                              href={art.wordpressUrl} 
                              target="_blank" 
                              referrerPolicy="no-referrer"
                              className="text-[#d7f941] hover:text-[#bce122] inline-flex items-center text-xs font-medium gap-0.5"
                            >
                              <span>Live Link</span>
                              <ExternalLink className="w-3" />
                            </a>
                          )}
                        </div>

                        {art.wordpressError && (
                          <p className="text-[10px] text-red-400 border-l border-red-500 pl-2 mt-2 break-all">{art.wordpressError}</p>
                        )}

                        <div className="mt-4 pt-2 border-t border-white/5/40 flex justify-end">
                          <button
                            onClick={() => publishToWordPress(art.id, art.title, art.content, 'articles')}
                            disabled={!hasWordPressSetup || opLoading[wpOpKey] || wpStatus === 'publishing'}
                            className="flex items-center gap-1.5 text-xs text-white bg-[#25262B]/85 hover:bg-[#25262B] border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-md transition"
                          >
                            {opLoading[wpOpKey] ? (
                              <Loader2 className="w-3 h-3 animate-spin text-white" />
                            ) : wpStatus === 'published' ? (
                              <RefreshCw className="w-3 h-3" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            <span>{wpStatus === 'published' ? 'Update Post' : 'Publish to WP'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Telegram Channel */}
                      <div className="flex flex-col justify-between bg-[#1C1D21]/30 p-3 rounded-lg border border-white/5/40">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-semibold text-zinc-400">Telegram Channel</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              {tgStatus === 'idle' && (
                                <span className="inline-flex items-center text-xs text-zinc-500 font-medium">
                                  <Clock className="w-3.5 h-3.5 mr-1 text-zinc-600" /> Ready to broadcast
                                </span>
                              )}
                              {tgStatus === 'publishing' && (
                                <span className="inline-flex items-center text-xs text-amber-500 font-medium">
                                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-amber-500" /> Broadcasting...
                                </span>
                              )}
                              {tgStatus === 'published' && (
                                <span className="inline-flex items-center text-xs text-sky-400 font-medium">
                                  <CheckCircle className="w-3.5 h-3.5 mr-1 text-sky-400" /> Broadcast Sent
                                </span>
                              )}
                              {tgStatus === 'error' && (
                                <span className="inline-flex items-center text-xs text-red-500 font-medium">
                                  <AlertOctagon className="w-3.5 h-3.5 mr-1 text-red-500" /> Failed
                                </span>
                              )}
                            </div>
                          </div>

                          {tgStatus === 'published' && art.telegramUrl && (
                            <a 
                              href={art.telegramUrl} 
                              target="_blank" 
                              referrerPolicy="no-referrer"
                              className="text-sky-400 hover:text-sky-300 inline-flex items-center text-xs font-medium gap-0.5"
                            >
                              <span>Post Link</span>
                              <ExternalLink className="w-3" />
                            </a>
                          )}
                        </div>

                        {art.telegramError && (
                          <p className="text-[10px] text-red-400 border-l border-red-500 pl-2 mt-2 break-all">{art.telegramError}</p>
                        )}

                        <div className="mt-4 pt-2 border-t border-white/5/40 flex justify-end">
                          <button
                            onClick={() => publishToTelegram(art.id, `${art.title} - ${art.keyword}`, undefined, 'articles')}
                            disabled={!hasTelegramSetup || opLoading[tgOpKey] || tgStatus === 'publishing'}
                            className="flex items-center gap-1.5 text-xs text-white bg-[#25262B]/85 hover:bg-[#25262B] border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-md transition"
                          >
                            {opLoading[tgOpKey] ? (
                              <Loader2 className="w-3 h-3 animate-spin text-white" />
                            ) : tgStatus === 'published' ? (
                              <RefreshCw className="w-3 h-3" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            <span>{tgStatus === 'published' ? 'BroadCast Again' : 'Broadcast Content'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <SocialDistributionSection
                      item={art}
                      collectionName="articles"
                      hasTwitterSetup={hasTwitterSetup}
                      hasLinkedInSetup={hasLinkedInSetup}
                      opLoading={opLoading}
                      generateSocialCopy={generateSocialCopy}
                      publishToTwitter={publishToTwitter}
                      publishToLinkedIn={publishToLinkedIn}
                    />
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : activeTab === 'pins' ? (
        <div className="space-y-4">
          {filteredPins.length === 0 ? (
            <Card className="border-dashed border-2 border-white/5/60 bg-transparent text-center py-16">
              <CardContent>
                <ImageIcon className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 font-medium">No Pinterest Pin Assets</p>
                <p className="text-xs text-zinc-600 mt-1">Deploy campaign pipelines to automatically trigger Pinterest generation.</p>
              </CardContent>
            </Card>
          ) : (
            filteredPins.map(pin => {
              const wpStatus = pin.wordpressStatus || 'idle';
              const tgStatus = pin.telegramStatus || 'idle';
              const wpOpKey = `${pin.id}_wp`;
              const tgOpKey = `${pin.id}_tg`;

              return (
                <Card key={pin.id} className="border border-white/5 hover:border-white/10/80 transition-all bg-[#0e0e10]">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row items-stretch justify-between gap-6">
                      <div className="flex gap-4">
                        <div className="relative w-16 h-28 md:w-20 md:h-36 bg-[#1C1D21] border border-white/5 rounded-md overflow-hidden shrink-0">
                          <img 
                            src={resolvePinImage(pin.imageUrl, pin.concept || pin.title, pin.id)} 
                            alt={pin.title} 
                            onError={handleImageFallback}
                            referrerPolicy="no-referrer"
                            className="object-cover w-full h-full" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs uppercase tracking-wider text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded font-mono font-medium">Pinterest Pin</span>
                          <h3 className="text-lg font-bold text-white mt-1.5 truncate">{pin.title}</h3>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-3">{pin.description}</p>
                          <p className="text-[10px] text-zinc-500 mt-2 font-mono">Concept: {pin.concept}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="border-t border-zinc-850 pt-4 pb-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      {/* WP image attach/post */}
                      <div className="flex flex-col justify-between bg-[#1C1D21]/30 p-3 rounded-lg border border-white/5/40">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-semibold text-zinc-400">WordPress Media / Post</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              {wpStatus === 'idle' && (
                                <span className="inline-flex items-center text-xs text-zinc-500 font-medium">
                                  <Clock className="w-3.5 h-3.5 mr-1 text-zinc-600" /> Ready
                                </span>
                              )}
                              {wpStatus === 'publishing' && (
                                <span className="inline-flex items-center text-xs text-amber-500 font-medium">
                                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-amber-500" /> Uploading block...
                                </span>
                              )}
                              {wpStatus === 'published' && (
                                <span className="inline-flex items-center text-xs text-[#d7f941] font-medium">
                                  <CheckCircle className="w-3.5 h-3.5 mr-1 text-[#d7f941]" /> Live Post Block
                                </span>
                              )}
                              {wpStatus === 'error' && (
                                <span className="inline-flex items-center text-xs text-red-500 font-medium">
                                  <AlertOctagon className="w-3.5 h-3.5 mr-1 text-red-500" /> Failed
                                </span>
                              )}
                            </div>
                          </div>

                          {wpStatus === 'published' && pin.wordpressUrl && (
                            <a 
                              href={pin.wordpressUrl} 
                              target="_blank" 
                              referrerPolicy="no-referrer"
                              className="text-[#d7f941] hover:text-[#bce122] inline-flex items-center text-xs font-medium gap-0.5"
                            >
                              <span>View WP</span>
                              <ExternalLink className="w-3" />
                            </a>
                          )}
                        </div>

                        {pin.wordpressError && (
                          <p className="text-[10px] text-red-400 border-l border-red-500 pl-2 mt-2 break-all">{pin.wordpressError}</p>
                        )}

                        <div className="mt-4 pt-2 border-t border-zinc-805 flex justify-end">
                          <button
                            onClick={() => {
                              const resolvedImage = resolvePinImage(pin.imageUrl, pin.concept || pin.title, pin.id);
                              publishToWordPress(pin.id, `Pinterest Idea: ${pin.title}`, `<center><img src="${resolvedImage || ''}" alt="${pin.title}" style="max-width:100%; border-radius:8px;" /><br/><h3>${pin.title}</h3><p>${pin.description}</p></center>`, 'pins')
                            }}
                            disabled={!hasWordPressSetup || opLoading[wpOpKey] || wpStatus === 'publishing'}
                            className="w-full flex items-center justify-center gap-1.5 text-xs text-white bg-[#25262B]/85 hover:bg-[#25262B] border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-md transition"
                          >
                            {opLoading[wpOpKey] ? (
                              <Loader2 className="w-3 h-3 animate-spin text-white" />
                            ) : wpStatus === 'published' ? (
                              <RefreshCw className="w-3 h-3" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            <span>{wpStatus === 'published' ? 'Repost Card' : 'Post to WP'}</span>
                          </button>
                        </div>
                      </div>

                      {/* TG broadcast image */}
                      <div className="flex flex-col justify-between bg-[#1C1D21]/30 p-3 rounded-lg border border-white/5/40">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-semibold text-zinc-400">Telegram Channel Message</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              {tgStatus === 'idle' && (
                                <span className="inline-flex items-center text-xs text-zinc-500 font-medium">
                                  <Clock className="w-3.5 h-3.5 mr-1 text-zinc-600" /> Ready
                                </span>
                              )}
                              {tgStatus === 'publishing' && (
                                <span className="inline-flex items-center text-xs text-amber-500 font-medium">
                                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-amber-500" /> Sending creative...
                                </span>
                              )}
                              {tgStatus === 'published' && (
                                <span className="inline-flex items-center text-xs text-sky-400 font-medium">
                                  <CheckCircle className="w-3.5 h-3.5 mr-1 text-sky-400" /> Active Broadcast
                                </span>
                              )}
                              {tgStatus === 'error' && (
                                <span className="inline-flex items-center text-xs text-red-500 font-medium">
                                  <AlertOctagon className="w-3.5 h-3.5 mr-1 text-red-500" /> Failed
                                </span>
                              )}
                            </div>
                          </div>

                          {tgStatus === 'published' && pin.telegramUrl && (
                            <a 
                              href={pin.telegramUrl} 
                              target="_blank" 
                              referrerPolicy="no-referrer"
                              className="text-sky-400 hover:text-sky-300 inline-flex items-center text-xs font-medium gap-0.5"
                            >
                              <span>View Telegram</span>
                              <ExternalLink className="w-3" />
                            </a>
                          )}
                        </div>

                        {pin.telegramError && (
                          <p className="text-[10px] text-red-400 border-l border-red-500 pl-2 mt-2 break-all">{pin.telegramError}</p>
                        )}

                        <div className="mt-4 pt-2 border-t border-zinc-805 flex justify-end">
                          <button
                            onClick={() => publishToTelegram(pin.id, `${pin.title}\n\n${pin.description}`, pin.imageUrl, 'pins')}
                            disabled={!hasTelegramSetup || opLoading[tgOpKey] || tgStatus === 'publishing'}
                            className="w-full flex items-center justify-center gap-1.5 text-xs text-white bg-[#25262B]/85 hover:bg-[#25262B] border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-md transition"
                          >
                            {opLoading[tgOpKey] ? (
                              <Loader2 className="w-3 h-3 animate-spin text-white" />
                            ) : tgStatus === 'published' ? (
                              <RefreshCw className="w-3 h-3" />
                            ) : (
                               <Send className="w-3 h-3" />
                            )}
                            <span>{tgStatus === 'published' ? 'BroadCast Again' : 'Broadcast Pin'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Direct Pinterest Publisher (v5) */}
                      <div className="flex flex-col justify-between bg-[#1C1D21]/30 p-3 rounded-lg border border-white/5/40">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-semibold text-zinc-400">Direct Pinterest (v5 API)</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              {pin.pinterestStatus === 'publishing' && (
                                <span className="inline-flex items-center text-xs text-amber-500 font-medium">
                                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-amber-500" /> Pinning...
                                </span>
                              )}
                              {pin.pinterestStatus === 'published' && (
                                <span className="inline-flex items-center text-xs text-rose-400 font-medium font-semibold">
                                  <Check className="w-3.5 h-3.5 mr-1 text-rose-400" /> Pinned Live
                                </span>
                              )}
                              {pin.pinterestStatus === 'error' && (
                                <span className="inline-flex items-center text-xs text-red-500 font-medium">
                                  <AlertOctagon className="w-3.5 h-3.5 mr-1 text-red-500" /> Pin Failed
                                </span>
                              )}
                              {(!pin.pinterestStatus || pin.pinterestStatus === 'idle') && (
                                <span className="inline-flex items-center text-xs text-zinc-500 font-medium">
                                  <Clock className="w-3.5 h-3.5 mr-1 text-zinc-600" /> Ready
                                </span>
                              )}
                            </div>
                          </div>

                          {pin.pinterestStatus === 'published' && pin.pinterestUrl && (
                            <a 
                              href={pin.pinterestUrl} 
                              target="_blank" 
                              referrerPolicy="no-referrer"
                              className="text-rose-400 hover:text-rose-300 inline-flex items-center text-xs font-medium gap-0.5"
                            >
                              <span>View Pin</span>
                              <ExternalLink className="w-3" />
                            </a>
                          )}
                        </div>

                        {pin.pinterestError && (
                          <p className="text-[10px] text-red-400 border-l border-red-500 pl-2 mt-2 break-all">{pin.pinterestError}</p>
                        )}

                        <div className="space-y-2 mt-3 pt-2 border-t border-white/5">
                          {hasPinterestSetup ? (
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase tracking-wider font-bold text-zinc-500">Board Selection</label>
                              <select
                                value={selectedBoards[pin.id] || ''}
                                onChange={(e) => setSelectedBoards(prev => ({ ...prev, [pin.id]: e.target.value }))}
                                className="w-full text-xs bg-[#1C1D21] border border-white/10 rounded p-1 text-zinc-350 focus:outline-none focus:ring-1 focus:ring-rose-500"
                              >
                                {pinterestBoards.length === 0 ? (
                                  <option value="">-- Loading/No Boards --</option>
                                ) : (
                                  pinterestBoards.map((board: any) => (
                                    <option key={board.id} value={board.id}>{board.name}</option>
                                  ))
                                )}
                              </select>
                            </div>
                          ) : (
                            <p className="text-[10px] text-zinc-550 italic">Please configure your Pinterest Access Token in settings to unlock direct publishing.</p>
                          )}

                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => publishToPinterestDirect(pin.id, pin.title, pin.description, pin.imageUrl)}
                              disabled={!hasPinterestSetup || opLoading[`${pin.id}_pin`] || pin.pinterestStatus === 'publishing'}
                              className="w-full flex items-center justify-center gap-1.5 text-xs text-white bg-[#e60023] hover:bg-[#ad081b] disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-md transition font-medium"
                            >
                              {opLoading[`${pin.id}_pin`] ? (
                                <Loader2 className="w-3 h-3 animate-spin text-white" />
                              ) : pin.pinterestStatus === 'published' ? (
                                <RefreshCw className="w-3 h-3" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              <span>{pin.pinterestStatus === 'published' ? 'Repost Pin' : 'Publish Pin'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <SocialDistributionSection
                      item={pin}
                      collectionName="pins"
                      hasTwitterSetup={hasTwitterSetup}
                      hasLinkedInSetup={hasLinkedInSetup}
                      opLoading={opLoading}
                      generateSocialCopy={generateSocialCopy}
                      publishToTwitter={publishToTwitter}
                      publishToLinkedIn={publishToLinkedIn}
                    />
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <ContentCalendarView 
          articles={articles}
          pins={pins}
          hasWordPressSetup={hasWordPressSetup}
          hasTelegramSetup={hasTelegramSetup}
          hasPinterestSetup={hasPinterestSetup}
          hasTwitterSetup={hasTwitterSetup}
          hasLinkedInSetup={hasLinkedInSetup}
          integrationSettings={integrationSettings}
          opLoading={opLoading}
          publishToWordPress={publishToWordPress}
          publishToTelegram={publishToTelegram}
          publishToPinterestDirect={publishToPinterestDirect}
          pinterestBoards={pinterestBoards}
          selectedBoards={selectedBoards}
          setSelectedBoards={setSelectedBoards}
        />
      )}
    </div>
  );
}
