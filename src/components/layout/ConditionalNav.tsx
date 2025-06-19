"use client";

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/ui/Footer';
import BottomNav from '@/components/layout/BottomNav';

export default function ConditionalNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBookingPage = pathname.startsWith('/booking');
  const isDashboardPage = pathname.startsWith('/dashboard');

  // For dashboard pages, render children directly without any navigation or padding
  if (isDashboardPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-full flex flex-col pb-16 sm:pb-0">
      {!isBookingPage && <Navbar />}
      <main className="flex-grow">
        <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      {!isBookingPage && <Footer />}
      {!isBookingPage && <BottomNav />}
    </div>
  );
} 