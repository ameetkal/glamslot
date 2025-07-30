const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc } = require('firebase/firestore');

// Firebase config (you'll need to add your config here)
const firebaseConfig = {
  // Add your Firebase config here
  // apiKey: "your-api-key",
  // authDomain: "your-auth-domain",
  // projectId: "your-project-id",
  // storageBucket: "your-storage-bucket",
  // messagingSenderId: "your-messaging-sender-id",
  // appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixSalonBookingUrl(salonId) {
  try {
    console.log('🔍 Fixing booking URL for salon:', salonId);
    
    // Get the salon document
    const salonDocRef = doc(db, 'salons', salonId);
    const salonDoc = await getDoc(salonDocRef);
    
    if (!salonDoc.exists()) {
      console.log('❌ No salon document found for ID:', salonId);
      return;
    }
    
    const salonData = salonDoc.data();
    console.log('📋 Current salon data:', {
      name: salonData.name,
      slug: salonData.slug,
      currentBookingUrl: salonData.bookingUrl
    });
    
    // Check if the URL contains localhost
    if (salonData.bookingUrl && salonData.bookingUrl.includes('localhost')) {
      // Replace localhost with production domain
      const newBookingUrl = salonData.bookingUrl.replace(
        'http://localhost:3000',
        'https://glamslot.vercel.app'
      );
      
      console.log('🔄 New booking URL:', newBookingUrl);
      
      // Update the document
      await updateDoc(salonDocRef, {
        bookingUrl: newBookingUrl,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Salon booking URL updated successfully!');
      
      // Now update all providers for this salon
      console.log('🔄 Updating provider booking URLs...');
      const { collection, query, where, getDocs, updateDoc } = require('firebase/firestore');
      
      const providersQuery = query(
        collection(db, 'providers'),
        where('salonId', '==', salonId)
      );
      
      const providersSnapshot = await getDocs(providersQuery);
      const providers = providersSnapshot.docs;
      
      console.log(`📋 Found ${providers.length} providers to update`);
      
      for (const providerDoc of providers) {
        const providerData = providerDoc.data();
        if (providerData.bookingUrl && providerData.bookingUrl.includes('localhost')) {
          const newProviderUrl = providerData.bookingUrl.replace(
            'http://localhost:3000',
            'https://glamslot.vercel.app'
          );
          
          await updateDoc(providerDoc.ref, {
            bookingUrl: newProviderUrl,
            updatedAt: new Date().toISOString()
          });
          
          console.log(`✅ Updated provider ${providerData.name}: ${newProviderUrl}`);
        }
      }
      
      console.log('🎉 All booking URLs updated successfully!');
      
    } else {
      console.log('✅ Booking URL is already correct or doesn\'t contain localhost');
    }
    
  } catch (error) {
    console.error('❌ Error fixing booking URL:', error);
  }
}

// Usage: Replace 'your-salon-id' with your actual salon ID
// You can find this in your browser's developer tools when logged in as the salon owner
// fixSalonBookingUrl('your-salon-id');

module.exports = { fixSalonBookingUrl }; 