'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import AddSlotForm from '@/components/forms/AddSlotForm'

// Gap slots data (mock for now)
const availableSlots = [
  { id: 1, date: 'Today', time: '2:00 PM - 3:00 PM', service: 'Any Service', status: 'available' as const },
  { id: 2, date: 'Tomorrow', time: '11:30 AM - 12:30 PM', service: 'Haircut Only', status: 'available' as const },
]

type Slot = {
  id: number
  date: string
  time: string
  service: string
  status: 'available' | 'booked' | 'completed'
}

type SlotFormData = {
  date: Date
  startTime: string
  endTime: string
  serviceType: 'any' | 'haircut' | 'color' | 'styling'
}

export default function AvailabilityPage() {
  const [isAddingSlot, setIsAddingSlot] = useState(false)
  const [slots, setSlots] = useState<Slot[]>(availableSlots)

  const handleAddSlot = (data: SlotFormData) => {
    // In a real app, this would make an API call
    const newSlot: Slot = {
      id: Date.now(),
      date: data.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      time: `${data.startTime} - ${data.endTime}`,
      service: data.serviceType.charAt(0).toUpperCase() + data.serviceType.slice(1) + ' Service',
      status: 'available'
    }
    setSlots([...slots, newSlot])
    setIsAddingSlot(false)
  }

  const handleRemoveSlot = (id: number) => {
    setSlots(slots.filter(slot => slot.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Upload Gap Time Slots</h1>
          <p className="mt-2 text-sm text-gray-700 mb-4">
            Use this page to upload last-minute or gap appointment slots you want to fill. <br />
            <span className="text-blue-700 font-medium">Your main schedule is managed in your POS system.</span> Only upload open slots you want to promote or fill through this platform.
          </p>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsAddingSlot(true)}
              className="flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white font-semibold px-4 py-2 rounded-md shadow-md border-none"
            >
              + Add Gap Slot
            </button>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            {slots.length === 0 ? (
              <p className="text-gray-500 text-center">No gap slots uploaded yet.</p>
            ) : (
              <ul role="list" className="divide-y divide-gray-200">
                {slots.map((slot) => (
                  <li key={slot.id} className="py-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{slot.date}</div>
                      <div className="text-sm text-gray-500">{slot.time} • {slot.service}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(slot.id)}
                      className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <Modal isOpen={isAddingSlot} onClose={() => setIsAddingSlot(false)} title="Add Gap Slot">
          <AddSlotForm onSubmit={handleAddSlot} onCancel={() => setIsAddingSlot(false)} />
        </Modal>
      </div>
    </div>
  )
}