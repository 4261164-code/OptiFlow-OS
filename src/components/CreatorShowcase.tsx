import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from './ui';
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  Briefcase, 
  GraduationCap, 
  Languages, 
  Gamepad2, 
  Camera, 
  Plane,
  Mail, 
  Instagram, 
  MessageSquare,
  Twitter, 
  Dribbble, 
  FolderLock,
  Workflow,
  MousePointerClick,
  MonitorCheck,
  Activity,
  Globe,
  Award,
  X
} from 'lucide-react';

const ivanAvatar = "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80"; // Professional man in suit
const sunilAvatar = "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=300&q=80"; // Professional man smiling

// Custom icons or text badges for design software
const SOFTWARE_ICONS: Record<string, { label: string; color: string; desc: string }> = {
  Ai: { label: 'Adobe Illustrator', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30', desc: 'Vector illustration & branding standard' },
  Ps: { label: 'Adobe Photoshop', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30', desc: 'Creative raster layout & image composition' },
  Id: { label: 'Adobe InDesign', color: 'text-pink-500 bg-pink-500/10 border-pink-500/30', desc: 'Multi-page editorial & booklet styling' },
  Xd: { label: 'Adobe XD', color: 'text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/30', desc: 'Dynamic interface wireframing & mockups' },
  Canva: { label: 'Canva', color: 'text-teal-400 bg-teal-400/10 border-teal-400/30', desc: 'Rapid collaborative marketing design templates' },
  Asana: { label: 'Asana', color: 'text-rose-500 bg-rose-500/10 border-rose-500/30', desc: 'Programmatic workflow task coordination' },
  Dropbox: { label: 'Dropbox', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30', desc: 'Secure cloud project asset distribution' },
  Airtable: { label: 'Airtable', color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30', desc: 'Structured database matching & briefs' },
  'AI+': { label: 'AI Gen Prompting', color: 'text-[#a8ff35] bg-[#a8ff35]/10 border-[#a8ff35]/30', desc: 'Advanced Midjourney & Stable Diffusion integration' },
  Ae: { label: 'Adobe After Effects', color: 'text-purple-500 bg-purple-500/10 border-purple-500/30', desc: 'Motion graphics & cinematic logo loops' },
  Pr: { label: 'Adobe Premiere Pro', color: 'text-blue-600 bg-blue-600/10 border-blue-600/30', desc: 'High-speed sequence timeline video editor' },
  Resolve: { label: 'DaVinci Resolve', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', desc: 'Sunkissed professional color grading master' }
};

export function CreatorShowcase() {
  const [selectedCreator, setSelectedCreator] = useState<'none' | 'ivan' | 'sunil'>('none');
  const [activeTab, setActiveTab] = useState<'work' | 'catalog' | 'none'>('none');
  
  // Interactive Ivan Booking State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    service: 'Brand Identity',
    notes: '',
    email: '',
    urgent: false
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Interactive Sunil Inquiry State
  const [showSunilContact, setShowSunilContact] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [activeToolInfo, setActiveToolInfo] = useState<string | null>(null);

  const handleBookService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.email) return;
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setIsBookingOpen(false);
      setBookingForm({ service: 'Brand Identity', notes: '', email: '', urgent: false });
    }, 3000);
  };

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySent(true);
    setTimeout(() => {
      setInquirySent(false);
      setShowSunilContact(false);
    }, 2800);
  };

  // ----------------------------------------------------------------------
  // RENDER: PARTNER DIRECTORY / HUB LANDING
  // ----------------------------------------------------------------------
  if (selectedCreator === 'none') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-white tracking-tight">OptiFlow OS Creator Partner Showcase</h2>
          <p className="text-xs text-zinc-400">
            Need highly optimized affiliate banners, social Pinterest graphics, or a premium custom brand identity? Meet our certified elite designers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Ivan */}
          <div 
            onClick={() => { setSelectedCreator('ivan'); setActiveTab('none'); }}
            className="group cursor-pointer bg-[#0e0f13] hover:bg-[#131419] border border-white/5 hover:border-[#a8ff35]/30 p-6 rounded-[28px] transition duration-350 shadow-xl flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 group-hover:scale-105 transition duration-300">
                  <img src={ivanAvatar} alt="Ivan avatar portrait" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] text-blue-400 font-mono font-bold uppercase bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                  Brand Illustrator
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white group-hover:text-[#a8ff35] transition duration-300">Rence Ivann</h3>
                <p className="text-xs text-[#a8ff35] font-semibold">Graphic / Product & Brand Designer</p>
                <p className="text-xs text-zinc-400 leading-relaxed pt-1.5">
                  "Hi, I'm Ivan... passionate about crafting result-driven designs and giving your products an interesting story and look."
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500 font-mono">
              <div className="flex gap-1.5">
                {['Ai', 'Ps', 'Canva', 'AI+'].map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-300">{t}</span>
                ))}
              </div>
              <span className="text-[#a8ff35] group-hover:translate-x-1 duration-300 transition-all font-bold">Open Portfolio →</span>
            </div>
          </div>

          {/* Card Sunil */}
          <div 
            onClick={() => { setSelectedCreator('sunil'); }}
            className="group cursor-pointer bg-[#0e0f13] hover:bg-[#131419] border border-white/5 hover:border-[#a8ff35]/30 p-6 rounded-[28px] transition duration-350 shadow-xl flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 group-hover:scale-105 transition duration-300">
                  <img src={sunilAvatar} alt="Sunil avatar portrait" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Bento Showcase
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white group-hover:text-[#a8ff35] transition duration-300">Sunil Kumar</h3>
                <p className="text-xs text-[#a8ff35] font-semibold">Self-taught Logo & Brand Designer</p>
                <p className="text-xs text-zinc-400 leading-relaxed pt-1.5">
                  "I specialize in creating modern, clean, and minimal brands that make a lasting, beautiful impression."
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500 font-mono">
              <div className="flex gap-1.5">
                {['Ai', 'Ps', 'Ae', 'Pr'].map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-300">{t}</span>
                ))}
              </div>
              <span className="text-[#a8ff35] group-hover:translate-x-1 duration-300 transition-all font-bold">Open Portfolio →</span>
            </div>
          </div>
        </div>

        {/* Co-Op Notice */}
        <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center gap-3">
          <Award className="w-5 h-5 text-[#a8ff35] flex-shrink-0" />
          <p className="text-xs text-zinc-400 leading-relaxed">
            All OptiFlow OS Creator Partners have verified feedback loops. Designs requested here sync immediately with your local assets library for immediate automatic syndication.
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: IVAN PORTFOLIO EXPERIENCE (DARK LUX BRAND SUITE)
  // ----------------------------------------------------------------------
  if (selectedCreator === 'ivan') {
    return (
      <div className="space-y-8 animate-fade-in relative">
        {/* Back Menu */}
        <div className="flex justify-between items-center bg-[#0d0e12] p-3 rounded-2xl border border-white/5">
          <button 
            onClick={() => setSelectedCreator('none')}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#a8ff35]" />
            <span>Back to Creator Specialists</span>
          </button>
          <span className="text-[10px] font-mono tracking-widest text-zinc-500 font-bold uppercase">certified layout partner</span>
        </div>

        {/* 1. Header Navigation and Logo Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4 border-b border-white/5">
          {/* Quick Nav Pills from mockup top-bar */}
          <div className="flex items-center gap-3 order-2 md:order-1">
            <button 
              onClick={() => setActiveTab(activeTab === 'work' ? 'none' : 'work')}
              className={`px-4.5 py-2 rounded-full text-xs font-bold transition duration-300 flex items-center gap-1.5 pointer cursor-pointer border ${activeTab === 'work' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-zinc-900 border-white/5 text-zinc-300 hover:text-white'}`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>See my work</span>
            </button>
            <button 
              onClick={() => setActiveTab(activeTab === 'catalog' ? 'none' : 'catalog')}
              className={`px-4.5 py-2 rounded-full text-xs font-bold transition duration-300 flex items-center gap-1.5 pointer cursor-pointer border ${activeTab === 'catalog' ? 'bg-[#a8ff35]/20 text-[#a8ff35] border-[#a8ff35]/30' : 'bg-zinc-900 border-white/5 text-zinc-300 hover:text-white'}`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>My catalog</span>
            </button>
          </div>

          <div className="text-center md:text-right order-1 md:order-2">
            <button 
              onClick={() => setIsBookingOpen(true)}
              className="px-5 py-2.5 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold transition shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Book a service</span>
            </button>
          </div>
        </div>

        {/* MAIN DESIGN PANEL (FROM FIRST IMAGE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#0d0e12] rounded-[36px] overflow-hidden border border-white/5 p-8 md:p-12">
          {/* Left Block: Avatar & Bio */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-4">
              <span className="text-zinc-500 font-mono tracking-widest text-xs uppercase block">rence</span>
              <h1 className="text-5xl md:text-6.5xl font-extrabold tracking-tighter text-white font-sans leading-none">
                Ivann
              </h1>
              <p className="text-sm md:text-base font-bold bg-gradient-to-r from-teal-400 to-[#a8ff35] bg-clip-text text-transparent uppercase tracking-wider">
                Graphic / Product & Brand Designer
              </p>
            </div>

            <p className="text-sm md:text-md text-zinc-300 leading-relaxed font-sans font-medium">
              Hi, I'm Ivan, a graphic designer, product designer, and brand illustrator passionate about crafting result driven designs and giving your products an interesting story and look.
            </p>

            {/* Glowing Tools Suite from the mockup line */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-semibold block">design stack & environment</span>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {['Ai', 'Ps', 'Canva', 'Asana', 'Dropbox', 'Airtable', 'AI+'].map((app) => {
                  const meta = SOFTWARE_ICONS[app];
                  return (
                    <div 
                      key={app} 
                      title={meta?.desc}
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold font-mono transition duration-300 cursor-help hover:scale-105 active:scale-95 ${meta?.color || 'bg-zinc-900 border-white/5 text-zinc-300'}`}
                    >
                      {app}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Block: Massive Beautiful Cartoon Avatar Display Portrait */}
          <div className="lg:col-span-5 flex justify-center relative">
            <div className="w-72 h-72 md:w-80 md:h-80 rounded-[40px] overflow-hidden p-1 bg-gradient-to-tr from-teal-500/20 via-[#a8ff35]/20 to-blue-500/20 border border-white/10 shadow-2xl relative group">
              {/* Animated decorative ring inside */}
              <div className="absolute inset-0 rounded-[38px] border border-dashed border-white/10 animate-spin-slow pointer-events-none opacity-60" />
              <img 
                src={ivanAvatar} 
                alt="Rence Ivan Illustration portrait" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-[38px] transform group-hover:scale-102 transition duration-500" 
              />
            </div>
          </div>
        </div>

        {/* DEEP FOCUS: Crafting incredible statement */}
        <div className="text-center py-6 px-4 bg-zinc-950/40 rounded-3xl border border-white/3">
          <p className="text-md md:text-lg font-medium text-zinc-200 tracking-wide font-sans italic">
            &ldquo;Crafting incredible, impactful, satisfactory designs, brand identities and many more...&rdquo;
          </p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-2">
            Design is not just about pictures, words, logo, color and typography. It is a way of telling a brand's story.
          </p>
        </div>

        {/* 2. DYNAMIC WORK EXPANSION ACCORDION (when "See my work" is active) */}
        {activeTab === 'work' && (
          <div className="p-6 bg-[#0c0d11] rounded-[28px] border border-[#a8ff35]/20 space-y-6 animate-fade-in font-mono">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#a8ff35]" />
                <h3 className="text-md font-bold text-white uppercase tracking-wide font-sans">Work Proof Showcase</h3>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">DIGITAL LENS OPTIMIZED</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-zinc-200">
              
              {/* Card 1 */}
              <div className="bg-[#101115] border border-white/5 rounded-2xl p-4 flex flex-col justify-between relative group overflow-hidden hover:border-[#a8ff35]/30 duration-300">
                <div className="w-full bg-[#050608] rounded-xl h-36 flex items-center justify-center relative overflow-hidden p-2 border border-white/10 group-hover:border-[#a8ff35]/50 duration-300">
                  {/* Viewfinder corner lines */}
                  <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-[#a8ff35]" />
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-[#a8ff35]" />
                  <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l border-[#a8ff35]" />
                  <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-[#a8ff35]" />
                  
                  {/* Viewfinder Slider Scale left & right */}
                  <div className="absolute left-2 top-4 bottom-4 w-[1px] bg-white/10 flex flex-col justify-between items-center py-0.5">
                    <span className="w-1 h-[1px] bg-[#a8ff35]" />
                    <span className="w-1.5 h-0.5 bg-[#a8ff35] rounded-full" />
                    <span className="w-1 h-[1px] bg-[#a8ff35]" />
                  </div>
                  
                  {/* Center Target Crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div className="w-3.5 h-3.5 border border-[#a8ff35] rounded-full flex items-center justify-center">
                      <div className="w-1 h-1 bg-[#a8ff35] rounded-full" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 w-full h-full rounded flex items-center justify-center font-bold text-zinc-300 relative">
                    <span className="text-xs uppercase tracking-widest">OptiFlow OS ID</span>
                  </div>

                  {/* Bottom camera tag overlay */}
                  <div className="absolute bottom-1.5 left-6 right-6 bg-[#a8ff35] text-black px-1.5 py-0.5 rounded flex items-center justify-between text-[7px] font-black uppercase tracking-wider font-mono">
                    <span>BRAND SYST</span>
                    <span>1.80 ETH</span>
                  </div>
                </div>
                <div className="mt-3.5">
                  <p className="font-bold text-white text-xs font-sans">OptiFlow OS Branding</p>
                  <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Logo guidelines & style palettes.</p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-[#101115] border border-white/5 rounded-2xl p-4 flex flex-col justify-between relative group overflow-hidden hover:border-[#a8ff35]/30 duration-300">
                <div className="w-full bg-[#050608] rounded-xl h-36 flex items-center justify-center relative overflow-hidden p-2 border border-white/10 group-hover:border-[#a8ff35]/50 duration-300">
                  {/* Viewfinder corner lines */}
                  <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-[#a8ff35]" />
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-[#a8ff35]" />
                  <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l border-[#a8ff35]" />
                  <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-[#a8ff35]" />
                  
                  {/* Viewfinder Slider Scale left & right */}
                  <div className="absolute left-2 top-4 bottom-4 w-[1px] bg-white/10 flex flex-col justify-between items-center py-0.5 font-mono">
                    <span className="w-1.5 h-[1px] bg-[#a8ff35]" />
                    <span className="w-1 h-[1px] bg-[#a8ff35]" />
                    <span className="w-1.5 h-0.5 bg-[#a8ff35] rounded-full translate-y-1" />
                  </div>
                  
                  {/* Center Target Crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div className="w-3.5 h-3.5 border border-[#a8ff35] rounded-full flex items-center justify-center">
                      <div className="w-1 h-1 bg-[#a8ff35] rounded-full" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500/20 to-fuchsia-500/20 w-full h-full rounded flex items-center justify-center font-bold text-zinc-300">
                    <span className="text-xs uppercase tracking-widest">PINS TEMPL x2</span>
                  </div>

                  {/* Bottom camera tag overlay */}
                  <div className="absolute bottom-1.5 left-6 right-6 bg-[#a8ff35] text-black px-1.5 py-0.5 rounded flex items-center justify-between text-[7px] font-black uppercase tracking-wider font-mono">
                    <span>CTR BOUNTY</span>
                    <span>1.15 ETH</span>
                  </div>
                </div>
                <div className="mt-3.5">
                  <p className="font-bold text-white text-xs font-sans">High-CTR Pin Assets</p>
                  <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Conversion layouts designed targeting SaaS clicks.</p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-[#101115] border border-white/5 rounded-2xl p-4 flex flex-col justify-between relative group overflow-hidden hover:border-[#a8ff35]/30 duration-300">
                <div className="w-full bg-[#050608] rounded-xl h-36 flex items-center justify-center relative overflow-hidden p-2 border border-white/10 group-hover:border-[#a8ff35]/50 duration-300">
                  {/* Viewfinder corner lines */}
                  <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-[#a8ff35]" />
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-[#a8ff35]" />
                  <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l border-[#a8ff35]" />
                  <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-[#a8ff35]" />
                  
                  {/* Viewfinder Slider Scale left & right */}
                  <div className="absolute left-2 top-4 bottom-4 w-[1px] bg-white/10 flex flex-col justify-between items-center py-0.5">
                    <span className="w-1.5 h-0.5 bg-[#a8ff35] rounded-full" />
                    <span className="w-1 h-[1px] bg-[#a8ff35]" />
                    <span className="w-1.5 h-[1px] bg-[#a8ff35]" />
                  </div>
                  
                  {/* Center Target Crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div className="w-3.5 h-3.5 border border-[#a8ff35] rounded-full flex items-center justify-center">
                      <div className="w-1 h-1 bg-[#a8ff35] rounded-full" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-500/20 to-rose-500/20 w-full h-full rounded flex items-center justify-center font-bold text-zinc-300">
                    <span className="text-xs uppercase tracking-widest">ISOMETRIC MAP</span>
                  </div>

                  {/* Bottom camera tag overlay */}
                  <div className="absolute bottom-1.5 left-6 right-6 bg-[#a8ff35] text-black px-1.5 py-0.5 rounded flex items-center justify-between text-[7px] font-black uppercase tracking-wider font-mono">
                    <span>VECTOR PACK</span>
                    <span>2.40 ETH</span>
                  </div>
                </div>
                <div className="mt-3.5">
                  <p className="font-bold text-white text-xs font-sans">Vector Media Art</p>
                  <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Isometric headers & landing banners.</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 3. DYNAMIC SPECIALTIES CATALOG (when "My Catalog" is active) */}
        {activeTab === 'catalog' && (
          <div className="p-6 bg-[#0c0d11] rounded-[28px] border border-[#a8ff35]/20 space-y-4 animate-fade-in">
            <h3 className="text-md font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#a8ff35]" />
              <span>Available Pre-made Design Bounties</span>
            </h3>
            <p className="text-xs text-zinc-400">Claim these targeted design packages. They integrate natively with your local collections immediately.</p>
            <div className="space-y-2.5">
              {[
                { title: 'SaaS Startups Logo Premium Pack', price: '$220', time: '2 Days Delivery' },
                { title: 'Viral Affiliate Pinterest CTR pins (15 Templates)', price: '$140', time: '1 Day Delivery' },
                { title: 'Responsive Landing Layout Wireframe Style Guide', price: '$350', time: '3 Days Delivery' }
              ].map((c, idx) => (
                <div key={idx} className="flex justify-between items-center bg-zinc-950 p-4 border border-white/5 rounded-xl hover:border-[#a8ff35]/10 duration-200">
                  <div>
                    <h4 className="text-xs font-bold text-white">{c.title}</h4>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">{c.time}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#a8ff35] font-mono font-bold text-sm bg-[#a8ff35]/5 px-2.5 py-1 rounded border border-[#a8ff35]/15">{c.price}</span>
                    <Button size="sm" onClick={() => setIsBookingOpen(true)}>Book Bundle</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WHAT I DO GRID (FROM ORIGINAL IMAGE) */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-zinc-500 pl-1">
            what I do
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-41 mt-2">
            {[
              { title: 'BRAND IDENTITY & LOGO DESIGN', desc: 'Custom vectors, guidelines, style books, and typography maps.' },
              { title: 'SOCIAL MEDIA ADS / DESIGN', desc: 'High conversion social ads, repin loops graphics, and header bundles.' },
              { title: 'YOUTUBE THUMBNAILS', desc: 'Maximum CTR expressions, vibrant compositions, and engaging dynamic titles.' },
              { title: 'MOVIE POSTERS / ALBUM COVERS', desc: 'Cinematic layout overlays, editorial graphic poster arts, and cover palettes.' },
              { title: 'SPORTS DESIGN', desc: 'Vigorous high-energy athlete portraits, event posters, and apparel vectors.' },
              { title: 'AI PROMPT FOR DESIGN AND OTHERS', desc: 'Custom parametric prompt structures for Midjourney or Stable Diffusion.' }
            ].map((srv, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                  setBookingForm(prev => ({ ...prev, service: srv.title }));
                  setIsBookingOpen(true);
                }}
                className="group/card bg-[#111216] border border-white/5 hover:border-[#a8ff35]/20 p-5 rounded-2xl flex items-center justify-between text-left transition duration-300 hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="space-y-1.5 pr-4">
                  <h4 className="text-xs font-bold text-white tracking-wide group-hover/card:text-[#a8ff35] transition duration-300">{srv.title}</h4>
                  <p className="text-[10px] leading-relaxed text-zinc-400">{srv.desc}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 group-hover/card:bg-[#a8ff35] group-hover/card:text-black flex items-center justify-center text-[#a8ff35] duration-300 flex-shrink-0">
                  <MousePointerClick className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CONTACT FOOTER */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">Contact rence ivann</p>
          <div className="flex gap-3">
            {[
              { icon: Mail, label: 'Gmail', action: 'mailto:ivan@affiliateos.com' },
              { icon: Instagram, label: 'Instagram', action: '#' },
              { icon: MessageSquare, label: 'Whatsapp', action: '#' },
              { icon: Twitter, label: 'X/Twitter', action: '#' },
              { icon: Dribbble, label: 'Pinterest', action: '#' },
              { icon: FolderLock, label: 'Behance', action: '#' }
            ].map((soc, idx) => (
              <button 
                key={idx}
                type="button"
                onClick={() => {
                  setBookingForm(prev => ({ ...prev, notes: `Query regarding ${soc.label} referral links...` }));
                  setIsBookingOpen(true);
                }}
                className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/5 hover:border-[#a8ff35]/30 hover:bg-zinc-850 flex items-center justify-center text-zinc-400 hover:text-white transition duration-300"
                title={`Ping on ${soc.label}`}
              >
                <soc.icon className="w-4 h-4 text-zinc-300" />
              </button>
            ))}
          </div>
        </div>

        {/* --- BOOKING MODAL (IVAN) --- */}
        {isBookingOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#101115] border border-white/10 p-6 rounded-3xl max-w-md w-full scrollbar-none animate-scale-up space-y-6 text-zinc-200">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#a8ff35]" />
                  <span className="font-bold text-white text-sm">Secure OptiFlow OS Client Inquiry</span>
                </div>
                <button 
                  onClick={() => setIsBookingOpen(false)} 
                  className="text-zinc-500 hover:text-[#a8ff35] transition duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {bookingSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto animate-pulse">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-md font-bold text-white">Inquiry Forwarded Successfully</h3>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Ivan has been notified via OptiFlow OS routing with your campaign requirements! He will follow up via your address within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBookService} className="space-y-4 text-xs font-sans">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-[#6B6E7B] font-bold block">Selected Service</label>
                    <select 
                      value={bookingForm.service}
                      onChange={e => setBookingForm(prev => ({ ...prev, service: e.target.value }))}
                      className="w-full bg-[#16171d] border border-white/10 rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:border-[#a8ff35]"
                    >
                      <option value="Brand Identity">Brand Identity & Logo ($250+)</option>
                      <option value="Social Media Ads">Social Media & Pins Ads Package ($150+)</option>
                      <option value="YouTube Graphic">High Conversion YouTube Visuals ($100+)</option>
                      <option value="Cinematic Media">Posters & Editorial Album Covers ($300+)</option>
                      <option value="AI prompt engineer">Custom Parametric AI Prompting Pack ($80+)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-[#6B6E7B] font-bold block">Your Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="Enter your email to receive blueprints..." 
                      value={bookingForm.email}
                      onChange={e => setBookingForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-[#16171d] border border-white/10 rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:border-[#a8ff35]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-[#6B6E7B] font-bold block">Brief Project Notes (Optional)</label>
                    <textarea 
                      rows={3}
                      placeholder="Provide campaign details (e.g. niche targets, color parameters...)" 
                      value={bookingForm.notes}
                      onChange={e => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full bg-[#16171d] border border-white/10 rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:border-[#a8ff35]"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1 bg-[#16171d]/30 p-2 rounded-xl">
                    <input 
                      type="checkbox" 
                      checked={bookingForm.urgent}
                      onChange={e => setBookingForm(prev => ({ ...prev, urgent: e.target.checked }))}
                      className="text-[#a8ff35] focus:ring-0 accent-[#a8ff35] rounded bg-[#16171d]" 
                    />
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">Flag as urgent high-priority campaign asset production (24h lead)</span>
                  </label>

                  <div className="pt-3 flex gap-3 text-xs">
                    <button 
                      type="button" 
                      onClick={() => setIsBookingOpen(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-white/5 hover:bg-zinc-900 font-semibold text-zinc-400 transition"
                    >
                      Dismiss
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#a8ff35] text-black font-extrabold hover:bg-[#96e321] transition hover:scale-[1.01]"
                    >
                      Confirm Booking Request
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: SUNIL KUMAR PORTFOLIO EXPERIENCE (GLORIOUS DARK BENTO GRID)
  // ----------------------------------------------------------------------
  if (selectedCreator === 'sunil') {
    return (
      <div className="space-y-8 animate-fade-in text-zinc-300">
        
        {/* Back Menu */}
        <div className="flex justify-between items-center bg-[#0d0e12] p-3 rounded-2xl border border-white/5">
          <button 
            onClick={() => setSelectedCreator('none')}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#a8ff35]" />
            <span>Back to Creator Specialists</span>
          </button>
          <span className="text-[10px] font-mono tracking-widest text-[#a8ff35] font-bold uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#a8ff35] animate-ping" />
            <span>Active Bento Specialist</span>
          </span>
        </div>

        {/* ----------------------------------------------------------------------
            THE AMAZING BENTO GRID MODEL (FOLLOWS IMAGE 2 CRITERIA STRICTLY)
            ---------------------------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 font-sans leading-relaxed">
          
          {/* BENTO BOX 1: Sunil Kumar Illustration Portrait & bio */}
          <div className="md:col-span-4 bg-[#0e0f13] border border-white/5 p-6 rounded-[32px] flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-20 h-20 rounded-[24px] overflow-hidden border border-white/10 bg-gradient-to-[#161820] bg-[#161820] relative">
                  <img src={sunilAvatar} alt="Sunil Kumar headshot Portrait" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                {/* Visual Accent from image mock: Sunil text label */}
                <div className="text-right">
                  <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase font-bold">सुनील</span>
                  <span className="text-[10px] text-[#a8ff35] font-bold block">4+ Years Exp</span>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Sunil Kumar</h3>
                <p className="text-[10px] uppercase font-mono tracking-widest font-bold text-zinc-500">Logo & Brand Designer</p>
                <p className="text-xs text-zinc-400 pt-2 leading-relaxed">
                  My name is Sunil Kumar self-taught logo/brand designer with 4+ years of experience creating modern, clean, and minimal brands that make a lasting impression.
                </p>
              </div>
            </div>

            {/* Interests Box strictly matching Sunil interests box in image */}
            <div className="pt-4 border-t border-white/5 space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 block">Interests</span>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5 text-[10px] font-semibold text-zinc-300">
                  <Gamepad2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Gaming</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5 text-[10px] font-semibold text-zinc-300">
                  <Camera className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Film Making</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5 text-[10px] font-semibold text-zinc-300">
                  <Plane className="w-3.5 h-3.5 text-[#a8ff35]" />
                  <span>Traveling</span>
                </span>
              </div>
            </div>
          </div>

          {/* BENTO BOX 2: EXP TIMELINES (Freelancer & Meetzed) */}
          <div className="md:col-span-5 bg-[#0e0f13] border border-white/5 p-6 rounded-[32px] space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-zinc-500 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" /> Experience Chronology
              </span>

              {/* Freelancer job block */}
              <div className="p-4 bg-zinc-950/60 rounded-2xl border border-white/3 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white">Freelancer</h4>
                  <span className="text-[9px] font-mono text-zinc-500 font-bold bg-[#a8ff35]/10 text-[#a8ff35] px-2 py-0.5 rounded">2021 - NOW</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">Logo / Brand Designer</p>
                <ul className="text-[10px] text-zinc-400 space-y-1 pl-3 list-disc leading-relaxed pt-1">
                  <li>Worked on diverse logo and brand identity projects.</li>
                  <li>Collaborated with clients from multiple countries.</li>
                  <li>Developed a versatile, responsive design skill set.</li>
                </ul>
              </div>

              {/* Meetzed Job Block */}
              <div className="p-4 bg-zinc-950/60 rounded-2xl border border-white/3 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white">Meetzed</h4>
                  <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded">2020 - 2021</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">Graphic Designer</p>
                <ul className="text-[10px] text-zinc-400 space-y-1 pl-3 list-disc leading-relaxed pt-1">
                  <li>Co-collaborators supporting Lead Designer on major projects.</li>
                  <li>Crafted distinctive, optimized brand assets.</li>
                  <li>Deep dive into design systems & layout tools.</li>
                </ul>
              </div>
            </div>

            {/* Quick action helper inside Sunil Bento */}
            <button 
              onClick={() => setShowSunilContact(true)}
              className="w-full py-2 bg-gradient-to-r from-[#a8ff35]/10 to-teal-500/10 border border-[#a8ff35]/25 hover:border-[#a8ff35]/50 text-white font-bold text-xs rounded-xl shadow transition duration-300"
            >
              Collaborate and Hire Sunil
            </button>
          </div>

          {/* BENTO BOX 3: TOOLKIT & STACKS (Design Tools & Editing Tools & Langs) */}
          <div className="md:col-span-3 space-y-5 flex flex-col justify-between">
            {/* Design & Editing Tools Board */}
            <div className="bg-[#0e0f13] border border-white/5 p-5 rounded-[28px] space-y-3.5">
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-zinc-500">design software</span>
              
              <div className="space-y-1">
                <span className="text-[9px] font-semibold text-zinc-500">Creative Suits:</span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {['Ai', 'Ps', 'Id', 'Xd'].map(tool => (
                    <button 
                      key={tool}
                      onClick={() => setActiveToolInfo(tool)}
                      className="px-2.5 py-1 text-[10px] font-bold font-mono rounded-lg bg-zinc-900 border border-white/5 text-[#a8ff35] hover:border-[#a8ff35]/30 cursor-pointer"
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <span className="text-[9px] font-semibold text-zinc-500">Motion & Video:</span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {['Ae', 'Pr', 'Resolve'].map(tool => (
                    <button 
                      key={tool}
                      onClick={() => setActiveToolInfo(tool)}
                      className="px-2.5 py-1 text-[10px] font-bold font-mono rounded-lg bg-zinc-900 border border-white/5 text-[#a8ff35] hover:border-[#a8ff35]/30 cursor-pointer"
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>

              {activeToolInfo && (
                <div className="p-2.5 bg-[#a8ff35]/5 border border-[#a8ff35]/20 rounded-xl text-[9px] text-[#a8ff35] animate-scale-up">
                  <span className="font-bold uppercase font-mono block">{SOFTWARE_ICONS[activeToolInfo]?.label}:</span>
                  <p className="text-zinc-300 mt-0.5 leading-snug">{SOFTWARE_ICONS[activeToolInfo]?.desc}</p>
                </div>
              )}
            </div>

            {/* Languages and Dialects strictly matching Sunil Languages in layout */}
            <div className="bg-[#0e0f13] border border-white/5 p-5 rounded-[28px] space-y-2">
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-zinc-500 block">Languages</span>
              <div className="flex gap-2 pt-1">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5 text-[10px] text-zinc-300 font-semibold" title="Hindi (Primary)">
                  🇮🇳 <span>Hindi</span>
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5 text-[10px] text-zinc-300 font-semibold" title="English (Fluent)">
                  🇬🇧 <span>English</span>
                </span>
              </div>
            </div>

            {/* Education Timeline Block from image */}
            <div className="bg-[#0e0f13] border border-white/5 p-5 rounded-[28px] space-y-3">
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                <GraduationCap className="w-4 h-4 text-[#a8ff35]" /> Academic Training
              </span>

              <div className="space-y-2 text-[10px]">
                <div className="border-l border-white/5 pl-2.5 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="font-bold text-zinc-200">BFA/Fine Arts Graduate</span>
                    <span className="text-[9px] font-mono text-zinc-500">2017-21</span>
                  </div>
                  <p className="text-[9px] text-zinc-500">IGNOU Delhi, India</p>
                </div>

                <div className="border-l border-white/5 pl-2.5 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="font-bold text-zinc-200">Graphic Diploma</span>
                    <span className="text-[9px] font-mono text-zinc-500">2017-18</span>
                  </div>
                  <p className="text-[9px] text-zinc-500">Delhi, India</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* BENTO BOTTOM ROW 1: PORTFOLIO PLATFORMS */}
        <div className="bg-[#0e0f13] border border-white/5 p-5 rounded-[28px] space-y-2">
          <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-widest block pl-1">portfolio destinations</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            {[
              { label: 'Bento', link: '#', style: 'border-pink-500/10 hover:border-pink-400/30' },
              { label: 'Behance', link: '#', style: 'border-blue-500/10 hover:border-blue-400/30' },
              { label: 'Instagram', link: '#', style: 'border-rose-500/10 hover:border-rose-400/30' },
              { label: 'YouTube', link: '#', style: 'border-red-500/10 hover:border-red-400/30' },
              { label: 'Dribbble', link: '#', style: 'border-fuchsia-500/10 hover:border-fuchsia-400/30' }
            ].map((p, idx) => (
              <button 
                key={idx}
                type="button"
                onClick={() => {
                  setShowSunilContact(true);
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 bg-zinc-950 font-semibold text-xs text-zinc-300 rounded-xl border transition duration-300 ${p.style}`}
              >
                <span>{p.label}</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-650" />
              </button>
            ))}
          </div>
        </div>

        {/* BENTO BOTTOM ROW 2: CRITICAL TECHNICAL DETAILS */}
        <div className="bg-[#0b0c10] border border-dashed border-white/5 p-5 rounded-[28px]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-zinc-950 border border-white/3 rounded-xl">
              <span className="text-[9px] text-zinc-500 block">Age bracket</span>
              <span className="font-bold text-white uppercase">26 years</span>
            </div>
            <div className="p-3 bg-zinc-950 border border-white/3 rounded-xl col-span-1">
              <span className="text-[9px] text-zinc-500 block">Contact coordinate</span>
              <span className="font-bold text-[#a8ff35] text-[11px] truncate block">iamsunilfreelancer.com</span>
            </div>
            <div className="p-3 bg-zinc-950 border border-white/3 rounded-xl text-xs">
              <span className="text-[9px] text-zinc-500 block">Telephony contact</span>
              <span className="font-bold text-zinc-200">+91 9899052055</span>
            </div>
            <div className="p-3 bg-zinc-950 border border-white/3 rounded-xl text-xs">
              <span className="text-[9px] text-zinc-500 block">Geographical deployment</span>
              <span className="font-bold text-zinc-200">Delhi, India</span>
            </div>
          </div>
        </div>

        {/* --- SUNIL COLLABORANT INQUIRY PANEL --- */}
        {showSunilContact && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#101115] border border-white/10 p-6 rounded-3xl max-w-sm w-full animate-scale-up space-y-6 text-zinc-200">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="font-bold text-white text-xs uppercase tracking-widest font-mono">syndicate briefing</span>
                <button 
                  onClick={() => setShowSunilContact(false)} 
                  className="text-zinc-500 hover:text-[#a8ff35] transition duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {inquirySent ? (
                <div className="py-10 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#a8ff35]/10 border border-[#a8ff35]/30 flex items-center justify-center text-[#a8ff35] mx-auto animate-pulse">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Briefing Dispatched</h3>
                  <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                    Inquiry synced directly with Sunil Kumar's freelance coordinate channel. He will connect to provide branding assistance on WhatsApp/Email.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendInquiry} className="space-y-4 text-xs">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Instantly pitch a branding idea, joint Pinterest boards request, or design proposal to Sunil Kumar.
                  </p>
                  
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-[#a8ff35] block">Briefing message</label>
                    <textarea 
                      required
                      placeholder="Hi Sunil, let's collaborate on affiliate logo branding..." 
                      rows={4}
                      className="w-full bg-[#16171d] border border-white/10 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-[#a8ff35]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setShowSunilContact(false)}
                      className="flex-1 px-3 py-2 rounded-xl border border-white/5 text-zinc-400 hover:bg-zinc-900 transition"
                    >
                      Dismiss
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 px-3 py-2 rounded-xl bg-[#a8ff35] text-black font-bold hover:bg-[#96e321] transition"
                    >
                      Dispatch Mail
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  return null;
}
