"use client";

import { usePathname } from 'next/navigation';
import Footer from '@/components/ui/Footer';

export default function ConditionalNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboardPage = pathname.startsWith('/dashboard');
  const isStandalonePage = pathname.startsWith('/booking') || 
                          pathname.startsWith('/consultation') ||
                          pathname.startsWith('/glampage') ||
                          pathname.startsWith('/loyalty') ||
                          pathname === '/login' || 
                          pathname === '/signup' ||
                          pathname.startsWith('/join');

  // For dashboard pages, render children directly without any wrapper
  if (isDashboardPage) {
    return <>{children}</>;
  }

  // For standalone pages (booking, consultation, glampage, etc.), render children directly
  if (isStandalonePage) {
    return <>{children}</>;
  }

  // For any other pages (like homepage), render with minimal wrapper
  return (
    <div className="min-h-full flex flex-col">
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
} 