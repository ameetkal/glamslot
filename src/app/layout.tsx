import './globals.css'
import { Inter } from 'next/font/google'
import ConditionalNav from '@/components/layout/ConditionalNav'
import { AuthProvider } from '@/lib/auth'
import PWAInstaller from '@/components/PWAInstaller'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'GlamSlot - Beauty Appointment Booking System',
  description: 'Professional booking platform for salons and beauty professionals to manage client appointments and requests',
  manifest: '/manifest.json',
  themeColor: '#ffffff',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GlamSlot',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    title: 'GlamSlot - Beauty Appointment Booking System',
    description: 'Professional booking platform for salons and beauty professionals',
    siteName: 'GlamSlot',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GlamSlot" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${inter.className} h-full flex flex-col`}>
        <PWAInstaller />
        <AuthProvider>
          <ConditionalNav>
            {children}
          </ConditionalNav>
        </AuthProvider>
      </body>
    </html>
  )
}
