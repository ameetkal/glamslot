'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/auth'
import Select from './Select'

interface Salon {
  id: string
  name: string
  slug: string
}

export function BusinessSelector() {
  const { user, isPlatformAdmin, selectedSalonId, setSelectedSalonId } = useAuth()
  const [salons, setSalons] = useState<Salon[]>([])
  const [loading, setLoading] = useState(false)

  // Memoize options to prevent unnecessary re-renders
  const options = useMemo(() => [
    { value: 'platform', label: loading ? 'Loading...' : '🏢 Platform View' },
    ...salons.map(salon => ({
      value: salon.id,
      label: salon.name
    }))
  ], [loading, salons])

  useEffect(() => {
    const fetchSalons = async () => {
      if (!isPlatformAdmin) return
      
      setLoading(true)
      try {
        const { collection, getDocs } = await import('firebase/firestore')
        const { db } = await import('@/lib/firebase')
        
        const salonsSnapshot = await getDocs(collection(db, 'salons'))
        const salonsData: Salon[] = salonsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || 'Unnamed Salon',
          slug: doc.data().slug || doc.id
        }))
        
        // Sort by name
        salonsData.sort((a, b) => a.name.localeCompare(b.name))
        setSalons(salonsData)
      } catch (error) {
        console.error('Error fetching salons:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSalons()
  }, [isPlatformAdmin])

  // Only show for SuperAdmins
  if (!user || !isPlatformAdmin) {
    return null
  }

  const handleSalonChange = (salonId: string) => {
    if (salonId === 'platform') {
      setSelectedSalonId(null) // Return to platform view
    } else {
      setSelectedSalonId(salonId)
    }
  }

  const currentSalon = salons.find(s => s.id === selectedSalonId)
  const isImpersonating = selectedSalonId !== null

  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <div className="space-y-3">
        <Select
          value={selectedSalonId || 'platform'}
          onChange={(e) => handleSalonChange(e.target.value)}
          disabled={loading}
          className="w-full"
          options={options}
        />
        
        {isImpersonating && currentSalon && (
          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded text-center">
            <span>👁️ Viewing: {currentSalon.name}</span>
          </div>
        )}
      </div>
    </div>
  )
}
