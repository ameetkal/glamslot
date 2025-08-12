export interface SettingsItem {
  name: string
  href: string
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  description?: string
}

export function getSettingsItems(userRole: string, userEmail?: string | null): SettingsItem[] {
  const items: SettingsItem[] = [
    { name: 'Providers', href: '/dashboard/settings/providers' },
    { name: 'Services', href: '/dashboard/settings/services' },
    { name: 'Clients', href: '/dashboard/settings/clients' },
    { name: 'Notifications', href: '/dashboard/settings/notifications' },
    { name: 'Profile', href: '/dashboard/settings/profile' },
    { name: 'Links', href: '/dashboard/settings/links' },
    { name: 'Team Management', href: '/dashboard/settings/admin' },
    { name: 'Billing', href: '/dashboard/settings/billing' },
  ]

  // Add Staff Schedule and Dashboard for admins
  if (userRole === 'admin') {
    items.push(
      { name: 'Staff Schedule', href: '/dashboard/staff-schedule' },
      { name: 'Dashboard', href: '/dashboard' }
    )
  }

  // Add Platform Admin tab only for platform admins
  if (isPlatformAdmin(userEmail)) {
    items.push({ name: 'Platform Admin', href: '/dashboard/settings/platform-admin' })
  }

  return items
}

// Helper function to check if user is a platform admin
function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return email === 'ameet@gofisherman.com' || email === 'ameetk96@gmail.com'
}
