import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your Firebase configuration
// You'll need to replace these with your actual Firebase project config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Debug log to check environment variables in production
if (typeof window !== 'undefined') {
  console.log('Firebase Config Debug:', {
    apiKey: firebaseConfig.apiKey ? 'LOADED' : 'MISSING',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId ? 'LOADED' : 'MISSING',
  });
}

// Check if all required config values are present
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);

if (missingFields.length > 0) {
  console.error('Missing Firebase configuration fields:', missingFields);
  throw new Error(`Firebase configuration is missing required fields: ${missingFields.join(', ')}`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services with error handling
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize Analytics only in browser environment with better error handling
export const analytics = typeof window !== 'undefined' ? (() => {
  try {
    // Only initialize analytics if measurementId is valid
    if (firebaseConfig.measurementId && 
        firebaseConfig.measurementId !== 'G-C6SHWDM5WQ' && 
        firebaseConfig.measurementId.length > 0) {
      return getAnalytics(app);
    } else {
      console.warn('Analytics not initialized: Invalid or missing measurementId');
      return null;
    }
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
    return null;
  }
})() : null;

// Add error handling for Firebase services
if (typeof window !== 'undefined') {
  // Suppress Firebase installation errors in development/production
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && (
      message.includes('Firebase Installations') ||
      message.includes('measurementId') ||
      message.includes('webConfig') ||
      message.includes('installations')
    )) {
      console.warn('Firebase service warning (suppressed):', ...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

export default app; 