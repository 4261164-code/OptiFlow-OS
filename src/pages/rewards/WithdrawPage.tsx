import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input } from '../../components/ui';
import { CreditCard, DollarSign, CheckCircle2, ChevronRight, AlertCircle, Loader2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../../lib/auth';
import { useNotifications } from '../../components/NotificationContext';
import { cn } from '../../lib/utils';

export default function WithdrawPage() {
  const [step, setStep] = useState(1);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'paypal' | 'amazon_gc'>('paypal');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (snap) => {
      if (snap.exists()) {
        setBalance(snap.data().balance || 0);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const totalCents = parseFloat(amount) * 100;

  const handleNext = () => {
    if (step === 1) {
      if (isNaN(totalCents) || totalCents < 1000) {
        addNotification('error', "Error", "Minimum withdrawal is $10.00");
        return;
      }
      if (totalCents > balance) {
        addNotification('error', "Error", "Insufficient balance");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!recipient.trim() || !recipient.includes('@')) {
        addNotification('error', "Error", "Valid email is required");
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/request-withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalCents,
          method,
          recipient
        })
      });
      const data = await res.json();
      if (data.success) {
        setStep(4);
        addNotification('milestone', "Success", "Withdrawal requested!");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      addNotification('error', "Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-sans font-bold text-white tracking-tight">Withdraw Funds</h1>
        <p className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">Secure L3 Payment Protocol</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-4">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500",
              step >= s ? "bg-[#a8ff35] text-black shadow-[0_0_15px_rgba(168,255,53,0.4)]" : "bg-white/5 text-zinc-600"
            )}>
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            {s < 3 && <div className={cn("w-12 h-0.5 rounded-full", step > s ? "bg-[#a8ff35]" : "bg-white/5")} />}
          </div>
        ))}
      </div>

      <Card className="bg-[#0d0e12] border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#a8ff35]/30 to-transparent" />
        <CardContent className="p-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-white/5 rounded-2xl p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Available Pulse</span>
                    <p className="text-2xl font-mono font-bold text-[#a8ff35]">${(balance / 100).toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-zinc-800" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-zinc-400">Withdrawal Amount ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 font-bold">$</span>
                    <Input 
                      type="number"
                      placeholder="10.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-8 h-14 text-lg font-mono bg-white/2 border-white/5 focus:ring-[#a8ff35]"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600">Minimum withdrawal: <span className="text-zinc-400">$10.00 USD</span></p>
                </div>

                <Button 
                  onClick={handleNext}
                  className="w-full h-14 bg-[#a8ff35] text-black font-bold text-lg rounded-2xl group hover:bg-[#92ec1d] transition-all"
                >
                  Configure Method <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                   <label className="text-xs uppercase font-bold text-zinc-400">Select Method</label>
                   <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setMethod('paypal')}
                        className={cn(
                          "p-6 rounded-2xl border transition-all flex flex-col items-center gap-3",
                          method === 'paypal' ? "bg-[#a8ff35]/10 border-[#a8ff35] text-white shadow-[0_0_20px_rgba(168,255,53,0.1)]" : "bg-white/2 border-white/5 text-zinc-500 hover:border-white/10"
                        )}
                      >
                         <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", method === 'paypal' ? "bg-[#a8ff35] text-black" : "bg-white/5")}>P</div>
                         <span className="font-bold text-sm">PayPal</span>
                      </button>
                      <button 
                        onClick={() => setMethod('amazon_gc')}
                        className={cn(
                          "p-6 rounded-2xl border transition-all flex flex-col items-center gap-3",
                          method === 'amazon_gc' ? "bg-orange-500/10 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.1)]" : "bg-white/2 border-white/5 text-zinc-500 hover:border-white/10"
                        )}
                      >
                         <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", method === 'amazon_gc' ? "bg-orange-500 text-black" : "bg-white/5")}>A</div>
                         <span className="font-bold text-sm">Amazon GC</span>
                      </button>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-zinc-400">Payment Recipient (Email)</label>
                  <Input 
                    placeholder="your-email@example.com"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="h-14 bg-white/2 border-white/5 focus:ring-[#a8ff35]"
                  />
                  <p className="text-[10px] text-zinc-600 flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Double check recipient email. Transfers are irreversible.</p>
                </div>

                <div className="flex gap-4">
                  <Button variant="ghost" onClick={() => setStep(1)} className="h-14 px-8 text-zinc-500">Back</Button>
                  <Button 
                    onClick={handleNext}
                    className="flex-1 h-14 bg-[#a8ff35] text-black font-bold text-lg rounded-2xl group hover:bg-[#92ec1d] transition-all"
                  >
                    Review Request
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="p-6 bg-white/5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-500">Amount</span>
                      <span className="text-white font-mono font-bold">${amount}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-500">Method</span>
                      <span className="text-white font-bold uppercase">{method.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-500">Recipient</span>
                      <span className="text-white font-bold">{recipient}</span>
                    </div>
                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                      <span className="text-zinc-400 font-bold">Total Deduction</span>
                      <span className="text-[#a8ff35] font-mono font-bold text-xl">${amount}</span>
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-[10px] text-amber-500/80 leading-relaxed uppercase font-bold tracking-wider">
                      Requests are typically processed within 48 business hours. You will receive an automated notification once credited.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="ghost" onClick={() => setStep(2)} className="h-14 px-8 text-zinc-500" disabled={submitting}>Back</Button>
                  <Button 
                    onClick={handleSubmit}
                    className="flex-1 h-14 bg-[#a8ff35] text-black font-bold text-lg rounded-2xl group hover:bg-[#92ec1d] transition-all"
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm & Send Request"}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-6"
              >
                <div className="w-24 h-24 bg-[#a8ff35]/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(168,255,53,0.3)]">
                  <CheckCircle2 className="w-12 h-12 text-[#a8ff35]" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">Request Received!</h2>
                  <p className="text-zinc-500 text-sm max-w-xs mx-auto">
                    Pulse Credits have been moved to pending and will be credited to your account after internal verification.
                  </p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/wallet'}
                  className="bg-white/5 text-zinc-300 hover:text-white rounded-xl px-10"
                >
                  Return to Wallet
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
      
      <div className="flex justify-center flex-col items-center gap-2">
         <div className="flex items-center gap-4 text-zinc-700">
            <Shield className="w-4 h-4" />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em]">End-to-End Encrypted Transfer</span>
         </div>
      </div>
    </div>
  );
}
