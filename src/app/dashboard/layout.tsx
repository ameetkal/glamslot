'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Cog6ToothIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  BellIcon,
  UserIcon,
  ShieldCheckIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import AuthGuard from '@/components/auth/AuthGuard'
import { salonService, teamService } from '@/lib/firebase/services'
import { getPermissionsForRole } from '@/lib/permissions'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  subItems?: NavigationItem[]
}

const settingsSubItems = [
  { name: 'Providers', href: '/dashboard/settings/providers', icon: UserGroupIcon },
  { name: 'Services', href: '/dashboard/settings/services', icon: WrenchScrewdriverIcon },
  { name: 'Clients', href: '/dashboard/settings/clients', icon: UserGroupIcon },
  { name: 'Notifications', href: '/dashboard/settings/notifications', icon: BellIcon },
  { name: 'Profile', href: '/dashboard/settings/profile', icon: UserIcon },
  { name: 'Admin', href: '/dashboard/settings/admin', icon: ShieldCheckIcon },
]

const getNavigation = (userRole: string): NavigationItem[] => {
  const permissions = getPermissionsForRole(userRole)
  
  const navigation: NavigationItem[] = []
  
  // Add Requests if user can view them
  if (permissions.canViewRequests) {
    navigation.push({ name: 'Requests', href: '/dashboard/requests', icon: ChatBubbleLeftRightIcon })
  }
  
  // Add Staff Schedule for management (owners, admins, front desk)
  if (userRole === 'owner' || userRole === 'admin' || userRole === 'front_desk') {
    navigation.push({ name: 'Staff Schedule', href: '/dashboard/staff-schedule', icon: CalendarIcon })
  }
  
  // Add Loyalty if user can view it (temporarily hidden)
  // if (permissions.canViewLoyalty) {
  //   navigation.push({ name: 'Loyalty', href: '/dashboard/loyalty', icon: GiftIcon })
  // }
  
  // Add Dashboard (only for owners and admins)
  if (userRole === 'owner' || userRole === 'admin') {
    navigation.push({ name: 'Dashboard', href: '/dashboard', icon: HomeIcon })
  }
  
  // Add provider-specific pages (only for non-owners)
  if (permissions.canManageOwnSchedule && userRole !== 'owner') {
    navigation.push({ name: 'My Schedule', href: '/dashboard/schedule', icon: CalendarIcon })
  }
  
  if (permissions.canViewOwnBookings && userRole !== 'owner') {
    navigation.push({ name: 'My Bookings', href: '/dashboard/bookings', icon: ChatBubbleLeftRightIcon })
  }
  
  // Add Settings if user can view settings
  if (permissions.canViewSettings) {
    navigation.push({ name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon, subItems: settingsSubItems })
  } else if (permissions.canManageOwnServices) {
    // For providers, show a simplified settings link to their provider settings
    navigation.push({ name: 'Settings', href: '/dashboard/settings/provider', icon: Cog6ToothIcon })
  }
  
  return navigation
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith('/dashboard/settings'))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [salonName, setSalonName] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('owner')

  useEffect(() => {
    const fetchSalon = async () => {
      if (!user) return
      
      try {
        // First, try to find the user in team members to get their salon ID
        const userTeamMember = await teamService.getTeamMemberByUserId(user.uid)
        
        if (userTeamMember) {
          // User is a team member, get salon using their salonId
          const salon = await salonService.getSalon(userTeamMember.salonId)
          if (salon && salon.name) setSalonName(salon.name)
        } else {
          // User might be a salon owner, try using their uid as salon ID
          const salon = await salonService.getSalon(user.uid)
          if (salon && salon.name) setSalonName(salon.name)
        }
      } catch (error) {
        console.error('Error fetching salon name:', error)
      }
    }
    fetchSalon()
  }, [user])

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return
      
      try {
        // First check if they're a salon owner (this takes precedence)
        const salon = await salonService.getSalon(user.uid)
        if (salon) {
          setUserRole('owner')
          return
        }
        
        // If not an owner, check if they're a team member
        const userTeamMember = await teamService.getTeamMemberByUserId(user.uid)
        if (userTeamMember) {
          setUserRole(userTeamMember.role)
        } else {
          // Default to member if we can't determine role
          setUserRole('member')
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
        setUserRole('member')
      }
    }
    fetchUserRole()
  }, [user])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          type="button"
          className="bg-white p-2 rounded-md shadow-md border border-gray-200"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          ) : (
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center flex-shrink-0 px-4 py-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{salonName || 'Business Name'}</h1>
              <p className="text-sm text-gray-500 mt-1">by Glammatic</p>
            </div>
          </div>

          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate" title={user?.email || ''}>
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  {userRole === 'owner' ? 'Salon Owner' : 
                   userRole === 'admin' ? 'Admin' : 
                   userRole === 'service_provider' ? 'Service Provider' : 
                   userRole === 'front_desk' ? 'Front Desk' : 
                   'Team Member'}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-4">
            {getNavigation(userRole).map((item: NavigationItem) => {
              if (!item.subItems) {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-accent-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-accent-600' : 'text-gray-600 group-hover:text-gray-700'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                )
              }
              // Settings group with sub-items
              const isSettingsActive = pathname.startsWith('/dashboard/settings')
              return (
                <div key={item.name}>
                  <button
                    type="button"
                    className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors ${
                      isSettingsActive
                        ? 'bg-accent-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSettingsOpen((open) => !open)}
                    aria-expanded={settingsOpen}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isSettingsActive ? 'text-accent-600' : 'text-gray-600 group-hover:text-gray-700'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                    <svg
                      className={`ml-auto h-4 w-4 transition-transform ${settingsOpen ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {settingsOpen && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.subItems.map((sub: NavigationItem) => {
                        const isSubActive = pathname === sub.href
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                              isSubActive
                                ? 'bg-accent-50 text-gray-900 border border-accent-200'
                                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <sub.icon className="h-4 w-4 mr-2" />
                            {sub.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Logout button */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-600 group-hover:text-gray-700" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="min-h-screen pt-16 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthGuard>
  )
} 