import React from 'react';
import { Hexagon } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  hideText?: boolean;
}

export function Logo({ className, size = 'md', hideText = false }: LogoProps) {
  const isSm = size === 'sm';
  const containerSize = isSm ? 'w-7 h-7' : 'w-8 h-8';
  const textSize = isSm ? 'text-base' : 'text-lg';

  return (
    <div className={cn("flex items-center gap-2.5 font-semibold tracking-tight text-white", textSize, className)}>
      <div className={cn("flex items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#0B1017] shadow-lg shadow-black/40", containerSize)}>
        <img src="/logo.png" alt="OptiFlow" className="w-full h-full object-cover" />
      </div>
      {!hideText && (
        <span className="bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">OptiFlow OS</span>
      )}
    </div>
  );
}
