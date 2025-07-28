const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  // Add your Firebase config here
  // You can find this in your firebase.json or firebase.ts file
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugServiceProvider() {
  try {
    const serviceProviderEmail = 'nina@testsalon.com';
    
    console.log('🔍 Debugging Service Provider Access');
    console.log('=====================================');
    
    // 1. Check if team member exists
    console.log('\n1. Checking team member record...');
    const teamMembersRef = collection(db, 'teamMembers');
    const teamQuery = query(teamMembersRef, where('email', '==', serviceProviderEmail));
    const teamSnapshot = await getDocs(teamQuery);
    
    if (!teamSnapshot.empty) {
      const teamMember = teamSnapshot.docs[0].data();
      console.log('✅ Team member found:', teamMember);
      console.log('   - User ID:', teamSnapshot.docs[0].id);
      console.log('   - Salon ID:', teamMember.salonId);
      console.log('   - Role:', teamMember.role);
      
      // 2. Check if salon exists
      console.log('\n2. Checking salon access...');
      const salonRef = doc(db, 'salons', teamMember.salonId);
      const salonDoc = await getDoc(salonRef);
      
      if (salonDoc.exists()) {
        console.log('✅ Salon found:', salonDoc.data().name);
        console.log('   - Salon ID:', teamMember.salonId);
        console.log('   - Owner Email:', salonDoc.data().ownerEmail);
      } else {
        console.log('❌ Salon not found for ID:', teamMember.salonId);
      }
      
      // 3. Check booking requests access
      console.log('\n3. Checking booking requests access...');
      const requestsRef = collection(db, 'bookingRequests');
      const requestsQuery = query(requestsRef, where('salonId', '==', teamMember.salonId));
      const requestsSnapshot = await getDocs(requestsQuery);
      
      console.log('✅ Booking requests found:', requestsSnapshot.size, 'requests');
      
    } else {
      console.log('❌ No team member found for email:', serviceProviderEmail);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
debugServiceProvider(); 