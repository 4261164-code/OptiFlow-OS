import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Activity, 
  Zap, 
  Globe, 
  Smartphone, 
  Monitor, 
  Tablet, 
  DollarSign, 
  ArrowUpRight, 
  Play, 
  Loader2, 
  ShieldCheck, 
  Clock, 
  Filter,
  Sparkles,
  Layers
} from 'lucide-react';
import { apiFetch } from '../../lib/auth';

interface LiveEvent {
  id: string;
  type: 'click' | 'conversion' | 'smart_route' | 'bot_blocked';
  timestamp: number;
  offerId?: string;
  offerName?: string;
  source: string;
  country: string;
  device: 'desktop' | 'mobile' | 'tablet';
  payout?: number;
  subid?: string;
  latencyMs?: number;
}

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  GB: '🇬🇧',
  CA: '🇨🇦',
  DE: '🇩🇪',
  AU: '🇦🇺',
  FR: '🇫🇷',
  NL: '🇳🇱',
  JP: '🇯🇵',
  BR: '🇧🇷',
  IN: '🇮🇳',
};

export function LiveTrafficPulse() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'click' | 'conversion'>('all');
  const [simulating, setSimulating] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial batch
  useEffect(() => {
    let mounted = true;
    apiFetch('/api/analytics/live-recent')
      .then(res => res.json())
      .then(data => {
        if (mounted && data.events) {
          setEvents(data.events);
        }
      })
      .catch(err => console.warn('Could not load recent telemetry:', err));

    // Initialize SSE live stream
    try {
      const es = new EventSource('/api/analytics/live-pulse');
      eventSourceRef.current = es;

      es.onopen = () => {
        if (mounted) setIsConnected(true);
      };

      es.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.type === 'connected') {
            if (mounted) setIsConnected(true);
            return;
          }
          if (mounted) {
            setEvents(prev => [parsed, ...prev.slice(0, 49)]);
          }
        } catch (err) {
          // ignore parsing error
        }
      };

      es.onerror = () => {
        if (mounted) setIsConnected(false);
      };
    } catch (e) {
      console.warn('SSE not supported or blocked in preview, using static buffer');
    }

    return () => {
      mounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleSimulate = async (type: 'click' | 'conversion') => {
    try {
      setSimulating(true);
      const res = await apiFetch('/api/analytics/simulate-traffic', {
        method: 'POST',
        body: JSON.stringify({
          type,
          offerName: type === 'conversion' ? 'Weight Loss Nutra ($62 CPA)' : 'NordVPN High Yield',
          payout: type === 'conversion' ? 62 : undefined,
          country: ['US', 'GB', 'CA', 'DE', 'AU'][Math.floor(Math.random() * 5)]
        })
      });
      const data = await res.json();
      if (data.event) {
        setEvents(prev => [data.event, ...prev.slice(0, 49)]);
      }
    } catch (e) {
      console.error('Failed to emit simulated event:', e);
    } finally {
      setSimulating(false);
    }
  };

  const filteredEvents = events.filter(e => {
    if (filterType === 'all') return true;
    return e.type === filterType;
  });

  const totalRevenue = events
    .filter(e => e.type === 'conversion' && e.payout)
    .reduce((sum, e) => sum + (e.payout || 0), 0);

  const totalClicks = events.filter(e => e.type === 'click' || e.type === 'smart_route').length;
  const epc = totalClicks > 0 ? (totalRevenue / totalClicks).toFixed(2) : '0.00';
  const avgLatency = Math.round(
    events.reduce((acc, curr) => acc + (curr.latencyMs || 20), 0) / (events.length || 1)
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-[#0B0F17] to-black p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
      <div className="absolute top-0 right-1/4 -mt-20 w-80 h-80 bg-[#a8ff35]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-[#a8ff35]' : 'bg-amber-400'} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-[#a8ff35]' : 'bg-amber-400'}`} />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
              {isConnected ? 'Real-Time SSE Stream Active' : 'Live Buffer Mode'}
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            In-Flight Traffic & Telemetry Stream
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono font-normal">
              SubID Routing
            </span>
          </h3>
          <p className="text-xs text-zinc-400">
            Real-time packet inspection for clicks, bot filters, Thompson bandit routing, and affiliate S2S postbacks.
          </p>
        </div>

        {/* Live Simulation Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleSimulate('click')}
            disabled={simulating}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            {simulating ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} className="text-cyan-400" />}
            + Simulate Click
          </button>
          <button
            onClick={() => handleSimulate('conversion')}
            disabled={simulating}
            className="px-3 py-2 rounded-xl bg-[#a8ff35]/10 hover:bg-[#a8ff35]/20 border border-[#a8ff35]/30 text-xs font-semibold text-[#a8ff35] flex items-center gap-1.5 transition cursor-pointer"
          >
            {simulating ? <Loader2 size={13} className="animate-spin" /> : <DollarSign size={13} />}
            + Simulate Conversion ($62)
          </button>
        </div>
      </div>

      {/* Real-time KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">In-Flight Volume</div>
          <div className="text-2xl font-extrabold text-white font-mono pt-1">{totalClicks}</div>
          <div className="text-[10px] text-zinc-500 flex items-center gap-1 pt-0.5">
            <Activity size={10} className="text-[#a8ff35]" /> Monitored hops
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Live Revenue</div>
          <div className="text-2xl font-extrabold text-[#a8ff35] font-mono pt-1">${totalRevenue.toFixed(2)}</div>
          <div className="text-[10px] text-zinc-500 flex items-center gap-1 pt-0.5">
            <DollarSign size={10} className="text-[#a8ff35]" /> Confirmed S2S postbacks
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Real-Time EPC</div>
          <div className="text-2xl font-extrabold text-white font-mono pt-1">${epc}</div>
          <div className="text-[10px] text-zinc-500 flex items-center gap-1 pt-0.5">
            <ArrowUpRight size={10} className="text-cyan-400" /> Earnings Per Click
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Hop Latency</div>
          <div className="text-2xl font-extrabold text-white font-mono pt-1">{avgLatency} ms</div>
          <div className="text-[10px] text-zinc-500 flex items-center gap-1 pt-0.5">
            <Zap size={10} className="text-amber-400" /> Sub-millisecond redirect
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterType === 'all'
                ? 'bg-[#a8ff35] text-black font-bold'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            All Stream Events ({events.length})
          </button>
          <button
            onClick={() => setFilterType('conversion')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterType === 'conversion'
                ? 'bg-[#a8ff35] text-black font-bold'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            Conversions Only ({events.filter(e => e.type === 'conversion').length})
          </button>
          <button
            onClick={() => setFilterType('click')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterType === 'click'
                ? 'bg-[#a8ff35] text-black font-bold'
                : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            Clicks & Redirects
          </button>
        </div>

        <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
          Showing last 50 telemetry packets
        </span>
      </div>

      {/* Telemetry Stream Feed Table */}
      <div className="rounded-2xl border border-white/5 bg-black/40 overflow-hidden">
        <div className="overflow-x-auto max-h-[360px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Offer / Target</th>
                <th className="py-3 px-4">Geo</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">SubID / ClickID</th>
                <th className="py-3 px-4 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filteredEvents.map((evt) => {
                const flag = COUNTRY_FLAGS[evt.country] || '🌐';
                const isConv = evt.type === 'conversion';
                const isSmart = evt.type === 'smart_route';

                return (
                  <tr key={evt.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Event Type */}
                    <td className="py-3 px-4">
                      {isConv ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[10px] flex items-center gap-1 w-max">
                          <DollarSign size={10} /> CONVERSION
                        </span>
                      ) : isSmart ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 font-mono font-bold text-[10px] flex items-center gap-1 w-max">
                          <Sparkles size={10} /> BANDIT HOP
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-mono font-semibold text-[10px] flex items-center gap-1 w-max">
                          <Zap size={10} /> CLICK
                        </span>
                      )}
                    </td>

                    {/* Offer Name */}
                    <td className="py-3 px-4 font-semibold text-white truncate max-w-[200px]">
                      {evt.offerName || `Offer #${evt.offerId?.substring(0, 8)}`}
                    </td>

                    {/* Geo */}
                    <td className="py-3 px-4 font-mono text-zinc-300">
                      <span className="mr-1.5 text-sm">{flag}</span>
                      {evt.country}
                    </td>

                    {/* Device */}
                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px] capitalize">
                      <div className="flex items-center gap-1.5">
                        {evt.device === 'mobile' && <Smartphone size={12} className="text-cyan-400" />}
                        {evt.device === 'desktop' && <Monitor size={12} className="text-zinc-400" />}
                        {evt.device === 'tablet' && <Tablet size={12} className="text-amber-400" />}
                        {evt.device}
                      </div>
                    </td>

                    {/* Source */}
                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                      {evt.source}
                    </td>

                    {/* SubID */}
                    <td className="py-3 px-4 font-mono text-[10px] text-zinc-500 truncate max-w-[140px]">
                      {evt.subid || evt.id}
                    </td>

                    {/* Value */}
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {isConv ? (
                        <span className="text-[#a8ff35] text-sm">+${evt.payout?.toFixed(2)}</span>
                      ) : (
                        <span className="text-zinc-500 text-[11px]">{evt.latencyMs || 18}ms</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
