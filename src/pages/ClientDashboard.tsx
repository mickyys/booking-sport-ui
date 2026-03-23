import React, { useEffect, useState } from 'react';
import { Calendar, List, X } from 'lucide-react';
import { parseISO, differenceInHours } from 'date-fns';

import { UserProfile } from '../types';
import { useBookingStore } from '../store/useBookingStore';
import api from '../api/axiosInstance';
import { useAuth0 } from '@auth0/auth0-react';
import { BookingCard } from '../components/booking/BookingCard';
import { PastBookingItem } from '../components/booking/PastBookingItem';
import { BookingCardSkeleton, PastBookingItemSkeleton } from '../components/booking/BookingSkeleton';
import { CancelledBookingList } from '../components/booking/CancelledBookingList';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { CancellationModal } from '../components/booking/CancellationModal';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';


interface ClientDashboardProps {
    user?: UserProfile | null;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ user: userProp }) => {
    const { user: authUser } = useAuth();
    const user = userProp || authUser;
    const { myBookings, fetchMyBookings, fetchCancelledBookings, fetchConfirmedCount, cancelBooking, sportCenters, courts, isLoading } = useBookingStore();
    const { getAccessTokenSilently } = useAuth0();
    const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
    const [isPastLoading, setIsPastLoading] = useState(false);
    const [pastBookings, setPastBookings] = useState<any[]>([]);
    const [confirmedCount, setConfirmedCount] = useState(0);
    // Estado para reservas canceladas
    const [cancelledBookings, setCancelledBookings] = useState<any[]>([]);
    const [isCancelledLoading, setIsCancelledLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchMyBookings(getAccessTokenSilently);

        // Fetch confirmed count
        const getCount = async () => {
            const count = await fetchConfirmedCount(getAccessTokenSilently);
            setConfirmedCount(count);
        };
        getCount();

        // Fetch past bookings independientemente
        const fetchPast = async () => {
            setIsPastLoading(true);
            try {
                const token = await getAccessTokenSilently({
                    authorizationParams: {
                        audience: (import.meta as any).env.VITE_APP_AUTH0_AUDIENCE,
                        scope: "openid profile email"
                    }
                });
                const { data } = await api.get('/bookings/my-bookings?old=true', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const formattedPast = (data.data || []).map((b: any) => ({
                    ...b,
                    sportCenterName: b.sport_center_name,
                    courtName: b.court_name,
                    courtId: b.court_id,
                    centerId: b.sport_center_id,
                    paymentMethod: b.payment_method,
                    createdAt: b.created_at
                }));
                setPastBookings(formattedPast);
            } catch (err) {
                console.error("Error fetching past bookings:", err);
            } finally {
                setIsPastLoading(false);
            }
        };
        fetchPast();

        // Fetch cancelled bookings
        const fetchCancelled = async () => {
            setIsCancelledLoading(true);
            try {
                const result = await fetchCancelledBookings(getAccessTokenSilently, 1, 5);
                setCancelledBookings(result);
            } catch (err) {
                setCancelledBookings([]);
            } finally {
                setIsCancelledLoading(false);
            }
        };
        fetchCancelled();
    }, [fetchMyBookings, fetchCancelledBookings, getAccessTokenSilently, user?.name]);

    const handleCancelBooking = async () => {
        if (!bookingToCancel) return;

        try {
            await cancelBooking(bookingToCancel, getAccessTokenSilently);
            // Refrescar las listas de bookings
            await fetchMyBookings(getAccessTokenSilently, false);
            await fetchMyBookings(getAccessTokenSilently, true);
        } catch (err) {
            console.error(err);
        } finally {
            setBookingToCancel(null);
        }
    };


    // Simplification: just show future bookings
    const futureBookings = myBookings
        .filter(b => b.status === 'confirmed' && new Date(b.date) > new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Past bookings are now fetched separately via old=true
    console.log('bookingToCancel ========>', bookingToCancel)
    if (!user) return null;

    return (
        <>

            <div className="min-h-screen bg-slate-50 pt-8 pb-20 px-4">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <DashboardHeader user={{
                        ...user,
                        stats: {
                            matchesPlayed: confirmedCount,
                            points: user?.stats?.points ?? 0,
                            rank: user?.stats?.rank ?? 'Principiante'
                        }
                    }} />

                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        {/* Próximos Partidos */}
                        <div className="flex flex-col">
                            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-emerald-500" />
                                Próximos Partidos
                            </h3>

                            {isLoading ? (
                                <div className="space-y-4">
                                    <BookingCardSkeleton />
                                    <BookingCardSkeleton />
                                </div>
                            ) : futureBookings.length > 0 ? (
                                <div className="space-y-4">
                                    {futureBookings.map(booking => (
                                        <BookingCard
                                            key={booking.id}
                                            booking={booking}
                                            courts={courts}
                                            isLoading={isLoading}
                                            onCancel={(id) => setBookingToCancel(id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 text-center">
                                    <p className="text-slate-500 mb-4">No tienes partidos programados.</p>
                                    <button
                                        className="text-emerald-600 font-bold hover:underline cursor-pointer"
                                        onClick={() => window.location.href = '/'}
                                    >
                                        Reservar una cancha
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Historial Reciente */}
                        <div className="flex flex-col gap-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <List className="w-5 h-5 text-slate-400" />
                                    Historial Reciente
                                </h3>
                                {isPastLoading ? (
                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                                        <PastBookingItemSkeleton />
                                        <PastBookingItemSkeleton />
                                        <PastBookingItemSkeleton />
                                    </div>
                                ) : pastBookings.length > 0 ? (
                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-200">
                                        {pastBookings.slice(0, 5).map(booking => (
                                            <PastBookingItem
                                                key={booking.id}
                                                booking={booking}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-sm">No hay historial disponible.</p>
                                )}
                            </div>
                            <CancelledBookingList bookings={cancelledBookings} isLoading={isCancelledLoading} />
                        </div>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {bookingToCancel && (
                    <CancellationModal
                        bookingId={bookingToCancel}
                        onClose={async () => {                            
                            setBookingToCancel(null)
                            await fetchMyBookings(getAccessTokenSilently, false);
                        }}
                        onConfirm={handleCancelBooking}
                    />
                )}
            </AnimatePresence>
        </>

    );
};
