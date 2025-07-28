const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, deleteDoc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  // Add your Firebase config here
  // You can find this in your firebase.json or firebase.ts file
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixSalonDocumentId() {
  try {
    // The salon document that exists with wrong ID
    const wrongSalonId = 'Cpac2PwkhCWEpM541bz5wPuCpCv2';
    
    // Get the salon data from the wrong document
    const wrongSalonRef = doc(db, 'salons', wrongSalonId);
    const wrongSalonDoc = await getDoc(wrongSalonRef);
    
    if (!wrongSalonDoc.exists()) {
      console.log('❌ Salon document not found with ID:', wrongSalonId);
      return;
    }
    
    const salonData = wrongSalonDoc.data();
    console.log('✅ Found salon data:', salonData.name);
    console.log('📧 Owner email:', salonData.ownerEmail);
    
    // We need to find the correct user ID for ameet@gofisherman.com
    // For now, let's create a new document with a more logical ID
    // You'll need to provide your actual Firebase Auth UID
    
    console.log('\n🔍 To fix this, we need your Firebase Auth UID.');
    console.log('You can find this by:');
    console.log('1. Opening browser dev tools (F12)');
    console.log('2. Going to the Console tab');
    console.log('3. Refreshing the dashboard page');
    console.log('4. Looking for: "Fetching dashboard data for user: [YOUR_UID]"');
    
    // Alternative: We could search for the salon by ownerEmail
    console.log('\n💡 Alternative: We could modify the dashboard to search by ownerEmail instead of user ID');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
fixSalonDocumentId(); 