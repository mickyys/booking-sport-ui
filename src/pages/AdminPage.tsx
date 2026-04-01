import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Booking, TimeSlot } from '../types';
import { COURTS } from '../data/mockData';
import { useAuth0 } from '@auth0/auth0-react';
import { useBookingStore } from '../store/useBookingStore';
import { toast } from 'sonner';

import { AdminDashboard } from './admin/AdminDashboard';
import { AdminCourts } from './admin/AdminCourts';
import { AdminSchedules } from './admin/AdminSchedules';
import { AdminCalendar } from './admin/AdminCalendar';
import { AdminSettings } from './admin/AdminSettings';
import { LayoutDashboard, Trophy, Clock, CalendarRange, Settings } from 'lucide-react';

interface AdminPanelProps {
    bookings: Booking[];
    slots: TimeSlot[];
    onCancelBooking: (booking: Booking) => void;
    onBlockSlot: (slot: TimeSlot) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
    bookings,
    slots,
    onCancelBooking,
    onBlockSlot
}) => {
    const [view, setView] = useState<'dashboard' | 'courts' | 'schedules' | 'calendar' | 'settings'>('dashboard');
    const [dashboardPage, setDashboardPage] = useState(1);
    const [dashboardNameFilter, setDashboardNameFilter] = useState('');
    const [dashboardCodeFilter, setDashboardCodeFilter] = useState('');
    const [dashboardDateFilter, setDashboardDateFilter] = useState<string>(() => {
        const from = format(new Date(), 'yyyy-MM-dd');
        const to = format(addDays(new Date(), 6), 'yyyy-MM-dd');
        return `${from}|${to}`;
    });
    const { getAccessTokenSilently } = useAuth0();
    const { 
        fetchAdminCourts, 
        adminCourts, 
        deleteAdminCourt, 
        updateAdminSchedule, 
        fetchAdminDashboard, 
        adminDashboardData,
        cancelBooking: storeCancelBooking // Use real cancelBooking
    } = useBookingStore();

    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchAdminCourts(getAccessTokenSilently);
    }, [fetchAdminCourts, getAccessTokenSilently]);

    useEffect(() => {
        fetchAdminDashboard(
            getAccessTokenSilently,
            dashboardPage,
            10,
            dashboardDateFilter,
            dashboardNameFilter,
            dashboardCodeFilter
        );
    }, [
        fetchAdminDashboard,
        getAccessTokenSilently,
        dashboardPage,
        dashboardDateFilter,
        dashboardNameFilter,
        dashboardCodeFilter
    ]);

    // Flatten backend courts
    const backendCourts = adminCourts ? adminCourts.flatMap((ac: any) => ac.courts?.map((c: any) => ({
        ...c,
        id: c.id || c._id,
        image: c.image || '/images/cancha1.jpeg',
        centerName: ac.sport_center?.name,
        centerId: ac.sport_center?.id || ac.sport_center?._id,
    })) || []) : [];

    const currentSportCenter = adminCourts && adminCourts.length > 0 ? adminCourts[0].sport_center : null;


    // Use backend courts if available, otherwise mock
    const courts = backendCourts.length > 0 ? backendCourts : COURTS;

    // Build real schedules from backend data
    const schedules = backendCourts.map(c => ({
        courtId: c.id,
        slots: c.schedule?.map((s: any) => ({
            hour: s.hour,
            minutes: s.minutes || 0,
            price: s.price || 0,
            enabled: s.status === 'available',
            paymentRequired: s.payment_required,
            paymentOptional: s.payment_optional || false
        })) || []
    }));

    // For simplicity, take prices from the first center
    const prices = {}; // No longer used
    
    // Actions
    const onSaveCourt = (court: any) => fetchAdminCourts(getAccessTokenSilently);
    const onDeleteCourt = async (id: any) => {
        try {
            await deleteAdminCourt(id, getAccessTokenSilently);
            await fetchAdminCourts(getAccessTokenSilently);
            toast.success("Cancha eliminada con éxito");
        } catch (error) {
            toast.error("Hubo un error al eliminar la cancha");
        }
    };
    
    const onUpdateSchedule = async (schedule: any) => {
        try {
            await updateAdminSchedule(schedule.courtId, schedule.slots, getAccessTokenSilently);
            await fetchAdminCourts(getAccessTokenSilently);
            toast.success("Horario actualizado con éxito");
        } catch (error) {
            toast.error("Error al actualizar horario");
        }
    };

    const handleDashboardCancel = async (booking: any) => {
        try {
            await storeCancelBooking(booking.id, getAccessTokenSilently);
            toast.success("Reserva cancelada con éxito");
            fetchAdminDashboard(getAccessTokenSilently);
        } catch (error) {
            toast.error("Error al cancelar la reserva");
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                        Panel de Administración
                    </h2>
                    
                    <div className="flex bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto no-scrollbar scroll-smooth">
                        <button
                            onClick={() => setView('dashboard')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                                view === 'dashboard' 
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 translate-y-[-1px]' 
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <LayoutDashboard size={18} />
                            Dashboard
                        </button>
                        <button
                            onClick={() => setView('courts')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                                view === 'courts' 
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 translate-y-[-1px]' 
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Trophy size={18} />
                            Canchas
                        </button>
                        <button
                            onClick={() => setView('schedules')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                                view === 'schedules' 
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 translate-y-[-1px]' 
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Clock size={18} />
                            Horarios y Tarifas
                        </button>
                        <button
                            onClick={() => setView('calendar')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                                view === 'calendar' 
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 translate-y-[-1px]' 
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <CalendarRange size={18} />
                            Calendario y Reservas
                        </button>
                        <button
                            onClick={() => setView('settings')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                                view === 'settings' 
                                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 translate-y-[-1px]' 
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Settings size={18} />
                            Configuración
                        </button>
                    </div>
                </div>

                {view === 'dashboard' && (
                    <AdminDashboard
                        dashboardData={adminDashboardData}
                        onCancelBooking={handleDashboardCancel}
                        onNewBooking={() => setView('calendar')}
                        courts={courts}
                        filters={{
                            page: dashboardPage,
                            name: dashboardNameFilter,
                            date: dashboardDateFilter,
                            code: dashboardCodeFilter
                        }}
                        onFilterChange={(newFilters: any) => {
                            if (newFilters.page !== undefined) {
                                setDashboardPage(newFilters.page);
                            }
                            if (newFilters.name !== undefined) {
                                setDashboardNameFilter(newFilters.name);
                                setDashboardPage(1); // Reset to page 1 on search
                            }
                            if (newFilters.code !== undefined) {
                                setDashboardCodeFilter(newFilters.code);
                                setDashboardPage(1); // Reset to page 1 on search
                            }
                            if (newFilters.date !== undefined) {
                                setDashboardDateFilter(newFilters.date);
                                setDashboardPage(1); // Reset to page 1 on search
                            }
                        }}
                        onRefresh={() => {
                            setIsRefreshing(true);
                            // call fetch and clear loading when done
                            Promise.resolve(
                                fetchAdminDashboard(
                                    getAccessTokenSilently,
                                    dashboardPage,
                                    10,
                                    dashboardDateFilter,
                                    dashboardNameFilter
                                )
                            ).finally(() => setIsRefreshing(false));
                        }}
                        isRefreshing={isRefreshing}
                    />
                )}

                {view === 'courts' && (
                    <AdminCourts
                        courts={courts}
                        onSaveCourt={onSaveCourt}
                        onDeleteCourt={onDeleteCourt}
                    />
                )}

                {view === 'schedules' && (
                    <AdminSchedules
                        courts={courts}
                        schedules={schedules}
                        onUpdateSchedule={onUpdateSchedule}
                    />
                )}

                {view === 'calendar' && (
                    <AdminCalendar
                        courts={courts}
                    />
                )}

                {view === 'settings' && (
                    <AdminSettings
                        sportCenter={currentSportCenter}
                        onSave={() => fetchAdminCourts(getAccessTokenSilently)}
                    />
                )}
            </div>
        </div>
    );
};
