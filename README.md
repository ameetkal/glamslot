# GlamSlot - Beauty Appointment Booking System

GlamSlot is a professional booking platform designed for salons and beauty professionals to efficiently manage client appointments and requests.

## Features

- 📅 **Smart Booking Requests** - Clients can submit booking requests with their preferred services and times
- 💄 **Salon Management** - Complete dashboard for managing appointments, clients, and business settings
- 🎯 **Loyalty Programs** - Built-in loyalty system with QR code scanning and rewards tracking
- 📱 **Mobile Optimized** - Responsive design that works perfectly on all devices
- 🔔 **Smart Notifications** - Email and SMS notifications for new bookings and updates
- 📊 **Analytics Dashboard** - Track booking stats, client activity, and business metrics

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account for backend services
- Twilio account for SMS notifications (optional)
- Mailjet account for email notifications (optional)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/glamslot.git
cd glamslot
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

4. Configure your Firebase, Twilio, and Mailjet credentials in `.env.local`

5. Run the development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) to see the app

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **Notifications**: Twilio (SMS), Mailjet (Email)
- **Deployment**: Vercel

## License

This project is licensed under the MIT License.
