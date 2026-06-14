import { Link, Outlet, useLocation } from "react-router-dom";
import { Plus, LogOut, Lock, Search, Bell, Network, Brain, Activity, Shield, Book, MessageSquare, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui";
import { logout } from "../lib/auth";
import { useNotifications } from "./NotificationContext";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CEOChat } from './executive/CEOChat';
import { LiveTicker } from './LiveTicker';
import { Logo } from "./Logo";
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openedCategories, setOpenedCategories] = useState<Record<string, boolean>>({
    command: true,
    intelligence: true,
    content: true,
    distribution: true,
    system: false,
  });

  useEffect(() => {
    document.title = "AffiliateOS | Campaign Factory";
  }, []);

  const navigationCategories = [
    {
      id: "command",
      label: "Command & Control",
      items: [
        { label: "Dashboard", href: "/", icon: DashboardIcon },
        { label: "CEO Command Center", href: "/executive", icon: Shield },
        { label: "Strategy Hub", href: "/strategy", icon: TrendingUp },
        { label: "Autopilot Console", href: "/automation", icon: Activity },
        { label: "Agents Control", href: "/agents", icon: AgentsIcon },
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
    <div className="min-h-screen bg-[#05070A] text-zinc-200 flex font-sans selection:bg-blue-500/30">
      {/* Sidebar - Glossy Neo Premium Collapsible Design */}
      <div className={cn(
        "flex-shrink-0 hidden md:flex flex-col z-20 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-[100px] p-4" : "w-[290px] p-5"
      )}>
        <div className="relative bg-[#0B1017] rounded-[24px] flex-1 flex flex-col overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.06),0_0_40px_rgba(168,255,53,0.02)] border border-white/5 pb-4">
          
          {/* Header Area */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-white/5 relative bg-zinc-950/20">
            {!isSidebarCollapsed && <Logo />}
            
            {isSidebarCollapsed && (
              <div className="mx-auto">
                <Logo size="sm" />
              </div>
            )}

            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-8 bg-[#161B22] border border-white/10 rounded-l-md flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-md hover:bg-zinc-800"
            >
              {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto scrollbar-none">
             {navigationCategories.map((cat) => {
               const isOpen = openedCategories[cat.id];
               return (
                 <div key={cat.id} className="space-y-1">
                   {!isSidebarCollapsed && (
                     <button 
                       onClick={() => toggleCategory(cat.id)} 
                       className="flex items-center justify-between w-full px-3 py-1.5 text-[9px] uppercase tracking-widest text-zinc-500 font-bold hover:text-zinc-200 transition-colors group cursor-pointer"
                     >
                       <span className="group-hover:tracking-wider transition-all duration-300">{cat.label}</span>
                       {isOpen ? (
                         <ChevronUp className="w-3 h-3 text-zinc-500 group-hover:text-white transition-transform" />
                       ) : (
                         <ChevronDown className="w-3 h-3 text-zinc-500 group-hover:text-white transition-transform" />
                       )}
                     </button>
                   )}
                   
                   <AnimatePresence initial={false}>
                     {(isOpen || isSidebarCollapsed) && (
                       <motion.div
                         initial={isSidebarCollapsed ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                         animate={{ height: "auto", opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         transition={{ duration: 0.2, ease: "easeInOut" }}
                         className="overflow-hidden space-y-1"
                       >
                         {cat.items.map((item) => {
                           const isActive = location.pathname === item.href;
                           return (
                             <Link
                               key={item.href}
                               to={item.href}
                               title={isSidebarCollapsed ? item.label : undefined}
                               className={cn(
                                 "flex items-center rounded-xl text-xs font-semibold transition-all duration-200 relative group cursor-pointer",
                                 isSidebarCollapsed ? "justify-center p-3" : "px-4 py-2 hover:translate-x-1",
                                 isActive
                                   ? "bg-primary/10 text-white border border-primary/20"
                                   : "text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent"
                               )}
                             >
                               <item.icon className={cn(
                                 "flex-shrink-0 h-4 w-4 transition-all duration-200", 
                                 isActive 
                                   ? "text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] scale-110" 
                                   : "text-zinc-500 group-hover:text-zinc-200",
                                 !isSidebarCollapsed && "mr-3"
                               )} strokeWidth={2} />
                               {!isSidebarCollapsed && <span className="transition-all duration-200">{item.label}</span>}
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

          <div className="px-4 mt-auto pt-3 border-t border-white/5">
              <Button 
                variant="ghost" 
                className={cn(
                  "w-full text-zinc-400 hover:text-red-400 hover:bg-red-500/5 text-xs py-3 rounded-xl transition-all",
                  isSidebarCollapsed ? "justify-center px-0" : "justify-start px-4"
                )} 
                onClick={logout}
              >
                <LogOut className={cn("h-4 w-4 stroke-[2]", !isSidebarCollapsed && "mr-3")} /> 
                {!isSidebarCollapsed && "Sign Out"}
              </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <LiveTicker />
        <header className="h-16 bg-[#0B1017] border-b border-white/5 flex items-center justify-between px-6 md:hidden">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsOpen(true)}
               className="h-9 w-9 rounded-full border border-white/5 bg-[#161B22] flex items-center justify-center text-zinc-400 hover:text-white relative transition cursor-pointer"
             >
               <Bell className="w-4 h-4" />
               {unreadCount > 0 && (
                 <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] font-extrabold h-4.5 w-4.5 rounded-full flex items-center justify-center border border-[#0B1017] shadow-[0_0_6px_#3b82f6]">
                   {unreadCount}
                 </span>
               )}
             </button>
             <Button asChild size="sm" className="rounded-full bg-blue-600 text-white font-bold hover:bg-blue-500">
                <Link to="/new">New Campaign</Link>
             </Button>
          </div>
        </header>
        <div className="h-20 hidden md:flex items-center justify-between px-10 relative z-40 bg-zinc-950/20 border-b border-white/5">
           {/* Top floating header area for search/profile */}
           <div className="flex-1"></div>
           <div className="flex items-center space-x-5">
              <div className="h-10 w-64 bg-[#0B1017] rounded-full border border-white/5 flex items-center px-4 shadow-[0_4px_24px_rgba(0,0,0,0.15)]">
                 <Search className="w-3.5 h-3.5 text-zinc-500 mr-2.5" />
                 <span className="text-zinc-500 text-xs font-mono">Enterprise intelligence query...</span>
              </div>
              <button 
                onClick={() => setIsAIChatOpen(true)}
                className="h-10 w-10 rounded-full border border-white/5 bg-[#0B1017] flex items-center justify-center text-blue-500 hover:bg-blue-500/10 transition-all relative cursor-pointer shadow-lg"
              >
                <Brain className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
              </button>
              <button 
                onClick={() => setIsOpen(true)}
                className="h-10 w-10 rounded-full border border-white/5 bg-[#090a0d] flex items-center justify-center text-zinc-400 hover:text-white transition-colors relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[9px] font-extrabold h-5 w-5 rounded-full flex items-center justify-center border border-[#0B1017] shadow-[0_0_8px_#3b82f6]">
                    {unreadCount}
                  </span>
                )}
              </button>
              <Button asChild className="h-10 px-5 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-500 text-xs shadow-md">
                 <Link to="/new">Provision</Link>
              </Button>
           </div>
        </div>
        <main className="flex-1 overflow-y-auto px-6 pb-6 md:px-10 md:pb-10 bg-gradient-to-b from-[#05070A] via-[#0B1017] to-[#05070A] relative">
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
              className="fixed top-0 right-0 h-screen w-full max-w-xl bg-[#0B1017] border-l border-white/5 z-[101] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
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

