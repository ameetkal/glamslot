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

async function fixNinaProviderUrl() {
  try {
    console.log('🔍 Looking for provider with email: nina@testsalon.com');
    
    // First, we need to find the provider document
    // Since we don't have a direct email lookup, we'll need to find it manually
    // You can either:
    // 1. Look up the provider ID in your Firebase console
    // 2. Or I can help you find it by searching through providers
    
    console.log('📝 To complete this fix, I need the provider document ID.');
    console.log('📝 You can find this in your Firebase console:');
    console.log('   1. Go to Firestore Database');
    console.log('   2. Navigate to the "providers" collection');
    console.log('   3. Find the document for nina@testsalon.com');
    console.log('   4. Copy the document ID (the long string)');
    
    // Once you have the provider ID, uncomment and modify this code:
    /*
    const providerId = 'YOUR_PROVIDER_ID_HERE'; // Replace with actual ID
    
    // Get the provider document
    const providerRef = doc(db, 'providers', providerId);
    const providerSnap = await getDoc(providerRef);
    
    if (!providerSnap.exists()) {
      console.log('❌ Provider not found');
      return;
    }
    
    const provider = providerSnap.data();
    console.log('✅ Found provider:', provider.name);
    
    // Get the salon document to get the booking URL
    const salonRef = doc(db, 'salons', provider.salonId);
    const salonSnap = await getDoc(salonRef);
    
    if (!salonSnap.exists()) {
      console.log('❌ Salon not found');
      return;
    }
    
    const salon = salonSnap.data();
    console.log('✅ Found salon:', salon.name);
    
    // Generate the provider-specific booking URL
    const providerUrl = `${salon.bookingUrl}?provider=${providerId}`;
    console.log('🔗 Generated URL:', providerUrl);
    
    // Update the provider document
    await updateDoc(providerRef, {
      bookingUrl: providerUrl
    });
    
    console.log('✅ Successfully updated provider with booking URL!');
    */
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
fixNinaProviderUrl(); 