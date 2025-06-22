// Migration script to add order fields to existing services and providers
// Run this script once to update existing data

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';

// Your Firebase config - you'll need to add this
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateServices() {
  console.log('Starting services migration...');
  
  try {
    // Get all services
    const servicesSnapshot = await getDocs(collection(db, 'services'));
    const services = servicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${services.length} services to migrate`);
    
    // Update each service with an order field
    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      const order = i + 1;
      
      await updateDoc(doc(db, 'services', service.id), {
        order: order
      });
      
      console.log(`Updated service "${service.name}" with order ${order}`);
    }
    
    console.log('Services migration completed successfully!');
  } catch (error) {
    console.error('Error migrating services:', error);
  }
}

async function migrateProviders() {
  console.log('Starting providers migration...');
  
  try {
    // Get all providers
    const providersSnapshot = await getDocs(collection(db, 'providers'));
    const providers = providersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${providers.length} providers to migrate`);
    
    // Update each provider with an order field
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const order = i + 1;
      
      await updateDoc(doc(db, 'providers', provider.id), {
        order: order
      });
      
      console.log(`Updated provider "${provider.name}" with order ${order}`);
    }
    
    console.log('Providers migration completed successfully!');
  } catch (error) {
    console.error('Error migrating providers:', error);
  }
}

async function runMigration() {
  console.log('Starting migration...');
  
  await migrateServices();
  await migrateProviders();
  
  console.log('Migration completed!');
}

// Run the migration
runMigration().catch(console.error); 