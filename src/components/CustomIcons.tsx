import React from "react";

interface CustomIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function DashboardIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Precision grid dashboard panel */}
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function CampaignIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Symmetrical, high-fidelity crisp vector sparkles */}
      <path d="M15 3c0 3 2 5 5 5-3 0-5 2-5 5 0-3-2-5-5-5 3 0 5-2 5-5z" />
      <path d="M6 11c0 2 1.5 3 3 3-1.5 0-3 1-3 3 0-2-1.5-3-3-3 1.5 0 3-1 3-3z" />
      <path d="M8 2c0 1.2.8 2 2 2-1.2 0-2 .8-2 2 0-1.2-.8-2-2-2 1.2 0 2-.8 2-2z" />
    </svg>
  );
}

export function AgentsIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* High-fidelity futuristic cybernetic AI visor dome */}
      <path d="M12 2C6.48 2 2 6.48 2 12c0 2.76 1.12 5.26 2.93 7.07" />
      <path d="M19.07 19.07C20.88 17.26 22 14.76 22 12c0-5.52-4.48-10-10-10z" />
      <rect x="4" y="9" width="16" height="5" rx="2.5" />
      <line x1="6" y1="11.5" x2="18" y2="11.5" />
      <circle cx="12" cy="11.5" r="1.5" fill="currentColor" />
      <path d="M8 18c1 1.5 2.5 2.5 4 2.5s3-1 4-2.5" />
    </svg>
  );
}

export function ArticlesIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Stacked semantic content & articles database cluster */}
      <path d="M4 6h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
      <path d="M7 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2" />
      <line x1="7" y1="10" x2="17" y2="10" />
      <line x1="7" y1="13" x2="17" y2="13" />
      <line x1="7" y1="16" x2="13" y2="16" />
    </svg>
  );
}

export function OffersIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Precision coupon/tag with crisp notch and security key line */}
      <path d="M12.5 3h6.5a1 1 0 0 1 1 1v6.5a2 2 0 0 1-.58 1.42l-9.5 9.5a2 2 0 0 1-2.83 0l-5.66-5.66a2 2 0 0 1 0-2.83l9.5-9.5A2 2 0 0 1 12.5 3z" />
      <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
      <path d="M8.5 15.5l3.5-3.5" />
    </svg>
  );
}

export function PinterestIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Clean high-CTR social focal pin */}
      <path d="M12 2a8 8 0 0 0-8 8c0 3.7 2.4 6.8 5.7 7.7L12 22l2.3-4.3C17.6 16.8 20 13.7 20 10a8 8 0 0 0-8-8z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function PublishingIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Automated cloud push broadcasting network */}
      <path d="M12 20v-8M17 16l-5-5-5 5" />
      <path d="M20.8 14.8c1.6-1.1 2.2-3.2 1.4-5.1-.9-2.1-3-3.2-5.2-2.7C16 4 13.3 2 10 2 6.5 2 3.6 4.5 3.1 8c-2.1-.2-4.1 1-4.8 3C-2.4 13 1.8 15.6 4 15.6h16c.3 0 .6-.1.8-.8z" />
    </svg>
  );
}

export function AnalyticsIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Multi-node chart projection system */}
      <path d="M18 20V10M12 20V4M6 20v-6" />
      <circle cx="18" cy="10" r="2" fill="currentColor" />
      <circle cx="12" cy="4" r="2" fill="currentColor" />
      <circle cx="6" cy="14" r="2" fill="currentColor" />
    </svg>
  );
}

export function SettingsIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Fine-toothed modern production mechanical gear */}
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function AffiliateMatchIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Premium matchmaking analytical vector */}
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function TrafficEngineIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Precision traffic turbine core */}
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="12" x2="15" y2="9" />
    </svg>
  );
}

export function CreatorNetworkIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Clean human node peer-to-peer syndicate network grid */}
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function BubblyAppleIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Elegant minimalist stylized abstract corporate shield & apple tech node */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8a2.5 2.5 0 0 1 2.5-2.5h1" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function CloverMascotIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Geometric architectural perfect quad clover layout representing organic growth */}
      <path d="M12 12c2-2 4-2 5 0s1 4-1 5-4-1-4-1" />
      <path d="M12 12c-2-2-4-2-5 0s-1 4 1 5 4-1 4-1" />
      <path d="M12 12c2 2 2 4 0 5s-4 1-5-1 1-4 1-4" />
      <path d="M12 12c-2 2-2 4 0 5s4 1 5-1-1-4-1-4" />
      <path d="M12 12c0 3-1 6-4 8" />
    </svg>
  );
}

export function BrandingXIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* High-fidelity architectural asterisk star monogram */}
      <path d="M4 4l16 16M20 4L4 20" />
      <circle cx="12" cy="12" r="3" className="fill-[#06070a]" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function BrandingHexIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Mathematical nested isometric hexagons */}
      <polygon points="12 2 22 7 22 17 12 22 2 17 2 7" />
      <polygon points="12 6 18 9.5 18 14.5 12 18 6 14.5 6 9.5" />
    </svg>
  );
}
