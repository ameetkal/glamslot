// Types for the feedback system
export interface DeclineFeedback {
  requestId: number
  reason: string
  customReason?: string
  actionable: boolean
  suggestedAction?: string
  requestData: {
    providerId?: number
    serviceId?: number
    service: string
    duration: number
    price: number
    date: string
    time: string
  }
}

export interface SystemUpdate {
  type: 'service_duration' | 'service_pricing' | 'provider_mapping' | 'availability' | 'consultation_requirement'
  data: Record<string, unknown>
  priority: 'high' | 'medium' | 'low'
  description: string
}

// Mock data stores (in a real app, these would be database operations)
const serviceDurations: Record<number, number> = {
  1: 45, // Haircut
  2: 90, // Color
  3: 120, // Balayage
  4: 90, // Highlights
  5: 30, // Blowout
}

const servicePricing: Record<number, number> = {
  1: 65, // Haircut
  2: 135, // Color
  3: 185, // Balayage
  4: 150, // Highlights
  5: 45, // Blowout
}

let providerServiceMappings: Array<{
  providerId: number
  serviceId: number
  duration: number
  isSpecialty: boolean
  requiresConsultation: boolean
}> = [
  { providerId: 1, serviceId: 1, duration: 45, isSpecialty: true, requiresConsultation: false },
  { providerId: 1, serviceId: 2, duration: 100, isSpecialty: false, requiresConsultation: true },
  { providerId: 2, serviceId: 1, duration: 50, isSpecialty: false, requiresConsultation: false },
  { providerId: 2, serviceId: 3, duration: 130, isSpecialty: true, requiresConsultation: true },
]

const consultationRequirements: Record<number, boolean> = {
  1: false, // Haircut
  2: true,  // Color
  3: true,  // Balayage
  4: true,  // Highlights
  5: false, // Blowout
}

// Feedback processing logic
export class FeedbackProcessor {
  private static instance: FeedbackProcessor
  private updateQueue: SystemUpdate[] = []

  static getInstance(): FeedbackProcessor {
    if (!FeedbackProcessor.instance) {
      FeedbackProcessor.instance = new FeedbackProcessor()
    }
    return FeedbackProcessor.instance
  }

  // Process decline feedback and generate system updates
  processDeclineFeedback(feedback: DeclineFeedback): SystemUpdate[] {
    const updates: SystemUpdate[] = []

    switch (feedback.reason) {
      case 'insufficient_time':
        updates.push(this.handleInsufficientTime(feedback))
        break
      case 'price_mismatch':
        updates.push(this.handlePriceMismatch(feedback))
        break
      case 'consultation_required':
        updates.push(this.handleConsultationRequired(feedback))
        break
      case 'provider_not_qualified':
        updates.push(this.handleProviderNotQualified(feedback))
        break
      case 'service_not_offered':
        updates.push(this.handleServiceNotOffered(feedback))
        break
      case 'service_discontinued':
        updates.push(this.handleServiceDiscontinued(feedback))
        break
      case 'specialty_required':
        updates.push(this.handleSpecialtyRequired(feedback))
        break
      case 'provider_left':
        updates.push(this.handleProviderLeft(feedback))
        break
    }

    // Add updates to queue
    this.updateQueue.push(...updates)
    
    // Log the updates for now (in a real app, these would trigger actual system changes)
    console.log('Generated system updates:', updates)
    
    return updates
  }

  private handleInsufficientTime(feedback: DeclineFeedback): SystemUpdate {
    const { serviceId, duration } = feedback.requestData
    const currentDuration = serviceDurations[serviceId!] || 60
    
    // If the requested duration is longer than current, update it
    if (duration > currentDuration) {
      serviceDurations[serviceId!] = duration
      
      return {
        type: 'service_duration',
        data: { serviceId, newDuration: duration, previousDuration: currentDuration },
        priority: 'high',
        description: `Updated service duration from ${currentDuration} to ${duration} minutes based on decline feedback`
      }
    }
    
    return {
      type: 'service_duration',
      data: { serviceId, suggestedDuration: duration, currentDuration },
      priority: 'medium',
      description: `Consider increasing service duration to ${duration} minutes`
    }
  }

  private handlePriceMismatch(feedback: DeclineFeedback): SystemUpdate {
    const { serviceId, price } = feedback.requestData
    const currentPrice = servicePricing[serviceId!] || 0
    
    // Update pricing if there's a significant difference
    if (Math.abs(price - currentPrice) > 5) {
      servicePricing[serviceId!] = price
      
      return {
        type: 'service_pricing',
        data: { serviceId, newPrice: price, previousPrice: currentPrice },
        priority: 'high',
        description: `Updated service pricing from $${currentPrice} to $${price} based on decline feedback`
      }
    }
    
    return {
      type: 'service_pricing',
      data: { serviceId, requestedPrice: price, currentPrice },
      priority: 'medium',
      description: `Price discrepancy detected: requested $${price}, current $${currentPrice}`
    }
  }

  private handleConsultationRequired(feedback: DeclineFeedback): SystemUpdate {
    const { serviceId } = feedback.requestData
    const currentRequirement = consultationRequirements[serviceId!] || false
    
    if (!currentRequirement) {
      consultationRequirements[serviceId!] = true
      
      return {
        type: 'consultation_requirement',
        data: { serviceId, requiresConsultation: true },
        priority: 'high',
        description: `Marked service as requiring consultation based on decline feedback`
      }
    }
    
    return {
      type: 'consultation_requirement',
      data: { serviceId, alreadyRequiresConsultation: true },
      priority: 'low',
      description: `Service already marked as requiring consultation`
    }
  }

  private handleProviderNotQualified(feedback: DeclineFeedback): SystemUpdate {
    const { providerId, serviceId } = feedback.requestData
    
    // Remove the provider-service mapping
    const mappingIndex = providerServiceMappings.findIndex(
      m => m.providerId === providerId && m.serviceId === serviceId
    )
    
    if (mappingIndex !== -1) {
      const removedMapping = providerServiceMappings[mappingIndex]
      providerServiceMappings.splice(mappingIndex, 1)
      
      return {
        type: 'provider_mapping',
        data: { 
          providerId, 
          serviceId, 
          action: 'removed',
          previousMapping: removedMapping 
        },
        priority: 'high',
        description: `Removed provider-service mapping based on decline feedback`
      }
    }
    
    return {
      type: 'provider_mapping',
      data: { providerId, serviceId, action: 'none' },
      priority: 'low',
      description: `Provider-service mapping not found`
    }
  }

  private handleServiceNotOffered(feedback: DeclineFeedback): SystemUpdate {
    const { service } = feedback.requestData
    
    return {
      type: 'service_duration', // Using this as a catch-all for service updates
      data: { 
        serviceName: service,
        action: 'add_service',
        suggestedDuration: 60,
        suggestedPrice: 75
      },
      priority: 'medium',
      description: `Consider adding "${service}" to the service catalog`
    }
  }

  private handleServiceDiscontinued(feedback: DeclineFeedback): SystemUpdate {
    const { serviceId } = feedback.requestData
    
    return {
      type: 'service_duration', // Using this as a catch-all for service updates
      data: { 
        serviceId,
        action: 'remove_service'
      },
      priority: 'medium',
      description: `Consider removing this service from the catalog`
    }
  }

  private handleSpecialtyRequired(feedback: DeclineFeedback): SystemUpdate {
    const { serviceId } = feedback.requestData
    
    // Mark all current mappings for this service as specialty
    const updatedMappings = providerServiceMappings
      .filter(m => m.serviceId === serviceId)
      .map(m => ({ ...m, isSpecialty: true }))
    
    if (updatedMappings.length > 0) {
      // Update the mappings
      updatedMappings.forEach(mapping => {
        const index = providerServiceMappings.findIndex(
          m => m.providerId === mapping.providerId && m.serviceId === mapping.serviceId
        )
        if (index !== -1) {
          providerServiceMappings[index] = mapping
        }
      })
      
      return {
        type: 'provider_mapping',
        data: { 
          serviceId,
          action: 'mark_specialty',
          updatedMappings
        },
        priority: 'high',
        description: `Marked service as specialty for all providers`
      }
    }
    
    return {
      type: 'provider_mapping',
      data: { serviceId, action: 'no_providers' },
      priority: 'medium',
      description: `No providers currently offer this service`
    }
  }

  private handleProviderLeft(feedback: DeclineFeedback): SystemUpdate {
    const { providerId } = feedback.requestData
    
    // Remove all mappings for this provider
    const removedMappings = providerServiceMappings.filter(m => m.providerId === providerId)
    providerServiceMappings = providerServiceMappings.filter(m => m.providerId !== providerId)
    
    return {
      type: 'provider_mapping',
      data: { 
        providerId,
        action: 'remove_provider',
        removedMappings
      },
      priority: 'high',
      description: `Removed all service mappings for provider who left`
    }
  }

  // Get current system state for debugging/testing
  getSystemState() {
    return {
      serviceDurations,
      servicePricing,
      providerServiceMappings,
      consultationRequirements,
      pendingUpdates: this.updateQueue
    }
  }

  // Apply pending updates (in a real app, this would update the database)
  applyPendingUpdates(): void {
    console.log('Applying pending updates:', this.updateQueue)
    this.updateQueue = [] // Clear the queue after applying
  }

  // Get suggested improvements based on feedback patterns
  getSuggestedImprovements(): string[] {
    const suggestions: string[] = []
    
    // Analyze patterns and generate suggestions
    if (this.updateQueue.length > 0) {
      const durationUpdates = this.updateQueue.filter(u => u.type === 'service_duration')
      const pricingUpdates = this.updateQueue.filter(u => u.type === 'service_pricing')
      
      if (durationUpdates.length > 2) {
        suggestions.push('Multiple duration updates detected - consider reviewing all service duration estimates')
      }
      
      if (pricingUpdates.length > 2) {
        suggestions.push('Multiple pricing updates detected - consider reviewing pricing strategy')
      }
    }
    
    return suggestions
  }

  // Methods to update system data based on user input
  updateServiceDuration(serviceId: number, newDuration: number): void {
    serviceDurations[serviceId] = newDuration
    console.log(`Updated service ${serviceId} duration to ${newDuration} minutes`)
  }

  updateServicePricing(serviceId: number, newPrice: number): void {
    servicePricing[serviceId] = newPrice
    console.log(`Updated service ${serviceId} pricing to $${newPrice}`)
  }

  updateConsultationRequirement(serviceId: number, requiresConsultation: boolean): void {
    consultationRequirements[serviceId] = requiresConsultation
    console.log(`Updated service ${serviceId} consultation requirement to ${requiresConsultation}`)
  }
} 