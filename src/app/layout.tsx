import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/ui/Footer'
import BottomNav from '@/components/layout/BottomNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'LastMinute - Fill Your Appointment Gaps',
  description: 'Help salons and beauty professionals fill cancelled appointment slots',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className={`${inter.className} h-full flex flex-col`}>
        <div className="min-h-full flex flex-col pb-16 sm:pb-0">
          <Navbar />
          <main className="flex-grow">
            <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
          <Footer />
          <BottomNav />
        </div>
      </body>
    </html>
  )
}
