import { Booking, BookingDTO } from "../types";

export function mapBooking(dto: BookingDTO): Booking {
  return {
    id: dto.id,

    // relaciones
    slotId: dto.booking_code,
    courtId: dto.court_id,
    centerId: dto.sport_center_id,
    userId: dto.user_id,

    // nombres
    courtName: dto.court_name,
    sportCenterName: dto.sport_center_name,

    // fecha
    date: dto.date,
    hour: dto.hour,

    // precios
    price: dto.price,
    finalPrice: dto.final_price,

    // estado
    status: dto.status,

    // pago
    paymentMethod: dto.payment_method === 'venue' ? 'cash' : dto.payment_method,
    fintocPaymentIntentId: undefined,
    paidAmount: dto.paid_amount,
    pendingAmount: dto.pending_amount,
    isPartialPayment: dto.is_partial_payment,
    partialPaymentPaid: dto.partial_payment_paid,

    // cliente
    customerName: dto.customer_name,
    customerPhone: dto.customer_phone,
    customerEmail: dto.guest_details?.email,

    // invitado
    isGuest: !!dto.guest_details,
    guestDetails: dto.guest_details,

    // código
    bookingCode: dto.booking_code,

    // auditoría
    createdAt: dto.created_at,
    updatedAt: dto.updated_at
  }
}
