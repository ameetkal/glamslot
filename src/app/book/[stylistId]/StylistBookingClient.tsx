'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { 
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

// Mock data for the prototype - in a real app, this would come from the database
const stylistData = {
  id: 'jane-doe',
  name: 'Jane Doe',
  title: 'Senior Stylist',
  image: '/placeholder-stylist.jpg', // We'll need to add this image
  bio: 'Specializing in modern cuts and balayage. 5+ years of experience in creating personalized looks.',
  rating: 4.9,
  reviewCount: 128,
  location: 'Downtown Salon',
  instagram: '@janedoestylist',
  services: ['Haircuts', 'Color', 'Balayage', 'Styling'],
  lastMinuteSlots: [
    {
      id: 1,
      date: 'Today',
      time: '2:00 PM',
      service: 'Haircut & Style',
      duration: '45 min',
      originalPrice: 85,
      discountPrice: 65,
      expiresIn: '2 hours',
    },
    {
      id: 2,
      date: 'Today',
      time: '4:30 PM',
      service: 'Balayage',
      duration: '2.5 hours',
      originalPrice: 250,
      discountPrice: 185,
      expiresIn: '4 hours',
    },
    {
      id: 3,
      date: 'Tomorrow',
      time: '11:00 AM',
      service: 'Color & Cut',
      duration: '2 hours',
      originalPrice: 180,
      discountPrice: 135,
      expiresIn: '1 day',
    },
  ]
}

// Booking form schema
const bookingSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  service: yup.string().required('What service do you want to book?'),
  stylistPreference: yup.string().default(''),
  dateTimePreference: yup.string().required('Share appointment time windows you\'d prefer'),
  waitlistOptIn: yup.boolean().default(false),
})

type BookingFormData = yup.InferType<typeof bookingSchema>

type Props = {
  slug: string
}

export default function StylistBookingClient({ slug }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<typeof stylistData.lastMinuteSlots[0] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BookingFormData>({
    resolver: yupResolver(bookingSchema),
  })

  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!selectedSlot) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          slug,
          slot: selectedSlot,
        }),
      })
      const result = await response.json()
      if (result.success) {
        reset()
        setSelectedSlot(null)
        alert('Booking request submitted successfully!')
      } else {
        alert(result.error || 'Failed to submit booking request. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting booking:', error)
      alert('Failed to submit booking request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Stylist Profile Header */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24 overflow-hidden rounded-full">
              <Image
                src={stylistData.image}
                alt={stylistData.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{stylistData.name}</h1>
              <div className="mt-2">
                <a
                  href={`https://instagram.com/${stylistData.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-accent-600"
                >
                  {stylistData.instagram}
                </a>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">{stylistData.bio}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {stylistData.services.map((service) => (
              <span
                key={service}
                className="rounded-full bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="py-6">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
              Request an Appointment
            </h2>
            <form onSubmit={handleSubmit(handleBookingSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow">
              <Input
                label="Name"
                {...register('name')}
                error={errors.name?.message}
                required
              />
              <Input
                label="Phone"
                {...register('phone')}
                error={errors.phone?.message}
                required
              />
              <Input
                label="Email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                required
              />
              <Input
                label="Service"
                {...register('service')}
                error={errors.service?.message}
                required
                description="What service do you want to book?"
              />
              <Input
                label="Stylist Preference"
                {...register('stylistPreference')}
                error={errors.stylistPreference?.message}
                description="Skip if you have no preference"
              />
              <Input
                label="Date & Time Preference"
                {...register('dateTimePreference')}
                error={errors.dateTimePreference?.message}
                required
                description="Share appointment time windows you'd prefer"
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="waitlistOptIn"
                  {...register('waitlistOptIn')}
                  className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                />
                <label htmlFor="waitlistOptIn" className="text-sm text-gray-700">
                  Include me in the waitlist for future appointment gaps that open up in my preferred window
                </label>
              </div>
              <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting} className="w-full">
                Request Appointment
              </Button>
            </form>
          </div>

          {stylistData.lastMinuteSlots && stylistData.lastMinuteSlots.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Appointments</h3>
              <div className="grid grid-cols-1 gap-4">
                {stylistData.lastMinuteSlots.map((slot) => (
                  <motion.button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`w-full rounded-lg border p-4 text-left transition-all ${
                      selectedSlot?.id === slot.id
                        ? 'border-accent-500 bg-accent-50'
                        : 'border-gray-200 bg-white hover:border-accent-300'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-5 w-5 text-accent-600" />
                          <span className="font-medium text-gray-900">
                            {slot.date} at {slot.time}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {slot.service} • {slot.duration}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 line-through">
                            ${slot.originalPrice}
                          </span>
                          <span className="text-lg font-semibold text-accent-600">
                            ${slot.discountPrice}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-accent-600">
                          <SparklesIcon className="h-4 w-4" />
                          <span>Expires in {slot.expiresIn}</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
              {selectedSlot && (
                <div className="mt-4 p-4 bg-accent-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-accent-900">
                        {selectedSlot.service}
                      </div>
                      <div className="mt-1 text-sm text-accent-700">
                        {selectedSlot.date} at {selectedSlot.time}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-accent-900">
                        <span className="line-through">${selectedSlot.originalPrice}</span>
                        <span className="ml-2 text-lg font-semibold">${selectedSlot.discountPrice}</span>
                      </div>
                      <div className="mt-1 text-xs text-accent-600">
                        Expires in {selectedSlot.expiresIn}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    This slot will be included in your request.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 