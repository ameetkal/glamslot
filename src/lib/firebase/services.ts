import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Provider, Service, BookingRequest, Salon } from '@/types/firebase';

// Provider Services
export const providerService = {
  // Get all providers for a salon
  async getProviders(salonId: string): Promise<Provider[]> {
    const q = query(
      collection(db, 'providers'),
      where('salonId', '==', salonId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Provider[];
  },

  // Get a single provider
  async getProvider(id: string): Promise<Provider | null> {
    const docRef = doc(db, 'providers', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Provider;
    }
    return null;
  },

  // Create a new provider
  async createProvider(provider: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'providers'), {
      ...provider,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // Update a provider
  async updateProvider(id: string, updates: Partial<Provider>): Promise<void> {
    const docRef = doc(db, 'providers', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // Delete a provider
  async deleteProvider(id: string): Promise<void> {
    const docRef = doc(db, 'providers', id);
    await deleteDoc(docRef);
  }
};

// Service Services
export const serviceService = {
  // Get all services for a salon
  async getServices(salonId: string): Promise<Service[]> {
    const q = query(
      collection(db, 'services'),
      where('salonId', '==', salonId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Service[];
  },

  // Get a single service
  async getService(id: string): Promise<Service | null> {
    const docRef = doc(db, 'services', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Service;
    }
    return null;
  },

  // Create a new service
  async createService(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'services'), {
      ...service,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // Update a service
  async updateService(id: string, updates: Partial<Service>): Promise<void> {
    const docRef = doc(db, 'services', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // Delete a service
  async deleteService(id: string): Promise<void> {
    const docRef = doc(db, 'services', id);
    await deleteDoc(docRef);
  }
};

// Booking Request Services
export const bookingRequestService = {
  // Get all booking requests for a salon
  async getBookingRequests(salonId: string): Promise<BookingRequest[]> {
    const q = query(
      collection(db, 'bookingRequests'),
      where('salonId', '==', salonId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BookingRequest[];
  },

  // Get a single booking request
  async getBookingRequest(id: string): Promise<BookingRequest | null> {
    const docRef = doc(db, 'bookingRequests', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as BookingRequest;
    }
    return null;
  },

  // Create a new booking request
  async createBookingRequest(request: Omit<BookingRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'bookingRequests'), {
      ...request,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // Update a booking request
  async updateBookingRequest(id: string, updates: Partial<BookingRequest>): Promise<void> {
    const docRef = doc(db, 'bookingRequests', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // Delete a booking request
  async deleteBookingRequest(id: string): Promise<void> {
    const docRef = doc(db, 'bookingRequests', id);
    await deleteDoc(docRef);
  }
};

// Salon Services
export const salonService = {
  // Get salon by slug
  async getSalonBySlug(slug: string): Promise<Salon | null> {
    const q = query(
      collection(db, 'salons'),
      where('slug', '==', slug)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Salon;
    }
    return null;
  },

  // Get salon by ID
  async getSalon(id: string): Promise<Salon | null> {
    const docRef = doc(db, 'salons', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Salon;
    }
    return null;
  },

  // Update salon settings
  async updateSalonSettings(id: string, settings: Partial<Salon['settings']>): Promise<void> {
    const docRef = doc(db, 'salons', id);
    await updateDoc(docRef, {
      settings: settings,
      updatedAt: serverTimestamp()
    });
  }
}; 