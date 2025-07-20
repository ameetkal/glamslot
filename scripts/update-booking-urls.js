const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

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

async function updateBookingUrls() {
  try {
    console.log('Fetching all salons...');
    
    // Get all salons
    const salonsSnapshot = await getDocs(collection(db, 'salons'));
    const salons = salonsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${salons.length} salons`);

    // Update each salon's booking URL
    for (const salon of salons) {
      if (salon.slug) {
        const newBookingUrl = `https://glamslot.vercel.app/booking/${salon.slug}`;
        
        // Only update if the URL is different
        if (salon.bookingUrl !== newBookingUrl) {
          console.log(`Updating ${salon.name} (${salon.slug}):`);
          console.log(`  Old: ${salon.bookingUrl || 'No booking URL'}`);
          console.log(`  New: ${newBookingUrl}`);
          
          await updateDoc(doc(db, 'salons', salon.id), {
            bookingUrl: newBookingUrl,
            updatedAt: new Date()
          });
          
          console.log(`  ✅ Updated successfully\n`);
        } else {
          console.log(`✅ ${salon.name} (${salon.slug}) - URL already correct\n`);
        }
      } else {
        console.log(`⚠️  ${salon.name} - No slug found, skipping\n`);
      }
    }

    console.log('🎉 All booking URLs updated successfully!');
  } catch (error) {
    console.error('Error updating booking URLs:', error);
  }
}

// Run the script
updateBookingUrls(); 