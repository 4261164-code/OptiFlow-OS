import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Cpu, Activity, AlertCircle, RefreshCw, BarChart, Server, Zap, CheckCircle2, CircleDashed } from 'lucide-react';
import { apiFetch } from '../../lib/auth';

export function OrchestrationEngineBoard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ jobs: any[] }>({ jobs: [] });

  useEffect(() => {
    fetchIntelligence();
  }, []);

  const fetchIntelligence = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/orchestrator/status');
      const responseBody = await res.json();
      if (responseBody.success) {
        setData({ jobs: responseBody.jobs || [] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const forceTrigger = async (event: string) => {
    try {
       await apiFetch('/api/orchestrator/trigger', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trigger_event: event, target_id: "Auto Trigger", initial_context: {} })
       });
       fetchIntelligence();
    } catch(e){}
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center">
            <Cpu className="w-6 h-6 mr-2 text-indigo-500" />
            Autonomous Orchestration Engine
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Multi-agent execution loop running business pipeline automatically</p>
        </div>
        <div className="flex space-x-2">
            <button onClick={() => forceTrigger('new_keyword')} className="px-4 py-2 bg-zinc-800 text-white rounded-md text-xs font-bold uppercase tracking-wider hover:bg-zinc-700 transition">
            Trigger Loop
            </button>
            <button onClick={fetchIntelligence} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">
            Refresh
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl">
        <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center">
          <Server className="w-4 h-4 mr-2" /> Orchestration Job Queue
        </h3>
        
        {loading ? (
             <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin text-zinc-500 mx-auto"/></div>
        ) : data.jobs.length === 0 ? (
             <div className="p-8 text-center text-zinc-500 font-medium">No orchestration jobs in queue.</div>
        ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900/50 dark:text-zinc-400">
                <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Job ID / Trigger</th>
                    <th className="px-4 py-3">Pipeline Agents</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Agent Index</th>
                    <th className="px-4 py-3 rounded-tr-lg">Created</th>
                </tr>
                </thead>
                <tbody>
                {data.jobs.map((job: any) => (
                    <tr key={job.job_id} className="border-b border-zinc-100 dark:border-zinc-850">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                        <div className="truncate w-32 md:w-auto">{job.job_id}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{job.trigger_event}</div>
                    </td>
                    <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap w-48">
                            {job.pipeline.map((p: string, i: number) => (
                                <span key={i} className={`w-2 h-2 rounded-full ${i < job.current_agentIndex ? 'bg-emerald-500' : i === job.current_agentIndex && job.status !== 'completed' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-700'}`} title={p} />
                            ))}
                        </div>
                    </td>
                    <td className="px-4 py-3">
                       <span className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md ${
                          job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                          job.status === 'failed' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-amber-500/10 text-amber-400'
                       }`}>{job.status}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                        {job.current_agentIndex} / {job.pipeline.length}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                        {new Date(job.created_at).toLocaleString()}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
      </div>
    </div>
  );
}
