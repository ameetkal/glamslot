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
import { Provider, Service, BookingRequest, Salon, TeamMember, Invitation } from '@/types/firebase';

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
      where('salonId', '==', salonId)
    );
    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BookingRequest[];
    
    // Sort in memory instead
    const sortedRequests = requests.sort((a, b) => {
      const dateA = typeof a.createdAt === 'object' && 'toDate' in a.createdAt 
        ? (a.createdAt as { toDate: () => Date }).toDate() 
        : new Date(a.createdAt);
      const dateB = typeof b.createdAt === 'object' && 'toDate' in b.createdAt 
        ? (b.createdAt as { toDate: () => Date }).toDate() 
        : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
    return sortedRequests;
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
  },

  // Update salon information
  async updateSalon(id: string, updates: Partial<Salon>): Promise<void> {
    const docRef = doc(db, 'salons', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }
};

// Team Management Services
export const teamService = {
  // Get all team members for a salon
  async getTeamMembers(salonId: string): Promise<TeamMember[]> {
    const q = query(
      collection(db, 'teamMembers'),
      where('salonId', '==', salonId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TeamMember[];
  },

  // Get all invitations for a salon
  async getInvitations(salonId: string): Promise<Invitation[]> {
    const q = query(
      collection(db, 'invitations'),
      where('salonId', '==', salonId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Invitation[];
  },

  // Create a new invitation
  async createInvitation(invitation: {
    email: string;
    name: string;
    salonId: string;
    invitedBy: string;
  }): Promise<string> {
    const docRef = await addDoc(collection(db, 'invitations'), {
      ...invitation,
      status: 'pending',
      invitedAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });
    return docRef.id;
  },

  // Update invitation status
  async updateInvitation(id: string, updates: Partial<Invitation>): Promise<void> {
    const docRef = doc(db, 'invitations', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // Delete invitation
  async deleteInvitation(id: string): Promise<void> {
    const docRef = doc(db, 'invitations', id);
    await deleteDoc(docRef);
  },

  // Add team member
  async addTeamMember(member: {
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'member';
    salonId: string;
    userId: string;
  }): Promise<string> {
    const docRef = await addDoc(collection(db, 'teamMembers'), {
      ...member,
      status: 'active',
      invitedAt: serverTimestamp(),
      joinedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Remove team member
  async removeTeamMember(id: string): Promise<void> {
    const docRef = doc(db, 'teamMembers', id);
    await deleteDoc(docRef);
  }
}; 