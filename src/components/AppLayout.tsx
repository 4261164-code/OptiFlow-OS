import { Link, Outlet, useLocation } from "react-router-dom";
import { 
  Search, Bell, Activity, Shield, Settings, Database, 
  BarChart3, Globe, Compass, Zap, Cpu, AlertTriangle, 
  Wallet, FileText, ChevronDown, CheckCircle2, User, LayoutDashboard, BrainCircuit, Users
} from "lucide-react";
import { cn } from "../lib/utils";
import { logout } from "../lib/auth";
import { useNotifications } from "./NotificationContext";
import { useState } from 'react';

export function AppLayout() {
  const location = useLocation();
  const { unreadCount, setIsOpen } = useNotifications();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const sidebarItems = [
    { label: "Overview", href: "/", icon: LayoutDashboard },
    { label: "Revenue Intelligence", href: "/executive", icon: BarChart3 },
    { label: "Traffic Intelligence", href: "/traffic-engine", icon: Globe },
    { label: "Affiliate Command", href: "/affiliate-match", icon: Compass },
    { label: "Campaign Control", href: "/new", icon: Zap },
    { label: "Offer Intelligence", href: "/offers", icon: Database },
    { label: "AI Operations", href: "/agents", icon: Cpu },
    { label: "Automation Center", href: "/automation", icon: BrainCircuit },
    { label: "System Diagnostics", href: "/analytics", icon: Activity },
    { label: "Risk & Compliance", href: "/risk", icon: Shield },
    { label: "Financial Center", href: "/finance", icon: Wallet },
    { label: "Audit Ledger", href: "/audit", icon: FileText },
    { label: "Knowledge Vault", href: "/articles", icon: Users },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen font-sans selection:bg-white/10" style={{ backgroundColor: "#06070A", color: "#E2E8F0" }}>
      <div className="flex h-screen overflow-hidden">
        
        {/* LEFT EXECUTIVE SIDEBAR */}
        <div 
          className={cn(
            "flex-shrink-0 flex flex-col border-r border-white/5 transition-all duration-300 relative z-20",
            isSidebarCollapsed ? "w-[72px]" : "w-[280px]"
          )}
          style={{ backgroundColor: "#0D1117" }}
        >
          {/* Logo Area */}
          <div className="h-16 flex items-center px-5 border-b border-white/5">
            <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center border border-white/10 shadow-sm" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
              <div className="w-3 h-3 bg-white rounded-sm drop-shadow-md" />
            </div>
            {!isSidebarCollapsed && (
              <span className="ml-3 font-semibold text-sm tracking-tight text-zinc-100 uppercase letter-spacing-[0.05em]">
                System OS
              </span>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 py-4 overflow-y-auto scrollbar-none">
            <div className="px-3 space-y-[2px]">
              {sidebarItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 group relative",
                      isActive
                        ? "text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-white/5"
                        : "text-zinc-400 hover:text-zinc-100 border border-transparent"
                    )}
                    style={{ backgroundColor: isActive ? "#111827" : "transparent" }}
                  >
                    <item.icon className={cn(
                      "flex-shrink-0 h-4 w-4 transition-colors", 
                      isActive ? "text-zinc-100" : "text-zinc-500 group-hover:text-zinc-300"
                    )} strokeWidth={isActive ? 2 : 1.5} />
                    
                    {!isSidebarCollapsed && (
                      <span className="ml-3">{item.label}</span>
                    )}
                    
                    {isActive && !isSidebarCollapsed && (
                      <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-zinc-300" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Bottom Section */}
          <div className="mt-auto border-t border-white/5 p-4 space-y-3">
            {!isSidebarCollapsed && (
              <>
                <div className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-6 h-6 rounded bg-zinc-800 border border-white/10 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-white leading-none">Executive User</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">Global Admin</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                </div>
                
                <div className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-white leading-none">Production Env</span>
                    <span className="text-[10px] text-emerald-500 mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> System Healthy
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                </div>
              </>
            )}
            
            <button onClick={logout} className="w-full flex items-center justify-center px-3 py-2 text-[11px] font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
              {isSidebarCollapsed ? <User className="w-4 h-4" /> : "Sign Out"}
            </button>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: "#06070A" }}>
          
          {/* TOP COMMAND BAR */}
          <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0 relative z-10" style={{ backgroundColor: "rgba(13, 17, 23, 0.7)", backdropFilter: "blur(12px)" }}>
            
            <div className="flex flex-1 items-center space-x-4">
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-white/5 text-zinc-400 transition-colors"
              >
                <div className="space-y-1">
                  <div className="w-4 h-[1.5px] bg-current rounded-full" />
                  <div className="w-4 h-[1.5px] bg-current rounded-full" />
                  <div className="w-3 h-[1.5px] bg-current rounded-full" />
                </div>
              </button>

              <div className="hidden md:flex relative group w-96">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-zinc-500" />
                 </div>
                 <input 
                   type="text" 
                   placeholder="Global command palette (Press ⌘K)..." 
                   className="w-full pl-9 pr-4 py-1.5 rounded-md text-[13px] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors shadow-sm focus:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
                   style={{ backgroundColor: "#111827" }}
                 />
              </div>
            </div>

            <div className="flex items-center space-x-5 shrink-0">
               {/* Quick Actions / System Status */}
               <div className="hidden lg:flex items-center space-x-4 pr-4 border-r border-white/10 text-[11px] font-medium text-zinc-400">
                  <div className="flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <span>API: 12ms</span>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors">
                    <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                    <span>AI: Active</span>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors">
                    <BarChart3 className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Pulse: +4.2%</span>
                  </div>
               </div>

               <button 
                 onClick={() => setIsOpen(true)}
                 className="relative w-8 h-8 rounded flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
               >
                 <Bell className="w-4 h-4" />
                 {unreadCount > 0 && (
                   <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
                 )}
               </button>

               <div className="w-7 h-7 rounded bg-zinc-800 border border-white/10 flex items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors shadow-sm">
                 <span className="text-[10px] font-bold text-white">EX</span>
               </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto w-full relative">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}


