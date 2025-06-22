// SMS Service for sending notifications
// In a real implementation, this would integrate with services like Twilio, AWS SNS, etc.

import twilio from 'twilio'
import { getBookingUrl } from '@/lib/utils'


export interface SMSNotification {
  to: string
  message: string
  salonName?: string
}

export class SMSService {
  private static instance: SMSService
  private twilioClient: twilio.Twilio | null = null

  private constructor() {
    // Only initialize Twilio if we have the required environment variables
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        this.twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        )
      } catch (error) {
        console.warn('Failed to initialize Twilio client:', error)
        this.twilioClient = null
      }
    } else {
      console.warn('Twilio credentials not found, SMS notifications will be disabled')
      this.twilioClient = null
    }
  }

  public static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService()
    }
    return SMSService.instance
  }

  /**
   * Send a booking request notification to salon
   */
  async sendBookingRequestNotification(
    salonPhone: string,
    salonSlug: string
  ): Promise<boolean> {
    try {
      // If Twilio is not available, log and return success (don't fail the booking)
      if (!this.twilioClient) {
        console.log(`SMS notification skipped (Twilio not available) - would send to ${salonPhone}`)
        return true
      }

      // Use dashboard URL instead of booking URL for salon notifications
      const dashboardUrl = getBookingUrl(salonSlug).replace('/booking/', '/dashboard/requests');
      const message = `🔔 New booking request! View now: ${dashboardUrl}`

      await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: salonPhone
      })

      console.log(`SMS notification sent to ${salonPhone} for booking request`)
      return true
    } catch (error) {
      console.error('Error sending SMS notification:', error)
      return false
    }
  }

  /**
   * Send a general SMS notification
   */
  async sendNotification(notification: SMSNotification): Promise<boolean> {
    try {
      // If Twilio is not available, log and return success
      if (!this.twilioClient) {
        console.log(`SMS notification skipped (Twilio not available) - would send to ${notification.to}`)
        return true
      }

      await this.twilioClient.messages.create({
        body: notification.message,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: notification.to
      })

      console.log(`SMS notification sent to ${notification.to}`)
      return true
    } catch (error) {
      console.error('Error sending SMS notification:', error)
      return false
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // Basic validation - should start with + and contain only digits
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    return phoneRegex.test(phoneNumber)
  }

  /**
   * Format phone number to E.164 format
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '')
    
    // If it doesn't start with +, add +1 for US numbers
    if (!cleaned.startsWith('+')) {
      cleaned = '+1' + cleaned
    }
    
    return cleaned
  }
}

// Export singleton instance
export const smsService = SMSService.getInstance()

// Helper function to get the booking URL
export function getBookingUrlForSMS(salonSlug: string): string {
  return getBookingUrl(salonSlug);
}

// Helper function to format phone numbers
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as XXX-XXX-XXXX
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Return original if not 10 digits
  return phone;
}

// Helper function to validate phone numbers
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
} 