'use client'

import { useState, useEffect, use } from 'react'
import { salonService, serviceService, providerService, clientService } from '@/lib/firebase/services'
import { Salon, Service, Provider, Client } from '@/types/firebase'
import BookingSlideUp from '@/components/ui/BookingSlideUp'
import {
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline'

interface GlampageProps {
  params: Promise<{ slug: string }>
}

function GlampageContent({ slug }: { slug: string }) {
  const [salon, setSalon] = useState<Salon | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBookingSlideUp, setShowBookingSlideUp] = useState(false)
  const [submittingData, setSubmittingData] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch salon data
        const salonData = await salonService.getSalonBySlug(slug)
        if (!salonData) {
          setError('Salon not found')
          return
        }
        
        setSalon(salonData)
        
        // Fetch services and providers
        const [servicesData, providersData] = await Promise.all([
          serviceService.getServices(salonData.id),
          providerService.getProviders(salonData.id)
        ])
        
        setServices(servicesData)
        setProviders(providersData)
        
      } catch (err) {
        console.error('Error fetching salon data:', err)
        setError('Failed to load salon information')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug])

  const handleBookNowClick = () => {
    if (!salon) return

    const bookNowUrl = salon.externalLinks?.bookNow || salon.bookingUrl
    
    // Check if it's a 3rd party URL (not our native booking URL)
    const isNativeBooking = bookNowUrl === salon.bookingUrl || 
                           bookNowUrl.includes('glamslot.vercel.app') ||
                           bookNowUrl.includes('localhost:3000')

    if (isNativeBooking) {
      // Direct redirect for native booking
      window.open(bookNowUrl, '_blank')
    } else {
      // Show slide-up for 3rd party booking
      setShowBookingSlideUp(true)
    }
  }

  const handleClientDataSubmit = async (data: { name: string; phone: string; optInCommunications: boolean }) => {
    if (!salon) return

    setSubmittingData(true)
    try {
      // Save client data to Clients tab
      console.log('Saving client data:', { ...data, salonId: salon.id, source: 'glampage_3rd_party' })
      
      // Check if client already exists
      const existingClient = await clientService.findClientByEmailOrPhone(salon.id, '', data.phone)
      
      if (existingClient) {
        // Update existing client
        await clientService.updateClient(existingClient.id, {
          name: data.name,
          phone: data.phone,
          updatedAt: new Date()
        })
        console.log('Updated existing client:', existingClient.id)
      } else {
        // Create new client
        const clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> = {
          name: data.name,
          phone: data.phone,
          salonId: salon.id
        }
        
        const clientId = await clientService.createClient(clientData)
        console.log('Created new client:', clientId)
      }
      
      // Redirect to 3rd party booking URL
      const bookNowUrl = salon.externalLinks?.bookNow
      if (bookNowUrl) {
        window.open(bookNowUrl, '_blank')
      }
      
      setShowBookingSlideUp(false)
    } catch (error) {
      console.error('Error saving client data:', error)
      alert('Failed to save your information. Please try again.')
    } finally {
      setSubmittingData(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading salon information...</p>
        </div>
      </div>
    )
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Salon Not Found</h1>
          <p className="text-gray-600">The salon you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{salon.name}</h1>
            <p className="text-lg text-gray-600 mb-8">
              Professional beauty services tailored to your needs
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button
                onClick={handleBookNowClick}
                className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-lg"
              >
                <CalendarIcon className="w-6 h-6 inline mr-2" />
                Book Now
              </button>
              
              {salon.externalLinks?.shop && (
                <button
                  onClick={() => window.open(salon.externalLinks!.shop, '_blank')}
                  className="w-full sm:w-auto bg-white text-gray-900 border-2 border-accent-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-accent-50 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-colors"
                >
                  <ShoppingBagIcon className="w-6 h-6 inline mr-2" />
                  Shop
                </button>
              )}
            </div>
            
            {/* Social Media Icons */}
            {(salon.externalLinks?.instagram || salon.externalLinks?.facebook) && (
              <div className="flex justify-center space-x-6 mb-8">
                {salon.externalLinks?.instagram && (
                  <a
                    href={salon.externalLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-pink-500 transition-colors"
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                
                {salon.externalLinks?.facebook && (
                  <a
                    href={salon.externalLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Services Section */}
      {services.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-lg text-gray-600">Discover our range of professional beauty services</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{service.name}</h3>
                {service.description && (
                  <p className="text-gray-600 mb-4">{service.description}</p>
                )}
                {service.defaultDuration && (
                  <p className="text-sm text-gray-500">
                    Duration: {service.defaultDuration} minutes
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Section */}
      {providers.length > 0 && (
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Team</h2>
              <p className="text-lg text-gray-600">Meet our experienced beauty professionals</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {providers.map((provider) => (
                <div key={provider.id} className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="w-16 h-16 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{provider.name}</h3>
                  {provider.services && provider.services.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Specializes in {provider.services.length} service{provider.services.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contact Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-lg text-gray-600">Get in touch to book your appointment</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <PhoneIcon className="w-8 h-8 text-accent-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone</h3>
              <p className="text-gray-600">
                {salon.ownerPhone || 'Contact us for details'}
              </p>
            </div>
            
            <div className="text-center">
              <EnvelopeIcon className="w-8 h-8 text-accent-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">
                {salon.ownerEmail || 'Contact us for details'}
              </p>
            </div>
            
            <div className="text-center">
              <ClockIcon className="w-8 h-8 text-accent-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hours</h3>
              <p className="text-gray-600">By appointment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Social Links */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-600">&copy; 2025 {salon.name}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Booking Slide-up Panel */}
      <BookingSlideUp
        isOpen={showBookingSlideUp}
        onClose={() => setShowBookingSlideUp(false)}
        onSubmit={handleClientDataSubmit}
        loading={submittingData}
      />
    </div>
  )
}

export default function Glampage({ params }: GlampageProps) {
  const { slug } = use(params)
  return <GlampageContent slug={slug} />
} 