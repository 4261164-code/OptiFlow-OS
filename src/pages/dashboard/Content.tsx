import React, { useState, useEffect } from 'react';
import { Eye, Edit3, Settings, Zap, ArrowRight, RefreshCw, Copy, Layers, X, Send, Twitter, Linkedin, Facebook, AlignLeft } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, limit } from 'firebase/firestore';

export function ContentCommand() {
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      try {
        const articlesSnap = await getDocs(query(collection(db, 'articles'), limit(20)));
        const pinsSnap = await getDocs(query(collection(db, 'pins'), limit(20)));
        
        const loaded: any[] = [];
        
        articlesSnap.forEach(doc => {
          const data = doc.data();
          loaded.push({
            id: doc.id,
            title: data.title || 'Untitled Article',
            keyword: data.keyword || '-',
            status: data.status || 'Published',
            clicks: Math.floor(Math.random() * 500),
            rev: '$' + (Math.floor(Math.random() * 100)),
            type: 'Blog Post',
            body: data.content || '<p>No content</p>',
            createdAt: data.createdAt || 0
          });
        });

        pinsSnap.forEach(doc => {
          const data = doc.data();
          loaded.push({
            id: doc.id,
            title: data.title || 'Untitled Pin',
            keyword: data.keyword || '-',
            status: data.status || 'Published',
            clicks: Math.floor(Math.random() * 100),
            rev: '$' + (Math.floor(Math.random() * 20)),
            type: 'Social Update',
            platform: 'Pinterest',
            body: data.description || 'No description',
            createdAt: data.createdAt || 0
          });
        });

        loaded.sort((a, b) => b.createdAt - a.createdAt);
        setContent(loaded);
      } catch (e) {
        console.error("Failed to load content:", e);
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Content Command Center</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage AI-generated content</p>
        </div>
      </div>

      <div className="bg-[#111827] border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs uppercase bg-zinc-900/50 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-bold">Title</th>
                <th className="px-6 py-4 font-bold">Type</th>
                <th className="px-6 py-4 font-bold">Keyword</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Clicks</th>
                <th className="px-6 py-4 font-bold">Revenue</th>
                <th className="px-6 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {content.map((c) => (
                <tr key={c.id} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                  <td className="px-6 py-4 font-medium text-white">{c.title}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5">
                      {c.type === 'Blog Post' ? <AlignLeft className="w-3.5 h-3.5 text-blue-400" /> : 
                       c.platform === 'Twitter' ? <Twitter className="w-3.5 h-3.5 text-sky-400" /> : 
                       <Linkedin className="w-3.5 h-3.5 text-blue-500" />}
                      {c.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">{c.keyword}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      c.status === 'Published' ? 'bg-emerald-500/10 text-emerald-500' : 
                      c.status === 'Draft' ? 'bg-indigo-500/10 text-indigo-400' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{c.clicks}</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">{c.rev}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                       <button 
                         onClick={() => setPreviewItem(c)}
                         className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded transition-colors flex items-center gap-1 text-xs font-medium" 
                         title="Preview Draft"
                       >
                         <Eye className="w-3.5 h-3.5" /> Preview
                       </button>
                       <button className="p-1 hover:text-white transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                       <button className="p-1 hover:text-indigo-400 transition-colors" title="Re-optimize"><RefreshCw className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold text-white mb-4">AI Bulk Actions</h3>
        <div className="flex gap-4">
           <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center shadow-lg">
             <Zap className="w-4 h-4 mr-2" /> Improve CTR
           </button>
           <button className="bg-[#1f2937] border border-zinc-700 hover:bg-zinc-700 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center">
             <Layers className="w-4 h-4 mr-2" /> Expand Content
           </button>
           <button className="bg-[#1f2937] border border-zinc-700 hover:bg-zinc-700 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center">
             <ArrowRight className="w-4 h-4 mr-2" /> Add Internal Links
           </button>
        </div>
      </div>

      {/* Draft Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f1117] border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-zinc-800 bg-[#14171f]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                  {previewItem.type === 'Blog Post' ? <AlignLeft className="w-5 h-5 text-zinc-400" /> : 
                   previewItem.platform === 'Twitter' ? <Twitter className="w-5 h-5 text-sky-400" /> : 
                   <Linkedin className="w-5 h-5 text-blue-500" />}
                </div>
                <div>
                  <h3 className="text-white font-bold">{previewItem.type === 'Blog Post' ? 'WordPress Draft Preview' : 'Social Post Preview'}</h3>
                  <p className="text-xs text-zinc-400">{previewItem.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewItem(null)}
                className="text-zinc-500 hover:text-white transition-colors bg-zinc-800/50 hover:bg-zinc-700 p-2 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-[#0a0c10] flex-1">
              {previewItem.type === 'Blog Post' ? (
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden text-zinc-800">
                  <div className="h-48 bg-zinc-200 w-full relative">
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-400 font-medium">Featured Image Placeholder</div>
                  </div>
                  <div className="p-8">
                    <h1 className="text-3xl font-extrabold mb-4 text-zinc-900 leading-tight">{previewItem.title}</h1>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 mb-8 pb-8 border-b border-zinc-100">
                      <span className="bg-zinc-100 px-2 py-1 rounded">Category: SEO</span>
                      <span>•</span>
                      <span>By AI Author</span>
                    </div>
                    <div 
                      className="prose prose-zinc max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-p:text-zinc-600 prose-p:leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: previewItem.body }}
                    />
                  </div>
                </div>
              ) : (
                <div className="max-w-md mx-auto">
                  <div className="bg-[#16181c] rounded-xl border border-zinc-800 p-4">
                    <div className="flex gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <span className="text-indigo-400 font-bold">OP</span>
                      </div>
                      <div>
                        <div className="font-bold text-zinc-100">OptiFlow OS</div>
                        <div className="text-sm text-zinc-500">@optiflow_os</div>
                      </div>
                    </div>
                    <div className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                      {previewItem.body}
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-800/50 flex gap-6 text-zinc-500">
                      <span className="text-xs font-medium hover:text-indigo-400 cursor-pointer">Reply</span>
                      <span className="text-xs font-medium hover:text-emerald-400 cursor-pointer">Repost</span>
                      <span className="text-xs font-medium hover:text-pink-400 cursor-pointer">Like</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-zinc-800 bg-[#14171f] flex justify-between items-center">
              <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Ready to publish
              </span>
              <div className="flex gap-3">
                <button 
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all">
                  <Send className="w-4 h-4" />
                  {previewItem.type === 'Blog Post' ? 'Publish to WordPress' : `Post to ${previewItem.platform}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

