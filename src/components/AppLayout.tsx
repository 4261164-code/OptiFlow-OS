import { Link, Outlet, useLocation } from "react-router-dom";
import { Plus, LogOut, Lock, Search, Bell, Network, Brain, Zap, Briefcase } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui";
import { logout } from "../lib/auth";
import { useNotifications } from "./NotificationContext";
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

  const activeNavItems = [
    { label: "Dashboard", href: "/", icon: DashboardIcon },
    { label: "Campaign Builder", href: "/new", icon: CampaignIcon },
    { label: "Keyword Explorer", href: "/keywords", icon: Search },
    { label: "SEO Clusters", href: "/clusters", icon: Network },
    { label: "Autopilot Console", href: "/automation", icon: Zap },
    { label: "Agents", href: "/agents", icon: AgentsIcon },
    { label: "Intel Digest", href: "/intel-digest", icon: Brain },
    { label: "Articles", href: "/articles", icon: ArticlesIcon },
    { label: "Affiliate Offers", href: "/offers", icon: OffersIcon },
    { label: "Pinterest", href: "/pins", icon: PinterestIcon },
    { label: "Publishing", href: "/publishing", icon: PublishingIcon },
    { label: "Analytics", href: "/analytics", icon: AnalyticsIcon },
    { label: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  const phase2NavItems = [
    { label: "Executive Dashboard", href: "/executive", icon: Briefcase },
    { label: "Affiliate Match", href: "/affiliate-match", icon: AffiliateMatchIcon },
    { label: "Traffic Engine", href: "/traffic-engine", icon: TrafficEngineIcon },
    { label: "Creator Network", href: "/creator-network", icon: CreatorNetworkIcon },
  ];

  return (
    <div className="min-h-screen bg-[#06070a] text-zinc-200 flex font-sans selection:bg-[#a8ff35]/30">
      {/* Sidebar */}
      <div className="w-[280px] flex-shrink-0 p-5 hidden md:flex flex-col">
        <div className="bg-[#090a0d] rounded-[32px] flex-1 flex flex-col overflow-hidden shadow-2xl border border-white/5 pb-4">
          <div className="h-24 flex items-center px-8">
            <span className="font-semibold text-2xl tracking-tight text-white flex items-center">
              <div className="w-10 h-10 bg-[#a8ff35]/10 flex items-center justify-center rounded-xl mr-3 border border-[#a8ff35]/20 shadow-[0_0_15px_rgba(168,255,53,0.1)]">
                <BrandingHexIcon className="w-6 h-6 text-[#a8ff35]" />
              </div>
              AffiliateOS
            </span>
          </div>
          <nav className="flex-1 px-5 py-3 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            <div>
                <div className="text-[10px] uppercase tracking-widest text-[#6B6E7B] font-bold mb-3 px-4">Factory</div>
                <div className="space-y-1">
                {activeNavItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-350 relative",
                        isActive
                          ? "bg-[#a8ff35]/8 text-white shadow-sm border-l-2 border-[#a8ff35] pl-3.5"
                          : "text-zinc-400 hover:bg-white/3 hover:text-white"
                      )}
                    >
                      <item.icon className={cn("flex-shrink-0 mr-3.5 h-5.5 w-5.5 transition-colors", isActive ? "text-[#a8ff35]" : "text-[#6B6E7B]")} strokeWidth={1.8} />
                      {item.label}
                    </Link>
                  );
                })}
                </div>
            </div>

            <div>
                <div className="text-[10px] uppercase tracking-widest text-[#a8ff35]/85 font-bold mb-3 px-4">Distribution</div>
                <div className="space-y-1">
                {phase2NavItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-350 relative",
                        isActive
                          ? "bg-[#a8ff35]/8 text-white shadow-sm border-l-2 border-[#a8ff35] pl-3.5"
                          : "text-zinc-400 hover:bg-white/3 hover:text-white"
                      )}
                    >
                      <item.icon className={cn("flex-shrink-0 mr-3.5 h-5.5 w-5.5 transition-colors", isActive ? "text-[#a8ff35]" : "text-[#6B6E7B]")} strokeWidth={1.8} />
                      {item.label}
                    </Link>
                  );
                })}
                </div>
            </div>
          </nav>
          <div className="px-5 mt-auto">
              <Button variant="ghost" className="w-full justify-start text-[#FF5A5F] hover:text-[#FF5A5F] hover:bg-red-500/10 text-xs py-5 rounded-2xl" onClick={logout}>
                  <LogOut className="mr-3.5 h-5.5 w-5.5 stroke-[1.8]" /> Sign Out
              </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
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
        <div className="h-20 hidden md:flex items-center justify-between px-10">
           {/* Top floating header area for search/profile */}
           <div className="flex-1"></div>
           <div className="flex items-center space-x-5">
              <div className="h-10 w-60 bg-[#090a0d] rounded-full border border-white/5 flex items-center px-4 shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
                 <Search className="w-3.5 h-3.5 text-zinc-500 mr-2" />
                 <span className="text-zinc-500 text-xs">Search anything...</span>
              </div>
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
                 <Link to="/new">Create</Link>
              </Button>
           </div>
        </div>
        <main className="flex-1 overflow-y-auto px-6 pb-6 md:px-10 md:pb-10 bg-gradient-to-b from-[#06070a] via-[#08090d]/60 to-[#040507] relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
