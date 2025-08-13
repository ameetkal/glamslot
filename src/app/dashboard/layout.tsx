'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Cog6ToothIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  BellIcon,
  UserIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  CalendarIcon,
  ChartBarIcon,
  GlobeAltIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import AuthGuard from '@/components/auth/AuthGuard'
import BottomNav from '@/components/layout/BottomNav'
import { salonService, teamService } from '@/lib/firebase/services'
import { getPermissionsForRole } from '@/lib/permissions'
import { getSettingsItems } from '@/lib/settingsUtils'
import { BusinessSelector } from '@/components/ui/BusinessSelector'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  subItems?: NavigationItem[]
  isSignOut?: boolean
}

// We'll generate settings items dynamically using the shared utility

const getNavigation = (userRole: string, userEmail?: string | null): NavigationItem[] => {
  const permissions = getPermissionsForRole(userRole)
  

  
  const navigation: NavigationItem[] = []
  
  // Add Requests if user can view them (for both admin and service providers)
  if (permissions.canViewRequests || permissions.canViewOwnBookings) {
    navigation.push({ name: 'Requests', href: '/dashboard/requests', icon: ClipboardDocumentListIcon })
  }
  
  // Add Settings if user can view settings
  if (permissions.canViewSettings) {
    // Get settings items from shared utility
    const baseSettingsItems = getSettingsItems(userRole, userEmail)
    
    // Convert to NavigationItem format with icons
    const settingsItems: NavigationItem[] = baseSettingsItems.map(item => {
      const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
        'Providers': UserGroupIcon,
        'Services': WrenchScrewdriverIcon,
        'Clients': UserGroupIcon,
        'Notifications': BellIcon,
        'Profile': UserIcon,
        'Links': GlobeAltIcon,
        'Team Management': ShieldCheckIcon,
        'Billing': CreditCardIcon,
        'Staff Schedule': CalendarIcon,
        'Dashboard': HomeIcon,
        'Platform Admin': ChartBarIcon,
      }
      
      return {
        ...item,
        icon: iconMap[item.name] || UserIcon
      }
    })
    
    // Add My Schedule for service providers (if not already included)
    if (permissions.canManageOwnSchedule && userRole === 'service_provider' && !settingsItems.find(item => item.name === 'My Schedule')) {
      settingsItems.push({ name: 'My Schedule', href: '/dashboard/schedule', icon: CalendarIcon })
    }
    
    // Add Sign Out at the very bottom
    settingsItems.push({ name: 'Sign Out', href: '#signout', icon: ArrowRightOnRectangleIcon, isSignOut: true })
    
    navigation.push({ name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon, subItems: settingsItems })
  } else if (permissions.canManageOwnServices) {
    // For providers, show a simplified settings link to their provider settings
    const settingsItems: NavigationItem[] = []
    
    // Add Provider Settings for service providers (includes Profile, Services, etc.)
    settingsItems.push({ name: 'Provider Settings', href: '/dashboard/settings/provider', icon: UserIcon })
    
    // Add My Schedule for service providers
    if (permissions.canManageOwnSchedule && userRole === 'service_provider') {
      settingsItems.push({ name: 'My Schedule', href: '/dashboard/schedule', icon: CalendarIcon })
    }
    
    // Add Sign Out at the very bottom
    settingsItems.push({ name: 'Sign Out', href: '#signout', icon: ArrowRightOnRectangleIcon, isSignOut: true })
    
    navigation.push({ name: 'Settings', href: '/dashboard/settings/provider', icon: Cog6ToothIcon, subItems: settingsItems })
  }
  
  return navigation
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout, currentSalonName } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith('/dashboard/settings'))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userRole, setUserRole] = useState<string>('owner')

  // Use currentSalonName from context (either selected salon or user's own salon)
  const displaySalonName = currentSalonName || 'Business Name'

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
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{displaySalonName}</h1>
            <p className="text-sm text-gray-500">by Glammatic</p>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar - Hidden on mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:block ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center flex-shrink-0 px-4 py-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{displaySalonName}</h1>
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
                  {userRole === 'admin' ? 'Admin' : 'Service Provider'}
                </p>
              </div>
            </div>
          </div>

          {/* SuperAdmin Business Selector */}
          <BusinessSelector />

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-4">
            {getNavigation(userRole, user?.email).map((item: NavigationItem) => {
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
                        
                        // Handle Sign Out button specially
                        if (sub.isSignOut) {
                          return (
                            <button
                              key={sub.href}
                              onClick={handleLogout}
                              className="group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors text-red-600 hover:text-red-900 hover:bg-red-50"
                            >
                              <sub.icon className="h-4 w-4 mr-2" />
                              {sub.name}
                            </button>
                          )
                        }
                        
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
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="min-h-screen pt-16 pb-20 lg:pt-0 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav userRole={userRole} userEmail={user?.email} />
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