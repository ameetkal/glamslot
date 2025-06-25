import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate the correct booking URL based on environment
export function getBookingUrl(slug: string): string {
  // Check if we're in development or production
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       (typeof window !== 'undefined' && window.location.hostname === 'localhost');
  
  const baseUrl = isDevelopment 
    ? 'http://localhost:3000' 
    : 'https://last-minute-app.vercel.app';
  
  return `${baseUrl}/booking/${slug}`;
}

/**
 * Generate a unique pass ID for loyalty program QR codes
 * Format: LOYAL-[SALON_ID]-[RANDOM_STRING]
 */
export function generatePassId(salonId: string): string {
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `LOYAL-${salonId.substring(0, 8)}-${randomString}`;
}

/**
 * Validate if a string is a valid pass ID format
 */
export function isValidPassId(passId: string): boolean {
  const passIdRegex = /^LOYAL-[A-Z0-9]{8}-[A-Z0-9]{6}$/;
  return passIdRegex.test(passId);
} 