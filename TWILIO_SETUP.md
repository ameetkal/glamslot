# Twilio SMS Setup Guide

## Environment Variables to Add

Add these variables to your `.env.local` file:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## How to Get Your Twilio Credentials

1. **Log into your Twilio Console**: https://console.twilio.com/
2. **Find your Account SID**: On the dashboard, copy your Account SID
3. **Find your Auth Token**: Click "Show" next to your Auth Token and copy it
4. **Get a Phone Number**: 
   - Go to Phone Numbers > Manage > Active numbers
   - If you don't have one, buy a new number
   - Copy the phone number (format: +1234567890)

## Security Notes

- Never commit these credentials to git
- Use different credentials for development and production
- Consider using Twilio's test credentials for development 