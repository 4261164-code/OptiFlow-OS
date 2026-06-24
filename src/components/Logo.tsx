import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  hideText?: boolean;
  variant?: 'infinity' | 'circle';
}

export function Logo({ className, size = 'md', hideText = false, variant }: LogoProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';
  
  // Resolve variant: if size is sm and no variant is specified, we can use 'circle' for compact layout, or let 'infinity' scale.
  // Actually, let's default to 'infinity' since that's the gorgeous primary parallel-track identity.
  const resolvedVariant = variant || 'infinity';

  // Sizing definitions
  const containerClasses = cn(
    "flex items-center justify-center overflow-hidden transition-all duration-300",
    resolvedVariant === 'circle'
      ? (isSm ? 'w-7 h-7' : isLg ? 'w-12 h-12' : 'w-9 h-9')
      : (isSm ? 'w-14 h-7' : isLg ? 'w-24 h-12' : 'w-18 h-9')
  );

  const textSize = isSm ? 'text-sm' : isLg ? 'text-xl' : 'text-base';

  return (
    <div className={cn("flex items-center gap-2.5 font-semibold tracking-tight text-white select-none", className)}>
      <div className={containerClasses}>
        {resolvedVariant === 'infinity' ? (
          // OptiFlow OS Full Parallel Track Infinity Logo
          <svg
            viewBox="0 0 100 50"
            className="w-full h-full text-[#a8ff35]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Glowing Background Glow Ribbon */}
            <path
              d="M 50,25 C 62,10 88,10 88,25 C 88,40 62,40 50,25 C 38,10 12,10 12,25 C 12,40 38,40 50,25 Z"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              className="opacity-[0.12]"
              filter="url(#neon-glow)"
            />

            {/* Middle Parallel Track */}
            <path
              d="M 50,25 C 62,10 88,10 88,25 C 88,40 62,40 50,25 C 38,10 12,10 12,25 C 12,40 38,40 50,25 Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="opacity-[0.45]"
            />

            {/* Inner Bright White Core Track */}
            <path
              d="M 50,25 C 62,10 88,10 88,25 C 88,40 62,40 50,25 C 38,10 12,10 12,25 C 12,40 38,40 50,25 Z"
              stroke="#ffffff"
              strokeWidth="0.75"
              strokeLinecap="round"
              className="opacity-95"
            />

            {/* Left Loop 'O' Ring Inner Details */}
            <circle cx="30" cy="25" r="7.5" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 1.5" className="opacity-40" />
            <circle cx="30" cy="25" r="4.5" stroke="currentColor" strokeWidth="0.5" className="opacity-30" />
            
            {/* Small Up-Right Trend Arrow inside Left Circle */}
            <path
              d="M 27.5,27.5 L 31.5,23.5 M 29,23.5 L 31.5,23.5 L 31.5,26"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-80"
            />

            {/* Right Loop 'F' Inner Details */}
            <circle cx="70" cy="25" r="7.5" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 2.5" className="opacity-30" />
            <path
              d="M 67.5,31 L 67.5,19.5 C 67.5,19.5 67.5,18 69.5,18 L 74,18 M 67.5,24 L 71.5,24"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-90"
            />

            {/* Glowing Central Hub Dot */}
            <circle cx="50" cy="25" r="5" stroke="currentColor" strokeWidth="0.5" className="opacity-25" />
            <circle cx="50" cy="25" r="3" fill="#ffffff" filter="url(#neon-glow)" />

            {/* Futuristic Orbit Indicators (Decors) */}
            <circle cx="18" cy="14" r="0.75" fill="currentColor" className="opacity-40" />
            <path d="M 16,13 L 18,14" stroke="currentColor" strokeWidth="0.5" className="opacity-30" />
            
            <path d="M 14,35 L 17,33" stroke="currentColor" strokeWidth="0.5" className="opacity-30" />
            
            <circle cx="83" cy="33" r="1" stroke="currentColor" strokeWidth="0.5" className="opacity-40" />
            <path d="M 83,31.5 L 83,34.5 M 81.5,33 L 84.5,33" stroke="currentColor" strokeWidth="0.5" className="opacity-30" />
          </svg>
        ) : (
          // Compact Concentric Target Circular Variant (from bottom row of layout)
          <svg
            viewBox="0 0 40 40"
            className="w-full h-full text-[#a8ff35]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="neon-glow-circle" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            {/* Concentric Tracks */}
            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" className="opacity-[0.12]" filter="url(#neon-glow-circle)" />
            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1.2" className="opacity-40" />
            <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="0.8" className="opacity-30" />
            <circle cx="20" cy="20" r="9" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 1.5" className="opacity-50" />
            
            {/* Center target arrow */}
            <path
              d="M 16.5,23.5 L 23,17 M 19.5,17 L 23,17 L 23,20.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-90"
            />
            {/* Tiny center point */}
            <circle cx="20" cy="20" r="1.5" fill="#ffffff" />
          </svg>
        )}
      </div>
      {!hideText && (
        <span className={cn("font-bold tracking-tight bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent", textSize)}>
          OptiFlow<span className="text-[#a8ff35] ml-1 select-none">OS</span>
        </span>
      )}
    </div>
  );
}
