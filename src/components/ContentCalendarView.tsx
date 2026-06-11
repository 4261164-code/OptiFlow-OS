import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Article, Pin } from '../types';
import { addNotification } from '../lib/notifications';
import { 
  Clock, 
  Sparkles, 
  Zap, 
  Calendar as CalendarIcon, 
  Check, 
  Trash2, 
  Plus, 
  ChevronRight, 
  ArrowRight,
  BookOpen, 
  Image as ImageIcon, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  Sliders,
  Play,
  RotateCcw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui';

export const HIGH_TRAFFIC_SLOTS = [
  { 
    time: "09:00 AM", 
    label: "Morning Peak (Pinterest & Blogs)", 
    trafficBoost: "+45% lift", 
    trafficScore: "Optimal", 
    colText: "text-[#a8ff35]", 
    colBg: "bg-[#a8ff35]/10", 
    colBorder: "border-[#a8ff35]/20", 
    description: "Pinterest feed morning discovery & corporate email break reading." 
  },
  { 
    time: "01:00 PM", 
    label: "Mid-Day Lunch (LinkedIn & Social)", 
    trafficBoost: "+30% lift", 
    trafficScore: "Steady", 
    colText: "text-blue-400", 
    colBg: "bg-blue-500/10", 
    colBorder: "border-blue-500/20", 
    description: "Peak mobile browsing for professionals taking mid-day lunch breaks." 
  },
  { 
    time: "06:00 PM", 
    label: "Evening Golden Hour (Pinterest & X)", 
    trafficBoost: "+55% lift", 
    trafficScore: "Peak Peak", 
    colText: "text-rose-400", 
    colBg: "bg-rose-500/10", 
    colBorder: "border-rose-500/20", 
    description: "Highest conversion rate window. Casual scrolling converts visual media at up to 2.4x standard levels." 
  },
  { 
    time: "09:30 PM", 
    label: "Night Catchup (Deep-Dive Guides)", 
    trafficBoost: "+25% lift", 
    trafficScore: "Stable", 
    colText: "text-purple-400", 
    colBg: "bg-purple-500/10", 
    colBorder: "border-purple-500/20", 
    description: "Focused long-form reading on tablets. Best for niche informational tutorials." 
  }
];

export interface ContentCalendarViewProps {
  articles: Article[];
  pins: Pin[];
  hasWordPressSetup: boolean;
  hasTelegramSetup: boolean;
  hasPinterestSetup: boolean;
  hasTwitterSetup: boolean;
  hasLinkedInSetup: boolean;
  integrationSettings: any;
  opLoading: Record<string, boolean>;
  publishToWordPress: (id: string, title: string, content: string, collectionName: 'articles' | 'pins') => Promise<void>;
  publishToTelegram: (id: string, text: string, imageUrl: string | undefined, collectionName: 'articles' | 'pins') => Promise<void>;
  publishToPinterestDirect: (id: string, title: string, description: string, imageUrl: string | undefined) => Promise<void>;
  pinterestBoards: { id: string, name: string }[];
  selectedBoards: Record<string, string>;
  setSelectedBoards: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function ContentCalendarView({
  articles,
  pins,
  hasWordPressSetup,
  hasTelegramSetup,
  hasPinterestSetup,
  hasTwitterSetup,
  hasLinkedInSetup,
  integrationSettings,
  opLoading,
  publishToWordPress,
  publishToTelegram,
  publishToPinterestDirect,
  pinterestBoards,
  selectedBoards,
  setSelectedBoards
}: ContentCalendarViewProps) {
  
  // 1. Calculate next 7 rolling days from current local time
  const getNextNDays = (n: number) => {
    const days = [];
    const now = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`; // YYYY-MM-DD format
      
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayLongName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const dateNum = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({ dateStr, dayName, dayLongName, dateNum });
    }
    return days;
  };

  const rollingDays = getNextNDays(7);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(rollingDays[0].dateStr);
  const [isSchedulingAll, setIsSchedulingAll] = useState<boolean>(false);
  const [quickAssignSlot, setQuickAssignSlot] = useState<{ date: string; slot: string } | null>(null);

  // Filter unscheduled assets
  const unscheduledArticles = articles.filter(a => !a.scheduledDate);
  const unscheduledPins = pins.filter(p => !p.scheduledDate);
  const totalUnscheduled = unscheduledArticles.length + unscheduledPins.length;

  const currentSelectedDayInfo = rollingDays.find(d => d.dateStr === selectedDateStr) || rollingDays[0];

  // Helper to retrieve item scheduled in a specific date & slot
  const getScheduledItemForSlot = (dateStr: string, slotTime: string) => {
    const matchArticle = articles.find(a => a.scheduledDate === dateStr && a.scheduledTimeSlot === slotTime);
    if (matchArticle) return { ...matchArticle, itemType: 'articles' as const };
    
    const matchPin = pins.find(p => p.scheduledDate === dateStr && p.scheduledTimeSlot === slotTime);
    if (matchPin) return { ...matchPin, itemType: 'pins' as const };
    
    return null;
  };

  // 2. Clear schedules of items
  const handleUnscheduleItem = async (id: string, type: 'articles' | 'pins') => {
    try {
      if (!auth.currentUser) return;
      const docRef = doc(db, type, id);
      await setDoc(docRef, {
        scheduledDate: null,
        scheduledTimeSlot: null,
        scheduledAt: null,
        isScheduled: false,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to unschedule:", err);
    }
  };

  // 3. Clear all schedules
  const handleResetCalendar = async () => {
    if (!window.confirm("Are you sure you want to unschedule all future items?")) return;
    try {
      const scheduledArticles = articles.filter(a => a.scheduledDate);
      const scheduledPins = pins.filter(p => p.scheduledDate);
      
      for (const a of scheduledArticles) {
        await handleUnscheduleItem(a.id, 'articles');
      }
      for (const p of scheduledPins) {
        await handleUnscheduleItem(p.id, 'pins');
      }

      if (auth.currentUser) {
        await addNotification(
          auth.currentUser.uid,
          'info',
          'Content Calendar Reset',
          `All scheduled pins and articles have been safely returned to the unscheduled reserves pool.`
        ).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to reset schedules:", err);
    }
  };

  // 4. AIS-optimized Auto-Scheduling Engine
  // Distributes all unscheduled items sequentially into empty high-traffic slots
  const handleAutoScheduleAll = async () => {
    if (totalUnscheduled === 0) {
      alert("There are no unscheduled articles or pins in your queue backlog.");
      return;
    }
    
    setIsSchedulingAll(true);
    let count = 0;
    try {
      // Create a combined flat queue
      const backlog: { id: string; type: 'articles' | 'pins' }[] = [];
      unscheduledArticles.forEach(a => backlog.push({ id: a.id, type: 'articles' }));
      unscheduledPins.forEach(p => backlog.push({ id: p.id, type: 'pins' }));

      // Look up to 14 days ahead to place them
      const futureDays = getNextNDays(14);
      let backlogIdx = 0;

      // Find currently occupied slots across those 14 days
      const occupied = new Set<string>(); // "YYYY-MM-DD_HH:MM AM"
      articles.forEach(a => {
        if (a.scheduledDate && a.scheduledTimeSlot) {
          occupied.add(`${a.scheduledDate}_${a.scheduledTimeSlot}`);
        }
      });
      pins.forEach(p => {
        if (p.scheduledDate && p.scheduledTimeSlot) {
          occupied.add(`${p.scheduledDate}_${p.scheduledTimeSlot}`);
        }
      });

      for (const day of futureDays) {
        for (const slot of HIGH_TRAFFIC_SLOTS) {
          if (backlogIdx >= backlog.length) break;

          const key = `${day.dateStr}_${slot.time}`;
          if (!occupied.has(key)) {
            const item = backlog[backlogIdx];
            const docRef = doc(db, item.type, item.id);
            const schedTime = new Date(`${day.dateStr} ${slot.time}`).getTime();

            await setDoc(docRef, {
              scheduledDate: day.dateStr,
              scheduledTimeSlot: slot.time,
              scheduledAt: schedTime,
              isScheduled: true,
              updatedAt: Date.now()
            }, { merge: true });

            count++;
            backlogIdx++;
          }
        }
        if (backlogIdx >= backlog.length) break;
      }

      if (auth.currentUser && count > 0) {
        await addNotification(
          auth.currentUser.uid,
          'milestone',
          'Chronological Route Completed',
          `The Optimizer mapped ${count} backlog assets sequentially into Pinterest & WordPress high-engagement slots.`
        );
      }
    } catch (err) {
      console.error("Sequential route failed:", err);
    } finally {
      setIsSchedulingAll(false);
    }
  };

  // 5. Connect/Assign manual unscheduled item to any slot
  const handleAssignItem = async (itemId: string, itemType: 'articles' | 'pins', dateStr: string, slotTime: string) => {
    try {
      if (!auth.currentUser) return;
      const docRef = doc(db, itemType, itemId);
      const schedTime = new Date(`${dateStr} ${slotTime}`).getTime();

      await setDoc(docRef, {
        scheduledDate: dateStr,
        scheduledTimeSlot: slotTime,
        scheduledAt: schedTime,
        isScheduled: true,
        updatedAt: Date.now()
      }, { merge: true });

      setQuickAssignSlot(null);

      await addNotification(
        auth.currentUser.uid,
        'info',
        'Asset Scheduled',
        `Linked content to slot "${slotTime}" on date ${dateStr} aligned with the peak analytics indicators.`
      ).catch(() => {});
    } catch (err) {
      console.error("Assign failing:", err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 2-COLUMN SPLIT SCHEDULER VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: 7-DAY AGENDAR TIMELINE WITH CHOSEN SLOTS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* HORIZONTAL DATE SELECTOR TABS */}
          <div className="bg-[#0e0e11] border border-white/5 rounded-2xl p-2.5">
            <div className="flex items-center justify-between px-2 mb-3">
              <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">Interactive Day Selection (Next 7 Days)</span>
              <span className="text-[10.5px] text-[#a8ff35] font-mono font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#a8ff35] animate-pulse" />
                <span>Peak-Aligned Optimization</span>
              </span>
            </div>
            
            <div className="grid grid-cols-7 gap-1.5">
              {rollingDays.map((day) => {
                const isActive = selectedDateStr === day.dateStr;
                // Count how many items scheduled are on this dateStr
                const scheduledOnThisDayCount = 
                  articles.filter(a => a.scheduledDate === day.dateStr).length + 
                  pins.filter(p => p.scheduledDate === day.dateStr).length;

                return (
                  <button
                    key={day.dateStr}
                    onClick={() => { setSelectedDateStr(day.dateStr); setQuickAssignSlot(null); }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition cursor-pointer relative overflow-hidden ${
                      isActive 
                        ? 'bg-[#1C1D21] border border-[#d7f941]/40 text-white' 
                        : 'bg-[#1c1d21]/30 hover:bg-[#1C1D21]/60 border border-white/3 text-zinc-400'
                    }`}
                  >
                    {/* Tiny Indicator if something scheduled */}
                    {scheduledOnThisDayCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#d7f941]" />
                    )}
                    
                    <span className="text-[9.5px] font-mono font-bold uppercase opacity-80">{day.dayName}</span>
                    <span className="text-sm font-extrabold mt-0.5">{day.dateNum.split(' ')[1]}</span>
                    <span className="text-[7.5px] font-mono mt-1 opacity-60">
                      {scheduledOnThisDayCount > 0 ? `${scheduledOnThisDayCount} posts` : 'empty'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PEAK SLOTS DETAIL SECTION */}
          <div className="bg-[#0e0e11] border border-white/5 rounded-[32px] p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#d7f941]">Active Content Pipeline</span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {currentSelectedDayInfo.dayLongName}, {currentSelectedDayInfo.dateNum}
                </h2>
              </div>
              
              <div className="bg-[#1C1D21] border border-white/5 px-3.5 py-1.5 rounded-full text-xs text-zinc-300 font-mono flex items-center justify-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Optimized Feed Distribution Ready</span>
              </div>
            </div>

            {/* 4 SLOT CONTAINERS */}
            <div className="space-y-4">
              {HIGH_TRAFFIC_SLOTS.map((slot) => {
                const item = getScheduledItemForSlot(selectedDateStr, slot.time);
                
                return (
                  <div 
                    key={slot.time}
                    className={`border rounded-2xl p-4 transition-all flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between relative overflow-hidden ${
                      item 
                        ? 'bg-[#1C1D21]/70 border-white/5' 
                        : 'bg-[#1c1d21]/20 border-dashed border-white/5/65 hover:border-white/12'
                    }`}
                  >
                    {/* HIGH TRAFFIC OVERLAY CHASSIS */}
                    <div className="absolute top-0 right-0 w-[140px] h-[140px] bg-gradient-to-bl from-white/[0.015] to-transparent pointer-events-none" />

                    {/* Time Slot Details */}
                    <div className="flex items-start gap-3 md:max-w-xs shrink-0">
                      <div className={`p-2.5 rounded-xl ${slot.colBg} ${slot.colBorder} border flex flex-col items-center justify-center w-14 h-14 shrink-0`}>
                        <Clock className={`w-4 h-4 ${slot.colText}`} />
                        <span className={`text-[10px] font-mono font-extrabold mt-1 text-center leading-none ${slot.colText}`}>
                          {slot.time.split(' ')[0]}
                        </span>
                      </div>
                      
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{slot.label}</span>
                          <span className={`text-[8.5px] px-2 py-0.5 rounded font-mono font-bold leading-none ${slot.colBg} ${slot.colText}`}>
                            {slot.trafficBoost}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-normal">{slot.description}</p>
                      </div>
                    </div>

                    {/* SLOT CONTENT ELEMENT (IF FILLED) */}
                    {item ? (
                      <div className="flex-1 bg-black/30 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3 relative">
                        <div className="space-y-1 truncate pr-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.itemType === 'articles' ? (
                              <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-[#a8ff35] bg-[#a8ff35]/15 border border-[#a8ff35]/25 px-1.5 py-0.5 rounded">Article</span>
                            ) : (
                              <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-pink-500 bg-pink-500/15 border border-pink-500/25 px-1.5 py-0.5 rounded">Pin</span>
                            )}
                            <span className="text-[9px] text-zinc-500 font-mono">ID: {item.id.substring(0,6)}</span>
                          </div>
                          <p className="text-xs font-bold text-white truncate max-w-[200px] md:max-w-[150px]">{item.title}</p>
                          <span className="text-[9px] text-zinc-550 truncate block">
                            {item.itemType === 'articles' 
                              ? `Keyword: ${(item as Article).keyword}` 
                              : `Concept: ${(item as Pin).concept}`}
                          </span>
                        </div>

                        {/* Actions for filled slot */}
                        <div className="flex items-center gap-2">
                          {/* Live Links or Triggers for manual immediate delivery */}
                          {item.itemType === 'articles' && item.wordpressStatus === 'published' && item.wordpressUrl && (
                            <a href={item.wordpressUrl} target="_blank" rel="noreferrer" title="Live WordPress Page" className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-[#a8ff35] transition">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {item.itemType === 'pins' && item.pinterestStatus === 'published' && item.pinterestUrl && (
                            <a href={item.pinterestUrl} target="_blank" rel="noreferrer" title="Pinterest Creative Pin Link" className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-rose-400 transition">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button 
                            onClick={() => handleUnscheduleItem(item.id, item.itemType)}
                            title="Unschedule & Return to reserves Backlog"
                            className="p-1.5 bg-transparent text-zinc-550 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* SLOT EMPTY PLACEHOLDER */
                      <div className="flex-1 flex flex-col justify-center">
                        {quickAssignSlot?.date === selectedDateStr && quickAssignSlot?.slot === slot.time ? (
                          /* QUICK CHOOSE EXPANDED DRAWER */
                          <div className="space-y-2 bg-[#050608] border border-white/10 p-2.5 rounded-xl">
                            <div className="flex items-center justify-between border-b border-white/5 pb-1">
                              <span className="text-[9.5px] text-zinc-500 uppercase font-mono font-bold">Pick an asset to schedule:</span>
                              <button 
                                onClick={() => setQuickAssignSlot(null)}
                                className="text-[10px] text-zinc-400 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="max-h-[140px] overflow-y-auto pr-1 space-y-1.5 text-left scrollbar-thin">
                              {totalUnscheduled === 0 ? (
                                <p className="text-[10px] text-zinc-550 p-2 text-center italic">All articles and pins are already scheduled.</p>
                              ) : (
                                <>
                                  {unscheduledArticles.map(a => (
                                    <button
                                      key={a.id}
                                      onClick={() => handleAssignItem(a.id, 'articles', selectedDateStr, slot.time)}
                                      className="w-full text-left p-1.5 rounded bg-zinc-900 border border-white/3 hover:bg-zinc-850 hover:border-[#a8ff35]/35 transition text-[10.5px] truncate text-white block"
                                    >
                                      <span className="text-[#a8ff35] font-mono mr-1.5 text-[9px] font-bold">[Art]</span> {a.title}
                                    </button>
                                  ))}
                                  {unscheduledPins.map(p => (
                                    <button
                                      key={p.id}
                                      onClick={() => handleAssignItem(p.id, 'pins', selectedDateStr, slot.time)}
                                      className="w-full text-left p-1.5 rounded bg-zinc-900 border border-white/3 hover:bg-zinc-850 hover:border-pink-500/35 transition text-[10.5px] truncate text-white block"
                                    >
                                      <span className="text-pink-500 font-mono mr-1.5 text-[9px] font-bold">[Pin]</span> {p.title}
                                    </button>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* STANDARD EMPTY BUTTON */
                          <button
                            onClick={() => setQuickAssignSlot({ date: selectedDateStr, slot: slot.time })}
                            className="w-full group/empty py-2.5 px-3 border border-dashed border-white/5 hover:border-white/12 hover:bg-[#1C1D21]/30 rounded-xl transition text-[#d7f941] text-[10.5px] font-mono uppercase font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-zinc-600 group-hover/empty:text-[#d7f941] group-hover/empty:scale-110 transition shrink-0" />
                            <span className="text-zinc-600 group-hover/empty:text-[#d7f941] transition">Schedule Backlog Asset Here</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REVENUE & OPTIMIZER PANELS + RESERVES BACKLOG POOL */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* AI OPTIMIZATION CONTROLS PANEL */}
          <Card className="bg-[#0e0e11] border border-white/5 rounded-[28px] p-6 space-y-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#a8ff35]/3 rounded-full blur-[70px] pointer-events-none" />
            
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#a8ff35] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Analytics Engine Scheduler</span>
              </span>
              <h3 className="text-lg font-bold text-white mt-1">Autopilot Campaign Optimizer</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Let the engine automatically analyze your unscheduled asset backlogs and place them across high-traffic hours to prevent social stream collisions.
              </p>
            </div>

            {/* Simulated Live Analytics Data for context */}
            <div className="bg-[#1C1D21] border border-white/5 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-white/[0.04] pb-2">
                <span className="text-zinc-400">Total Unscheduled Items:</span>
                <span className="font-extrabold text-white font-mono">{totalUnscheduled}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-white/[0.04] pb-2">
                <span className="text-zinc-400">Projected Traffic Multiplier:</span>
                <span className="font-extrabold text-[#a8ff35] font-mono">1.84x (Peak Boost)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Primary Channel Outlets:</span>
                <span className="font-extrabold text-zinc-300 font-mono">WP Sandbox & Pinterest</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1.5">
              <button
                onClick={handleAutoScheduleAll}
                disabled={isSchedulingAll || totalUnscheduled === 0}
                className="w-full bg-[#d7f941] hover:bg-[#c6e834] text-black font-extrabold py-3.5 text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-40"
              >
                {isSchedulingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Routing Queue...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-black fill-current" />
                    <span>⚡ Auto-Schedule All Backlog</span>
                  </>
                )}
              </button>

              <button
                onClick={handleResetCalendar}
                className="w-full bg-[#1C1D21] border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold py-2.5 text-[10.5px] uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Block Schedule</span>
              </button>
            </div>
          </Card>

          {/* UNSCHEDULED BACKLOG POOL ITEMS */}
          <Card className="bg-[#0e0e11] border border-white/5 rounded-[28px] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">Asset Reserves</span>
                <h3 className="text-sm font-extrabold text-white mt-0.5 tracking-tight">Unscheduled pool backlog</h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 bg-zinc-850 text-zinc-400 font-mono font-extrabold rounded-lg uppercase">
                {totalUnscheduled} Reserves
              </span>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {totalUnscheduled === 0 ? (
                <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center bg-black/10">
                  <Check className="w-8 h-8 text-[#a8ff35] mb-2" />
                  <p className="text-xs text-white font-bold uppercase">All systems optimized!</p>
                  <p className="text-[10px] text-zinc-550 mt-1 max-w-[200px]">Every article and pin has been assigned a premium high-traffic social execution slot.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* articles list block */}
                  {unscheduledArticles.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-zinc-405 block">Articles ({unscheduledArticles.length})</span>
                      {unscheduledArticles.map(art => (
                        <div key={art.id} className="p-2.5 bg-zinc-900/60 border border-white/3 rounded-xl flex items-center justify-between gap-3 group">
                          <div className="truncate pr-2">
                            <span className="text-[8px] uppercase font-mono font-extrabold text-[#a8ff35] block">[Article]</span>
                            <span className="text-xs font-bold text-white block truncate">{art.title}</span>
                            <span className="text-[9.5px] text-zinc-500 block truncate">Keyword: {art.keyword}</span>
                          </div>
                          
                          <button
                            onClick={() => {
                              setSelectedDateStr(rollingDays[0].dateStr); 
                              setQuickAssignSlot({ date: rollingDays[0].dateStr, slot: HIGH_TRAFFIC_SLOTS[0].time });
                            }}
                            className="bg-[#1C1D21] border border-white/5 hover:border-[#a8ff35]/35 hover:bg-[#a8ff35]/5 p-1.5 rounded-lg text-[#a8ff35] text-[10.5px] font-bold font-mono transition shrink-0"
                            title="Schedule Article"
                          >
                            <CalendarIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* pins list block */}
                  {unscheduledPins.length > 0 && (
                    <div className="space-y-1.5 pt-3 border-t border-white/[0.03]">
                      <span className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-zinc-405 block">Pinterest Pins ({unscheduledPins.length})</span>
                      {unscheduledPins.map(pin => (
                        <div key={pin.id} className="p-2.5 bg-zinc-900/60 border border-white/3 rounded-xl flex items-center justify-between gap-3 group">
                          <div className="flex gap-2.5 items-center truncate">
                            {pin.imageUrl && (
                              <div className="w-9 h-14 bg-zinc-950 border border-white/5 rounded overflow-hidden shrink-0">
                                <img src={pin.imageUrl} alt={pin.title} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            <div className="truncate pr-2">
                              <span className="text-[8px] uppercase font-mono font-extrabold text-pink-500 block">[Pin Asset]</span>
                              <span className="text-xs font-bold text-white block truncate">{pin.title}</span>
                              <span className="text-[9.5px] text-zinc-500 block truncate">Concept: {pin.concept}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedDateStr(rollingDays[0].dateStr); 
                              setQuickAssignSlot({ date: rollingDays[0].dateStr, slot: HIGH_TRAFFIC_SLOTS[0].time });
                            }}
                            className="bg-[#1C1D21] border border-white/5 hover:border-pink-500/35 hover:bg-pink-500/5 p-1.5 rounded-lg text-pink-500 text-[10.5px] font-bold font-mono transition shrink-0"
                            title="Schedule Pinterest Pin"
                          >
                            <CalendarIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
}
