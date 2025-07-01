import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Load environment variables (you may need to install dotenv and configure it)
// Or manually replace these with your actual values
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDGc0Bmf94Ws5DkSh0hTEeGhH-5pfBeREI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "last-minute-app-93f61.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "last-minute-app-93f61",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "last-minute-app-93f61.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "916728653067",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:916728653067:web:08e03dfc04cec1b1786e0e",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-C6SHWDM5WQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Create test salon data
const testSalon = {
  name: "Elegant Cuts Salon",
  slug: "test", // This matches the URL you're using
      bookingUrl: "https://glamslot.vercel.app/booking/test",
  settings: {
    notifications: {
      email: true,
      sms: true,
      bookingConfirmation: true,
      bookingReminders: true
    },
    businessHours: {
      monday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      tuesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      wednesday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      thursday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      friday: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
      saturday: { isOpen: true, openTime: "10:00", closeTime: "15:00" },
      sunday: { isOpen: false }
    }
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

async function createTestSalon() {
  try {
    // Create the salon document with a specific ID
    await setDoc(doc(db, 'salons', 'test-salon-id'), testSalon);
    console.log('✅ Test salon created successfully!');
    console.log('You can now access: http://localhost:3000/booking/test');
  } catch (error) {
    console.error('❌ Error creating test salon:', error);
  }
}

createTestSalon(); 