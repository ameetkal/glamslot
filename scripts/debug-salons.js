import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function debugSalons() {
  try {
    console.log('🔍 Debugging salon documents...');
    
    // Get all salon documents
    const querySnapshot = await getDocs(collection(db, 'salons'));
    
    if (querySnapshot.empty) {
      console.log('❌ No salon documents found in the database');
      return;
    }
    
    console.log(`📊 Found ${querySnapshot.size} salon documents:`);
    
    // Process each salon document
    querySnapshot.docs.forEach((docSnapshot, index) => {
      const salonData = docSnapshot.data();
      const docId = docSnapshot.id;
      
      console.log(`\n${index + 1}. Salon Document:`);
      console.log(`   Document ID: ${docId}`);
      console.log(`   Name: ${salonData.name || 'N/A'}`);
      console.log(`   Slug: ${salonData.slug || 'N/A'}`);
      console.log(`   Booking URL: ${salonData.bookingUrl || 'N/A'}`);
      console.log(`   Owner Email: ${salonData.ownerEmail || 'N/A'}`);
      console.log(`   Created At: ${salonData.createdAt || 'N/A'}`);
      
      // Check if slug is missing
      if (!salonData.slug) {
        console.log(`   ⚠️  WARNING: This salon is missing a slug field!`);
      }
      
      // Show the booking URL that should work
      if (salonData.slug) {
        console.log(`   📝 Booking URL should be: https://glamslot.vercel.app/booking/${salonData.slug}`);
      }
    });
    
    console.log(`\n🎯 Summary:`);
    console.log(`   Total salons: ${querySnapshot.size}`);
    const salonsWithSlugs = querySnapshot.docs.filter(doc => doc.data().slug).length;
    console.log(`   Salons with slugs: ${salonsWithSlugs}`);
    console.log(`   Salons missing slugs: ${querySnapshot.size - salonsWithSlugs}`);
    
    if (salonsWithSlugs > 0) {
      console.log(`\n✅ Available booking URLs:`);
      querySnapshot.docs.forEach(doc => {
        const salonData = doc.data();
        if (salonData.slug) {
          console.log(`   https://glamslot.vercel.app/booking/${salonData.slug}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error debugging salons:', error);
  }
}

// Run the debug
debugSalons(); 