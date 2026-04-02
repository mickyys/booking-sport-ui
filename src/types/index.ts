export type SlotStatus = 'available' | 'reserved' | 'user-reserved' | 'maintenance' | 'booked' | 'closed' | 'passed';

export interface ScheduleSlot {
  hour: number;
  minutes: number;
  price: number;
  status: SlotStatus;
  booking_id?: string;
  series_id?: string;
  paymentRequired?: boolean;
  paymentOptional?: boolean;
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
  phone?: string;
  email?: string;
  contact?: {
    phone: string;
    email: string;
  },
  coordinates?: {
    lat: number;
    lng: number;
  };
  image: string;
  cancellationHours?: number;
  retentionPercent?: number;
  courts?: number;
  services: string[];
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
  paymentOptional?: boolean;
}

export interface Booking {
  id: string

  // relaciones
  slotId: string
  courtId: string
  centerId: string
  userId: string

  // nombres descriptivos
  courtName: string
  sportCenterName: string

  // fecha reserva
  date: string
  hour: number

  // precios
  price: number
  finalPrice: number

  // estado
  status: 'confirmed' | 'cancelled' | 'pending'

  // pago
  paymentMethod: 'mercadopago' | 'fintoc' | 'cash'
  fintocPaymentIntentId?: string

  // cliente
  userName?: string;
  userEmail?: string;
  customerName: string
  customerPhone: string
  customerEmail?: string

  // invitado
  isGuest: boolean
  guestDetails?: {
    name: string
    email: string
    phone: string
  }

  // código de reserva
  bookingCode: string

  series_id?: string;

  // auditoría
  createdAt: string
  updatedAt: string
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


export interface BookingDTO {
  id: string
  court_id: string
  sport_center_id: string
  court_name: string
  sport_center_name: string
  user_id: string
  guest_details?: {
    name: string
    email: string
    phone: string
  }
  date: string
  hour: number
  final_price: number
  price: number
  status: 'confirmed' | 'cancelled' | 'pending'
  booking_code: string
  payment_method: 'venue' | 'mercadopago' | 'fintoc'
  customer_name: string
  customer_phone: string
  created_at: string
  updated_at: string
}