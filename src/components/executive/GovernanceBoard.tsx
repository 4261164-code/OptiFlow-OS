import React, { useState, useEffect } from 'react';
import { auth } from '../../lib/firebase';
import { 
  ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle, Clock,
  ArrowRight, Key, Plus
} from 'lucide-react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  authorId: string;
  phase: string;
  riskLevel: string;
  approvers: string[];
  reviews: any[];
  updatedAt: number;
}

export function GovernanceBoard() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const fetchProposals = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/governance/proposals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setProposals(data.proposals);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleCreate = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/governance/proposals', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTitle, description: newDesc })
      });
      
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed");
      
      setNewTitle('');
      setNewDesc('');
      fetchProposals();
    } catch (err: any) {
      alert("Governance Policy Blocked Creation: " + err.message);
    }
  };

  const handleTransition = async (id: string, targetPhase: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/governance/proposals/${id}/transition`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetPhase })
      });
      
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Transition Failed");
      
      alert(payload.message);
      fetchProposals();
    } catch (err: any) {
      alert("GATE BLOCK: " + err.message);
    }
  };

  const submitReview = async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/governance/proposals/${id}/review`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating: "approve", comment: "Verified and approved." })
      });
      
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Review Failed");
      
      alert(payload.message);
      fetchProposals();
    } catch (err: any) {
      alert("AUDIT POLICY BLOCK: " + err.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-8">
        <ShieldCheck className="w-8 h-8 text-emerald-500" />
        <h2 className="text-2xl font-bold font-mono">Enterprise Governance & Change Engine</h2>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded mb-6 flex items-center">
          <AlertTriangle className="mr-3" /> {error}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl mb-8">
        <h3 className="font-bold mb-4 flex items-center"><Plus className="w-4 h-4 mr-2" /> New Change Proposal</h3>
        <div className="space-y-4 max-w-lg">
          <input 
            type="text"
            placeholder="Proposal Title (e.g. Implement Role-Based Access)"
            className="w-full bg-black/50 border border-zinc-700 p-2 rounded text-sm text-white"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
          />
          <textarea 
            placeholder="Architecture / Risk Context"
            className="w-full bg-black/50 border border-zinc-700 p-2 rounded text-sm text-white h-24"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
          />
          <button 
            onClick={handleCreate}
            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded shadow cursor-pointer text-sm"
          >
            Submit for PRD Review
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-bold border-b border-zinc-800 pb-2">Active Change Pipelines</h3>
        {loading ? <p>Loading truth engine...</p> : proposals.map(p => (
          <div key={p.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex flex-col space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-lg">{p.title}</h4>
                <p className="text-zinc-400 text-sm">{p.description}</p>
                <div className="mt-2 text-xs font-mono text-zinc-500">ID: {p.id} | Author: {p.authorId}</div>
              </div>
              <div className="flex space-x-2">
                <span className="px-2 py-1 bg-zinc-800 rounded font-mono text-xs uppercase text-zinc-300 border border-zinc-700">
                  {p.phase}
                </span>
                <span className={`px-2 py-1 rounded font-mono text-xs uppercase border ${
                  p.riskLevel === 'critical' ? 'bg-red-900/30 text-red-500 border-red-900/50' :
                  p.riskLevel === 'high' ? 'bg-orange-900/30 text-orange-500 border-orange-900/50' :
                  'bg-blue-900/30 text-blue-500 border-blue-900/50'
                }`}>
                  {p.riskLevel} RISK
                </span>
              </div>
            </div>

            <div className="bg-black/30 p-4 rounded border border-zinc-800/50 flex flex-wrap gap-2 text-sm justify-between items-center">
               <div className="space-x-2">
                 <button onClick={() => handleTransition(p.id, "PRD")} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded cursor-pointer transition">→ PRD</button>
                 <button onClick={() => handleTransition(p.id, "ARCHITECTURE")} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded cursor-pointer transition">→ ARCHITECTURE</button>
                 <button onClick={() => handleTransition(p.id, "BUILD")} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded cursor-pointer transition">→ BUILD</button>
                 <button onClick={() => handleTransition(p.id, "TEST")} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded cursor-pointer transition">→ TEST</button>
                 <button onClick={() => handleTransition(p.id, "AUDIT")} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded cursor-pointer transition">→ AUDIT</button>
                 <button onClick={() => handleTransition(p.id, "LIVE")} className="px-3 py-1 bg-emerald-900/50 text-emerald-400 hover:bg-emerald-800/50 rounded cursor-pointer transition">→ LIVE DEPLOY</button>
               </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-zinc-500 flex items-center">
                 <ShieldAlert className="w-3 h-3 mr-1" />
                 {p.reviews.length} independent reviews
              </div>
              <button 
                onClick={() => submitReview(p.id)}
                className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded border border-indigo-500/30 hover:bg-indigo-500/40 cursor-pointer"
              >
                Sign Off & Approve (QA)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
