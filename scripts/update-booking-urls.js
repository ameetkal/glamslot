import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

async function updateBookingUrls() {
  try {
    console.log('🔍 Fetching all salon records...');
    
    // Get all salon documents
    const querySnapshot = await getDocs(collection(db, 'salons'));
    
    if (querySnapshot.empty) {
      console.log('✅ No salon records found to update');
      return;
    }
    
    console.log(`📊 Found ${querySnapshot.size} salon records`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Process each salon document
    for (const docSnapshot of querySnapshot.docs) {
      const salonData = docSnapshot.data();
      const salonId = docSnapshot.id;
      
      console.log(`\n🏪 Processing salon: ${salonData.name || salonId}`);
      console.log(`   Current bookingUrl: ${salonData.bookingUrl}`);
      
      // Check if the bookingUrl needs to be updated
      if (salonData.bookingUrl && salonData.bookingUrl.includes('booking.glammatic.com')) {
        // Update the bookingUrl to use the correct domain
        const newBookingUrl = salonData.bookingUrl.replace(
          'booking.glammatic.com',
          'glamslot.vercel.app'
        );
        
        console.log(`   New bookingUrl: ${newBookingUrl}`);
        
        // Update the document
        await updateDoc(doc(db, 'salons', salonId), {
          bookingUrl: newBookingUrl,
          updatedAt: new Date()
        });
        
        console.log(`   ✅ Updated successfully`);
        updatedCount++;
      } else {
        console.log(`   ⏭️  No update needed (already correct or no bookingUrl)`);
        skippedCount++;
      }
    }
    
    console.log(`\n🎉 Update complete!`);
    console.log(`   Updated: ${updatedCount} records`);
    console.log(`   Skipped: ${skippedCount} records`);
    
  } catch (error) {
    console.error('❌ Error updating booking URLs:', error);
  }
}

// Run the update
updateBookingUrls(); 