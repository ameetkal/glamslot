"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import {
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline"
import SettingsModal from "@/components/ui/SettingsModal"

interface BottomNavProps {
  userRole: string
  userEmail?: string | null
}

const navItems = [
  {
    name: "Requests",
    href: "/dashboard/requests",
    icon: ClipboardDocumentListIcon,
  },
  {
    name: "Settings",
    href: "#settings",
    icon: Cog6ToothIcon,
    isModal: true,
  },
]

export default function BottomNav({ userRole, userEmail }: BottomNavProps) {
  const pathname = usePathname()
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  const handleItemClick = (item: typeof navItems[0]) => {
    if (item.isModal) {
      setIsSettingsModalOpen(true)
    }
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 block border-t border-gray-200 bg-white shadow-lg md:hidden">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = item.isModal 
              ? false 
              : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            
            return (
              <button
                key={item.name}
                onClick={() => handleItemClick(item)}
                className={`flex flex-col items-center justify-center flex-1 py-3 text-xs font-medium transition-colors duration-150 ${
                  isActive 
                    ? "text-blue-600" 
                    : "text-gray-700 hover:text-blue-600"
                }`}
              >
                <item.icon className={`h-6 w-6 mb-1 ${isActive ? "text-blue-600" : "text-gray-700"}`} aria-hidden="true" />
                <span>{item.name}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        userRole={userRole}
        userEmail={userEmail}
      />
    </>
  )
} 