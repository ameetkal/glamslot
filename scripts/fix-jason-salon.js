const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixJasonSalon() {
  try {
    console.log('Fixing jasonmatthewsalon document...');
    
    const salonId = 'ebLbRxFKh9b0j6eGyp4HByw1Mg52';
    
    // Update the salon document with missing fields
    await updateDoc(doc(db, 'salons', salonId), {
      bookingUrl: 'https://glamslot.vercel.app/booking/jasonmatthewsalon',
      ownerPhone: '', // Add empty phone field
      'settings.notifications.emailRecipients': [
        {
          email: 'jasonmatthewsalon@gmail.com',
          enabled: true
        }
      ],
      'settings.notifications.smsRecipients': [
        {
          enabled: false,
          phone: ''
        }
      ],
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ jasonmatthewsalon document updated successfully!');
  } catch (error) {
    console.error('Error updating jasonmatthewsalon:', error);
  }
}

// Run the script
fixJasonSalon(); 