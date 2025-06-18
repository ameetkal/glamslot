'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import AddSlotForm from '@/components/forms/AddSlotForm'

// Calendar data
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM',
  '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
]

// Mock data for the prototype
const availableSlots = [
  { 
    id: 1, 
    date: 'Today', 
    time: '2:00 PM - 3:00 PM', 
    service: 'Any Service',
    status: 'available' as const
  },
  { 
    id: 2, 
    date: 'Tomorrow', 
    time: '11:30 AM - 12:30 PM', 
    service: 'Haircut Only',
    status: 'available' as const
  },
  { 
    id: 3, 
    date: 'Tomorrow', 
    time: '3:00 PM - 4:30 PM', 
    service: 'Color Service',
    status: 'available' as const
  },
  { 
    id: 4, 
    date: 'Wednesday', 
    time: '10:00 AM - 11:00 AM', 
    service: 'Any Service',
    status: 'available' as const
  },
  { 
    id: 5, 
    date: 'Wednesday', 
    time: '2:00 PM - 3:30 PM', 
    service: 'Color Service',
    status: 'available' as const
  },
  { 
    id: 6, 
    date: 'Thursday', 
    time: '9:00 AM - 10:00 AM', 
    service: 'Haircut Only',
    status: 'available' as const
  },
]

type Slot = {
  id: number
  date: string
  time: string
  service: string
  status: 'available' | 'booked' | 'completed'
}

// Generate mock calendar data
const generateCalendarData = () => {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    return {
      date,
      slots: timeSlots.map(time => ({
        time,
        isAvailable: Math.random() > 0.7,
        service: Math.random() > 0.5 ? 'Any Service' : 'Haircut Only',
      }))
    }
  })
  return days
}

const calendarData = generateCalendarData()

type ViewMode = 'list' | 'calendar'
type SlotFormData = {
  date: Date
  startTime: string
  endTime: string
  serviceType: 'any' | 'haircut' | 'color' | 'styling'
}

export default function AvailabilityPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isAddingSlot, setIsAddingSlot] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [slots, setSlots] = useState<Slot[]>(availableSlots)

  const handleAddSlot = (data: SlotFormData) => {
    // In a real app, this would make an API call
    console.log('Adding slot:', data)
    const newSlot: Slot = {
      id: Date.now(),
      date: data.date.toLocaleDateString('en-US', { weekday: 'long' }),
      time: `${data.startTime} - ${data.endTime}`,
      service: data.serviceType.charAt(0).toUpperCase() + data.serviceType.slice(1) + ' Service',
      status: 'available'
    }
    setSlots([...slots, newSlot])
    setIsAddingSlot(false)
  }

  const handleEditSlot = (date: Date, time: string) => {
    setSelectedDate(date)
    setSelectedTime(time)
    setIsEditing(true)
  }

  const handleDeleteSlot = (date: Date, time: string) => {
    // In a real app, this would make an API call
    console.log('Deleting slot:', date, time)
  }

  const handleRemoveSlot = (id: number) => {
    setSlots(slots.filter(slot => slot.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Availability</h1>
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex rounded-lg border border-gray-200 bg-white p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    viewMode === 'list'
                      ? 'bg-accent-50 text-accent-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                  List
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    viewMode === 'calendar'
                      ? 'bg-accent-50 text-accent-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <CalendarIcon className="h-5 w-5" />
                  Calendar
                </button>
              </div>
              <Button
                variant="primary"
                onClick={() => setIsAddingSlot(true)}
                className="flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-black font-semibold shadow-md border-none"
              >
                <PlusIcon className="h-4 w-4" />
                Add Time Slot
              </Button>
            </div>
          </div>

          {viewMode === 'list' ? (
            // List View
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 overflow-hidden rounded-lg bg-white shadow"
            >
              <div className="p-6">
                <div className="mt-6 flow-root">
                  <ul role="list" className="-my-5 divide-y divide-gray-200">
                    {slots.map((slot) => (
                      <li key={slot.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{slot.date}</p>
                            <p className="truncate text-sm text-gray-500">{slot.time}</p>
                          </div>
                          <div>
                            <span className="inline-flex items-center rounded-full bg-tan-50 px-2 py-1 text-xs font-medium text-tan-700 ring-1 ring-inset ring-tan-600/20">
                              {slot.service}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(slot.id)}
                            className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ) : (
            // Calendar View
            <>
              {/* Calendar Navigation */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Previous Week
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    Next Week
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-500">
                  {calendarData[0].date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - 
                  {calendarData[6].date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="mt-8">
                <div className="grid grid-cols-8 border-b border-gray-200">
                  <div className="col-span-1 p-4 text-sm font-medium text-gray-500">Time</div>
                  {weekDays.map((day, index) => (
                    <div
                      key={day}
                      className="p-4 text-center text-sm font-medium text-gray-500"
                    >
                      <div>{day}</div>
                      <div className="mt-1 text-xs text-gray-400">
                        {calendarData[index].date.getDate()}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="divide-y divide-gray-200">
                  {timeSlots.map((time) => (
                    <div key={time} className="grid grid-cols-8">
                      <div className="col-span-1 p-4 text-sm text-gray-500">
                        {time}
                      </div>
                      {calendarData.map((day) => {
                        const slot = day.slots.find(s => s.time === time)
                        return (
                          <div
                            key={`${day.date.toISOString()}-${time}`}
                            className={`relative p-4 ${
                              slot?.isAvailable
                                ? 'bg-tan-50'
                                : 'bg-gray-50'
                            }`}
                          >
                            {slot?.isAvailable && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group relative h-full"
                              >
                                <div className="flex h-full flex-col justify-between">
                                  <span className="text-xs font-medium text-tan-700">
                                    {slot.service}
                                  </span>
                                  <div className="mt-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleEditSlot(day.date, time)}
                                      className="rounded p-1 text-gray-400 hover:bg-white hover:text-gray-500"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSlot(day.date, time)}
                                      className="rounded p-1 text-gray-400 hover:bg-white hover:text-red-500"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-tan-50" />
              Available
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-gray-50" />
              Unavailable
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Slot Modal */}
      <Modal
        isOpen={isAddingSlot || isEditing}
        onClose={() => {
          setIsAddingSlot(false)
          setIsEditing(false)
          setSelectedDate(null)
          setSelectedTime(null)
        }}
        title={isEditing ? 'Edit Time Slot' : 'Add Time Slot'}
      >
        <AddSlotForm
          onSubmit={(data) => {
            handleAddSlot({
              ...data,
              date: new Date(data.date)  // Convert string to Date
            })
            setIsEditing(false)
            setIsAddingSlot(false)
            setSelectedDate(null)
            setSelectedTime(null)
          }}
          onCancel={() => {
            setIsEditing(false)
            setIsAddingSlot(false)
            setSelectedDate(null)
            setSelectedTime(null)
          }}
          initialData={isEditing && selectedDate && selectedTime ? {
            date: selectedDate,  // Pass the Date object directly
            startTime: selectedTime,
            endTime: timeSlots[timeSlots.indexOf(selectedTime) + 1] || selectedTime,
            serviceType: 'any'
          } : undefined}
        />
      </Modal>
    </div>
  )
}