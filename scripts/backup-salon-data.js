const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

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

async function backupSalonData() {
  try {
    console.log('Creating backup of salon data...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      timestamp: new Date().toISOString(),
      salons: [],
      services: [],
      providers: []
    };
    
    // Backup salons
    const salonsSnapshot = await getDocs(collection(db, 'salons'));
    salonsSnapshot.forEach(doc => {
      backupData.salons.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Backup services
    const servicesSnapshot = await getDocs(collection(db, 'services'));
    servicesSnapshot.forEach(doc => {
      backupData.services.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Backup providers
    const providersSnapshot = await getDocs(collection(db, 'providers'));
    providersSnapshot.forEach(doc => {
      backupData.providers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Save to file
    const filename = `backup-${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup created: ${filename}`);
    console.log(`📊 Salons: ${backupData.salons.length}`);
    console.log(`📊 Services: ${backupData.services.length}`);
    console.log(`📊 Providers: ${backupData.providers.length}`);
    
  } catch (error) {
    console.error('Error creating backup:', error);
  }
}

// Run the backup
backupSalonData(); 