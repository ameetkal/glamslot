import Link from 'next/link';

const settingsNav = [
  { name: 'Providers', href: '/dashboard/settings/providers' },
  { name: 'Services', href: '/dashboard/settings/services' },
  { name: 'Provider-Service Mapping', href: '/dashboard/settings/mapping' },
  { name: 'Notifications', href: '/dashboard/settings/notifications' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r p-6 hidden md:block">
        <nav className="space-y-2">
          {settingsNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-accent-50 text-accent-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
} 