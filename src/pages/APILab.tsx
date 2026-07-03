import React, { useState } from 'react';
import { Activity, Play, CheckCircle, XCircle, Clock, Server } from 'lucide-react';
import { motion } from 'motion/react';

export default function APILab() {
  const [selectedRoute, setSelectedRoute] = useState('/api/health');
  const [method, setMethod] = useState('GET');
  const [payload, setPayload] = useState('{}');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  const predefinedRoutes = [
    '/api/health',
    '/api/strategy/audit',
    '/api/strategy/adopt',
    '/api/writing/generate',
    '/api/writing/edit',
    '/api/intel/scrape',
    '/api/intel/competitors',
    '/api/distro/schedule',
    '/api/distro/publish',
    '/api/pipeline/start',
    '/api/gsc/auth',
    '/api/analyst/query',
    '/api/orchestrator/command',
    '/api/events/track',
    '/api/tracking/pixel',
    '/api/analytics/metrics',
    '/api/rapidapi/search'
  ];

  const handleTest = async () => {
    setLoading(true);
    setResponse(null);
    setStatus(null);
    setDuration(null);
    
    const startTime = performance.now();
    
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (method !== 'GET' && method !== 'HEAD') {
        options.body = payload;
      }

      
      const { auth } = await import('../lib/firebase');
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      const res = await fetch(selectedRoute, options);
  
      const endTime = performance.now();
      
      setStatus(res.status);
      setDuration(Math.round(endTime - startTime));
      
      try {
        const data = await res.json();
        setResponse(data);
      } catch (e) {
        const text = await res.text();
        setResponse({ _text: text });
      }
    } catch (err: any) {
      const endTime = performance.now();
      setDuration(Math.round(endTime - startTime));
      setResponse({ error: err.message });
      setStatus(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Server className="w-6 h-6 text-blue-500" />
            API Diagnostics & Sandbox
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">Test, ping, and inspect all internal API routes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#0B1017] border border-white/5 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Request Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Endpoint</label>
                <select
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                >
                  {predefinedRoutes.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Method</label>
                <div className="flex bg-black/40 border border-white/10 rounded-xl overflow-hidden p-1">
                  {['GET', 'POST', 'PUT', 'DELETE'].map(m => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`flex-1 text-xs py-1.5 rounded-lg font-bold transition-all ${method === m ? 'bg-blue-600/20 text-blue-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {method !== 'GET' && method !== 'HEAD' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Payload (JSON)</label>
                  <textarea
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    rows={6}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500/50 transition-colors"
                    placeholder="{}"
                  />
                </div>
              )}

              <button
                onClick={handleTest}
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Activity className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Execute Request
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[#0B1017] border border-white/5 rounded-2xl h-full shadow-lg flex flex-col">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/30">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Response Inspector</h3>
              {status !== null && (
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${status >= 200 && status < 300 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {status >= 200 && status < 300 ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    Status: {status}
                  </div>
                  {duration !== null && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 text-zinc-300 rounded-md">
                      <Clock className="w-3.5 h-3.5" />
                      {duration}ms
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex-1 p-4 overflow-auto bg-[#05070A] font-mono text-[13px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                  <Activity className="w-8 h-8 animate-spin text-blue-500" />
                  <p>Awaiting response...</p>
                </div>
              ) : response ? (
                <motion.pre 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-zinc-300 whitespace-pre-wrap break-words"
                >
                  {JSON.stringify(response, null, 2)}
                </motion.pre>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-600">
                  <p>No request executed yet. Select an endpoint and click execute.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
