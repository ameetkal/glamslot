'use client'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex-1 p-6">
      {children}
    </main>
  )
} 