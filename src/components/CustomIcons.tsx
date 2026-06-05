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
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Hand-crafted organic round dome */}
      <path d="M12,2.5 C17.3,2.5 20.3,6.8 20,13 C19.7,17.2 17.5,19.5 12,19.5 C6.5,19.5 4.3,17.2 4,13 C3.7,6.8 6.7,2.5 12,2.5 Z" />
      {/* Bubbly door arch */}
      <path d="M9.5,19.5 L9.5,15.8 C9.5,14.6 10.6,13.6 12,13.6 C13.4,13.6 14.5,14.6 14.5,15.8 L14.5,19.5" />
    </svg>
  );
}

export function CampaignIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Main big hand-styled sparkle */}
      <path d="M14.5,4.5 C15.2,7.2 15.2,7.2 18,8 C15.2,8.8 15.2,8.8 14.5,11.5 C13.8,8.8 13.8,8.8 11,8 C13.8,7.2 13.8,7.2 14.5,4.5 Z" />
      {/* Left smaller sparkle */}
      <path d="M6.5,11.5 C7,13 7,13 8.5,13.5 C7,14 7,14 6.5,15.5 C6,14 6,14 4.5,13.5 C6,13 6,13 6.5,11.5 Z" />
      {/* Small top-left sparkle */}
      <path d="M8.5,3 C8.8,4 8.8,4 9.8,4.3 C8.8,4.6 8.8,4.6 8.5,5.6 C8.2,4.6 8.2,4.6 7.2,4.3 C8.2,4 8.2,4 8.5,3 Z" />
    </svg>
  );
}

export function AgentsIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Bubbly cat head with rounded ear caps */}
      <path d="M4.5,10 C4,14 6,19 12,19 C18,19 20,14 19.5,10 C19,8.5 18,6.8 18,5.8 C17,4.5 15.8,3.2 14.8,4.5 C13.3,5.5 10.7,5.5 9.2,4.5 C8.2,3.2 7,4.5 6,5.8 C6,6.8 5,8.5 4.5,10 Z" />
      {/* Cat sunglasses (filled for iconic hipster look) */}
      <path d="M6.5,11 C6.5,9.8 8.2,9.8 9.5,11 C9.5,12.2 6.5,12.2 6.5,11 Z" fill="currentColor" />
      <path d="M14.5,11 C14.5,9.8 16.2,9.8 17.5,11 C17.5,12.2 14.5,12.2 14.5,11 Z" fill="currentColor" />
      {/* Glasses bridge */}
      <path d="M9.5,10.5 C11,9.8 13,9.8 14.5,10.5" />
      {/* Smug smiley face */}
      <path d="M11,14.5 C11.5,15.3 12.5,15.3 13,14.5" />
    </svg>
  );
}

export function ArticlesIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Top stacked pancake layer oval */}
      <path d="M6,7.5 C6,6.5 8,5.5 12,5.5 C16,5.5 18,6.5 18,7.5 C18,8.5 16,9.5 12,9.5 C8,9.5 6,8.5 6,7.5 Z" />
      {/* Middle layer stack curve */}
      <path d="M6,11.5 C6,13 8,14 12,14 C16,14 18,13 18,11.5" />
      {/* Bottom layer stack curve */}
      <path d="M6,15.5 C6,17 8,18 12,18 C16,18 18,17 18,15.5" />
      {/* Connective vertical rounded sides */}
      <path d="M6,7.5 L6,15.5" />
      <path d="M18,7.5 L18,15.5" />
    </svg>
  );
}

export function OffersIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Bubbly label tag rotating around 45deg */}
      <path d="M6.5,6 C5,6 4,7 4,8.5 L4,11.5 C4,13 5,14 6,15 L14,20 M6,15 L14.5,7 C15.5,6 17,6 18,7 L20,9 C21,10 21,11.5 20,12.5 L11.5,21 C10.5,22 9,22 8,21 L3,16" />
      {/* Clean tilted bubbly tag vector path */}
      <path d="M5.5,5.5 L12,5.5 C13.5,5.5 14.5,6 15.5,7 L21.5,13 C22.5,14 22.5,15.5 21.5,16.5 L16.5,21.5 C15.5,22.5 14,22.5 13,21.5 L7,15.5 C6,14.5 5.5,13.5 5.5,12 L5.5,5.5 Z" />
      {/* Eye hole cutout */}
      <circle cx="9.5" cy="9.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function PinterestIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Premium organic leaf (looks extremely clean and custom) */}
      <path d="M20,4 C14.2,4 7.2,8.1 5.2,12 C4.2,14 4.7,16.8 7.2,18.8 C11.2,20.8 16.2,16.8 19,12 C20.5,9.5 20.5,5.5 20,4 Z" />
      {/* Leaf primary branch */}
      <path d="M6.2,17.8 C10,14.5 14.5,10.5 19,4.5" />
      {/* Leaf secondary branch */}
      <path d="M11.5,13 C13.5,14.2 15.5,14.2 16.5,13" />
    </svg>
  );
}

export function PublishingIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Bubbly smiling bag / gift box */}
      <path d="M6,8.5 C6,7 8,6.5 12,6.5 C16,6.5 18,7 18,8.5 L19,16 C19,18 17,19.5 12,19.5 C7,19.5 5,18 5,16 L6,8.5 Z" />
      {/* Top loop handle */}
      <path d="M9.5,6.5 C9.5,4.5 10.5,3.4 12,3.4 C13.5,3.4 14.5,4.5 14.5,6.5" />
      {/* Smile and eyes */}
      <circle cx="9.5" cy="11.5" r="1" fill="currentColor" />
      <circle cx="14.5" cy="11.5" r="1" fill="currentColor" />
      <path d="M10,14.5 C10.5,15.8 13.5,15.8 14,14.5" />
    </svg>
  );
}

export function AnalyticsIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Bubbly concentric dartboard circles */}
      <path d="M3.5,12 C3.5,6.5 6.5,4 12,4 C17.5,4 20.5,6.5 20.5,12 C20.5,17.5 17.5,20 12,20 C6.5,20 3.5,17.5 3.5,12 Z" />
      <path d="M7.5,12 C7.5,8.8 9,7.5 12,7.5 C15,7.5 16.5,8.8 16.5,12 C16.5,15.2 15,16.5 12,16.5 C9,16.5 7.5,15.2 7.5,12 Z" />
      {/* Deep center dot */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function SettingsIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Overlapping Venn interlocking curves design */}
      <path d="M12,10.5 C14,10.5 15.5,9 15.5,7 C15.5,5 14,3.5 12,3.5 C10,3.5 8.5,5 8.5,7 C8.5,9 10,10.5 12,10.5 Z" />
      <path d="M8,18.5 C10,18.5 11.5,17 11.5,15 C11.5,13 10,11.5 8,11.5 C6,11.5 4.5,13 4.5,15 C4.5,17 6,18.5 8,18.5 Z" />
      <path d="M16,18.5 C18,18.5 19.5,17 19.5,15 C19.5,13 18,11.5 16,11.5 C14,11.5 12.5,13 12.5,15 C12.5,17 14,18.5 16,18.5 Z" />
    </svg>
  );
}

export function AffiliateMatchIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Bubbly heart shaped badge */}
      <path d="M12,6.5 C11,-0.5 3,-0.5 3,7 C3,13 9.8,18.2 12,20 C14.2,18.2 21,13 21,7 C21,-0.5 13,-0.5 12,6.5 Z" />
      {/* Cute stitch path dividing internal section */}
      <path d="M8,11.5 C10,10.5 12,11.5 13.5,10" />
      <path d="M11,14.5 C12.5,13.2 13.5,14 15.5,12.5" />
    </svg>
  );
}

export function TrafficEngineIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Heart-warm bubbly fire flame */}
      <path d="M12,21.5 C16,21.5 18.5,19.2 18.5,14.5 C18.5,9.8 16.2,7 14.8,3.5 C13,4.5 12,6.8 12,9 C12,6.8 10.2,5.5 9.3,6.8 C7.5,9 5.5,10.8 5.5,14.5 C5.5,19.2 8,21.5 12,21.5 Z" />
      {/* Inner baby flame */}
      <path d="M12,17.5 C13.5,17.5 14.5,16.2 14.5,14.5 C14.5,12.8 12,11 12,11 C12,11 9.5,12.8 9.5,14.5 C9.5,16.2 10.5,17.5 12,17.5 Z" />
    </svg>
  );
}

export function CreatorNetworkIcon({ className, ...props }: CustomIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Center user profile */}
      <path d="M12,10.5 C13.4,10.5 14.5,9.4 14.5,8 C14.5,6.6 13.4,5.5 12,5.5 C10.6,5.5 9.5,6.6 9.5,8 C9.5,9.4 10.6,10.5 12,10.5 Z" />
      <path d="M8,15.5 C8,13.5 9.8,12.5 12,12.5 C14.2,12.5 16,13.5 16,15.5" />
      {/* Intertwined outer exchange arcs */}
      <path d="M5.5,5.5 C8.5,2.5 15.5,2.5 18.5,5.5" />
      <path d="M18.5,18.5 C15.5,21.5 8.5,21.5 5.5,18.5" />
      {/* Small circular control points */}
      <circle cx="17.5" cy="4.5" r="1.5" fill="currentColor" />
      <circle cx="6.5" cy="19.5" r="1.5" fill="currentColor" />
    </svg>
  );
}
