export type SlotStatus = 'available' | 'reserved' | 'user-reserved' | 'maintenance';

export interface ScheduleSlot {
  hour: number;
  price: number;
  status: SlotStatus;
}

export interface CourtWithSchedule {
  id: string;
  name: string;
  schedule: ScheduleSlot[];
}

export interface SportCenter {
  id: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  image: string;
}

export interface Court {
  id: string;
  name: string;
  shortName: string;
  type: string;
  image: string;
  centerId: string;
}

export interface TimeSlot {
  id: string;
  courtId: string;
  centerId: string;
  date: Date;
  status: SlotStatus;
  price: number;
}

export interface Booking {
  id: string;
  slotId: string;
  courtId: string;
  centerId: string;
  date: string;
  price: number;
  status: 'confirmed' | 'cancelled';
  createdAt: number;
  paymentMethod: 'mercadopago' | 'fintoc' | 'cash';
  userName: string;
  userEmail: string;
  isGuest: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'administrator';
  stats?: {
      matchesPlayed: number;
      points: number;
      rank: string;
  }
  id: string;
}

export interface GuestDetails {
    name: string;
    email: string;
    phone: string;
}
