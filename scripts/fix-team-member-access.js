import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';

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

async function fixTeamMemberAccess() {
  try {
    console.log('🔍 Checking team member access issues...');
    
    // Get all team member documents
    const querySnapshot = await getDocs(collection(db, 'teamMembers'));
    
    if (querySnapshot.empty) {
      console.log('✅ No team member documents found');
      return;
    }
    
    console.log(`📊 Found ${querySnapshot.size} team member documents`);
    
    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    
    // Process each team member document
    for (const docSnapshot of querySnapshot.docs) {
      const teamMemberData = docSnapshot.data();
      const currentDocId = docSnapshot.id;
      const userId = teamMemberData.userId;
      
      console.log(`\n👤 Team member: ${teamMemberData.name} (${teamMemberData.email})`);
      console.log(`   Current document ID: ${currentDocId}`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Salon ID: ${teamMemberData.salonId}`);
      
      // Check if document ID matches userId
      if (currentDocId === userId) {
        console.log(`   ✅ Document ID already matches userId`);
        alreadyCorrectCount++;
        continue;
      }
      
      // Create new document with userId as document ID
      try {
        const newDocRef = doc(db, 'teamMembers', userId);
        await setDoc(newDocRef, {
          ...teamMemberData,
          userId: userId
        });
        
        console.log(`   ✅ Created new document with ID: ${userId}`);
        fixedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error creating document for ${teamMemberData.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Fix complete!`);
    console.log(`   Fixed: ${fixedCount} documents`);
    console.log(`   Already correct: ${alreadyCorrectCount} documents`);
    
    if (fixedCount > 0) {
      console.log(`\n📝 Next steps:`);
      console.log(`   1. The new team member documents have been created with userId as document ID`);
      console.log(`   2. You can now manually delete the old documents from the Firebase console`);
      console.log(`   3. Or run the migration script to automatically delete old documents`);
    }
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
  }
}

// Run the fix
fixTeamMemberAccess(); 