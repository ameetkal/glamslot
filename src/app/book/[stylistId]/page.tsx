'use client'

import { useParams } from 'next/navigation'
import StylistBookingClient from './StylistBookingClient'

// DEPRECATED: This route is deprecated. Please use /booking/[slug] instead.
// TODO: Remove this file after migration.

export default function StylistBookingPage() {
  const params = useParams()
  const slug = params.slug as string

  return <StylistBookingClient slug={slug} />
} 