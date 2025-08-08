import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Virtual Consultation | GlamSlot',
  description: 'Schedule your virtual consultation for personalized beauty services.',
}

export default function ConsultationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}