import Mailjet from 'node-mailjet';

interface EmailRecipient {
  email: string;
  name: string;
}

interface TeamInvitationEmail {
  to: EmailRecipient;
  salonName: string;
  invitedBy: string;
  invitationUrl: string;
  salonUrl: string;
}

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

class MailjetService {
  private mailjet: Mailjet;

  constructor() {
    const apiKey = process.env.MAILJET_API_KEY;
    const apiSecret = process.env.MAILJET_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('Mailjet API credentials not found in environment variables');
    }

    this.mailjet = new Mailjet({
      apiKey,
      apiSecret
    });
  }

  async sendEmail(data: EmailData): Promise<boolean> {
    try {
      const request = this.mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: process.env.MAILJET_FROM_EMAIL || 'noreply@yourdomain.com',
              Name: process.env.MAILJET_FROM_NAME || 'Salon Booking System'
            },
            To: [
              {
                Email: data.to,
                Name: data.to.split('@')[0] // Use email prefix as name
              }
            ],
            Subject: data.subject,
            HTMLPart: data.html || data.text,
            TextPart: data.text
          }
        ]
      });

      const response = await request;
      console.log('Mailjet response:', response.body);
      
      return response.response.status === 200;
    } catch (error) {
      console.error('Error sending email via Mailjet:', error);
      return false;
    }
  }

  async sendTestEmail(email: string): Promise<boolean> {
    try {
      const request = this.mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: process.env.MAILJET_FROM_EMAIL || 'noreply@yourdomain.com',
              Name: process.env.MAILJET_FROM_NAME || 'Salon Booking System'
            },
            To: [
              {
                Email: email,
                Name: email.split('@')[0]
              }
            ],
            Subject: 'Test Email from Salon Booking System',
            HTMLPart: `
              <h2>Test Email</h2>
              <p>This is a test email from your salon booking system.</p>
              <p>If you received this email, your email notifications are working correctly!</p>
              <p>Sent at: ${new Date().toLocaleString()}</p>
            `,
            TextPart: `Test Email\n\nThis is a test email from your salon booking system.\n\nIf you received this email, your email notifications are working correctly!\n\nSent at: ${new Date().toLocaleString()}`
          }
        ]
      });

      const response = await request;
      console.log('Mailjet API Response:', response.body);
      
      return response.response.status === 200;
    } catch (error) {
      console.error('Error sending test email via Mailjet:', error);
      return false;
    }
  }

  async sendTeamInvitation(data: TeamInvitationEmail): Promise<boolean> {
    try {
      const request = this.mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: process.env.MAILJET_FROM_EMAIL || 'noreply@yourdomain.com',
              Name: process.env.MAILJET_FROM_NAME || 'Salon Booking System'
            },
            To: [
              {
                Email: data.to.email,
                Name: data.to.name
              }
            ],
            Subject: `You've been invited to join ${data.salonName}`,
            HTMLPart: this.generateInvitationEmailHTML(data),
            TextPart: this.generateInvitationEmailText(data)
          }
        ]
      });

      const response = await request;
      console.log('Mailjet response:', response.body);
      
      return response.response.status === 200;
    } catch (error) {
      console.error('Error sending email via Mailjet:', error);
      return false;
    }
  }

  private generateInvitationEmailHTML(data: TeamInvitationEmail): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Invitation - ${data.salonName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 You're Invited!</h1>
            <p>Join the team at ${data.salonName}</p>
          </div>
          
          <div class="content">
            <h2>Hi ${data.to.name},</h2>
            
            <p>You've been invited by <strong>${data.invitedBy}</strong> to join the team at <strong>${data.salonName}</strong> as a team member.</p>
            
            <p>As a team member, you'll have access to:</p>
            <ul>
              <li>View and manage booking requests</li>
              <li>Access client information</li>
              <li>Help manage salon operations</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${data.invitationUrl}" class="button">Accept Invitation</a>
            </div>
            
            <div class="details">
              <h3>Invitation Details:</h3>
              <p><strong>Salon:</strong> ${data.salonName}</p>
              <p><strong>Invited By:</strong> ${data.invitedBy}</p>
              <p><strong>Your Role:</strong> Team Member</p>
              <p><strong>Expires:</strong> 7 days from now</p>
            </div>
            
            <p><strong>Important:</strong> This invitation will expire in 7 days. If you have any questions, please contact the person who invited you.</p>
            
            <p>Best regards,<br>The ${data.salonName} Team</p>
          </div>
          
          <div class="footer">
            <p>This invitation was sent from ${data.salonUrl}</p>
            <p>If you didn't expect this invitation, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generateInvitationEmailText(data: TeamInvitationEmail): string {
    return `
You've been invited to join ${data.salonName}

Hi ${data.to.name},

You've been invited by ${data.invitedBy} to join the team at ${data.salonName} as a team member.

As a team member, you'll have access to:
- View and manage booking requests
- Access client information  
- Help manage salon operations

To accept this invitation, please click the link below:
${data.invitationUrl}

Invitation Details:
- Salon: ${data.salonName}
- Invited By: ${data.invitedBy}
- Your Role: Team Member
- Expires: 7 days from now

Important: This invitation will expire in 7 days. If you have any questions, please contact the person who invited you.

Best regards,
The ${data.salonName} Team

This invitation was sent from ${data.salonUrl}
If you didn't expect this invitation, please ignore this email.
    `
  }
}

// Export singleton instance
export const mailjetService = new MailjetService();

// Export standalone functions for API routes
export const sendEmail = (data: EmailData) => mailjetService.sendEmail(data);
export const sendTestEmail = (email: string) => mailjetService.sendTestEmail(email); 