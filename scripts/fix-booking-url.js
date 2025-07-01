const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc } = require('firebase/firestore');

// Your Firebase config (you'll need to add your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  // You can get this from your .env.local file or Firebase console
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixBookingUrl(userId) {
  try {
    console.log('Fixing booking URL for user:', userId);
    
    // Get the salon document
    const salonDocRef = doc(db, 'salons', userId);
    const salonDoc = await getDoc(salonDocRef);
    
    if (!salonDoc.exists()) {
      console.log('No salon document found for user:', userId);
      return;
    }
    
    const salonData = salonDoc.data();
    console.log('Current booking URL:', salonData.bookingUrl);
    
    // Check if the URL contains localhost
    if (salonData.bookingUrl && salonData.bookingUrl.includes('localhost')) {
      // Replace localhost with production domain
      const newBookingUrl = salonData.bookingUrl.replace(
        'http://localhost:3000',
        'https://glamslot.vercel.app'
      );
      
      console.log('New booking URL:', newBookingUrl);
      
      // Update the document
      await updateDoc(salonDocRef, {
        bookingUrl: newBookingUrl,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Booking URL updated successfully!');
    } else {
      console.log('Booking URL is already correct or doesn\'t contain localhost');
    }
    
  } catch (error) {
    console.error('Error fixing booking URL:', error);
  }
}

// Usage: Replace 'your-user-id' with your actual Firebase user ID
// You can find this in your browser's developer tools when logged in
// fixBookingUrl('your-user-id');

module.exports = { fixBookingUrl }; 