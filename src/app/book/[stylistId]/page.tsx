'use client'

import { useParams } from 'next/navigation'
import StylistBookingClient from './StylistBookingClient'

export default function StylistBookingPage() {
  const params = useParams()
  const stylistId = params.stylistId as string

  return <StylistBookingClient stylistId={stylistId} />
} 