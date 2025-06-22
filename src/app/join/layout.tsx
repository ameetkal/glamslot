export default function JoinLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {children}
    </div>
  )
} 