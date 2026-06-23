import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Activity, RefreshCcw } from 'lucide-react';

export function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data to render quickly or if DB is empty
  const mockJobs = [
    { id: 'job-1', type: 'generate_content', status: 'completed', created: '10 mins ago', duration: '45s' },
    { id: 'job-2', type: 'seo_optimizer', status: 'running', created: '2 mins ago', duration: '-' },
    { id: 'job-3', type: 'distribute_pinterest', status: 'pending', created: '1 min ago', duration: '-' },
    { id: 'job-4', type: 'publish_wordpress', status: 'failed', created: '1 hour ago', duration: '12s' },
  ];

  useEffect(() => {
    async function fetchJobs() {
      try {
        const q = query(collection(db, "jobs"), orderBy("created_at", "desc"), limit(20));
        const snap = await getDocs(q);
        if (!snap.empty) {
           const fetched = snap.docs.map(doc => ({
               id: doc.id,
               type: doc.data().type,
               status: doc.data().status,
               created: new Date(doc.data().created_at).toLocaleTimeString(),
               duration: 'N/A' // Need start/end for duration
           }));
           setJobs(fetched);
        } else {
           setJobs(mockJobs);
        }
      } catch (err) {
        console.error(err);
        setJobs(mockJobs);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Job Monitor</h1>
          <p className="text-sm text-zinc-400 mt-1">Worker queue and system health.</p>
        </div>
        <button className="bg-[#1f2937] hover:bg-zinc-700 text-white px-4 py-2 flex items-center rounded-md font-medium text-sm transition-colors border border-zinc-700">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="bg-[#111827] border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs uppercase bg-zinc-900/50 text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-bold">Job ID</th>
                <th className="px-6 py-4 font-bold">Type</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Created</th>
                <th className="px-6 py-4 font-bold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                     <Activity className="w-6 h-6 animate-pulse mx-auto mb-2" />
                     Loading queue state...
                  </td>
                </tr>
              ) : jobs.map((job) => (
                <tr key={job.id} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500">{job.id}</td>
                  <td className="px-6 py-4 text-white font-medium">{job.type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                      job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                      job.status === 'running' ? 'bg-blue-500/10 text-blue-500 animate-pulse' :
                      job.status === 'failed' ? 'bg-rose-500/10 text-rose-500' :
                      'bg-zinc-500/10 text-zinc-500'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{job.created}</td>
                  <td className="px-6 py-4 text-zinc-500">{job.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
