import Mailjet from 'node-mailjet';

const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY!,
  apiSecret: process.env.MAILJET_API_SECRET!,
});

export interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    console.log('Attempting to send email with Mailjet...');
    console.log('API Key:', process.env.MAILJET_API_KEY ? 'Present' : 'Missing');
    console.log('API Secret:', process.env.MAILJET_API_SECRET ? 'Present' : 'Missing');
    console.log('From Email:', process.env.MAILJET_FROM_EMAIL || 'noreply@yourdomain.com');
    console.log('To Email:', emailData.to);
    console.log('Subject:', emailData.subject);

    const request = mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_FROM_EMAIL || 'noreply@yourdomain.com',
            Name: process.env.MAILJET_FROM_NAME || 'Salon Booking System'
          },
          To: [
            {
              Email: emailData.to,
              Name: emailData.to.split('@')[0] // Use email prefix as name
            }
          ],
          Subject: emailData.subject,
          TextPart: emailData.text || '',
          HTMLPart: emailData.html || emailData.text || ''
        }
      ]
    });

    const response = await request;
    console.log('Mailjet API Response:', JSON.stringify(response.body, null, 2));
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return false;
  }
}

export async function sendTestEmail(to: string): Promise<boolean> {
  const testEmailData: EmailData = {
    to,
    subject: 'Test Email from Salon Booking System',
    text: 'This is a test email to verify that email notifications are working correctly.',
    html: `
      <h2>Test Email</h2>
      <p>This is a test email to verify that email notifications are working correctly.</p>
      <p>If you received this email, your email notification system is properly configured!</p>
      <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
    `
  };

  return sendEmail(testEmailData);
} 