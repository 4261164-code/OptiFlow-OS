import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Cpu, Activity, AlertCircle, RefreshCw, BarChart, Zap, CheckCircle2, CircleDashed, Globe, DollarSign, PenTool } from 'lucide-react';
import { apiFetch } from '../../lib/auth';

export function EventDrivenGrowthBoard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ events: any[] }>({ events: [] });

  useEffect(() => {
    fetchIntelligence();
  }, []);

  const fetchIntelligence = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/events/status');
      const responseBody = await res.json();
      if (responseBody.success) {
        setData({ events: responseBody.events || [] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const spawnEvent = async (type: string, payload: any) => {
     try {
       await apiFetch('/api/events/trigger', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, payload })
       });
       fetchIntelligence();
     } catch(e){}
  }

  const getEventIcon = (type: string) => {
      switch(type) {
         case 'keyword_discovered': return <Globe className="w-4 h-4 text-blue-400" />;
         case 'article_published': return <PenTool className="w-4 h-4 text-emerald-400" />;
         case 'traffic_spike': return <TrendingUp className="w-4 h-4 text-indigo-400" />;
         case 'revenue_drop': return <AlertCircle className="w-4 h-4 text-rose-500" />;
         case 'high_epc_offer': return <DollarSign className="w-4 h-4 text-green-400" />;
         case 'conversion_increase': return <Activity className="w-4 h-4 text-amber-400" />;
         default: return <Zap className="w-4 h-4 text-zinc-400" />;
      }
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center">
            <Zap className="w-6 h-6 mr-2 text-indigo-500" />
            Event-Driven Autonomous Growth Loop
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Real-time system events triggering cascading AI workflows without human intervention</p>
        </div>
        <div className="flex space-x-2">
            <button onClick={fetchIntelligence} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20">
              Refresh Loop
            </button>
        </div>
      </div>

      {/* Manual Triggers for Demo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => spawnEvent('keyword_discovered', { keyword: 'best automation tools' })} className="p-4 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition">
             <Globe className="w-6 h-6 text-blue-400 mx-auto mb-2" />
             <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Inject Keyword</span>
          </button>
          <button onClick={() => spawnEvent('traffic_spike', { article_id: '123' })} className="p-4 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition">
             <TrendingUp className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
             <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Simulate Traffic Spike</span>
          </button>
          <button onClick={() => spawnEvent('high_epc_offer', { offer_id: '456' })} className="p-4 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition">
             <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
             <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Flag High EPC</span>
          </button>
          <button onClick={() => spawnEvent('revenue_drop', { target_id: 'site_wide' })} className="p-4 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition border-rose-100 dark:border-rose-900/30">
             <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
             <span className="block text-xs font-bold uppercase tracking-wider text-rose-500">Simulate Rev Drop</span>
          </button>
      </div>

      <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 p-6 rounded-xl">
        <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center">
           <Activity className="w-4 h-4 mr-2" /> Event History
        </h3>
        
        {loading ? (
             <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin text-zinc-500 mx-auto"/></div>
        ) : data.events.length === 0 ? (
             <div className="p-8 text-center text-zinc-500 font-medium">No events fired yet.</div>
        ) : (
            <div className="space-y-4">
              {data.events.map((event: any) => (
                 <div key={event.event_id} className="p-4 border border-zinc-100 dark:border-zinc-850 rounded-lg flex items-start">
                    <div className="mt-1 mr-4 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg">
                       {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1">
                       <div className="flex justify-between items-center mb-1">
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">{event.type.replace(/_/g, ' ')}</h4>
                          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
                              event.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                              event.status === 'failed' ? 'bg-rose-500/10 text-rose-500' :
                              'bg-amber-500/10 text-amber-500'
                          }`}>{event.status}</span>
                       </div>
                       <p className="text-xs text-zinc-500 italic mb-2">ID: {event.event_id} • {new Date(event.created_at).toLocaleString()}</p>
                       
                       {event.log && event.log.length > 0 && (
                          <div className="mt-3 bg-zinc-50 dark:bg-[#0a0a0a] p-3 rounded border border-zinc-100 dark:border-zinc-850 space-y-1">
                             <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Automated Actions Taken</div>
                             {event.log.map((logStr: string, idx: number) => (
                                <div key={idx} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start">
                                    <span className="text-indigo-400 mr-2">→</span> {logStr}
                                </div>
                             ))}
                          </div>
                       )}
                    </div>
                 </div>
              ))}
            </div>
        )}
      </div>
    </div>
  );
}
