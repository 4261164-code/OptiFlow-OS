import { Link, Outlet, useLocation } from "react-router-dom";
import { Plus, LogOut, Lock, Search, Bell, Network, Brain, Activity, Shield, Book, MessageSquare, X, ChevronUp, ChevronDown, Coins, Wallet, CreditCard, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui";
import { logout } from "../lib/auth";
import { useNotifications } from "./NotificationContext";
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CEOChat } from './executive/CEOChat';
import { LiveTicker } from './LiveTicker';
import {
  DashboardIcon,
  CampaignIcon,
  AgentsIcon,
  ArticlesIcon,
  OffersIcon,
  PinterestIcon,
  PublishingIcon,
  AnalyticsIcon,
  SettingsIcon,
  AffiliateMatchIcon,
  TrafficEngineIcon,
  CreatorNetworkIcon,
  BrandingHexIcon
} from "./CustomIcons";

export function AppLayout() {
  const location = useLocation();
  const { unreadCount, setIsOpen } = useNotifications();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [openedCategories, setOpenedCategories] = useState<Record<string, boolean>>({
    command: true,
    earn: true,
    intelligence: true,
    content: true,
    distribution: true,
    system: false,
  });

  const navigationCategories = [
    {
      id: "command",
      label: "Command & Control",
      items: [
        { label: "Dashboard", href: "/", icon: DashboardIcon },
        { label: "CEO Command Center", href: "/executive", icon: Shield },
        { label: "Autopilot Console", href: "/automation", icon: Activity },
        { label: "Agents Control", href: "/agents", icon: AgentsIcon },
      ]
    },
    {
      id: "earn",
      label: "EarnPulse Rewards",
      items: [
        { label: "Earn Rewards", href: "/earn", icon: Coins },
        { label: "My Wallet", href: "/wallet", icon: Wallet },
        { label: "Withdraw", href: "/withdraw", icon: CreditCard },
        { label: "Admin Rewards", href: "/admin/rewards", icon: Sparkles },
      ]
    },
    {
      id: "intelligence",
      label: "Research & Intel",
      items: [
        { label: "Intel Digest", href: "/intel-digest", icon: Brain },
        { label: "Keyword Explorer", href: "/keywords", icon: Search },
        { label: "SEO Clusters", href: "/clusters", icon: Network },
      ]
    },
    {
      id: "content",
      label: "Content Studio",
      items: [
        { label: "Campaign Builder", href: "/new", icon: CampaignIcon },
        { label: "Articles Generator", href: "/articles", icon: ArticlesIcon },
        { label: "EBook Creator", href: "/ebooks", icon: Book },
      ]
    },
    {
      id: "distribution",
      label: "Distribution & Growth",
      items: [
        { label: "Pinterest Engine", href: "/pins", icon: PinterestIcon },
        { label: "Publishing Hub", href: "/publishing", icon: PublishingIcon },
        { label: "Offers & Monetization", href: "/offers", icon: OffersIcon },
        { label: "Affiliate Match", href: "/affiliate-match", icon: AffiliateMatchIcon },
        { label: "Traffic Generator", href: "/traffic-engine", icon: TrafficEngineIcon },
        { label: "Creator Network", href: "/creator-network", icon: CreatorNetworkIcon },
      ]
    },
    {
      id: "system",
      label: "Analytics & Settings",
      items: [
        { label: "Performance Analytics", href: "/analytics", icon: AnalyticsIcon },
        { label: "Settings", href: "/settings", icon: SettingsIcon },
      ]
    }
  ];

  const toggleCategory = (id: string) => {
    setOpenedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#06070a] text-zinc-200 flex font-sans selection:bg-[#a8ff35]/30">
      {/* Sidebar - Glossy Neo Premium Design */}
      <div className="w-[280px] flex-shrink-0 p-5 hidden md:flex flex-col z-20">
        <div className="relative bg-[#0d0e12]/60 backdrop-blur-3xl rounded-[32px] flex-1 flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),0_0_40px_rgba(168,255,53,0.02)] border border-white/10 pb-4 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none">
          <div className="h-24 flex items-center px-8 relative border-b border-white/5">
            <span className="font-semibold text-xl tracking-tight text-white flex items-center">
              <div className="w-9 h-9 bg-gradient-to-br from-[#a8ff35] to-[#7dbf25] flex items-center justify-center rounded-2xl mr-3 shadow-[0_0_20px_rgba(168,255,53,0.3)]">
                <BrandingHexIcon className="w-5 h-5 text-black" />
              </div>
              AffiliateOS
            </span>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto scrollbar-none">
             {navigationCategories.map((cat) => {
               const isOpen = openedCategories[cat.id];
               return (
                 <div key={cat.id} className="space-y-1.5">
                   <button 
                     onClick={() => toggleCategory(cat.id)} 
                     className="flex items-center justify-between w-full px-4 py-2 text-[10px] uppercase tracking-widest text-[#6B6E7B] font-bold hover:text-zinc-200 transition-colors group cursor-pointer"
                   >
                     <span className="group-hover:tracking-wider transition-all duration-300">{cat.label}</span>
                     {isOpen ? (
                       <ChevronUp className="w-3 h-3 text-[#6B6E7B] group-hover:text-white transition-transform" />
                     ) : (
                       <ChevronDown className="w-3 h-3 text-[#6B6E7B] group-hover:text-white transition-transform" />
                     )}
                   </button>
                   
                   <AnimatePresence initial={false}>
                     {isOpen && (
                       <motion.div
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: "auto", opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         transition={{ duration: 0.2, ease: "easeInOut" }}
                         className="overflow-hidden space-y-1 pl-1"
                       >
                         {cat.items.map((item) => {
                           const isActive = location.pathname === item.href;
                           return (
                             <Link
                               key={item.href}
                               to={item.href}
                               className={cn(
                                 "flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 relative group cursor-pointer hover:translate-x-1.5",
                                 isActive
                                   ? "bg-white/8 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.2)] backdrop-blur-md border border-white/5"
                                   : "text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent"
                               )}
                             >
                               <div className={cn(
                                 "absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full transition-all duration-500", 
                                 isActive 
                                   ? "bg-[#a8ff35] shadow-[0_0_10px_#a8ff35]" 
                                   : "bg-transparent scale-y-0 group-hover:scale-y-100 group-hover:bg-[#a8ff35]/40"
                               )} />
                               <item.icon className={cn(
                                 "flex-shrink-0 mr-3 h-4.5 w-4.5 transition-all duration-300", 
                                 isActive 
                                   ? "text-[#a8ff35] drop-shadow-[0_0_6px_rgba(168,255,53,0.4)] scale-110" 
                                   : "text-[#6B6E7B] group-hover:text-zinc-200"
                               )} strokeWidth={1.8} />
                               <span className="transition-all duration-300">{item.label}</span>
                             </Link>
                           );
                         })}
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
               );
             })}
          </nav>
          <div className="px-5 mt-auto pt-4 border-t border-white/5">
              <Button variant="ghost" className="w-full justify-start text-zinc-400 hover:text-[#FF5A5F] hover:bg-red-500/10 text-xs py-5 rounded-2xl transition-all" onClick={logout}>
                  <LogOut className="mr-3.5 h-4.5 w-4.5 stroke-[1.8]" /> Sign Out
              </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <LiveTicker />
        <header className="h-16 bg-[#090a0d] border-b border-white/5 flex items-center justify-between px-6 md:hidden">
          <span className="font-bold text-xl text-white flex items-center">
            <div className="w-8 h-8 bg-[#a8ff35]/10 flex items-center justify-center rounded-lg mr-2 border border-[#a8ff35]/20 shadow-[0_0_10px_rgba(168,255,53,0.1)]">
              <BrandingHexIcon className="w-5 h-5 text-[#a8ff35]" />
            </div>
            AffiliateOS
          </span>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsOpen(true)}
               className="h-9 w-9 rounded-full border border-white/5 bg-[#0d0e12] flex items-center justify-center text-zinc-400 hover:text-white relative transition cursor-pointer"
             >
               <Bell className="w-4 h-4" />
               {unreadCount > 0 && (
                 <span className="absolute -top-1 -right-1 bg-[#a8ff35] text-black text-[8px] font-extrabold h-4.5 w-4.5 rounded-full flex items-center justify-center border border-[#0d0e12] shadow-[0_0_6px_#a8ff35]">
                   {unreadCount}
                 </span>
               )}
             </button>
             <Button asChild size="sm" className="rounded-full bg-[#a8ff35] text-black font-bold hover:bg-[#92ec1d]">
                <Link to="/new">New Campaign</Link>
             </Button>
          </div>
        </header>
        <div className="h-20 hidden md:flex items-center justify-between px-10 relative z-40">
           {/* Top floating header area for search/profile */}
           <div className="flex-1"></div>
           <div className="flex items-center space-x-5">
              <div className="h-10 w-60 bg-[#090a0d] rounded-full border border-white/5 flex items-center px-4 shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
                 <Search className="w-3.5 h-3.5 text-zinc-500 mr-2" />
                 <span className="text-zinc-500 text-xs text-zinc-600">Enterprise intelligence engine...</span>
              </div>
              <button 
                onClick={() => setIsAIChatOpen(true)}
                className="h-10 w-10 rounded-full border border-white/5 bg-[#090a0d] flex items-center justify-center text-[#a8ff35] hover:bg-[#a8ff35]/10 transition-all relative cursor-pointer shadow-lg"
              >
                <Brain className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              </button>
              <button 
                onClick={() => setIsOpen(true)}
                className="h-10 w-10 rounded-full border border-white/5 bg-[#090a0d] flex items-center justify-center text-zinc-400 hover:text-white transition-colors relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#a8ff35] text-black text-[9px] font-extrabold h-5 w-5 rounded-full flex items-center justify-center border border-[#090a0d] shadow-[0_0_8px_#a8ff35]">
                    {unreadCount}
                  </span>
                )}
              </button>
              <Button asChild className="h-10 px-5 rounded-full bg-[#a8ff35] text-black font-bold hover:bg-[#92ec1d] text-xs shadow-md">
                 <Link to="/new">Provision</Link>
              </Button>
           </div>
        </div>
        <main className="flex-1 overflow-y-auto px-6 pb-6 md:px-10 md:pb-10 bg-gradient-to-b from-[#06070a] via-[#08090d]/60 to-[#040507] relative">
          <Outlet />
        </main>
      </div>

      {/* Global AI Chat Drawer */}
      <AnimatePresence>
        {isAIChatOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAIChatOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full max-w-xl bg-[#09090b] border-l border-white/5 z-[101] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#a8ff35] rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-[0.1em]">AI Command Bridge</h2>
                    <p className="text-[10px] text-zinc-500 font-mono">Secure Executive Session</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAIChatOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <CEOChat />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

