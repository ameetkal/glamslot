import StylistBookingClient from './StylistBookingClient'

type PageProps = {
  params: { stylistId: string }
}

export default async function StylistBookingPage({ params }: PageProps) {
  // In a real app, you might fetch data here
  return <StylistBookingClient stylistId={params.stylistId} />
} 