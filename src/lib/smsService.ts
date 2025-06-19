// SMS Service for sending notifications
// In a real implementation, this would integrate with services like Twilio, AWS SNS, etc.

export interface SmsNotification {
  to: string;
  message: string;
}

export interface SalonSmsSettings {
  enabled: boolean;
  recipients: string[];
}

export class SmsService {
  private static instance: SmsService;
  private salonSettings: SalonSmsSettings = {
    enabled: false,
    recipients: []
  };

  private constructor() {}

  public static getInstance(): SmsService {
    if (!SmsService.instance) {
      SmsService.instance = new SmsService();
    }
    return SmsService.instance;
  }

  public updateSalonSettings(settings: SalonSmsSettings): void {
    this.salonSettings = settings;
  }

  public async sendBookingRequestNotification(): Promise<void> {
    if (!this.salonSettings.enabled || this.salonSettings.recipients.length === 0) {
      console.log('SMS notifications disabled or no recipients configured');
      return;
    }

    // Use the salon dashboard requests URL
    const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://last-minute-app.vercel.app/dashboard/requests';
    const message = `New Booking Request: visit ${dashboardUrl} to view`;

    const notifications: SmsNotification[] = this.salonSettings.recipients.map(recipient => ({
      to: recipient,
      message
    }));

    try {
      // In a real implementation, this would make API calls to your SMS provider
      await this.sendSmsBatch(notifications);
      console.log(`SMS notifications sent to ${notifications.length} recipients`);
    } catch (error) {
      console.error('Failed to send SMS notifications:', error);
      // In production, you might want to log this to an error tracking service
    }
  }

  private async sendSmsBatch(notifications: SmsNotification[]): Promise<void> {
    // Simulate SMS sending - replace with actual SMS provider integration
    const promises = notifications.map(async (notification) => {
      // Example with Twilio:
      // const client = require('twilio')(accountSid, authToken);
      // return client.messages.create({
      //   body: notification.message,
      //   from: '+1234567890',
      //   to: notification.to
      // });

      // For now, just simulate the API call
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log(`SMS to ${notification.to}: ${notification.message}`);
    });

    await Promise.all(promises);
  }

  public async sendTestSms(phoneNumber: string): Promise<boolean> {
    try {
      const testMessage = 'Test SMS from Last Minute App - SMS notifications are working!';
      await this.sendSmsBatch([{ to: phoneNumber, message: testMessage }]);
      return true;
    } catch (error) {
      console.error('Test SMS failed:', error);
      return false;
    }
  }
}

// Helper function to get the booking URL
export function getBookingUrl(salonSlug: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://last-minute-app.vercel.app';
  return `${baseUrl}/booking/${salonSlug}`;
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