import React from 'react';
import { X, Crown } from 'lucide-react';
import { BillingSubscriptionPanel } from './BillingSubscriptionPanel';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BillingModal({ isOpen, onClose }: BillingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#0a0c12] border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] custom-scrollbar">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-6 border-b border-white/5 sticky top-0 bg-[#0a0c12]/95 backdrop-blur-xl z-10 -mt-2 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#a8ff35]/15 border border-[#a8ff35]/30 text-[#a8ff35] flex items-center justify-center shadow-[0_0_20px_rgba(168,255,53,0.2)]">
              <Crown size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">OptiFlow Billing & Scale Hub</h2>
              <p className="text-xs text-zinc-400">Manage campaign capacity, AI token pools, and enterprise routing</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition border border-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Panel Content */}
        <div className="pt-6">
          <BillingSubscriptionPanel />
        </div>
      </div>
    </div>
  );
}
