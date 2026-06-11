import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Search, 
  Layers, 
  Workflow, 
  Bot, 
  History, 
  LineChart, 
  Users2, 
  ChevronRight,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { Button } from './ui';
import { BubblyAppleIcon, CloverMascotIcon, BrandingHexIcon, BrandingXIcon } from './CustomIcons';

// ----------------------------------------------------------------------
// 1. GORGEOUS ISOMETRIC CUSTOM VECTOR ART COMPONENTS
// ----------------------------------------------------------------------

function IsometricClockCube() {
  return (
    <svg viewBox="0 0 200 200" className="w-48 h-48 select-none drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Soft Ambient shadows */}
      <ellipse cx="100" cy="165" rx="65" ry="15" fill="black" fillOpacity="0.32" filter="blur(8px)" />
      
      {/* CUBE BASE */}
      {/* Left Wall (Deep Cobalt Blue / Navy) */}
      <path d="M40 90 L100 125 L100 165 L40 130 Z" fill="#1e3a8a" opacity="0.9" />
      <path d="M40 90 L100 125 L100 165 L40 130 Z" fill="url(#blueLeftGrad)" />
      
      {/* Right Wall (Medium Blue) */}
      <path d="M100 125 L160 90 L160 130 L100 165 Z" fill="#2563eb" opacity="0.95" />
      <path d="M100 125 L160 90 L160 130 L100 165 Z" fill="url(#blueRightGrad)" />
      
      {/* Top Face (Electric Teal / Blue) */}
      <path d="M40 90 L100 55 L160 90 L100 125 Z" fill="#3b82f6" />
      <path d="M40 90 L100 55 L160 90 L100 125 Z" fill="url(#blueTopGrad)" />

      {/* CLOCK DIAL ON THE LEFT FACE (Isometrically Flattened Ellipse) */}
      <g transform="translate(0, 0)">
        {/* Outer neon ring */}
        <path d="M50 112 C50 102 70 105 85 117 C92 122 92 130 85 133 C70 140 50 130 50 112 Z" stroke="#a8ff35" strokeWidth="2.5" fill="#0c1020" fillOpacity="0.85" />
        {/* Clock center pin */}
        <ellipse cx="71" cy="119" rx="2" ry="1.2" fill="#a8ff35" />
        {/* Clock hands */}
        <line x1="71" y1="119" x2="63" y2="114" stroke="#a8ff35" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="71" y1="119" x2="73" y2="128" stroke="#a8ff35" strokeWidth="1.8" strokeLinecap="round" />
        {/* Clock tick accents */}
        <circle cx="58" cy="111" r="1" fill="#fff" opacity="0.8" />
        <circle cx="84" cy="125" r="1" fill="#fff" opacity="0.8" />
      </g>

      {/* THREE 3D BUILDING BLOCKS ON TOP FACE (Orange Stack) */}
      <g transform="translate(0, -6)">
        {/* Lower Block */}
        <path d="M85 68 L105 57 L125 68 L105 79 Z" fill="#ea580c" />
        <path d="M85 68 L105 57 L125 68 L105 79 Z" fill="url(#orangeTopGrad)" />
        <path d="M85 68 L105 79 L105 88 L85 77 Z" fill="#9a3412" />
        <path d="M105 79 L125 68 L125 77 L105 88 Z" fill="#c2410c" />

        {/* Medium Stack Side Block */}
        <path d="M110 60 L125 52 L140 60 L125 68 Z" fill="#f97316" />
        <path d="M110 60 L125 52 L140 60 L125 68 Z" fill="url(#orangeLightGrad)" />
        <path d="M110 60 L125 68 L125 75 L110 67 Z" fill="#ea580c" />
        <path d="M125 68 L140 60 L140 67 L125 75 Z" fill="#f97316" />
      </g>

      {/* YELLOW COMPLETED FLYOUT FOLDER (On the Right) */}
      <g transform="translate(15, 5)">
        {/* Folder backing */}
        <path d="M142 98 L168 83 L182 91 L156 106 Z" fill="#eab308" />
        {/* White papers emerging isometrically */}
        <path d="M147 93 L169 80 L176 84 L154 97 Z" fill="#ffffff" />
        <path d="M149 91 L166 81 L172 84 L155 94 Z" fill="#ffffff" />
        {/* Folder front flap */}
        <path d="M142 101 L164 88 L180 97 L158 110 Z" fill="#facc15" />
        {/* Green tiny ascending arrow pointing up on the file */}
        <path d="M165 94 L170 91 M170 91 L167 91 M170 91 L170 94" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Decorative Grid Lines around base */}
      <path d="M20 120 L80 155 M110 173 L180 133" stroke="white" strokeWidth="1" strokeDasharray="3,3" opacity="0.15" />

      {/* SVG GRADIENT DEFINITIONS */}
      <defs>
        <linearGradient id="blueLeftGrad" x1="40" y1="90" x2="100" y2="165" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="blueRightGrad" x1="100" y1="125" x2="160" y2="165" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="blueTopGrad" x1="100" y1="55" x2="100" y2="125" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="orangeTopGrad" x1="105" y1="57" x2="105" y2="79" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="orangeLightGrad" x1="125" y1="52" x2="125" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function IsometricMailToaster() {
  return (
    <svg viewBox="0 0 200 200" className="w-48 h-48 select-none drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Base shadow */}
      <ellipse cx="100" cy="160" rx="55" ry="12" fill="black" fillOpacity="0.4" filter="blur(6px)" />

      {/* ISOMETRIC TOASTER/MAILBOX SHAPE */}
      {/* Front Face (Slate Silver) */}
      <path d="M45 100 C45 80 50 78 100 110 L100 150 C70 140 45 130 45 100 Z" fill="#3f3f46" />
      <path d="M45 100 C45 80 50 78 100 110 L100 150 C70 140 45 130 45 100 Z" fill="url(#silverFrontGrad)" />

      {/* Right/Side Face (Brushed Silver) */}
      <path d="M100 110 L155 78 C155 78 160 81 160 100 L160 140 L100 150 Z" fill="#52525b" />
      <path d="M100 110 L155 78 C155 78 160 81 160 100 L160 140 L100 150 Z" fill="url(#silverRightGrad)" />

      {/* Rounded Arch Top (Chamber slot) */}
      <path d="M45 100 L100 110 L155 78 C155 60 140 45 100 45 C60 45 45 60 45 100 Z" fill="url(#silverTopGrad)" />

      {/* TOASTER INSERTION SLOT */}
      <path d="M72 63 L128 41 C131 43 125 48 115 52 L62 74 C59 72 64 67 72 63 Z" fill="#18181b" />

      {/* BRIGHT NEON GREEN ENVELOPES ROUTING OUT */}
      {/* Back Envelope */}
      <g transform="translate(6, -20)">
        {/* Envelope back panel */}
        <path d="M75 75 L115 55 L130 65 L90 85 Z" fill="#85b00b" />
        {/* Envelope papers */}
        <path d="M80 72 L112 56 L124 64 L92 80 Z" fill="#ffffff" />
        {/* Front envelope flap */}
        <path d="M75 75 L90 85 L130 65 L108 61 Z" fill="#a8ff35" stroke="#85b00b" strokeWidth="1" />
      </g>
      
      {/* Front Glowing Envelope sliding into slot */}
      <g transform="translate(-5, -6)">
        <path d="M85 85 L120 68 L135 78 L100 95 Z" fill="#9ee220" />
        {/* Flap details */}
        <path d="M85 85 L110 95 L135 78" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="110" cy="85" r="2.5" fill="#ffffff" />
      </g>

      {/* BLUE MAIL FLAG ON THE RIGHT SIDE */}
      <g transform="translate(10, 5)">
        {/* Flag shaft (isometrically angled) */}
        <line x1="140" y1="110" x2="140" y2="78" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
        {/* Flag rectangle rotated */}
        <path d="M140 78 L155 70 L152 61 L137 69 Z" fill="#2563eb" />
        {/* Attachment screw */}
        <circle cx="140" cy="110" r="4.5" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1" />
      </g>

      {/* Elegant label "MAIL" in isometric perspective on front */}
      <text x="60" y="132" fill="#71717a" fontSize="13" fontWeight="950" transform="skewY(22) rotate(-6)" letterSpacing="1">MAIL</text>

      <defs>
        <linearGradient id="silverFrontGrad" x1="45" y1="100" x2="100" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#27272a" />
          <stop offset="100%" stopColor="#52525b" />
        </linearGradient>
        <linearGradient id="silverRightGrad" x1="100" y1="110" x2="160" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#71717a" />
          <stop offset="100%" stopColor="#3f3f46" />
        </linearGradient>
        <linearGradient id="silverTopGrad" x1="100" y1="45" x2="100" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a1a1aa" />
          <stop offset="100%" stopColor="#52525b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function IsometricRetroTerminal() {
  return (
    <svg viewBox="0 0 200 200" className="w-48 h-48 select-none drop-shadow-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Floor glow and shadows */}
      <ellipse cx="100" cy="160" rx="55" ry="12" fill="black" fillOpacity="0.45" filter="blur(7px)" />
      <ellipse cx="100" cy="160" rx="35" ry="8" fill="#d946ef" fillOpacity="0.25" filter="blur(10px)" />

      {/* ISOMETRIC CRT MONITOR CONSOLE */}
      {/* Front Screen Bezel Plane (Glowing Purple) */}
      <path d="M48 95 L112 127 L112 153 L48 121 Z" fill="#701a75" />
      <path d="M48 95 L112 127 L112 153 L48 121 Z" fill="url(#purpleFrontGrad)" />

      {/* Right chassis wall (Pink-Magenta Gradient) */}
      <path d="M112 127 L162 92 L162 118 L112 153 Z" fill="#c026d3" />
      <path d="M112 127 L162 92 L162 118 L112 153 Z" fill="url(#magentaRightGrad)" />

      {/* Top chassis hood */}
      <path d="M48 95 L95 62 L162 92 L112 127 Z" fill="#e879f9" />
      <path d="M48 95 L95 62 L162 92 L112 127 Z" fill="url(#magentaTopGrad)" />

      {/* GLOWING LIME GREEN CRT INNER TUBE SCREEN */}
      <path d="M54 102 L106 128 L106 145 L54 119 Z" fill="#18181b" />
      <path d="M54 102 L106 128 L106 145 L54 119 Z" fill="url(#screenGlassGrad)" />
      
      {/* Neon Scanlines / Grid lines in perspective */}
      <path d="M54 108 L106 134 M54 114 L106 140 M65 105 L65 125 M85 115 L85 135" stroke="#a8ff35" strokeWidth="0.5" opacity="0.4" />

      {/* LIME-GREEN RETRO ARCADE MASCOT GRAPHIC (Pixel art shape on Screen) */}
      <g transform="translate(1.5, 4)">
        {/* Pixel style alien logo matching our Clover / Apple character vibe */}
        {/* Clovers / Space Invader character */}
        <rect x="71" y="112" width="6" height="5" rx="1.5" fill="#a8ff35" transform="skewY(22) rotate(-5)" />
        <rect x="80" y="116" width="6" height="5" rx="1.5" fill="#a8ff35" transform="skewY(22) rotate(-5)" />
        <path d="M71 123 C71 128 85 134 85 128" stroke="#a8ff35" strokeWidth="1.8" strokeLinecap="round" transform="skewY(22) rotate(-5)" />
        {/* Invader eyes */}
        <circle cx="73" cy="116" r="0.8" fill="#000000" />
        <circle cx="82" cy="120" r="0.8" fill="#000000" />
      </g>

      {/* CONTROL DECK BUTTONS ON BOTTOM RIGHT */}
      <g transform="translate(0, 0)">
        {/* Little isometric venting registers or dials */}
        <ellipse cx="125" cy="138" rx="2" ry="1.2" fill="#a8ff35" />
        <ellipse cx="135" cy="133" rx="2" ry="1.2" fill="#ec4899" />
        <ellipse cx="145" cy="128" rx="2" ry="1.2" fill="#3b82f6" />
        
        {/* Power LED Indicator */}
        <ellipse cx="118" cy="143" rx="1.5" ry="0.8" fill="#a8ff35" className="animate-pulse" />
      </g>

      {/* Grid wiring background matrix */}
      <path d="M10 160 Q60 175 120 165 T180 170" stroke="rgba(217, 70, 239, 0.2)" strokeWidth="1.5" />

      <defs>
        <linearGradient id="purpleFrontGrad" x1="48" y1="95" x2="112" y2="153" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4a044e" />
          <stop offset="100%" stopColor="#701a75" />
        </linearGradient>
        <linearGradient id="magentaRightGrad" x1="112" y1="127" x2="162" y2="118" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#701a75" />
        </linearGradient>
        <linearGradient id="magentaTopGrad" x1="105" y1="62" x2="105" y2="127" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#c026d3" />
        </linearGradient>
        <linearGradient id="screenGlassGrad" x1="80" y1="102" x2="80" y2="145" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#022c22" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ----------------------------------------------------------------------
// 2. MAIN HUB COMPONENT
// ----------------------------------------------------------------------

interface AgentLauncherProps {
  onToggleToAnalytics?: () => void;
  activeCampaignsCount: number;
  completedArticlesCount: number;
}

export function AgentLauncher({ 
  onToggleToAnalytics, 
  activeCampaignsCount = 0, 
  completedArticlesCount = 0 
}: AgentLauncherProps) {
  
  return (
    <div className="space-y-8 animate-fade-in">
      {/* 2.1 TITLE BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#a8ff35] tracking-widest bg-[#a8ff35]/10 px-3 py-1 rounded-full border border-[#a8ff35]/20 mb-2 inline-block">
            Autonomous Agent Orchestration
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans sm:text-4xl">
            Agent Launcher Hub
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 max-w-2xl leading-relaxed">
            Welcome to AffiliateOS. Fire up our primary target builder to deploy organic search silos, or command specialized visual content and matchmaking agents in real time.
          </p>
        </div>
        {onToggleToAnalytics && (
          <div className="flex items-center gap-3">
            <button 
              onClick={onToggleToAnalytics}
              className="text-xs font-semibold px-4 py-2.5 rounded-full bg-zinc-900 border border-white/5 hover:border-[#a8ff35]/20 text-zinc-300 hover:text-[#a8ff35] transition duration-300 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <LineChart className="w-4 h-4" />
              <span>Operational Analytics Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2.2 THE THREE HIGH-FIDELITY ISOMETRIC AGENT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        
        {/* AGENT 1 - SEOLinkAgent AUTOPILOT (THIS AGENT) */}
        <div id="card-seo-agent" className="bg-[#101115] border border-white/5 rounded-[32px] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-[#a8ff35]/30 shadow-2xl relative group overflow-hidden">
          {/* Subtle glowing halo */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#a8ff35]/5 rounded-full blur-3xl group-hover:bg-[#a8ff35]/10 transition-all font-sans" />
          
          <div className="space-y-5">
            {/* Visual Isometric Asset Block surrounded by cyber viewfinder container */}
            <div className="w-full bg-[#050608] rounded-2xl h-44 flex items-center justify-center border-3 border-[#a8ff35]/85 relative overflow-hidden group-hover:bg-[#08090d] transition-colors p-2">
              
              {/* Cyber viewfinder corner brackets */}
              <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#a8ff35]" />
              <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#a8ff35]" />
              <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#a8ff35]" />
              <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#a8ff35]" />

              {/* Viewfinder Slider Scale left & right */}
              <div className="absolute left-2.5 top-8 bottom-8 w-[1px] bg-white/10 flex flex-col justify-between items-center py-1">
                <span className="w-1.5 h-[1px] bg-[#a8ff35]" />
                <span className="w-1 h-[1px] bg-white/20" />
                <span className="w-2.5 h-1 bg-[#a8ff35] rounded-full shadow" />
                <span className="w-1 h-[1px] bg-white/20" />
                <span className="w-1.5 h-[1px] bg-[#a8ff35]" />
              </div>
              <div className="absolute right-2.5 top-8 bottom-8 w-[1px] bg-white/10 flex flex-col justify-between items-center py-1">
                <span className="w-1.5 h-[1px] bg-white/40" />
                <span className="w-2.5 h-1 bg-white/90 rounded-full shadow translate-y-1" />
                <span className="w-1.5 h-[1px] bg-white/40" />
                <span className="w-1.5 h-[1px] bg-white/40" />
              </div>

              {/* Central optical target target */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
                <div className="w-5 h-5 border border-dashed border-white rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </div>

              {/* Viewfinder digital metadata labels */}
              <div className="absolute top-2.5 left-8 text-[7px] text-[#a8ff35] uppercase font-bold tracking-widest flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span>REC // AUTONOMOUS</span>
              </div>
              
              <div className="absolute top-2.5 right-8 text-[7px] text-zinc-400 font-mono font-semibold">
                ISO 400
              </div>

              {/* The high quality SVG illustration */}
              <div className="transform scale-90 group-hover:scale-95 transition-transform duration-300">
                <IsometricClockCube />
              </div>

              {/* Bottom camera tag overlay like Beast cards in image 1 */}
              <div className="absolute bottom-2 left-8 right-8 bg-[#a8ff35] text-black px-2 py-0.5 rounded flex items-center justify-between text-[8px] font-black uppercase tracking-wider select-none font-mono">
                <span>SEO - CLUSTER</span>
                <span className="bg-black/10 px-1 py-0.2 rounded font-sans font-extrabold text-[#111]">{activeCampaignsCount} LIVE</span>
              </div>
            </div>

            {/* Description Block */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-sans group-hover:text-[#a8ff35] transition-colors">
                SEOLinkAgent Autopilot
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans min-h-[64px]">
                Orchestrates complete, self-linking keyword silos. Researches programmatic intent, writes optimized affiliate articles, and builds inner linking maps automatically.
              </p>
            </div>

            {/* Realtime Statistics Pill */}
            <div className="bg-[#0e1014] border border-white/3 rounded-xl p-3 flex items-center justify-between text-xs text-zinc-500 font-sans">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a8ff35] animate-pulse" />
                <span className="font-mono text-[10px]">OPERATIONAL STATE:</span>
              </div>
              <span className="font-bold text-white text-xs font-mono">ACTIVE (3.8x Velocity)</span>
            </div>
          </div>

          <div className="pt-6">
            <Button asChild className="w-full justify-center bg-[#a8ff35] text-black hover:bg-[#99eb26] font-bold text-xs py-5 rounded-2xl tracking-wide group-hover:scale-[1.01] transition-transform">
              <Link to="/new">
                GET STARTED
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
              </Link>
            </Button>
          </div>
        </div>

        {/* AGENT 2 - CREATIVE VISUAL AGENT (PINTEREST MEDIA) */}
        <div id="card-pinterest-agent" className="bg-[#101115] border border-white/5 rounded-[32px] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-[#a8ff35]/30 shadow-2xl relative group overflow-hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#a8ff35]/5 rounded-full blur-3xl group-hover:bg-[#a8ff35]/10 transition-all" />
          
          <div className="space-y-5">
            {/* Visual Isometric Asset Block surrounded by cyber viewfinder container */}
            <div className="w-full bg-[#050608] rounded-2xl h-44 flex items-center justify-center border-3 border-[#a8ff35]/85 relative overflow-hidden group-hover:bg-[#08090d] transition-colors p-2">
              
              {/* Cyber viewfinder corner brackets */}
              <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#a8ff35]" />
              <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#a8ff35]" />
              <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#a8ff35]" />
              <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#a8ff35]" />

              {/* Viewfinder Slider Scale left & right */}
              <div className="absolute left-2.5 top-8 bottom-8 w-[1px] bg-white/10 flex flex-col justify-between items-center py-1">
                <span className="w-1 text-[1px] bg-white/20" />
                <span className="w-2.5 h-1 bg-[#a8ff35] rounded-full shadow translate-y-3" />
                <span className="w-1.5 h-[1px] bg-[#a8ff35]" />
                <span className="w-1 h-[1px] bg-white/20" />
              </div>
              <div className="absolute right-2.5 top-8 bottom-8 w-[1px] bg-white/10 flex flex-col justify-between items-center py-1">
                <span className="w-1.5 h-[1px] bg-[#a8ff35]" />
                <span className="w-2.5 h-1 bg-white/90 rounded-full shadow" />
                <span className="w-1.5 h-[1px] bg-white/40" />
                <span className="w-1.5 h-[1px] bg-white/40" />
              </div>

              {/* Central optical target target */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
                <div className="w-5 h-5 border border-dashed border-white rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </div>

              {/* Viewfinder digital metadata labels */}
              <div className="absolute top-2.5 left-8 text-[7px] text-[#a8ff35] uppercase font-bold tracking-widest flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>ONLINE // SYNDICATING</span>
              </div>
              
              <div className="absolute top-2.5 right-8 text-[7px] text-zinc-400 font-mono font-semibold">
                F/2.8 HDR
              </div>

              {/* The high quality SVG illustration */}
              <div className="transform scale-90 group-hover:scale-95 transition-transform duration-300">
                <IsometricMailToaster />
              </div>

              {/* Bottom camera tag overlay like Beast cards in image 1 */}
              <div className="absolute bottom-2 left-8 right-8 bg-[#a8ff35] text-black px-2 py-0.5 rounded flex items-center justify-between text-[8px] font-black uppercase tracking-wider select-none font-mono">
                <span>PINNING // CTR</span>
                <span className="bg-black/10 px-1 py-0.2 rounded font-sans font-extrabold text-[#111]">96% WEIGHT</span>
              </div>
            </div>

            {/* Description Block */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-sans group-hover:text-[#a8ff35] transition-colors">
                Pinterest Creative Agent
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans min-h-[64px]">
                Designs custom board visuals and schedule-posts high-referral social pins. Drives targeted Pinterest traffic immediately to your newly optimized SEO articles.
              </p>
            </div>

            {/* Realtime Statistics Pill */}
            <div className="bg-[#0e1014] border border-white/3 rounded-xl p-3 flex items-center justify-between text-xs text-zinc-500 font-sans">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a8ff35] animate-pulse" />
                <span className="font-mono text-[10px]">ASSETS GENERATED:</span>
              </div>
              <span className="font-bold text-white text-xs font-mono">INFINITE DEPLOY</span>
            </div>
          </div>

          <div className="pt-6">
            <Button asChild className="w-full justify-center bg-[#a8ff35] text-black hover:bg-[#99eb26] font-bold text-xs py-5 rounded-2xl tracking-wide group-hover:scale-[1.01] transition-transform">
              <Link to="/pins">
                GET STARTED
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
              </Link>
            </Button>
          </div>
        </div>

        {/* AGENT 3 - AFFILIATE CONSOLE MATCHMAKER */}
        <div id="card-match-agent" className="bg-[#101115] border border-white/5 rounded-[32px] p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-[#a8ff35]/30 shadow-2xl relative group overflow-hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#a8ff35]/5 rounded-full blur-3xl group-hover:bg-[#a8ff35]/10 transition-all font-sans" />
          
          <div className="space-y-5">
            {/* Visual Isometric Asset Block surrounded by cyber viewfinder container */}
            <div className="w-full bg-[#050608] rounded-2xl h-44 flex items-center justify-center border-3 border-[#a8ff35]/85 relative overflow-hidden group-hover:bg-[#08090d] transition-colors p-2">
              
              {/* Cyber viewfinder corner brackets */}
              <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#a8ff35]" />
              <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#a8ff35]" />
              <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#a8ff35]" />
              <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#a8ff35]" />

              {/* Viewfinder Slider Scale left & right */}
              <div className="absolute left-2.5 top-8 bottom-8 w-[1px] bg-white/10 flex flex-col justify-between items-center py-1">
                <span className="w-1.5 h-[1px] bg-[#a8ff35]" />
                <span className="w-1.5 h-[1px] bg-white/40" />
                <span className="w-2.5 h-1 bg-white/90 rounded-full shadow" />
                <span className="w-1.5 h-[1px] bg-white/40" />
              </div>
              <div className="absolute right-2.5 top-8 bottom-8 w-[1px] bg-white/10 flex flex-col justify-between items-center py-1">
                <span className="w-1 text-[1px] bg-white/20" />
                <span className="w-2.5 h-1 bg-[#a8ff35] rounded-full shadow -translate-y-2" />
                <span className="w-1.5 h-[1px] bg-[#a8ff35]" />
                <span className="w-1 h-[1px] bg-white/20" />
              </div>

              {/* Central optical target target */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
                <div className="w-5 h-5 border border-dashed border-white rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              </div>

              {/* Viewfinder digital metadata labels */}
              <div className="absolute top-2.5 left-8 text-[7px] text-[#a8ff35] uppercase font-bold tracking-widest flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block animate-pulse" />
                <span>SYNC // BOUNTY</span>
              </div>
              
              <div className="absolute top-2.5 right-8 text-[7px] text-zinc-400 font-mono font-semibold">
                60FPS LIVE
              </div>

              {/* The high quality SVG illustration */}
              <div className="transform scale-90 group-hover:scale-95 transition-transform duration-300">
                <IsometricRetroTerminal />
              </div>

              {/* Bottom camera tag overlay like Beast cards in image 1 */}
              <div className="absolute bottom-2 left-8 right-8 bg-[#a8ff35] text-black px-2 py-0.5 rounded flex items-center justify-between text-[8px] font-black uppercase tracking-wider select-none font-mono">
                <span>BOUNTY // FIT</span>
                <span className="bg-black/10 px-1 py-0.2 rounded font-sans font-extrabold text-[#111]">100% MATCH</span>
              </div>
            </div>

            {/* Description Block */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-sans group-hover:text-[#a8ff35] transition-colors">
                Affiliate Deal Matchmaker
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans min-h-[64px]">
                Scours major affiliate directories for the highest-paying sponsorships. Synchronizes programmatic bids to match keywords built by the core agent instantly.
              </p>
            </div>

            {/* Realtime Statistics Pill */}
            <div className="bg-[#0e1014] border border-white/3 rounded-xl p-3 flex items-center justify-between text-xs text-zinc-500 font-sans">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a8ff35] animate-pulse" />
                <span className="font-mono text-[10px]">DATABASE SYNC:</span>
              </div>
              <span className="font-bold text-white text-xs font-mono">SYNCED LIVE</span>
            </div>
          </div>

          <div className="pt-6">
            <Button asChild className="w-full justify-center bg-[#a8ff35] text-black hover:bg-[#99eb26] font-bold text-xs py-5 rounded-2xl tracking-wide group-hover:scale-[1.01] transition-transform">
              <Link to="/affiliate-match">
                GET STARTED
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
              </Link>
            </Button>
          </div>
        </div>

      </div>

      {/* 2.3 SECTION: CHOOSE OTHER OPERATIONAL DEEP AGENTS */}
      <div className="space-y-6 pt-10 border-t border-white/5 relative">
        <div className="absolute top-0 right-10 w-24 h-[1px] bg-gradient-to-r from-transparent via-[#a8ff35]/30 to-transparent" />
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Choose Other Autonomous Sub-Agents
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Toggle, manage, or deploy specialized operational engines configured directly within AffiliateOS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Sub-Agent A: Semantic Map Silos Builder */}
          <Link 
            to="/seo-clusters" 
            className="flex items-center justify-between p-4.5 bg-gradient-to-br from-[#0e0f12] to-[#0a0b0d] hover:from-[#13151b] hover:to-[#0d0e11] border border-white/5 hover:border-[#a8ff35]/25 rounded-[22px] transition duration-300 group shadow-lg shadow-black/25 relative overflow-hidden"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#a8ff35]/10 text-[#a8ff35] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <BrandingHexIcon className="w-5.5 h-5.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-[#a8ff35] transition-colors">SEO Pillar Architect</p>
                <p className="text-[10.5px] text-zinc-400 font-mono tracking-wide font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#a8ff35] shadow-[0_0_8px_#a8ff35] animate-pulse"></span>LSI semantic structures</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-650 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Sub-Agent B: WordPress Auto-Publisher */}
          <Link 
            to="/publishing" 
            className="flex items-center justify-between p-4.5 bg-gradient-to-br from-[#0e0f12] to-[#0a0b0d] hover:from-[#13151b] hover:to-[#0d0e11] border border-white/5 hover:border-[#a8ff35]/25 rounded-[22px] transition duration-300 group shadow-lg shadow-black/25 relative overflow-hidden"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#a8ff35]/10 text-[#a8ff35] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <History className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-[#a8ff35] transition-colors">WP Auto-Publisher</p>
                <p className="text-[10px] text-zinc-500 font-medium">Automatic article publishing queue</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-650 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Sub-Agent C: Traffic Optimizer */}
          <Link 
            to="/traffic-engine" 
            className="flex items-center justify-between p-4 bg-[#0e0f12] hover:bg-[#121317] border border-white/5 hover:border-[#a8ff35]/20 rounded-2xl transition duration-300 group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#a8ff35]/10 text-[#a8ff35] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-[#a8ff35] transition-colors">Traffic Engine</p>
                <p className="text-[10px] text-zinc-500 font-medium">Organic distribution & indices</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-650 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Sub-Agent D: Creator Network Exchange */}
          <Link 
            to="/creator-network" 
            className="flex items-center justify-between p-4.5 bg-gradient-to-br from-[#0e0f12] to-[#0a0b0d] hover:from-[#13151b] hover:to-[#0d0e11] border border-white/5 hover:border-[#a8ff35]/25 rounded-[22px] transition duration-300 group shadow-lg shadow-black/25 relative overflow-hidden"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#a8ff35]/10 text-[#a8ff35] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Users2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-[#a8ff35] transition-colors">Creator Network</p>
                <p className="text-[10px] text-zinc-500 font-medium">Connective creator nodes</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-650 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Sub-Agent E: System Configuration Panel */}
          <Link 
            to="/settings" 
            className="flex items-center justify-between p-4 bg-[#0e0f12] hover:bg-[#121317] border border-white/5 hover:border-[#a8ff35]/20 rounded-2xl transition duration-300 group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#a8ff35]/10 text-[#a8ff35] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-[#a8ff35] transition-colors">Agent Configurations</p>
                <p className="text-[10px] text-zinc-500 font-medium">Manage server-side health & API</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-650 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Sub-Agent F: System Core Diagnostics */}
          <Link 
            to="/agents" 
            className="flex items-center justify-between p-4 bg-[#0e0f12] hover:bg-[#121317] border border-white/5 hover:border-[#a8ff35]/20 rounded-2xl transition duration-300 group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#a8ff35]/10 text-[#a8ff35] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <BrandingXIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-[#a8ff35] transition-colors">Diagnostics Console</p>
                <p className="text-[10px] text-zinc-500 font-medium">Verify system loops & speed keys</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-650 group-hover:translate-x-0.5 transition-transform" />
          </Link>

        </div>
      </div>
      
    </div>
  );
}
