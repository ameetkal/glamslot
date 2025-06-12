'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import AddSlotForm from '@/components/forms/AddSlotForm'

// Mock data for the prototype
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM',
  '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
]

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

export default function AvailabilityPage() {
  const [isAddingSlot, setIsAddingSlot] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const handleAddSlot = (data: unknown) => {
    // In a real app, this would make an API call
    console.log('Adding slot:', data)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Availability</h1>
            <Button
              variant="primary"
              onClick={() => setIsAddingSlot(true)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add Time Slot
            </Button>
          </div>

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
          <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
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
          onSubmit={handleAddSlot}
          onCancel={() => {
            setIsAddingSlot(false)
            setIsEditing(false)
            setSelectedDate(null)
            setSelectedTime(null)
          }}
          initialData={isEditing && selectedDate && selectedTime ? {
            date: selectedDate.toISOString().split('T')[0],
            startTime: selectedTime,
            endTime: timeSlots[timeSlots.indexOf(selectedTime) + 1] || selectedTime,
            serviceType: 'any'
          } : undefined}
        />
      </Modal>
    </div>
  )
} 