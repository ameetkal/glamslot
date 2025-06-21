// SMS Service for sending notifications
// In a real implementation, this would integrate with services like Twilio, AWS SNS, etc.

import twilio from 'twilio'


export interface SMSNotification {
  to: string
  message: string
  salonName?: string
}

export class SMSService {
  private static instance: SMSService
  private twilioClient: twilio.Twilio

  private constructor() {
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )
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
    clientName: string,
    service: string,
    salonName: string
  ): Promise<boolean> {
    try {
      const message = `🔔 New booking request from ${clientName} for ${service} at ${salonName}. Check your dashboard to respond!`

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
export function getBookingUrl(salonSlug: string): string {
  return `https://booking.glammatic.com/${salonSlug}`;
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