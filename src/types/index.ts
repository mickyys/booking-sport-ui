export type SlotStatus = 'available' | 'reserved' | 'user-reserved' | 'maintenance' | 'booked' | 'closed' | 'passed';

export interface ScheduleSlot {
  hour: number;
  minutes: number;
  price: number;
  status: SlotStatus;
  booking_id?: string;
  paymentRequired?: boolean;
}

export interface CourtWithSchedule {
  id: string;
  name: string;
  schedule: ScheduleSlot[];
}

export interface SportCenter {
  id: string;
  name: string;
  slug: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  image: string;
  cancellationHours?: number;
  retentionPercent?: number;
}

export interface Court {
  id: string;
  name: string;
  shortName?: string;
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
  paymentRequired?: boolean;
}

export interface Booking {
  id: string;
  slotId: string;
  courtId: string;
  centerId: string;
  date: string;
  hour: number;
  sportCenterName: string;
  courtName: string;
  price: number;
  fintocPaymentIntentId?: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  createdAt: string;
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

export interface BookingDetailResponse {
    amount_paid: number;
    booking_detail: {
        booking_code: string;
        court_id: string;
        court_name: string;
        created_at: string;
        date: string;
        hour: number;
        id: string;
        payment_method: string;
        price: number;
        sport_center_id: string;
        sport_center_name: string;
        status: 'confirmed' | 'cancelled' | 'pending';
        updated_at: string;
        user_id: string;
    };
    can_cancel: boolean;
    cancellation_policy: {
        limit_hours: number;
        retention_percent: number;
    };
    hours_until_match: number;
    max_refund_amount: number;
    refund_percentage: number;
}
