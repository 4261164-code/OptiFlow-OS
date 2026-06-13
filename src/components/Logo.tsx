import React from 'react';
import { Hexagon } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const isSm = size === 'sm';
  const containerSize = isSm ? 'w-7 h-7' : 'w-8 h-8';
  const iconSize = isSm ? 16 : 18;
  const textSize = isSm ? 'text-base' : 'text-lg';

  return (
    <div className={cn("flex items-center gap-2.5 font-semibold tracking-tight text-white", textSize, className)}>
      <div className={cn("bg-gradient-to-tr from-emerald-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20", containerSize)}>
        <Hexagon size={iconSize} className="text-white" strokeWidth={2.5} />
      </div>
      AffiliateOS
    </div>
  );
}
