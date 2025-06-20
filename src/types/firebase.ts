// Firebase data models for the salon booking app

export interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  availability: Record<string, ProviderAvailabilityDay>;
  services: ProviderService[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderAvailabilityDay {
  start: string;
  end: string;
  isAvailable: boolean;
}

export interface Service {
  id: string;
  name: string;
  defaultDuration: number;
  requiresConsultation: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderService {
  serviceId: string;
  duration: number;
  isSpecialty: boolean;
  requiresConsultation: boolean;
}

export interface BookingRequest {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: string;
  stylistPreference: string;
  dateTimePreference: string;
  notes?: string;
  waitlistOptIn: boolean;
  status: 'pending' | 'booked' | 'not-booked';
  salonId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Salon {
  id: string;
  name: string;
  slug: string;
  bookingUrl: string;
  settings: SalonSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalonSettings {
  notifications: NotificationSettings;
  businessHours: BusinessHours;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  bookingConfirmation: boolean;
  bookingReminders: boolean;
}

export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
} 