import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Sparkles, 
  Check, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  Layers, 
  TrendingUp, 
  Activity, 
  Crown, 
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import { apiFetch } from '../../lib/auth';

interface PlanConfig {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  badge?: string;
  popular?: boolean;
  limits: {
    campaigns: number;
    monthlyClicks: number;
    aiGenerations: number;
    bandwidthGb: number;
  };
  features: string[];
}

export function BillingSubscriptionPanel() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Record<string, PlanConfig>>({});
  const [currentPlanId, setCurrentPlanId] = useState<string>('growth');
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>({
    activeCampaigns: 4,
    clicksThisMonth: 1240,
    articlesGenerated: 14,
  });
  const [limits, setLimits] = useState<any>({
    campaigns: 50,
    monthlyClicks: 150000,
    aiGenerations: 1500,
  });
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [plansRes, statusRes] = await Promise.all([
        apiFetch('/api/billing/plans').then(r => r.json()).catch(() => null),
        apiFetch('/api/billing/status').then(r => r.json()).catch(() => null)
      ]);

      if (plansRes?.plans) {
        setPlans(plansRes.plans);
      }
      if (statusRes?.subscription) {
        setSubscription(statusRes.subscription);
        setCurrentPlanId(statusRes.subscription.planId || statusRes.subscription.tier || 'growth');
      }
      if (statusRes?.usage) {
        setUsage(statusRes.usage);
      }
      if (statusRes?.limits) {
        setLimits(statusRes.limits);
      }
    } catch (err: any) {
      console.warn('[Billing] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleUpgrade = async (planId: string) => {
    try {
      setActionLoading(planId);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await apiFetch('/api/billing/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ planId, interval: billingInterval })
      });
      const data = await res.json();

      if (data.isSimulated) {
        setSuccessMsg(data.message || `Upgraded to ${planId.toUpperCase()} successfully!`);
        setCurrentPlanId(planId);
        await fetchBillingData();
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not initiate upgrade session');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSimulateSwitch = async (planId: string) => {
    try {
      setActionLoading(`switch-${planId}`);
      const res = await apiFetch('/api/billing/simulate-tier', {
        method: 'POST',
        body: JSON.stringify({ planId })
      });
      const data = await res.json();
      setSuccessMsg(data.message);
      setCurrentPlanId(planId);
      await fetchBillingData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch test tier');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#a8ff35]" />
        <p className="text-xs text-zinc-400 font-mono">Synchronizing billing engine & quota telemetry...</p>
      </div>
    );
  }

  const currentPlan = plans[currentPlanId] || {
    id: currentPlanId,
    name: currentPlanId.toUpperCase(),
    tagline: 'Custom Fleet Allocation',
    priceMonthly: 79,
    priceYearly: 790,
  };

  const campaignsRatio = Math.min(100, Math.round((usage.activeCampaigns / (limits.campaigns || 1)) * 100));
  const clicksRatio = Math.min(100, Math.round((usage.clicksThisMonth / (limits.monthlyClicks || 1)) * 100));
  const aiRatio = Math.min(100, Math.round((usage.articlesGenerated / (limits.aiGenerations || 1)) * 100));

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#a8ff35]/10 border border-[#a8ff35]/30 flex items-center justify-between text-[#a8ff35] text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-zinc-400 hover:text-white cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-400 text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-zinc-400 hover:text-white cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {/* Current Active Plan Overview Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-[#0c0e17] to-black p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#a8ff35]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-[#a8ff35]/15 text-[#a8ff35] border border-[#a8ff35]/30 font-bold">
                Active Tier
              </span>
              <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Standing: Good (Auto-renewing)
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              {currentPlan.name}
              {currentPlanId === 'growth' && <Crown size={22} className="text-[#a8ff35]" />}
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl">
              {currentPlan.tagline || 'High-velocity autonomous affiliate routing and AI orchestration engine.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right pr-4 border-r border-white/10 hidden sm:block">
              <div className="text-xs text-zinc-500 font-mono">BILLING RATE</div>
              <div className="text-xl font-bold text-white font-mono">
                ${billingInterval === 'year' ? Math.round(currentPlan.priceYearly / 12) : currentPlan.priceMonthly}
                <span className="text-xs text-zinc-500 font-normal">/mo</span>
              </div>
            </div>

            <button
              onClick={() => fetchBillingData()}
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 flex items-center gap-2 transition"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Sync Status
            </button>
          </div>
        </div>

        {/* Real-Time Plan Quota Meters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Meter 1: Active Campaigns */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                <Layers size={13} className="text-[#a8ff35]" /> Active Campaigns
              </span>
              <span className="text-white font-mono font-bold">
                {usage.activeCampaigns} <span className="text-zinc-500">/ {limits.campaigns >= 9999 ? '∞' : limits.campaigns}</span>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-[#a8ff35] rounded-full transition-all duration-500" 
                style={{ width: `${campaignsRatio}%` }} 
              />
            </div>
            <div className="text-[10px] text-zinc-500 text-right font-mono">{campaignsRatio}% allocated</div>
          </div>

          {/* Meter 2: Monthly Click Traffic */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                <Activity size={13} className="text-cyan-400" /> Outbound Clicks
              </span>
              <span className="text-white font-mono font-bold">
                {usage.clicksThisMonth.toLocaleString()} <span className="text-zinc-500">/ {limits.monthlyClicks.toLocaleString()}</span>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" 
                style={{ width: `${clicksRatio}%` }} 
              />
            </div>
            <div className="text-[10px] text-zinc-500 text-right font-mono">{clicksRatio}% monthly volume</div>
          </div>

          {/* Meter 3: AI Generation Quota */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" /> AI Studio Quota
              </span>
              <span className="text-white font-mono font-bold">
                {usage.articlesGenerated} <span className="text-zinc-500">/ {limits.aiGenerations >= 9999 ? '∞' : limits.aiGenerations}</span>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500" 
                style={{ width: `${aiRatio}%` }} 
              />
            </div>
            <div className="text-[10px] text-zinc-500 text-right font-mono">{aiRatio}% tokens consumed</div>
          </div>
        </div>
      </div>

      {/* Plan Selector Header & Interval Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">Available Subscription Tiers</h3>
          <p className="text-xs text-zinc-400">Scale bandwidth, AI agent pools, and multi-armed bandit routing</p>
        </div>

        {/* Interval Selector */}
        <div className="p-1 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-1">
          <button
            onClick={() => setBillingInterval('month')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
              billingInterval === 'month' 
                ? 'bg-[#a8ff35] text-black shadow-lg' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              billingInterval === 'year' 
                ? 'bg-[#a8ff35] text-black shadow-lg' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Annual <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/20 text-black font-extrabold">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.values(plans).map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          const price = billingInterval === 'year' ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;
          const isPopular = plan.popular;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 md:p-7 flex flex-col justify-between transition-all duration-300 ${
                isPopular
                  ? 'bg-gradient-to-b from-slate-900/90 via-[#0e121a] to-black border-2 border-[#a8ff35]/40 shadow-[0_0_40px_rgba(168,255,53,0.12)]'
                  : 'bg-slate-950/60 border border-white/10 hover:border-white/20'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#a8ff35] text-black text-[10px] font-black uppercase tracking-widest shadow-md">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">{plan.badge}</span>
                    <h4 className="text-xl font-extrabold text-white pt-1">{plan.name}</h4>
                  </div>
                  {isCurrent && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                      CURRENT
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed min-h-[36px]">
                  {plan.tagline}
                </p>

                <div className="pt-2 pb-4 border-b border-white/5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl md:text-4xl font-extrabold text-white font-mono tracking-tight">
                      ${price}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">/month</span>
                  </div>
                  {billingInterval === 'year' && (
                    <div className="text-[10px] text-zinc-500 font-mono pt-1">
                      Billed annually (${plan.priceYearly}/yr)
                    </div>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                    INCLUDED CAPABILITIES
                  </div>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-[#a8ff35]/15 text-[#a8ff35] flex items-center justify-center shrink-0">
                        <Check size={10} strokeWidth={3} />
                      </div>
                      <span className="leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={actionLoading === plan.id || isCurrent}
                  className={`w-full py-3 px-4 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
                    isCurrent
                      ? 'bg-white/5 text-zinc-500 border border-white/5 cursor-default'
                      : isPopular
                      ? 'bg-[#a8ff35] hover:bg-[#baff4c] text-black shadow-lg shadow-[#a8ff35]/20 hover:scale-[1.02]'
                      : 'bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20'
                  }`}
                >
                  {actionLoading === plan.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isCurrent ? (
                    'Active Plan'
                  ) : (
                    <>
                      Upgrade to {plan.name.split(' ')[0]}
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Developer Sandbox Tier Switcher (Fast QA Testing) */}
      <div className="p-5 rounded-2xl border border-white/5 bg-black/40 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              Developer QA Sandbox
            </span>
            <span className="text-xs text-zinc-300 font-semibold">Instant Tier Simulation</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Preview paywalls and rate-limits instantly without actual credit card charges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['starter', 'growth', 'enterprise'].map((t) => (
            <button
              key={t}
              onClick={() => handleSimulateSwitch(t)}
              disabled={actionLoading === `switch-${t}` || currentPlanId === t}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition ${
                currentPlanId === t
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {actionLoading === `switch-${t}` ? '...' : t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
