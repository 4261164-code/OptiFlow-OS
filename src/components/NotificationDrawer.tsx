import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  X, 
  Trash2, 
  CheckCheck, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  Info, 
  Bell, 
  Sparkles, 
  Zap, 
  ExternalLink,
  Target
} from 'lucide-react';
import { useNotifications } from './NotificationContext';
import { AppNotification, NotificationType } from '../types';
import { Button } from './ui';

export const NotificationDrawer: React.FC = () => {
  const { 
    notifications, 
    isOpen, 
    setIsOpen, 
    markAsRead, 
    deleteNotification, 
    clearAll, 
    markAllRead,
    addNotification 
  } = useNotifications();

  // Active category filter
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');

  if (!isOpen) return null;

  // Filter list
  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'milestone':
        return (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 shadow-[0_4px_12px_rgba(16,185,129,0.1)]">
            <Award className="w-5 h-5 animate-pulse" />
          </div>
        );
      case 'traffic':
        return (
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/10 shadow-[0_4px_12px_rgba(245,158,11,0.1)]">
            <TrendingUp className="w-5 h-5" />
          </div>
        );
      case 'error':
        return (
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/10 shadow-[0_4px_12px_rgba(244,63,94,0.1)]">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
        );
      default:
        return (
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/10 shadow-[0_4px_12px_rgba(59,130,246,0.1)]">
            <Info className="w-5 h-5" />
          </div>
        );
    }
  };


  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-[#040507]/80 backdrop-blur-sm transition-opacity" 
      />

      {/* Slideout Container */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 24, stiffness: 220 }}
        className="relative w-full max-w-lg bg-[#0d0e12] border-l border-white/5 shadow-2xl flex flex-col h-full focus:outline-none"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#a8ff35]/20 to-[#92ec1d]/20 flex items-center justify-center text-[#a8ff35] border border-[#a8ff35]/30">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Active Operations Drawer</h2>
              <p className="text-zinc-500 text-xs">Real-time pipeline monitoring</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 px-1.5 h-8 w-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls & Filter Header */}
        <div className="px-6 py-4 bg-[#0a0b0e] border-b border-white/5 flex flex-col gap-3.5">
          {/* Quick Filter Row */}
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'milestone', 'traffic', 'error'] as const).map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer capitalize ${
                  activeFilter === f
                    ? 'bg-[#a8ff35] text-black font-semibold'
                    : 'bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10'
                }`}
              >
                {f === 'all' ? 'Show All' : f + 's'}
              </button>
            ))}
          </div>

          {/* Quick Actions (Mark Read & Clear) */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between text-xs">
              <button 
                onClick={markAllRead} 
                className="flex items-center gap-1.5 text-zinc-400 hover:text-[#a8ff35] transition cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
              <button 
                onClick={clearAll} 
                className="flex items-center gap-1.5 text-rose-400/90 hover:text-rose-400 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear database list
              </button>
            </div>
          )}
        </div>

        {/* Notifications Scroll Area */}
        <div className="flex-1 overflow-y-auto self-stretch px-6 py-4 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <AnimatePresence initial={false}>
            {filteredNotifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-72 flex flex-col items-center justify-center text-center p-6 bg-[#0a0b0e] rounded-2xl border border-white/5 mt-4"
              >
                <div className="w-12 h-12 bg-white/5 border border-white/5 flex items-center justify-center rounded-2xl mb-4 text-zinc-500">
                  <Bell className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white">Stream is Quiet</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
                  No notifications recorded in this channel. Run a content campaign or trigger system pipelines to watch milestones sync in real time.
                </p>
              </motion.div>
            ) : (
              filteredNotifications.map((notif) => (
                <motion.div 
                  key={notif.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 rounded-2xl border transition-all relative flex gap-4 ${
                    notif.read 
                      ? 'bg-[#0a0b0e]/50 border-white/5' 
                      : 'bg-[#101116] border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.2)]'
                  }`}
                >
                  {/* Read Badge overlay */}
                  {!notif.read && (
                    <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-[#a8ff35] shadow-[0_0_8px_#a8ff35]" />
                  )}

                  {/* Left Side Icon */}
                  <div>
                    {getIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-semibold text-white leading-snug tracking-tight truncate">
                        {notif.title}
                      </h4>
                    </div>
                    <p className="text-zinc-400 text-xs font-normal mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    
                    {/* Footnote information */}
                    <div className="flex items-center gap-3.5 mt-2.5 text-[10px] font-medium text-zinc-500 font-mono">
                      <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span>•</span>
                      <span className="uppercase text-[9px] tracking-wider text-zinc-600">{notif.type}</span>
                    </div>
                  </div>

                  {/* Operational Controls per Alert */}
                  <div className="flex flex-col gap-2 justify-start pt-1">
                    {!notif.read && (
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-[#a8ff35]/90 hover:text-[#a8ff35] transition cursor-pointer"
                        title="Mark read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(notif.id)}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                      title="Clear from feed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
