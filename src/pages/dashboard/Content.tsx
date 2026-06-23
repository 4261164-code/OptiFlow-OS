import React from 'react';
import { Eye, Edit3, Settings, Zap, ArrowRight, RefreshCw, Copy, Layers } from 'lucide-react';

export function ContentCommand() {
  const content = [
    { id: 1, title: 'Best Survey Apps', keyword: 'survey apps sa', status: 'Published', clicks: 1250, rev: '$450', pos: 3, ctr: '4.2%', seo: 92 },
    { id: 2, title: 'AI Writing Tools', keyword: 'ai writers', status: 'Needs Rewrite', clicks: 80, rev: '$12', pos: 14, ctr: '1.1%', seo: 65 },
  ];

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
                <th className="px-6 py-4 font-bold">Keyword</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Clicks</th>
                <th className="px-6 py-4 font-bold">Revenue</th>
                <th className="px-6 py-4 font-bold">Pos</th>
                <th className="px-6 py-4 font-bold">CTR</th>
                <th className="px-6 py-4 font-bold">SEO</th>
                <th className="px-6 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {content.map((c) => (
                <tr key={c.id} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                  <td className="px-6 py-4 font-medium text-white">{c.title}</td>
                  <td className="px-6 py-4">{c.keyword}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      c.status === 'Published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{c.clicks}</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">{c.rev}</td>
                  <td className="px-6 py-4">{c.pos}</td>
                  <td className="px-6 py-4">{c.ctr}</td>
                  <td className="px-6 py-4">{c.seo}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                       <button className="p-1 hover:text-white transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                       <button className="p-1 hover:text-white transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                       <button className="p-1 hover:text-indigo-400 transition-colors" title="Re-optimize"><RefreshCw className="w-4 h-4" /></button>
                       <button className="p-1 hover:text-white transition-colors" title="Clone"><Copy className="w-4 h-4" /></button>
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
           <button className="bg-[#1f2937] border border-zinc-700 hover:bg-zinc-700 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center">
             <Layers className="w-4 h-4 mr-2" /> Generate Cluster
           </button>
        </div>
      </div>
    </div>
  );
}
