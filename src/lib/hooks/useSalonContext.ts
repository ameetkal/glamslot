import { useAuth } from '@/lib/auth'
import { useMemo } from 'react'

/**
 * Hook that provides the current salon context
 * For SuperAdmins: returns selected salon context when impersonating
 * For regular users: returns their own salon context
 */
export function useSalonContext() {
  const { currentSalonId, currentSalonName, isPlatformAdmin, selectedSalonId } = useAuth()
  
  // Memoize isImpersonating to prevent unnecessary re-renders
  const isImpersonating = useMemo(() => 
    isPlatformAdmin && selectedSalonId !== null, 
    [isPlatformAdmin, selectedSalonId]
  )
  
  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    // Current salon ID (either selected or user's own)
    salonId: currentSalonId,
    // Current salon name (either selected or user's own)
    salonName: currentSalonName,
    // Whether SuperAdmin is currently impersonating another salon
    isImpersonating,
    // The selected salon ID (null if not impersonating)
    selectedSalonId,
    // Whether user is a SuperAdmin
    isPlatformAdmin
  }), [currentSalonId, currentSalonName, isImpersonating, selectedSalonId, isPlatformAdmin])
}
