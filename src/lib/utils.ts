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