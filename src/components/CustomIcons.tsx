import React from "react";
import { 
  LayoutDashboard, 
  Target, 
  Users, 
  FileText, 
  Tag, 
  Pin, 
  Send, 
  BarChart3, 
  Settings, 
  Handshake, 
  Activity, 
  Network, 
  Shield, 
  Layers,
  Hexagon,
  Cpu,
  Bot
} from 'lucide-react';

interface CustomIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export function DashboardIcon({ className, size = 20, ...props }: CustomIconProps) {
  return <LayoutDashboard className={className} size={size} fill="none" strokeWidth={2} {...props} />;
}

export function CampaignIcon({ className, size = 20, ...props }: CustomIconProps) {
  return <Target className={className} size={size} fill="none" strokeWidth={2} {...props} />;
}

export function AgentsIcon({ className, size = 20, ...props }: CustomIconProps) {
  return <Users className={className} size={size} fill="none" strokeWidth={2} {...props} />;
}

export function ArticlesIcon({ className, size = 20, ...props }: CustomIconProps) {
  return <FileText className={className} size={size} fill="none" strokeWidth={2} {...props} />;
}

export function OffersIcon({ className, size = 20, ...props }: CustomIconProps) {
  return <Tag className={className} size={size} fill="none" strokeWidth={2} {...props} />;
}

export function PinterestIcon({ className, size = 20, ...props }: CustomIconProps) {
  return <Pin className={className} size={size} fill="none" strokeWidth={2} {...props} />;
}

export function PublishingIcon({ className, size = 20, ...props }: CustomIconProps) {
  return <Send className={className} size={size} fill="none" strokeWidth={2} {...props} />;
}

export function AnalyticsIcon({ className, size = 20, ...props }: CustomIconProps) {
  return <BarChart3 className={className} size={size} fill="none" strokeWidth={2} {...props} />;
}

export function SettingsIcon({ className, size = 20, ...props }: CustomIconProps) {
  return <Settings className={className} size={size} fill="none" strokeWidth={2} {...props} />;
}

export function AffiliateMatchIcon({ className, size = 20, ...props }: CustomIconProps) {
  return <Handshake className={className} size={size} fill="none" strokeWidth={2} {...props} />;
}

export function TrafficEngineIcon({ className, size = 20, ...props }: CustomIconProps) {
  return <Activity className={className} size={size} fill="none" strokeWidth={2} {...props} />;
}

export function CreatorNetworkIcon({ className, size = 20, ...props }: CustomIconProps) {
  return <Network className={className} size={size} fill="none" strokeWidth={2} {...props} />;
}

export function BubblyAppleIcon({ className, size = 20, ...props }: CustomIconProps) {
  return <Shield className={className} size={size} fill="none" strokeWidth={2} {...props} />;
}

export function CloverMascotIcon({ className, size = 20, ...props }: CustomIconProps) {
  return <Layers className={className} size={size} fill="none" strokeWidth={2} {...props} />;
}

export function BrandingXIcon({ className, size = 20, ...props }: CustomIconProps) {
  return <span className={className}><Cpu size={size} fill="none" strokeWidth={2} /></span>;
}

export function BrandingHexIcon({ className, size = 20, ...props }: CustomIconProps) {
  return <Hexagon className={className} size={size} fill="none" strokeWidth={2} {...props} />;
}

