import './globals.css'
import { Inter } from 'next/font/google'
import ConditionalNav from '@/components/layout/ConditionalNav'
import { AuthProvider } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'GlamSlot - Beauty Appointment Booking System',
  description: 'Professional booking platform for salons and beauty professionals to manage client appointments and requests',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className={`${inter.className} h-full flex flex-col`}>
        <AuthProvider>
          <ConditionalNav>
            {children}
          </ConditionalNav>
        </AuthProvider>
      </body>
    </html>
  )
}
