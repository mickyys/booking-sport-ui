export type SlotStatus = 'available' | 'reserved' | 'user-reserved' | 'maintenance' | 'booked' | 'closed' | 'passed' | 'recurring_booked' | 'passed_booked';

export interface ScheduleSlot {
  hour: number;
  minutes: number;
  price: number;
  status: SlotStatus;
  booking_id?: string;
  booking_code?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  series_id?: string;
  paymentRequired?: boolean;
  paymentOptional?: boolean;
  partialPaymentEnabled?: boolean | null;
  is_recurring_weekly?: boolean;
  recurring_reservation_id?: string;
  duration_minutes?: number;
}

export interface CourtWithSchedule {
  id: string;
  name: string;
  schedule: ScheduleSlot[];
}

// ===== Modelo de horarios por reglas (schedule_rules / exceptions / blocks) =====

export interface ScheduleRuleSlot {
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  price: number;
  payment_required: boolean;
  payment_optional: boolean;
  partial_payment_enabled?: boolean | null;
}

export interface ScheduleRule {
  id?: string;
  space_id?: string;
  sport_center_id?: string;
  days_of_week: number[]; // 0=domingo..6=sábado
  slots: ScheduleRuleSlot[];
  active?: boolean;
}

export type ScheduleSource = 'rules' | 'legacy' | 'none';

export type ScheduleExceptionType = 'closed' | 'special';

export interface ScheduleException {
  id?: string;
  space_id?: string;
  sport_center_id?: string;
  date: string; // "YYYY-MM-DD" (envío) / ISO (respuesta)
  type: ScheduleExceptionType;
  slots?: ScheduleRuleSlot[];
  note?: string;
}

export interface Block {
  id?: string;
  space_id?: string;
  sport_center_id?: string;
  date: string; // "YYYY-MM-DD" (envío) / ISO (respuesta)
  start_time: string;
  end_time: string;
  reason?: string;
}



export interface SportCenter {
  id: string;
  name: string;
  slug: string;
  location: string;
  city?: string;
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
  partialPaymentEnabled?: boolean;
  partialPaymentPercent?: number;
  payment_mode?: 'pay_online' | 'pay_at_center' | '';
  isPrivate?: boolean;
  subdomain?: string;
  isFeatured?: boolean;
  distanceKm?: number;
  /** Zona IANA del centro (por ejemplo America/Santiago). */
  timezone?: string;
}

export interface Court {
  id: string;
  name: string;
  shortName?: string;
  type: string;
  image: string;
  image_url?: string;
  y_position?: number;
  centerId: string;
}

export type FacilityType = 'quincho' | 'sede' | 'piscina';

export interface Facility {
  id: string;
  sport_center_id?: string;
  type: FacilityType;
  name: string;
  description: string;
  image_url?: string;
  image?: string;
  capacity: number;
  area: string;
  features: string[];
  enabled?: boolean;
  // quincho
  price_all_day?: number;
  price_half_day?: number;
  open_hour?: number;
  close_hour?: number;
  // sede / piscina
  price_per_day?: number;
  price_per_month?: number;
  min_months?: number;
  max_months?: number;
  available_months?: number[];
  deposit_months?: number;
}

export type SpaceCategory = 'cancha' | 'quincho' | 'sede' | 'piscina';

export interface Space {
  id: string;
  sport_center_id?: string;
  category: SpaceCategory;
  name: string;
  description: string;
  image_url?: string;
  image?: string;
  enabled?: boolean;
  // cancha
  y_position?: number;
  schedule?: any[];
  // facilities (quincho/sede/piscina)
  type?: string;
  capacity?: number;
  area?: string;
  features?: string[];
  // quincho
  price_all_day?: number;
  price_half_day?: number;
  open_hour?: number;
  close_hour?: number;
  // sede / piscina
  price_per_day?: number;
  price_per_month?: number;
  min_months?: number;
  max_months?: number;
  available_months?: number[];
  deposit_months?: number;
}

export interface TimeSlot {
  id: string;
  courtId: string;  centerId: string;
  date: Date;
  hour: number;
  minutes: number;
  status: SlotStatus;
  price: number;
  paymentRequired?: boolean;
  paymentOptional?: boolean;
  partialPaymentEnabled?: boolean | null;
}

export interface CenterTimeSlot {
  start_time: string;
  end_time: string;
}

export interface MPConnectStatus {
  connected: boolean;
  mp_user_id?: string;
  public_key?: string;
  platform_public_key?: string;
  live_mode?: boolean;
  scope?: string;
  connected_at?: string;
  expires_at?: string;
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
  partialPaymentEnabled?: boolean;
  partialPaymentPercent?: number;
  payment_mode?: 'pay_online' | 'pay_at_center' | '';
  isPrivate?: boolean;
  subdomain?: string;
  default_schedule?: CenterTimeSlot;
  schedule_overrides?: Record<number, CenterTimeSlot>;
  active_days?: number[];
  branding?: TenantBranding;
  /** Zona IANA del centro (por ejemplo America/Santiago). */
  timezone?: string;
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
  minutes?: number
  // Contrato UTC (v2): instantes canónicos enviados por el backend.
  scheduled_at?: string
  ends_at?: string
  timezone?: string
  duration_minutes?: number

  // precios
  price: number
  finalPrice: number

  // estado
  status: 'confirmed' | 'cancelled' | 'pending'

  // pago
  paymentMethod: 'mercadopago' | 'internal' | 'cash'
  payment_method?: string;
  paidAmount?: number;
  pendingAmount?: number;
  isPartialPayment?: boolean;
  partialPaymentPaid?: boolean;

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
  booking_code?: string;

  // del backend (snake_case)
  court_name?: string;
  sport_center_name?: string;

  series_id?: string;

  // política de cancelación
  cancellationPolicy?: {
    limit_hours: number;
    retention_percent: number;
  };
  canCancel?: boolean;
  refundPercentage?: number;
  maxRefundAmount?: number;

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
        minutes?: number;
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
  minutes?: number
  final_price: number
  price: number
  status: 'confirmed' | 'cancelled' | 'pending'
  booking_code: string
  payment_method: 'venue' | 'mercadopago' | 'internal'
  customer_name: string
  customer_phone: string
  created_at: string
  updated_at: string
  paid_amount?: number;
  pending_amount?: number;
  is_partial_payment?: boolean;
  partial_payment_paid?: boolean;
}

export interface RecurringReservation {
  id: string;
  sport_center_id: string;
  sport_center_name?: string;
  court_id: string;
  court_name?: string;
  customer_name: string;
  customer_phone: string;
  hour: number;
  minutes?: number;
  duration_minutes?: number;
  day_of_week: number; // 0=domingo, 1=lunes, ..., 6=sábado
  day_of_week_name?: string;
  price: number;
  notes?: string;
  status: 'active' | 'cancelled' | 'finished';
  cancelled_by?: string;
  cancel_reason?: string;
  cancelled_dates?: string[];
  start_date?: string;
  horizon_weeks?: number;
  finished_at?: string;
  finished_by?: string;
  finish_reason?: string;
  last_generated_at?: string;
  last_generation_ok?: boolean;
  last_generated_count?: number;
  generation_error?: string;
  generation_issues?: Array<{ date: string; reason: string }>;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringReservationDTO {
  court_id: string;
  sport_center_id?: string;
  customer_name: string;
  customer_phone: string;
  hour: number;
  minutes?: number;
  price?: number;
  notes?: string;
  date: string; // YYYY-MM-DD
}

export interface TenantBranding {
  name?: string;
  logo_url?: string;
  primary_color?: string;
  primary_dark?: string;
  accent?: string;
  nav_bg?: string;
  hero_gradient?: string;
}

export interface Tenant {
  subdomain: string;
  slug: string;
  center_id: string;
  name: string;
  branding?: TenantBranding;
  canonical_host: string;
}
