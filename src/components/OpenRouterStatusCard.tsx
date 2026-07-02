import React, { useMemo } from 'react';
import { Card } from './ui';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { Activity, Server, Zap } from 'lucide-react';

export function OpenRouterStatusCard() {
  // Generate mock data for the last 24 hours
  const tokenData = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      hour: i,
      tokens: 0,
    }));
  }, []);

  const currentTokensUsed = tokenData.reduce((acc, curr) => acc + curr.tokens, 0);
  const quota = 5000000;
  const remaining = Math.max(0, quota - currentTokensUsed);
  const remainingPercentage = remaining / quota;

  let statusColor = "#a8ff35"; // Green
  let statusText = "Operational";
  let statusBgClass = "bg-[#a8ff35]/10";
  let statusBorderClass = "border-[#a8ff35]/20";
  let statusTextClass = "text-[#a8ff35]";
  let statusPingClass = "bg-[#a8ff35]";

  if (remainingPercentage <= 0.2) {
    statusColor = "#ef4444"; // Red
    statusText = "Critical";
    statusBgClass = "bg-red-500/10";
    statusBorderClass = "border-red-500/20";
    statusTextClass = "text-red-500";
    statusPingClass = "bg-red-500";
  } else if (remainingPercentage <= 0.5) {
    statusColor = "#fbbf24"; // Amber
    statusText = "Warning";
    statusBgClass = "bg-amber-500/10";
    statusBorderClass = "border-amber-500/20";
    statusTextClass = "text-amber-500";
    statusPingClass = "bg-amber-500";
  }

  return (
    <Card className="bg-[#0D1117] border-white/5 overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Left side: Status and Quota */}
        <div className="p-6 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col justify-between w-full lg:w-1/3">
          <div className="flex items-center gap-3 mb-6">
            <div className={`${statusBgClass} p-2.5 rounded-lg border ${statusBorderClass}`}>
              <Server className={`w-5 h-5 ${statusTextClass}`} />
            </div>
            <div>
              <h3 className="text-white font-semibold">OpenRouter API Status</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusPingClass} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${statusPingClass}`}></span>
                </span>
                <span className="text-xs text-zinc-400">{statusText}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Quota Remaining</p>
            <div className="text-3xl font-bold text-white tracking-tight">
              {(remaining / 1000000).toFixed(1)}M <span className="text-sm font-medium text-zinc-500 tracking-normal">/ {(quota / 1000000).toFixed(1)}M</span>
            </div>
          </div>
        </div>

        {/* Right side: Sparkline Chart */}
        <div className="p-6 w-full lg:w-2/3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-400">Token Consumption (24h)</span>
            </div>
            <div className={`${statusTextClass} text-sm font-mono flex items-center gap-1`}>
              <Zap className="w-3 h-3" />
              {currentTokensUsed.toLocaleString()} utilized
            </div>
          </div>

          <div className="h-20 w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tokenData}>
                <YAxis domain={['dataMin - 5000', 'dataMax + 5000']} hide />
                <Line 
                  type="monotone" 
                  dataKey="tokens" 
                  stroke={statusColor} 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  );
}
