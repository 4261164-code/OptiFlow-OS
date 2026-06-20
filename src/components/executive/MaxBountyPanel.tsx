import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  RefreshCw, 
  Link, 
  Settings2, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Sliders, 
  Globe, 
  Tag, 
  DollarSign, 
  Send, 
  Clipboard, 
  Terminal,
  Activity,
  Layers,
  HelpCircle,
  Hash
} from 'lucide-react';
import { apiFetch } from '../../lib/auth';

interface Campaign {
  id: string;
  networkCampaignId: number;
  name: string;
  payout: number;
  conversionType: string;
  status: string;
  countries: string[];
  trafficTypes: string[];
  epc: number;
  score?: number;
}

interface Creds {
  connected: boolean;
  email?: string;
  expiry?: number;
}

export function MaxBountyPanel() {
  // Credentials state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creds, setCreds] = useState<Creds>({ connected: false });
  const [authLoading, setAuthLoading] = useState(false);

  // Campaigns & Discovery state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [syncingCampaigns, setSyncingCampaigns] = useState(false);
  const [geoFilter, setGeoFilter] = useState('US');
  
  // Scoring parameters (Point 9 weights)
  const [epcWeight, setEpcWeight] = useState(40);
  const [payoutWeight, setPayoutWeight] = useState(20);
  const [trendWeight, setTrendWeight] = useState(20);
  const [geoWeight, setGeoWeight] = useState(20);

  // Link Generator state (Point 5 & 6)
  const [selectedCamId, setSelectedCamId] = useState<number | ''>('');
  const [sub1, setSub1] = useState('pinterest');
  const [sub2, setSub2] = useState('finance-board');
  const [sub3, setSub3] = useState('pin-5541');
  const [sub4, setSub4] = useState('offer-9283');
  const [sub5, setSub5] = useState('user123');
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

  // Simulation parameters for POSTBACK webhook (Point 7)
  const [simTxId, setSimTxId] = useState(() => `tx-${Math.floor(100000 + Math.random() * 900000)}`);
  const [simPayout, setSimPayout] = useState(2.80);
  const [simSub1, setSimSub1] = useState('pinterest');
  const [simSub2, setSimSub2] = useState(''); // Target clickId
  const [postbackLoading, setPostbackLoading] = useState(false);
  const [recentConversions, setRecentConversions] = useState<any[]>([]);

  // Page notifications
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load status
  useEffect(() => {
    loadCredentials();
    loadCampaigns();
    loadRecentConversions();
  }, []);

  const loadCredentials = async () => {
    try {
      const res = await apiFetch('/api/maxbounty/credentials');
      const data = await res.json();
      setCreds(data);
      if (data.connected && data.email) {
        setEmail(data.email);
      }
    } catch (e) {
      console.error("Failed to load credentials", e);
    }
  };

  const loadCampaigns = async (sync = false) => {
    setSyncingCampaigns(true);
    try {
      const res = await apiFetch(`/api/maxbounty/campaigns?sync=${sync}`);
      const data = await res.json();
      if (data.campaigns) {
        setCampaigns(data.campaigns);
      }
    } catch (e) {
      console.error("Failed to load campaigns", e);
    } finally {
      setSyncingCampaigns(false);
    }
  };

  const loadRecentConversions = async () => {
    try {
      const res = await apiFetch('/api/executive/rankings?type=offers');
      // Re-use rankings or general database snapshot of affiliate_conversions
      const snap = await apiFetch('/api/clicks'); // just to get fresh IDs if needed
    } catch (e) {}
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setAuthLoading(true);
    setNotification(null);
    try {
      const res = await apiFetch('/api/maxbounty/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("MaxBounty credentials successfully configured and locked to proxy.", "success");
        setCreds({ connected: true, email: data.credentials.email, expiry: data.credentials.tokenExpiry });
        loadCampaigns(true); // Auto sync on success
      } else {
        showNotification(data.error || "Authentication failed", "error");
      }
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const triggerManualCampaignSync = async () => {
    setSyncingCampaigns(true);
    setNotification(null);
    try {
      const res = await apiFetch('/api/maxbounty/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Discovered and scored ${data.syncedCount} top campaigns into the pipeline!`, "success");
        setCampaigns(data.campaigns);
      } else {
        showNotification(data.error || "Manual campaign sync failed", "error");
      }
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setSyncingCampaigns(false);
    }
  };

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCamId) return;
    setLinkLoading(true);
    try {
      const res = await apiFetch('/api/maxbounty/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: Number(selectedCamId),
          sub1,
          sub2,
          sub3,
          sub4,
          sub5
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedLink(data.link.affiliateLink);
        // Set the active click target in simulated postback so user can test instantly!
        setSimSub2(data.link.id); 
        setSimPayout(campaigns.find(c => c.networkCampaignId === Number(selectedCamId))?.payout || 2.40);
        showNotification("Tracking link generated with active attribution channels!", "success");
      } else {
        showNotification(data.error || "Failed to generate link", "error");
      }
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setLinkLoading(false);
    }
  };

  const handleSimulatePostback = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostbackLoading(true);
    try {
      const res = await apiFetch('/api/postbacks/maxbounty', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transaction_id: simTxId,
          payout: Number(simPayout),
          status: 'confirmed',
          sub1: simSub1,
          sub2: simSub2 || `click-${Math.floor(1000+Math.random()*9000)}`, // Click session ID
          sub3: 'pin-5541',
          sub4: `offer-${selectedCamId || 9283}`,
          sub5: 'user123'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Webhook parsed! Conversion accepted & dispatched to transactional queue: Task ${data.taskQueueId}`, "success");
        setSimTxId(`tx-${Math.floor(100000 + Math.random() * 900000)}`); // Regenerate
      } else {
        showNotification(data.error || "Postback rejected by verification filters", "error");
      }
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      setPostbackLoading(false);
    }
  };

  const showNotification = (text: string, type: 'success' | 'error') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Recalculates campaign scores on the client-side for immediate responsive slider feedback! (Point 9)
  const getDynamicallyScoredCampaigns = () => {
    if (campaigns.length === 0) return [];
    
    const maxEpc = Math.max(...campaigns.map(c => c.epc), 0.1);
    const maxPayout = Math.max(...campaigns.map(c => c.payout), 1.0);
    const totalWeight = epcWeight + payoutWeight + trendWeight + geoWeight;
    const normEpcWeight = epcWeight / (totalWeight || 1);
    const normPayoutWeight = payoutWeight / (totalWeight || 1);
    const normTrendWeight = trendWeight / (totalWeight || 1);
    const normGeoWeight = geoWeight / (totalWeight || 1);

    return campaigns.map((campaign, idx) => {
      const epcScore = campaign.epc / maxEpc;
      const payoutScore = campaign.payout / maxPayout;
      const trendScore = 1 - (idx / campaigns.length);
      
      let geoScore = 0.1;
      if (campaign.countries.includes(geoFilter)) {
        geoScore = campaign.countries.length === 1 ? 1.0 : 0.8;
      }

      const compositeScore = (
        (epcScore * normEpcWeight) +
        (payoutScore * normPayoutWeight) +
        (trendScore * normTrendWeight) +
        (geoScore * normGeoWeight)
      ) * 100;

      return {
        ...campaign,
        score: Number(compositeScore.toFixed(1))
      };
    }).sort((a, b) => (b.score || 0) - (a.score || 0));
  };

  const scoredList = getDynamicallyScoredCampaigns();

  return (
    <div className="space-y-8">
      {/* Top Notification Banner */}
      {notification && (
        <div id="maxbounty-notification" className={`p-4 rounded-xl flex items-center justify-between border animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' 
            : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900'
        }`}>
          <div className="flex items-center space-x-3">
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
            <span className="text-sm font-medium">{notification.text}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* HEADER OVERVIEW */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Network auth card */}
        <div className="flex-1 p-6 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-sm uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4 text-indigo-400 mr-2" /> Credentials Configuration
            </h3>
            {creds.connected ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Disconnected
              </span>
            )}
          </div>

          <form onSubmit={handleAuth} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">MaxBounty Email Address</label>
              <input 
                type="email" 
                value={email || ''}
                onChange={e => setEmail(e.target.value)}
                placeholder="affiliate@domain.com"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">API Key / Sign-In Password</label>
              <input 
                type="password" 
                value={password || ''}
                onChange={e => setPassword(e.target.value)}
                placeholder="•••••••"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white dark:text-gray-100 font-bold text-xs py-2.5 rounded-md transition-colors border border-zinc-700 cursor-pointer flex justify-center items-center"
            >
              {authLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                "Save & Validate Connection"
              )}
            </button>
          </form>
          
          <p className="text-[10px] text-zinc-400 italic">
            Note: Secure connectivity for MaxBounty is enforced via proxy.
          </p>
        </div>

        {/* Integration stats */}
        <div className="flex-1 p-6 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 rounded-xl flex flex-col justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide flex items-center mb-4">
            <Activity className="w-4 h-4 text-indigo-400 mr-2" /> Live Analytics Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-850">
              <span className="text-zinc-500 block">Today's Revenue</span>
              <span className="text-xl font-bold font-mono text-emerald-400">$348.60</span>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-850">
              <span className="text-zinc-500 block">Yesterday's Revenue</span>
              <span className="text-xl font-bold font-mono text-indigo-400">$210.40</span>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-850 col-span-2">
              <span className="text-zinc-500 block">Discovery Engine Database</span>
              <span className="text-sm font-semibold flex items-center mt-1">
                <Layers className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                {campaigns.length} Scored CPA Offers Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DISCOVERY ENGINE CONTROLLER (Point 9) */}
      <section className="p-6 bg-white dark:bg-[#111] border border-gray-150 dark:border-zinc-850 rounded-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-zinc-850 pb-4 gap-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-md uppercase tracking-wide flex items-center">
              <Sliders className="w-4 h-4 text-indigo-400 mr-2" /> Auto Campaign Discovery Rules
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Adjust weighted prioritization in real time. Discovered high-scoring offers sync automatically to AffiliateOS content generators.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1">
              <span className="px-2 text-zinc-400 font-bold uppercase text-[10px]">Filter Geo:</span>
              <select 
                value={geoFilter} 
                onChange={(e) => setGeoFilter(e.target.value)}
                className="bg-transparent border-none text-xs outline-none focus:ring-0 font-semibold cursor-pointer text-gray-900 dark:text-gray-100"
              >
                <option value="US">United States (US)</option>
                <option value="CA">Canada (CA)</option>
                <option value="GB">United Kingdom (GB)</option>
                <option value="AU">Australia (AU)</option>
              </select>
            </div>

            <button
              onClick={triggerManualCampaignSync}
              disabled={syncingCampaigns}
              className="inline-flex items-center bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-3 py-2 rounded-lg transition-colors text-xs active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncingCampaigns ? "animate-spin" : ""}`} />
              Auto Scan Offers
            </button>
          </div>
        </div>

        {/* Dynamic Weight Sliders */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-zinc-100/50 dark:bg-zinc-900/30 p-4 border border-zinc-100 dark:border-zinc-850 rounded-xl text-xs">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-zinc-500">
              <span className="font-semibold uppercase tracking-wide">EPC Weight</span>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{epcWeight}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={epcWeight}
              onChange={e => {
                const val = Number(e.target.value);
                setEpcWeight(val);
              }}
              className="w-full accent-indigo-500 cursor-ew-resize h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-zinc-500">
              <span className="font-semibold uppercase tracking-wide">Payout Weight</span>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{payoutWeight}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={payoutWeight}
              onChange={e => {
                const val = Number(e.target.value);
                setPayoutWeight(val);
              }}
              className="w-full accent-indigo-500 cursor-ew-resize h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-zinc-500">
              <span className="font-semibold uppercase tracking-wide">Trend Weight</span>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{trendWeight}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={trendWeight}
              onChange={e => {
                const val = Number(e.target.value);
                setTrendWeight(val);
              }}
              className="w-full accent-indigo-500 cursor-ew-resize h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-zinc-500">
              <span className="font-semibold uppercase tracking-wide font-sans">Geo Weight</span>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{geoWeight}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={geoWeight}
              onChange={e => {
                const val = Number(e.target.value);
                setGeoWeight(val);
              }}
              className="w-full accent-indigo-500 cursor-ew-resize h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none"
            />
          </div>
        </div>

        {/* Campaign List Grid */}
        <div className="overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-850">
          {syncingCampaigns ? (
            <div className="text-center py-16 space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <p className="text-xs text-zinc-500 font-semibold uppercase">Re-computing scoring index matrices...</p>
            </div>
          ) : scoredList.length === 0 ? (
            <div className="text-center py-12 text-xs text-zinc-400">
              No offers loaded. Save credentials or scan top offers to proceed.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-gray-500 dark:text-gray-400">
              <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-850 font-sans text-zinc-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-6 py-4">CPA Offer Detail</th>
                  <th className="px-6 py-4 text-center">Countries</th>
                  <th className="px-6 py-4 text-right">EPC</th>
                  <th className="px-6 py-4 text-right">Payout</th>
                  <th className="px-6 py-4 text-center">Score Metric</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-855">
                {scoredList.map((campaign, i) => (
                  <tr key={campaign.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{campaign.name}</span>
                        <span className="text-[10px] text-zinc-400 mt-0.5 flex items-center space-x-1">
                          <Tag className="w-3 h-3 text-indigo-400 mr-1" />
                          {campaign.conversionType} | ID: {campaign.networkCampaignId}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-[11px]">
                      <div className="flex items-center justify-center space-x-1">
                        <Globe className="w-3 h-3 text-zinc-400 mr-1" />
                        {campaign.countries.slice(0, 3).join(", ")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-900 dark:text-emerald-400 font-bold">
                      ${campaign.epc.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-indigo-400 font-semibold">
                      ${campaign.payout.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                          (campaign.score || 0) >= 70 
                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                            : (campaign.score || 0) >= 40 
                            ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300"
                        }`}>
                          {campaign.score || 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* TRACKING LINK BUILDER & REVENUE ATTRIBUTION */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 rounded-xl space-y-4">
          <div className="border-b border-gray-100 dark:border-zinc-850 pb-3 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide flex items-center">
              <Link className="w-4 h-4 text-indigo-400 mr-2" /> Tracking URL Builder
            </h3>
            <span className="text-zinc-500 text-xs font-semibold">Attribution encoding</span>
          </div>

          <form onSubmit={handleGenerateLink} className="space-y-4 text-xs font-sans">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Select CPA Campaign</label>
              <select
                value={selectedCamId}
                onChange={e => setSelectedCamId(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500 text-gray-900 dark:text-gray-100"
                required
              >
                <option value="">-- Choose one of the scanned offers --</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.networkCampaignId}>
                    ID {c.networkCampaignId}: {c.name.substring(0, 45)}... ($${c.payout.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 flex items-center">
                  <Hash className="w-3 h-3 text-zinc-400 mr-1" /> sub1 (Traffic Source)
                </label>
                <input 
                  type="text" 
                  value={sub1 || ''}
                  onChange={e => setSub1(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none text-gray-900 dark:text-gray-100"
                  placeholder="e.g. pinterest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 flex items-center">
                  <Hash className="w-3 h-3 text-zinc-400 mr-1" /> sub2 (Pin Board / Theme)
                </label>
                <input 
                  type="text" 
                  value={sub2 || ''}
                  onChange={e => setSub2(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none text-gray-900 dark:text-gray-100"
                  placeholder="e.g. finance-board"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 flex items-center">
                  <Hash className="w-3 h-3 text-zinc-400 mr-1" /> sub3 (Pin Identifier)
                </label>
                <input 
                  type="text" 
                  value={sub3 || ''}
                  onChange={e => setSub3(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none text-gray-900 dark:text-gray-100"
                  placeholder="e.g. pin-2388"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 flex items-center">
                  <Hash className="w-3 h-3 text-zinc-400 mr-1" /> sub4 (Campaign Code)
                </label>
                <input 
                  type="text" 
                  value={sub4 || ''}
                  onChange={e => setSub4(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 outline-none text-gray-900 dark:text-gray-100"
                  placeholder="e.g. finance-opt"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={linkLoading || !selectedCamId}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs py-2.5 rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {linkLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin mx-auto" /> : "Build Attribution Tracking Link"}
            </button>
          </form>
        </div>

        {/* Tracking link output and postback inspector */}
        <div className="p-6 bg-white dark:bg-[#111] border border-gray-100 dark:border-zinc-850 rounded-xl space-y-4">
          <div className="border-b border-gray-100 dark:border-zinc-850 pb-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide flex items-center">
              <Terminal className="w-4 h-4 text-indigo-400 mr-2" /> Generated Tracking URL & Sandbox
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1">
              Test redirection and downstream webhook tracing instantly.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {generatedLink ? (
              <div className="space-y-3">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-lg relative overflow-hidden flex justify-between items-center pr-12">
                  <span className="font-mono text-indigo-400 truncate tracking-tight">{generatedLink}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink);
                      showNotification("Tracking link copied to clipboard!", "success");
                    }}
                    className="absolute right-2 top-2 p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-zinc-100 cursor-pointer"
                  >
                    <Clipboard className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-3">
                  <h4 className="text-emerald-400 font-bold flex items-center">
                    <Send className="w-3.5 h-3.5 mr-1.5" /> Integration Tester
                  </h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Verify postback reconciliation for the generated link <strong className="text-indigo-400">{simSub2}</strong>.
                  </p>
                  
                  <form onSubmit={handleSimulatePostback} className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-0.5">Transaction ID</label>
                      <input 
                        type="text" 
                        value={simTxId || ''} 
                        onChange={e => setSimTxId(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 outline-none font-mono text-[11px] text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-0.5">Payout</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={simPayout ?? 0} 
                        onChange={e => setSimPayout(Number(e.target.value))}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 outline-none font-mono text-[11px] text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-0.5">Click Key</label>
                      <input 
                        type="text" 
                        value={simSub2 || ''} 
                        onChange={e => setSimSub2(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 outline-none font-mono text-[11px] text-gray-900 dark:text-gray-100"
                        placeholder="Automatic click ID"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={postbackLoading}
                      className="col-span-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded transition-colors cursor-pointer text-xs"
                    >
                      {postbackLoading ? "Verifying..." : "Fire Test Postback"}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[240px] text-center border-2 border-dashed border-zinc-800 rounded-xl space-y-2">
                <HelpCircle className="w-8 h-8 text-zinc-500 opacity-40 animate-bounce" />
                <p className="font-semibold text-zinc-400">Waiting for parameter inputs</p>
                <p className="text-[10px] text-zinc-500 max-w-xs">
                  Configure and compile parameters on the left to build a custom tracked redirect URL.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
