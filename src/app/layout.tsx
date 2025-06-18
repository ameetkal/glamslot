import './globals.css'
import { Inter } from 'next/font/google'
import ConditionalNav from '@/components/layout/ConditionalNav'

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
        <ConditionalNav>
          {children}
        </ConditionalNav>
      </body>
    </html>
  )
}
