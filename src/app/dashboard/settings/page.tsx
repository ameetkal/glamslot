'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  BellIcon,
  LinkIcon,
  TagIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import Input from '@/components/ui/Input'

// Mock data for the prototype
const initialProfileData = {
  name: 'Jane Doe',
  title: 'Senior Stylist',
  email: 'jane@example.com',
  phone: '(555) 123-4567',
  location: 'Downtown Salon',
  bio: "Specializing in modern cuts and balayage. 5+ years of experience in creating personalized looks.",
  instagram: '@janedoestylist',
  services: [
    { id: 1, name: 'Haircut & Style', duration: 45, price: 85 },
    { id: 2, name: 'Balayage', duration: 150, price: 250 },
    { id: 3, name: 'Color & Cut', duration: 120, price: 180 },
  ],
  availability: {
    monday: { start: '09:00', end: '17:00', isAvailable: true },
    tuesday: { start: '09:00', end: '17:00', isAvailable: true },
    wednesday: { start: '09:00', end: '17:00', isAvailable: true },
    thursday: { start: '09:00', end: '17:00', isAvailable: true },
    friday: { start: '09:00', end: '17:00', isAvailable: true },
    saturday: { start: '10:00', end: '15:00', isAvailable: true },
    sunday: { start: '10:00', end: '15:00', isAvailable: false },
  },
  notifications: {
    email: true,
    sms: true,
    instagram: true,
    bookingRequests: true,
    reminders: true,
  },
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'services' | 'availability' | 'notifications'>('profile')
  const [profileData, setProfileData] = useState(initialProfileData)
  const [isSaving, setIsSaving] = useState(false)
  const [newService, setNewService] = useState({ name: '', duration: 30, price: 0 })

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      // In a real app, this would make an API call
      console.log('Saving profile:', profileData)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddService = () => {
    if (!newService.name || newService.price <= 0) return

    setProfileData(prev => ({
      ...prev,
      services: [
        ...prev.services,
        {
          id: Date.now(),
          name: newService.name,
          duration: newService.duration,
          price: newService.price,
        },
      ],
    }))
    setNewService({ name: '', duration: 30, price: 0 })
  }

  const handleRemoveService = (serviceId: number) => {
    setProfileData(prev => ({
      ...prev,
      services: prev.services.filter(service => service.id !== serviceId),
    }))
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'services', name: 'Services', icon: TagIcon },
    { id: 'availability', name: 'Availability', icon: ClockIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage your profile, services, and preferences
            </p>
          </div>
        </div>

        <div className="mt-8">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`
                    flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium
                    ${activeTab === tab.id
                      ? 'border-accent-500 text-accent-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }
                  `}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <Input
                      label="Full Name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      icon={UserIcon}
                    />
                  </div>
                  <div>
                    <Input
                      label="Title"
                      value={profileData.title}
                      onChange={(e) => setProfileData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      label="Email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      icon={EnvelopeIcon}
                    />
                  </div>
                  <div>
                    <Input
                      type="tel"
                      label="Phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      icon={PhoneIcon}
                    />
                  </div>
                  <div>
                    <Input
                      label="Location"
                      value={profileData.location}
                      onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                      icon={MapPinIcon}
                    />
                  </div>
                  <div>
                    <Input
                      label="Instagram Handle"
                      value={profileData.instagram}
                      onChange={(e) => setProfileData(prev => ({ ...prev, instagram: e.target.value }))}
                      icon={LinkIcon}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent-500 focus:ring-accent-500 sm:text-sm"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="inline-flex items-center rounded-md bg-accent-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'services' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="rounded-lg bg-white shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900">Your Services</h3>
                    <div className="mt-4 space-y-4">
                      {profileData.services.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div>
                            <div className="font-medium text-gray-900">{service.name}</div>
                            <div className="mt-1 text-sm text-gray-500">
                              {service.duration} min • ${service.price}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveService(service.id)}
                            className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <h3 className="text-lg font-medium text-gray-900">Add New Service</h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <Input
                        label="Service Name"
                        value={newService.name}
                        onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        label="Duration (minutes)"
                        value={newService.duration}
                        onChange={(e) => setNewService(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        label="Price ($)"
                        value={newService.price}
                        onChange={(e) => setNewService(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleAddService}
                      className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Service
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'availability' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="rounded-lg bg-white p-6 shadow">
                  <h3 className="text-lg font-medium text-gray-900">Default Availability</h3>
                  <div className="mt-4 space-y-4">
                    {Object.entries(profileData.availability).map(([day, schedule]) => (
                      <div key={day} className="flex items-center gap-4">
                        <div className="w-32">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={schedule.isAvailable}
                              onChange={(e) => setProfileData(prev => ({
                                ...prev,
                                availability: {
                                  ...prev.availability,
                                  [day]: { ...schedule, isAvailable: e.target.checked }
                                }
                              }))}
                              className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                            </span>
                          </label>
                        </div>
                        {schedule.isAvailable && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={schedule.start}
                              onChange={(e) => setProfileData(prev => ({
                                ...prev,
                                availability: {
                                  ...prev.availability,
                                  [day]: { ...schedule, start: e.target.value }
                                }
                              }))}
                              className="w-32"
                            />
                            <span className="text-gray-500">to</span>
                            <Input
                              type="time"
                              value={schedule.end}
                              onChange={(e) => setProfileData(prev => ({
                                ...prev,
                                availability: {
                                  ...prev.availability,
                                  [day]: { ...schedule, end: e.target.value }
                                }
                              }))}
                              className="w-32"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="rounded-lg bg-white p-6 shadow">
                  <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Email Notifications</div>
                        <div className="mt-1 text-sm text-gray-500">
                          Receive booking notifications via email
                        </div>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={profileData.notifications.email}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, email: e.target.checked }
                          }))}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-500 peer-focus:ring-offset-2" />
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">SMS Notifications</div>
                        <div className="mt-1 text-sm text-gray-500">
                          Receive booking notifications via text message
                        </div>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={profileData.notifications.sms}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, sms: e.target.checked }
                          }))}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-500 peer-focus:ring-offset-2" />
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Instagram Notifications</div>
                        <div className="mt-1 text-sm text-gray-500">
                          Receive booking notifications via Instagram
                        </div>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={profileData.notifications.instagram}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, instagram: e.target.checked }
                          }))}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-500 peer-focus:ring-offset-2" />
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Booking Request Notifications</div>
                        <div className="mt-1 text-sm text-gray-500">
                          Get notified when you receive new booking requests
                        </div>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={profileData.notifications.bookingRequests}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, bookingRequests: e.target.checked }
                          }))}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-500 peer-focus:ring-offset-2" />
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Appointment Reminders</div>
                        <div className="mt-1 text-sm text-gray-500">
                          Receive reminders for upcoming appointments
                        </div>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={profileData.notifications.reminders}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, reminders: e.target.checked }
                          }))}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-accent-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-500 peer-focus:ring-offset-2" />
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 