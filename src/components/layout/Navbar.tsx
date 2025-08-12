'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { useAuth } from '@/lib/auth'
import { getSettingsItems } from '@/lib/settingsUtils'
import { useState, useEffect } from 'react'
import { salonService, teamService } from '@/lib/firebase/services'

interface NavbarProps {
  className?: string
}

export default function Navbar({ className = '' }: NavbarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [userRole, setUserRole] = useState<string>('user')

  // Fetch user role and salon data
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return
      
      try {
        // First check if they're a salon owner (this takes precedence)
        const salon = await salonService.getSalon(user.uid)
        if (salon) {
          setUserRole('admin')
          return
        }
        
        // If not an owner, check if they're a team member
        const userTeamMember = await teamService.getTeamMemberByUserId(user.uid)
        if (userTeamMember) {
          // Map old roles to new simplified roles
          if (userTeamMember.role === 'owner' || userTeamMember.role === 'admin' || userTeamMember.role === 'front_desk') {
            setUserRole('admin')
          } else {
            setUserRole('service_provider')
          }
        } else {
          // Default to service_provider if we can't determine role
          setUserRole('service_provider')
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
        setUserRole('service_provider')
      }
    }
    fetchUserRole()
  }, [user])

  // Get settings items using shared utility
  const settingsItems = getSettingsItems(userRole, user?.email)
  
  // Debug logging
  console.log('Navbar Debug:', {
    userRole,
    userEmail: user?.email,
    settingsItemsCount: settingsItems.length,
    settingsItems: settingsItems.map(item => item.name)
  })

  const mainNavigation = [
    { name: 'Booking Requests', href: '/dashboard/requests' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Availability', href: '/dashboard/availability' },
  ]

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
              {mainNavigation.map((item) => (
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
              
              {/* Settings dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={clsx(
                    'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium',
                    pathname.startsWith('/dashboard/settings') || isSettingsOpen
                      ? 'border-accent-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  )}
                >
                  Settings
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Settings dropdown menu */}
                {isSettingsOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      {settingsItems.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          onClick={() => setIsSettingsOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
      
      {/* Click outside to close settings dropdown */}
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsSettingsOpen(false)}
        />
      )}
    </nav>
  )
} 