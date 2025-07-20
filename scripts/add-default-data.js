const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, updateDoc } = require('firebase/firestore');

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

async function addDefaultData() {
  try {
    console.log('Adding default data for jasonmatthewsalon...');
    
    const salonId = 'ebLbRxFKh9b0j6eGyp4HByw1Mg52';
    
    // Add a default service
    const serviceData = {
      salonId: salonId,
      name: 'Haircut',
      description: 'Professional haircut service',
      duration: 30,
      price: 25,
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const serviceRef = await addDoc(collection(db, 'services'), serviceData);
    console.log('✅ Added default service:', serviceRef.id);
    
    // Add a default provider
    const providerData = {
      salonId: salonId,
      name: 'Stylist',
      description: 'Professional stylist',
      order: 1,
      services: [
        {
          serviceId: serviceRef.id,
          price: 25,
          duration: 30
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const providerRef = await addDoc(collection(db, 'providers'), providerData);
    console.log('✅ Added default provider:', providerRef.id);
    
    // Update the service to reference the provider
    await updateDoc(doc(db, 'services', serviceRef.id), {
      providerId: providerRef.id,
      updatedAt: new Date().toISOString()
    });
    
    console.log('🎉 Default data added successfully!');
    console.log('The booking page should now work for jasonmatthewsalon');
    
  } catch (error) {
    console.error('Error adding default data:', error);
  }
}

// Run the script
addDefaultData(); 