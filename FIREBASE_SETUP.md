# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "salon-booking-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Firestore Database

1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development (we'll add security rules later)
4. Select a location closest to your users
5. Click "Done"

## Step 3: Get Firebase Configuration

1. In your Firebase project, go to "Project settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select "Web" (</>)
4. Register your app with a nickname (e.g., "salon-booking-web")
5. Copy the configuration object

## Step 4: Update Environment Variables

1. Open `.env.local` in your project root
2. Replace the placeholder values with your actual Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 5: Deploy Firestore Security Rules

1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init
   ```
   - Select "Firestore" and "Hosting"
   - Choose your project
   - Use default settings

4. Deploy the security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Step 6: Create Initial Data Structure

The app will automatically create the following collections when you start using it:

- `salons` - Salon information and settings
- `providers` - Stylist/provider information
- `services` - Available services
- `bookingRequests` - Client booking requests

## Step 7: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to your booking form and submit a test request
3. Check the Firebase Console to see if the data is being created

## Security Rules Explanation

The Firestore security rules ensure:

- **Public read access** to salon information (needed for booking forms)
- **Authenticated write access** for salon owners to manage their data
- **Public create access** for booking requests (anyone can submit)
- **Authenticated read/update access** for salon owners to manage requests

## Next Steps

1. Set up Firebase Authentication for salon owner login
2. Configure Firebase Storage for file uploads (if needed)
3. Set up Firebase Functions for advanced features
4. Configure Firebase Hosting for production deployment

## Troubleshooting

### Common Issues:

1. **"Firebase App named '[DEFAULT]' already exists"**
   - This usually means Firebase is being initialized multiple times
   - Check that you're only importing the Firebase config once

2. **"Missing or insufficient permissions"**
   - Check that your security rules are deployed correctly
   - Verify that the data structure matches the rules

3. **"Project not found"**
   - Verify your Firebase project ID in the environment variables
   - Make sure you're using the correct project

### Getting Help:

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Next.js with Firebase](https://firebase.google.com/docs/web/setup) 