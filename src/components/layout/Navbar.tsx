'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const navigation = [
  { name: 'Booking Requests', href: '/dashboard/requests' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Availability', href: '/dashboard/availability' },
  { name: 'Settings', href: '/dashboard/settings' },
]

interface NavbarProps {
  className?: string
}

export default function Navbar({ className = '' }: NavbarProps) {
  const pathname = usePathname()

  return (
    <nav className={clsx('bg-white shadow-sm', className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Mobile header - always visible */}
        <div className="flex h-14 items-center justify-center sm:hidden">
          <div className="text-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              GlamSlot
            </Link>
          </div>
        </div>

        {/* Desktop navigation - hidden on mobile */}
        <div className="hidden h-16 sm:flex sm:justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <div>
                <Link href="/" className="text-xl font-bold text-gray-900 hover:text-accent-600">
                  GlamSlot
                </Link>
              </div>
            </div>
            <div className="ml-6 flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium',
                    pathname === item.href
                      ? 'border-accent-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="ml-6 flex items-center">
            <button
              type="button"
              className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
            >
              <span className="sr-only">View notifications</span>
              {/* Add notification icon here */}
            </button>
            <div className="relative ml-3">
              <button
                type="button"
                className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-tan-200" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
} 