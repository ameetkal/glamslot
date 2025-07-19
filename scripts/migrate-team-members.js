import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

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

async function migrateTeamMembers() {
  try {
    console.log('🔍 Starting team member migration...');
    
    // Get all team member documents
    const querySnapshot = await getDocs(collection(db, 'teamMembers'));
    
    if (querySnapshot.empty) {
      console.log('✅ No team member documents found to migrate');
      return;
    }
    
    console.log(`📊 Found ${querySnapshot.size} team member documents to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each team member document
    for (const docSnapshot of querySnapshot.docs) {
      const teamMemberData = docSnapshot.data();
      const oldDocId = docSnapshot.id;
      const userId = teamMemberData.userId;
      
      console.log(`\n👤 Processing team member: ${teamMemberData.name} (${teamMemberData.email})`);
      console.log(`   Old document ID: ${oldDocId}`);
      console.log(`   User ID: ${userId}`);
      
      // Skip if already using userId as document ID
      if (oldDocId === userId) {
        console.log(`   ⏭️  Already using correct document ID, skipping`);
        skippedCount++;
        continue;
      }
      
      try {
        // Create new document with userId as document ID
        const newDocRef = doc(db, 'teamMembers', userId);
        await setDoc(newDocRef, {
          ...teamMemberData,
          // Ensure we don't duplicate the userId field
          userId: userId
        });
        
        console.log(`   ✅ Created new document with ID: ${userId}`);
        
        // Delete the old document
        const oldDocRef = doc(db, 'teamMembers', oldDocId);
        await deleteDoc(oldDocRef);
        
        console.log(`   ✅ Deleted old document with ID: ${oldDocId}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error migrating team member ${teamMemberData.name}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Migration complete!`);
    console.log(`   Migrated: ${migratedCount} documents`);
    console.log(`   Skipped: ${skippedCount} documents`);
    console.log(`   Errors: ${errorCount} documents`);
    
    if (errorCount > 0) {
      console.log(`\n⚠️  Some documents failed to migrate. Please check the errors above.`);
    }
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  }
}

// Run the migration
migrateTeamMembers(); 