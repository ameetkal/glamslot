'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  XMarkIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  BellIcon,
  UserIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  CalendarIcon,
  HomeIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/lib/auth'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  userRole: string
  userEmail?: string | null
}

import { SettingsItem, getSettingsItems } from '@/lib/settingsUtils'

interface SettingsItemWithIcon extends SettingsItem {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  isSignOut?: boolean
}

export default function SettingsModal({ isOpen, onClose, userRole, userEmail }: SettingsModalProps) {
  const { logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])



  // Generate settings items based on user role
  const getSettingsItemsWithIcons = (): SettingsItemWithIcon[] => {
    // Get base settings items from shared utility
    const baseItems = getSettingsItems(userRole, userEmail)
    
    // Map to items with icons
    const items: SettingsItemWithIcon[] = baseItems.map(item => {
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

    // Add Sign Out at the very bottom
    items.push({ name: 'Sign Out', href: '#signout', icon: ArrowRightOnRectangleIcon, isSignOut: true })

    return items
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleItemClick = (item: SettingsItemWithIcon) => {
    if (item.isSignOut) {
      handleLogout()
    } else {
      router.push(item.href)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="bg-white rounded-t-2xl shadow-xl max-h-[80vh] overflow-hidden">
          {/* Handle and Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto"></div>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[calc(80vh-80px)] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
            
            <div className="space-y-1">
              {getSettingsItemsWithIcons().map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                
                return (
                  <button
                    key={item.href}
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      item.isSignOut
                        ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                        : isActive
                        ? 'bg-blue-50 text-gray-900 border border-blue-200'
                        : 'text-gray-800 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 mr-3 ${item.isSignOut ? 'text-red-600' : isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                    <span className="font-medium">{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 