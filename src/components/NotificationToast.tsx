import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  X, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  Info,
  Bell 
} from 'lucide-react';
import { useNotifications } from './NotificationContext';
import { NotificationType } from '../types';

export const NotificationToast: React.FC = () => {
  const { activeToast, clearToast, setIsOpen } = useNotifications();

  // Auto-dismiss the toast after 6 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        clearToast();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeToast, clearToast]);

  if (!activeToast) return null;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'milestone':
        return (
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
            <Award className="w-4 h-4 animate-bounce" />
          </div>
        );
      case 'traffic':
        return (
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/10">
            <TrendingUp className="w-4 h-4" />
          </div>
        );
      case 'error':
        return (
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/10">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/10">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  const handleToastClick = () => {
    setIsOpen(true);
    clearToast();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none w-full max-w-sm sm:max-w-md">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
          className="pointer-events-auto bg-[#0a0b0e] border border-white/10 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex items-start gap-3 w-full border-t-[#a8ff35]/30 cursor-pointer"
          onClick={handleToastClick}
        >
          {/* Icon */}
          <div className="flex-shrink-0 pt-0.5">
            {getIcon(activeToast.type)}
          </div>
          
          {/* Title & Body */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-mono font-bold tracking-wider uppercase text-zinc-500 flex items-center gap-1.5">
              <span>{activeToast.type === 'milestone' ? 'Operating Milestone' : activeToast.type === 'traffic' ? 'Click Conversion' : activeToast.type + ' report'}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#a8ff35] shadow-[0_0_6px_#a8ff35]" />
            </p>
            <h4 className="text-sm font-semibold text-white mt-1 leading-tight tracking-tight">
              {activeToast.title}
            </h4>
            <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed line-clamp-2">
              {activeToast.message}
            </p>
            <p className="text-[10px] text-zinc-500 font-bold mt-2 hover:text-[#a8ff35] transition flex items-center gap-1">
              <span>Open operational logs</span> &rarr;
            </p>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearToast();
            }}
            className="flex-shrink-0 p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
