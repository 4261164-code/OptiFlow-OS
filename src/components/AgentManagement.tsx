import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui';
import { Sparkles, Bot, Search, Edit3, Image as ImageIcon, Send, BarChart, Users, Rocket, Clock, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';

export function AgentManagement() {
  const agents = [
    { name: "Research Agent", icon: Search, status: "Active", lastRun: "2 mins ago", successRate: "100%" },
    { name: "SEO Agent", icon: Sparkles, status: "Active", lastRun: "2 mins ago", successRate: "98%" },
    { name: "Writer Agent", icon: Edit3, status: "Active", lastRun: "2 mins ago", successRate: "99%" },
    { name: "Pinterest Agent", icon: ImageIcon, status: "Active", lastRun: "1 min ago", successRate: "100%" },
    { name: "Image Agent", icon: ImageIcon, status: "Active", lastRun: "1 min ago", successRate: "95%" },
    { name: "Publishing Agent", icon: Send, status: "Active", lastRun: "5 mins ago", successRate: "100%" },
    { name: "Analytics Agent", icon: BarChart, status: "Active", lastRun: "12 mins ago", successRate: "100%" },
    { name: "Affiliate Matchmaker Agent", icon: DollarSign, status: "Active", lastRun: "Just now", successRate: "100%" },
    { name: "Traffic Scheduler Agent", icon: Rocket, status: "Active", lastRun: "Just now", successRate: "100%" },
    { name: "Creator Syndicate Agent", icon: Users, status: "Active", lastRun: "3 mins ago", successRate: "100%" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-sans tracking-tight font-bold tracking-tight text-white mb-2">Agent Management</h1>
        <p className="text-zinc-400">Monitor and configure your autonomous OptiFlow agents.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {agents.map(agent => (
          <Card key={agent.name}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#d7f941]/10 flex items-center justify-center shrink-0">
                  <agent.icon className="w-5 h-5 text-[#d7f941]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{agent.name}</h3>
                  <div className="flex items-center gap-2 mt-1 mb-3 text-sm">
                    <span className={cn("w-2 h-2 rounded-full", agent.status.includes('Active') ? 'bg-[#d7f941]' : 'bg-zinc-600')}></span>
                    <span className="text-zinc-400">{agent.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-zinc-500 uppercase tracking-wider mb-1">Last Run</p>
                      <p className="text-zinc-300 font-mono">{agent.lastRun}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 uppercase tracking-wider mb-1">Success Rate</p>
                      <p className="text-zinc-300 font-mono">{agent.successRate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
