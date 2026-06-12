import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Book, 
  Wand2, 
  Download, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Layout,
  List
} from 'lucide-react';
import { Button, Card, Input } from './ui';
import ReactMarkdown from 'react-markdown';

export function EbookCreator() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [ebook, setEbook] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setEbook(null);

    try {
      const response = await fetch('/api/ebook-creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic, 
          userId: auth.currentUser?.uid 
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate eBook');
      
      setEbook(data.ebook);
      
      // Save to Firestore for persistence
      await addDoc(collection(db, 'ebooks'), {
        userId: auth.currentUser?.uid,
        topic,
        title: data.ebook.title,
        overview: data.ebook.overview,
        chapters: data.ebook.chapters,
        conclusion: data.ebook.conclusion,
        createdAt: serverTimestamp()
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-100 flex items-center gap-3">
            <Book className="h-8 w-8 text-indigo-400" />
            AI EBook Creator
          </h2>
          <p className="text-zinc-400 mt-1">Transform topics into professional structured eBooks in seconds.</p>
        </div>
      </div>

      <Card className="p-6 bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-zinc-400 mb-1.5 block">Target Topic or Niche</label>
            <Input
              placeholder="e.g. The Ultimate Guide to Affiliate Marketing with Pinterest..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-zinc-200"
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleGenerate} 
              disabled={loading || !topic.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white w-full md:w-auto h-11 px-8 gap-2 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Masterpiece...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  Generate EBook
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
          <p className="text-sm text-red-400 font-medium">{error}</p>
        </div>
      )}

      {ebook && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Table of Contents / Sidebar */}
          <Card className="lg:col-span-1 p-6 h-fit sticky top-24 bg-zinc-900/80 border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
              <List className="h-5 w-5 text-zinc-400" />
              Table of Contents
            </h3>
            <div className="space-y-1">
              <button className="w-full text-left p-2 rounded-lg text-sm text-zinc-400 border border-transparent hover:border-zinc-800 transition-colors">
                Preface & Introduction
              </button>
              {ebook.chapters.map((ch: any) => (
                <button key={ch.chapterNumber} className="w-full text-left p-2 rounded-lg text-sm text-zinc-400 border border-transparent hover:border-zinc-800 transition-colors">
                  Chapter {ch.chapterNumber}: {ch.chapterTitle}
                </button>
              ))}
              <button className="w-full text-left p-2 rounded-lg text-sm text-zinc-400 border border-transparent hover:border-zinc-800 transition-colors">
                Conclusion
              </button>
            </div>
            <hr className="my-6 border-zinc-800" />
            <Button variant="outline" className="w-full border-zinc-800 text-zinc-300 hover:bg-zinc-800 gap-2">
              <Download className="h-4 w-4" />
              Export as PDF
            </Button>
          </Card>

          {/* Main Book Reader Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-12 min-h-[800px] bg-white text-zinc-900 shadow-2xl relative overflow-hidden">
              <div className="max-w-prose mx-auto prose prose-zinc prose-invert prose-lg">
                <div className="text-center mb-16 not-prose">
                  <span className="text-indigo-600 font-bold uppercase tracking-widest text-xs px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 italic">
                    AI Premium Publication
                  </span>
                  <h1 className="text-5xl font-extrabold text-zinc-900 mt-6 tracking-tight">{ebook.title}</h1>
                  <div className="w-16 h-1 bg-indigo-600 mx-auto mt-8 opacity-40 rounded-full" />
                </div>

                <div className="space-y-12">
                  <section>
                    <h2 className="text-2xl font-bold text-zinc-800 border-b border-zinc-100 pb-2 mb-6">Introduction</h2>
                    <div className="text-zinc-600 leading-relaxed italic">
                      <ReactMarkdown>{ebook.overview}</ReactMarkdown>
                    </div>
                  </section>

                  {ebook.chapters.map((ch: any) => (
                    <section key={ch.chapterNumber} className="pt-8">
                      <div className="mb-4">
                        <span className="text-indigo-600 font-mono font-medium text-sm">CHAPTER {ch.chapterNumber}</span>
                        <h2 className="text-3xl font-bold text-zinc-900 mt-1">{ch.chapterTitle}</h2>
                      </div>
                      <div className="text-zinc-700 leading-relaxed space-y-4">
                        <ReactMarkdown>{ch.content}</ReactMarkdown>
                      </div>
                    </section>
                  ))}

                  <section className="pt-12 border-t border-zinc-100">
                    <h2 className="text-2xl font-bold text-zinc-800 mb-6 italic">Final Thoughts</h2>
                    <div className="text-zinc-600 leading-relaxed bg-zinc-50 p-6 rounded-2xl">
                      <ReactMarkdown>{ebook.conclusion}</ReactMarkdown>
                    </div>
                  </section>
                </div>
              </div>
              
              {/* Footer pagination simulation */}
              <div className="mt-20 flex justify-between items-center text-[10px] text-zinc-300 uppercase tracking-widest pt-8 border-t border-zinc-50 font-medium">
                <span>© 2026 AI Publisher Network</span>
                <span className="text-zinc-400">Section: {ebook.title}</span>
                <span>Page 01 - ∞</span>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
