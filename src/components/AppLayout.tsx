import { Link, Outlet, useLocation } from "react-router-dom";
import { Plus, LogOut, Lock, Search, Bell } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui";
import { logout } from "../lib/auth";
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
  CreatorNetworkIcon
} from "./CustomIcons";

export function AppLayout() {
  const location = useLocation();

  const activeNavItems = [
    { label: "Dashboard", href: "/", icon: DashboardIcon },
    { label: "Campaign Builder", href: "/new", icon: CampaignIcon },
    { label: "Agents", href: "/agents", icon: AgentsIcon },
    { label: "Articles", href: "/articles", icon: ArticlesIcon },
    { label: "Affiliate Offers", href: "/offers", icon: OffersIcon },
    { label: "Pinterest", href: "/pins", icon: PinterestIcon },
    { label: "Publishing", href: "/publishing", icon: PublishingIcon },
    { label: "Analytics", href: "/analytics", icon: AnalyticsIcon },
    { label: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  const phase2NavItems = [
    { label: "Affiliate Match", href: "/affiliate-match", icon: AffiliateMatchIcon },
    { label: "Traffic Engine", href: "/traffic-engine", icon: TrafficEngineIcon },
    { label: "Creator Network", href: "/creator-network", icon: CreatorNetworkIcon },
  ];

  return (
    <div className="min-h-screen bg-[#111216] text-zinc-200 flex font-sans selection:bg-[#d7f941]/30">
      {/* Sidebar */}
      <div className="w-[280px] flex-shrink-0 p-5 hidden md:flex flex-col">
        <div className="bg-[#1C1D21] rounded-[32px] flex-1 flex flex-col overflow-hidden shadow-2xl border border-white/5 pb-4">
          <div className="h-24 flex items-center px-8">
            <span className="font-semibold text-2xl tracking-tight text-white flex items-center">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-2xl mr-3 object-cover shadow-lg shadow-black/50" />
              AffiliateOS
            </span>
          </div>
          <nav className="flex-1 px-5 py-4 space-y-8 overflow-y-auto">
            <div>
                <div className="text-[11px] uppercase tracking-widest text-[#6B6E7B] font-bold mb-4 px-4">Factory</div>
                <div className="space-y-1.5">
                {activeNavItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300",
                        isActive
                          ? "bg-white/10 text-white shadow-sm"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <item.icon className={cn("flex-shrink-0 mr-4 h-5 w-5 transition-colors", isActive ? "text-[#d7f941]" : "text-[#6B6E7B]")} />
                      {item.label}
                    </Link>
                  );
                })}
                </div>
            </div>

            <div>
                <div className="text-[11px] uppercase tracking-widest text-[#d7f941]/80 font-bold mb-4 px-4">Distribution</div>
                <div className="space-y-1.5">
                {phase2NavItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300",
                        isActive
                          ? "bg-white/10 text-white shadow-sm"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <item.icon className={cn("flex-shrink-0 mr-4 h-5 w-5 transition-colors", isActive ? "text-[#d7f941]" : "text-[#6B6E7B]")} />
                      {item.label}
                    </Link>
                  );
                })}
                </div>
            </div>
          </nav>
          <div className="px-5 mt-auto">
              <Button variant="ghost" className="w-full justify-start text-[#FF5A5F] hover:text-[#FF5A5F] hover:bg-red-500/10 text-sm py-6 rounded-2xl" onClick={logout}>
                  <LogOut className="mr-4 h-5 w-5" /> Sign Out
              </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-[#1C1D21] border-b border-white/5 flex items-center justify-between px-6 md:hidden">
          <span className="font-bold text-xl text-white flex items-center">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-xl mr-2 object-cover" />
            AffiliateOS
          </span>
          <Button asChild size="sm" className="rounded-full bg-[#d7f941] text-black hover:bg-[#c9eb38]">
             <Link to="/new">New Campaign</Link>
          </Button>
        </header>
        <div className="h-24 hidden md:flex items-center justify-between px-10">
           {/* Top floating header area for search/profile */}
           <div className="flex-1"></div>
           <div className="flex items-center space-x-6">
              <div className="h-12 w-64 bg-[#1C1D21] rounded-full border border-white/5 flex items-center px-4 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
                 <Search className="w-4 h-4 text-zinc-500 mr-2" />
                 <span className="text-zinc-500 text-sm">Search anything...</span>
              </div>
              <button className="h-12 w-12 rounded-full border border-white/5 bg-[#1C1D21] flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <Button asChild className="h-12 px-6 rounded-full bg-white text-black hover:bg-zinc-200">
                 <Link to="/new">Create</Link>
              </Button>
           </div>
        </div>
        <main className="flex-1 overflow-y-auto px-6 pb-6 md:px-10 md:pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
