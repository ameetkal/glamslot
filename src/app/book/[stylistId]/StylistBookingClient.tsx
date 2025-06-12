'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { 
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  SparklesIcon,
  StarIcon,
  MapPinIcon,
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
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  notes: yup.string().optional().default(''),
})

type BookingFormData = yup.InferType<typeof bookingSchema>

type Props = {
  stylistId: string
}

export default function StylistBookingClient({ stylistId }: Props) {
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
      // In a real app, this would make an API call
      console.log('Booking request:', {
        ...data,
        stylistId,
        slot: selectedSlot,
      })
      
      // Reset form and selection
      reset()
      setSelectedSlot(null)
      
      // Show success message (in a real app)
      alert('Booking request submitted successfully!')
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
              <p className="text-sm text-gray-500">{stylistData.title}</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex items-center">
                  <StarIcon className="h-4 w-4 text-yellow-400" />
                  <span className="ml-1 text-sm font-medium text-gray-900">
                    {stylistData.rating}
                  </span>
                  <span className="ml-1 text-sm text-gray-500">
                    ({stylistData.reviewCount} reviews)
                  </span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPinIcon className="h-4 w-4" />
                  <span className="ml-1">{stylistData.location}</span>
                </div>
              </div>
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Last-Minute Appointments with {stylistData.name}
            </h2>
            <p className="mt-2 text-lg text-gray-500">
              Grab these discounted slots before they&apos;re gone!
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Available Slots */}
            <div className="space-y-4">
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

            {/* Booking Form */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900">Book Your Slot</h3>
              {selectedSlot ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="mt-4 rounded-md bg-accent-50 p-4">
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
                  </div>

                  <form onSubmit={handleSubmit(handleBookingSubmit)} className="mt-6 space-y-4">
                    <div>
                      <Input
                        label="Full Name"
                        icon={UserIcon}
                        error={errors.name?.message}
                        {...register('name')}
                      />
                    </div>

                    <div>
                      <Input
                        type="email"
                        label="Email"
                        icon={EnvelopeIcon}
                        error={errors.email?.message}
                        {...register('email')}
                      />
                    </div>

                    <div>
                      <Input
                        type="tel"
                        label="Phone Number"
                        icon={PhoneIcon}
                        error={errors.phone?.message}
                        {...register('phone')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Additional Notes
                      </label>
                      <textarea
                        {...register('notes')}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent-500 focus:ring-accent-500 sm:text-sm"
                        placeholder="Any special requests or requirements?"
                      />
                    </div>

                    <div className="mt-6">
                      <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        isLoading={isSubmitting}
                      >
                        Book Now - ${selectedSlot.discountPrice}
                      </Button>
                      <p className="mt-2 text-center text-xs text-gray-500">
                        You&apos;ll receive a confirmation email once {stylistData.name} approves your request
                      </p>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <div className="mt-6 text-center text-gray-500">
                  Select an available slot to book your appointment
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 