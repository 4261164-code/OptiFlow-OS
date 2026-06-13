import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolvePinImage(imageUrl: string | undefined | null, concept: string | undefined | null, id: string): string {
  if (!imageUrl || imageUrl.includes('1618005182384') || imageUrl === '/placeholder-image.png' || imageUrl.trim() === '') {
    // Sanitize concept for URL
    const cleanConcept = (concept || "professional affiliate marketing aesthetic")
      .replace(/[^\w\s]/gi, '')
      .split(' ')
      .slice(0, 8)
      .join(' ');
      
    return `https://image.pollinations.ai/prompt/photorealistic%20${encodeURIComponent(cleanConcept)}?width=1024&height=1024&nologo=true&seed=${id}`;
  }
  return imageUrl;
}

export function handleImageFallback(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const fallback = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=512&q=80";
  if (e.currentTarget.src !== fallback) {
    e.currentTarget.src = fallback;
  }
}