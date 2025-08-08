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
  writeBatch,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Provider, Service, BookingRequest, Salon, TeamMember, Invitation, LoyaltyProgram, CustomerPass, VisitRecord, Client, ShiftChangeRequest } from '@/types/firebase';

// Provider Services
export const providerService = {
  // Get all providers for a salon
  async getProviders(salonId: string): Promise<Provider[]> {
    const q = query(
      collection(db, 'providers'),
      where('salonId', '==', salonId)
    );
    const querySnapshot = await getDocs(q);
    const providers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Provider[];
    
    // Sort by order first, then by createdAt for items without order
    return providers.sort((a, b) => {
      const orderA = a.order || Number.MAX_SAFE_INTEGER;
      const orderB = b.order || Number.MAX_SAFE_INTEGER;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Fallback to createdAt for items with same order
      const dateA = typeof a.createdAt === 'object' && 'toDate' in a.createdAt 
        ? (a.createdAt as { toDate: () => Date }).toDate() 
        : new Date(a.createdAt);
      const dateB = typeof b.createdAt === 'object' && 'toDate' in b.createdAt 
        ? (b.createdAt as { toDate: () => Date }).toDate() 
        : new Date(b.createdAt);
      
      return dateB.getTime() - dateA.getTime();
    });
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
    // Get the highest order number and add 1
    const existingProviders = await this.getProviders(provider.salonId);
    const maxOrder = existingProviders.length > 0 
      ? Math.max(...existingProviders.map(p => p.order || 0))
      : 0;
    
    const docRef = await addDoc(collection(db, 'providers'), {
      ...provider,
      order: maxOrder + 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Generate provider-specific booking URL
    const salonData = await salonService.getSalon(provider.salonId);
    if (salonData?.bookingUrl) {
      const providerUrl = `${salonData.bookingUrl}?provider=${docRef.id}`;
      await this.updateProvider(docRef.id, { bookingUrl: providerUrl });
    }

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

  // Update provider order
  async updateProviderOrder(providerId: string, newOrder: number): Promise<void> {
    const docRef = doc(db, 'providers', providerId);
    await updateDoc(docRef, {
      order: newOrder,
      updatedAt: serverTimestamp()
    });
  },

  // Update multiple providers order
  async updateProvidersOrder(updates: { id: string; order: number }[]): Promise<void> {
    const batch = writeBatch(db);
    
    updates.forEach(({ id, order }) => {
      const docRef = doc(db, 'providers', id);
      batch.update(docRef, {
        order,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
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
      where('salonId', '==', salonId)
    );
    const querySnapshot = await getDocs(q);
    const services = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Service[];
    
    // Sort by order first, then by createdAt for items without order
    return services.sort((a, b) => {
      const orderA = a.order || Number.MAX_SAFE_INTEGER;
      const orderB = b.order || Number.MAX_SAFE_INTEGER;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Fallback to createdAt for items with same order
      const dateA = typeof a.createdAt === 'object' && 'toDate' in a.createdAt 
        ? (a.createdAt as { toDate: () => Date }).toDate() 
        : new Date(a.createdAt);
      const dateB = typeof b.createdAt === 'object' && 'toDate' in b.createdAt 
        ? (b.createdAt as { toDate: () => Date }).toDate() 
        : new Date(b.createdAt);
      
      return dateB.getTime() - dateA.getTime();
    });
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
    // Get the highest order number and add 1
    const existingServices = await this.getServices(service.salonId);
    const maxOrder = existingServices.length > 0 
      ? Math.max(...existingServices.map(s => s.order || 0))
      : 0;
    
    const docRef = await addDoc(collection(db, 'services'), {
      ...service,
      order: maxOrder + 1,
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

  // Update service order
  async updateServiceOrder(serviceId: string, newOrder: number): Promise<void> {
    const docRef = doc(db, 'services', serviceId);
    await updateDoc(docRef, {
      order: newOrder,
      updatedAt: serverTimestamp()
    });
  },

  // Update multiple services order
  async updateServicesOrder(updates: { id: string; order: number }[]): Promise<void> {
    const batch = writeBatch(db);
    
    updates.forEach(({ id, order }) => {
      const docRef = doc(db, 'services', id);
      batch.update(docRef, {
        order,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
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
    
    // Get current salon data to merge settings
    const currentSalon = await this.getSalon(id);
    const currentSettings = currentSalon?.settings || {};
    
    await updateDoc(docRef, {
      settings: {
        ...currentSettings,
        ...settings
      },
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
  },

  // Update external links
  async updateExternalLinks(id: string, externalLinks: Salon['externalLinks']): Promise<void> {
    const docRef = doc(db, 'salons', id);
    await updateDoc(docRef, {
      externalLinks,
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

  // Get team member by userId
  async getTeamMemberByUserId(userId: string): Promise<TeamMember | null> {
    // Now that we use userId as document ID, we can directly get the document
    const docRef = doc(db, 'teamMembers', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as TeamMember;
    }
    return null;
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

  // Get a single invitation by ID
  async getInvitation(invitationId: string): Promise<Invitation | null> {
    const docRef = doc(db, 'invitations', invitationId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Invitation;
    }
    return null;
  },

  // Create a new invitation
  async createInvitation(invitation: {
    email: string;
    name: string;
    phone?: string;
    role?: string;
    permissions?: import('@/types/firebase').TeamMemberPermissions;
    salonId: string;
    invitedBy: string;
  }): Promise<string> {
    const docRef = await addDoc(collection(db, 'invitations'), {
      ...invitation,
      role: invitation.role || 'member',
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
    phone?: string;
    role: 'owner' | 'admin' | 'front_desk' | 'service_provider' | 'member';
    permissions?: import('@/types/firebase').TeamMemberPermissions;
    salonId: string;
    userId: string;
  }): Promise<string> {
    // Use userId as the document ID to make security rules work properly
    const docRef = doc(db, 'teamMembers', member.userId);
    await setDoc(docRef, {
      ...member,
      status: 'active',
      invitedAt: serverTimestamp(),
      joinedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Remove team member
  async removeTeamMember(userId: string): Promise<void> {
    // Now that we use userId as document ID, we can directly delete the document
    const docRef = doc(db, 'teamMembers', userId);
    await deleteDoc(docRef);
  },

  // Link provider to team member
  async linkProviderToTeamMember(providerName: string, salonId: string, teamMemberId: string): Promise<void> {
    // Find provider by name and salon
    const providers = await providerService.getProviders(salonId);
    const provider = providers.find(p => p.name === providerName);
    
    if (provider) {
      await providerService.updateProvider(provider.id, {
        teamMemberId: teamMemberId,
        isTeamMember: true
      });
    }
  }
};

// Loyalty Program Services
export const loyaltyProgramService = {
  // Get all loyalty programs for a salon
  async getLoyaltyPrograms(salonId: string): Promise<LoyaltyProgram[]> {
    const q = query(
      collection(db, 'loyaltyPrograms'),
      where('salonId', '==', salonId)
    );
    const querySnapshot = await getDocs(q);
    const programs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LoyaltyProgram[];
    
    // Sort by createdAt (newest first)
    return programs.sort((a, b) => {
      const dateA = typeof a.createdAt === 'object' && 'toDate' in a.createdAt 
        ? (a.createdAt as { toDate: () => Date }).toDate() 
        : new Date(a.createdAt);
      const dateB = typeof b.createdAt === 'object' && 'toDate' in b.createdAt 
        ? (b.createdAt as { toDate: () => Date }).toDate() 
        : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  },

  // Get a single loyalty program
  async getLoyaltyProgram(id: string): Promise<LoyaltyProgram | null> {
    const docRef = doc(db, 'loyaltyPrograms', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as LoyaltyProgram;
    }
    return null;
  },

  // Create a new loyalty program
  async createLoyaltyProgram(program: Omit<LoyaltyProgram, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'loyaltyPrograms'), {
      ...program,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // Update a loyalty program
  async updateLoyaltyProgram(id: string, updates: Partial<LoyaltyProgram>): Promise<void> {
    const docRef = doc(db, 'loyaltyPrograms', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // Delete a loyalty program
  async deleteLoyaltyProgram(id: string): Promise<void> {
    const docRef = doc(db, 'loyaltyPrograms', id);
    await deleteDoc(docRef);
  }
};

// Customer Pass Services
export const customerPassService = {
  // Get all customer passes for a salon
  async getCustomerPasses(salonId: string): Promise<CustomerPass[]> {
    const q = query(
      collection(db, 'customerPasses'),
      where('salonId', '==', salonId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CustomerPass[];
  },

  // Get customer pass by pass ID (for QR code validation)
  async getCustomerPassByPassId(passId: string): Promise<CustomerPass | null> {
    const q = query(
      collection(db, 'customerPasses'),
      where('passId', '==', passId)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as CustomerPass;
    }
    return null;
  },

  // Get customer pass by ID
  async getCustomerPass(id: string): Promise<CustomerPass | null> {
    const docRef = doc(db, 'customerPasses', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as CustomerPass;
    }
    return null;
  },

  // Create a new customer pass
  async createCustomerPass(pass: Omit<CustomerPass, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'customerPasses'), {
      ...pass,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // Update a customer pass
  async updateCustomerPass(id: string, updates: Partial<CustomerPass>): Promise<void> {
    const docRef = doc(db, 'customerPasses', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // Record a visit (increment visit count)
  async recordVisit(passId: string, visitData: {
    recordedBy: string;
    method: 'qr_scan' | 'manual_entry';
    notes?: string;
  }): Promise<void> {
    const pass = await this.getCustomerPassByPassId(passId);
    if (!pass) {
      throw new Error('Customer pass not found');
    }

    const batch = writeBatch(db);
    
    // Update customer pass
    const passRef = doc(db, 'customerPasses', pass.id);
    const newVisitCount = pass.currentVisits + 1;
    const isRedeemed = newVisitCount >= pass.totalVisits;
    
    batch.update(passRef, {
      currentVisits: newVisitCount,
      isRedeemed,
      redeemedAt: isRedeemed ? serverTimestamp() : null,
      updatedAt: serverTimestamp()
    });

    // Create visit record
    const visitRecord: Omit<VisitRecord, 'id' | 'recordedAt'> = {
      customerPassId: pass.id,
      salonId: pass.salonId,
      loyaltyProgramId: pass.loyaltyProgramId,
      customerName: pass.customerName,
      recordedBy: visitData.recordedBy,
      method: visitData.method,
      notes: visitData.notes
    };

    const visitRef = doc(collection(db, 'visitRecords'));
    batch.set(visitRef, {
      ...visitRecord,
      recordedAt: serverTimestamp()
    });

    await batch.commit();
  },

  // Delete a customer pass
  async deleteCustomerPass(id: string): Promise<void> {
    const docRef = doc(db, 'customerPasses', id);
    await deleteDoc(docRef);
  }
};

// Visit Record Services
export const visitRecordService = {
  // Get recent visit records for a salon
  async getRecentVisits(salonId: string, limit: number = 10): Promise<VisitRecord[]> {
    const q = query(
      collection(db, 'visitRecords'),
      where('salonId', '==', salonId)
    );
    const querySnapshot = await getDocs(q);
    const visits = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VisitRecord[];
    
    // Sort by recordedAt (newest first) and limit
    return visits.sort((a, b) => {
      const dateA = typeof a.recordedAt === 'object' && 'toDate' in a.recordedAt 
        ? (a.recordedAt as { toDate: () => Date }).toDate() 
        : new Date(a.recordedAt);
      const dateB = typeof b.recordedAt === 'object' && 'toDate' in b.recordedAt 
        ? (b.recordedAt as { toDate: () => Date }).toDate() 
        : new Date(b.recordedAt);
      return dateB.getTime() - dateA.getTime();
    }).slice(0, limit);
  },

  // Get visit records for a specific customer pass
  async getVisitsForPass(customerPassId: string): Promise<VisitRecord[]> {
    const q = query(
      collection(db, 'visitRecords'),
      where('customerPassId', '==', customerPassId)
    );
    const querySnapshot = await getDocs(q);
    const visits = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VisitRecord[];
    
    // Sort by recordedAt (newest first)
    return visits.sort((a, b) => {
      const dateA = typeof a.recordedAt === 'object' && 'toDate' in a.recordedAt 
        ? (a.recordedAt as { toDate: () => Date }).toDate() 
        : new Date(a.recordedAt);
      const dateB = typeof b.recordedAt === 'object' && 'toDate' in b.recordedAt 
        ? (b.recordedAt as { toDate: () => Date }).toDate() 
        : new Date(b.recordedAt);
      return dateB.getTime() - dateA.getTime();
    });
  }
};

// Client Services
export const clientService = {
  // Get all clients for a salon
  async getClients(salonId: string): Promise<Client[]> {
    console.log('clientService.getClients called with salonId:', salonId);
    const q = query(
      collection(db, 'clients'),
      where('salonId', '==', salonId)
    );
    const querySnapshot = await getDocs(q);
    const clients = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Client[];
    console.log('clientService.getClients returning:', clients.length, 'clients', clients);
    return clients;
  },

  // Get a single client
  async getClient(id: string): Promise<Client | null> {
    const docRef = doc(db, 'clients', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Client;
    }
    return null;
  },

  // Find client by email or phone
  async findClientByEmailOrPhone(salonId: string, email: string, phone: string): Promise<Client | null> {
    // First try to find by email
    const emailQuery = query(
      collection(db, 'clients'),
      where('salonId', '==', salonId),
      where('email', '==', email.toLowerCase())
    );
    const emailSnapshot = await getDocs(emailQuery);
    if (!emailSnapshot.empty) {
      const doc = emailSnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Client;
    }

    // Then try to find by phone
    const phoneQuery = query(
      collection(db, 'clients'),
      where('salonId', '==', salonId),
      where('phone', '==', phone)
    );
    const phoneSnapshot = await getDocs(phoneQuery);
    if (!phoneSnapshot.empty) {
      const doc = phoneSnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Client;
    }

    return null;
  },

  // Create a new client
  async createClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>;
      updatedAt: ReturnType<typeof serverTimestamp>;
    } = {
      ...client,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Only include email if it's provided
    if (client.email) {
      clientData.email = client.email.toLowerCase();
    }
    
    const docRef = await addDoc(collection(db, 'clients'), clientData);
    return docRef.id;
  },

  // Update a client
  async updateClient(id: string, updates: Partial<Client>): Promise<void> {
    const docRef = doc(db, 'clients', id);
    const updateData = { ...updates };
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase(); // Normalize email
    }
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  },

  // Delete a client
  async deleteClient(id: string): Promise<void> {
    const docRef = doc(db, 'clients', id);
    await deleteDoc(docRef);
  },

  // Add or update loyalty data for a client
  async updateClientLoyalty(clientId: string, loyaltyData: Client['loyalty']): Promise<void> {
    const docRef = doc(db, 'clients', clientId);
    await updateDoc(docRef, {
      loyalty: loyaltyData,
      updatedAt: serverTimestamp()
    });
  }
};

// Shift Change Request Services
export const shiftChangeRequestService = {
  // Get all shift change requests for a salon
  async getShiftChangeRequests(salonId: string): Promise<ShiftChangeRequest[]> {
    const q = query(
      collection(db, 'shiftChangeRequests'),
      where('salonId', '==', salonId)
    );
    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ShiftChangeRequest[];
    
    // Sort by status priority (pending first), then by date
    return requests.sort((a, b) => {
      // Define status priority: pending > approved > denied
      const getStatusPriority = (status: string) => {
        switch (status) {
          case 'pending': return 3;
          case 'approved': return 2;
          case 'denied': return 1;
          default: return 0;
        }
      };
      
      const priorityA = getStatusPriority(a.status);
      const priorityB = getStatusPriority(b.status);
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      
      // If same status, sort by creation date (newest first)
      const dateA = typeof a.createdAt === 'object' && 'toDate' in a.createdAt 
        ? (a.createdAt as { toDate: () => Date }).toDate() 
        : new Date(a.createdAt);
      const dateB = typeof b.createdAt === 'object' && 'toDate' in b.createdAt 
        ? (b.createdAt as { toDate: () => Date }).toDate() 
        : new Date(b.createdAt);
      
      return dateB.getTime() - dateA.getTime();
    });
  },

  // Get shift change requests for a specific provider
  async getProviderShiftChangeRequests(providerId: string): Promise<ShiftChangeRequest[]> {
    const q = query(
      collection(db, 'shiftChangeRequests'),
      where('providerId', '==', providerId)
    );
    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ShiftChangeRequest[];
    
    // Sort by creation date (newest first)
    return requests.sort((a, b) => {
      const dateA = typeof a.createdAt === 'object' && 'toDate' in a.createdAt 
        ? (a.createdAt as { toDate: () => Date }).toDate() 
        : new Date(a.createdAt);
      const dateB = typeof b.createdAt === 'object' && 'toDate' in b.createdAt 
        ? (b.createdAt as { toDate: () => Date }).toDate() 
        : new Date(b.createdAt);
      
      return dateB.getTime() - dateA.getTime();
    });
  },

  // Get a single shift change request
  async getShiftChangeRequest(id: string): Promise<ShiftChangeRequest | null> {
    const docRef = doc(db, 'shiftChangeRequests', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ShiftChangeRequest;
    }
    return null;
  },

  // Create a new shift change request
  async createShiftChangeRequest(request: Omit<ShiftChangeRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'shiftChangeRequests'), {
      ...request,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // Update a shift change request
  async updateShiftChangeRequest(id: string, updates: Partial<ShiftChangeRequest>): Promise<void> {
    const docRef = doc(db, 'shiftChangeRequests', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // Delete a shift change request
  async deleteShiftChangeRequest(id: string): Promise<void> {
    const docRef = doc(db, 'shiftChangeRequests', id);
    await deleteDoc(docRef);
  }
}; 