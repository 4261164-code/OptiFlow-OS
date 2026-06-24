import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface IconWrapperProps {
  icon: LucideIcon;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function IconWrapper({ icon: Icon, size = 20, strokeWidth = 1.5, className }: IconWrapperProps) {
  return <Icon size={size} strokeWidth={strokeWidth} className={cn(className)} />;
}
