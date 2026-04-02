import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Booking, TimeSlot } from '../types';
import { COURTS } from '../data/mockData';
import { useAuth0 } from '@auth0/auth0-react';
import { useBookingStore } from '../store/useBookingStore';
import { toast } from 'sonner';
import { Outlet, useNavigate, useOutletContext } from 'react-router-dom';

import { AdminDashboard } from './admin/AdminDashboard';
import { AdminCourts } from './admin/AdminCourts';
import { AdminSchedules } from './admin/AdminSchedules';
import { AdminCalendar } from './admin/AdminCalendar';
import { AdminAgenda } from './admin/AdminAgenda';
import { AdminSettings } from './admin/AdminSettings';
import { AdminSubscriptions } from './admin/AdminSubscriptions';
import { AdminSidebar } from '../components/layout/AdminSidebar';

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
    const [dashboardPage, setDashboardPage] = useState(1);
    const [dashboardNameFilter, setDashboardNameFilter] = useState('');
    const [dashboardCodeFilter, setDashboardCodeFilter] = useState('');
    const [dashboardStatusFilter, setDashboardStatusFilter] = useState('');
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
            dashboardCodeFilter,
            dashboardStatusFilter
        );
    }, [
        fetchAdminDashboard,
        getAccessTokenSilently,
        dashboardPage,
        dashboardDateFilter,
        dashboardNameFilter,
        dashboardCodeFilter,
        dashboardStatusFilter
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
            paymentOptional: s.payment_optional || false,
        })) || []
    }));

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
        <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
            <AdminSidebar />
            
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto pt-16 lg:pt-0">
                    <Outlet context={{
                        adminDashboardData,
                        handleDashboardCancel,
                        courts,
                        dashboardPage,
                        dashboardNameFilter,
                        dashboardCodeFilter,
                        dashboardStatusFilter,
                        dashboardDateFilter,
                        setDashboardPage,
                        setDashboardNameFilter,
                        setDashboardCodeFilter,
                        setDashboardStatusFilter,
                        setDashboardDateFilter,
                        onSaveCourt,
                        onDeleteCourt,
                        schedules,
                        onUpdateSchedule,
                        currentSportCenter,
                        isRefreshing,
                        setIsRefreshing,
                        fetchAdminDashboard
                    }} />
                </div>
            </main>
        </div>
    );
};

// Sub-page Components that consume the context
export const AdminDashboardSubPage: React.FC = () => {
    const { 
        adminDashboardData, 
        handleDashboardCancel, 
        courts, 
        dashboardPage,
        dashboardNameFilter,
        dashboardCodeFilter,
        dashboardStatusFilter,
        dashboardDateFilter,
        setDashboardPage,
        setDashboardNameFilter,
        setDashboardCodeFilter,
        setDashboardStatusFilter,
        setDashboardDateFilter,
        fetchAdminDashboard,
        setIsRefreshing
    } = useOutletContext<any>();
    const { getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();

    return (
        <AdminDashboard
            dashboardData={adminDashboardData}
            onCancelBooking={handleDashboardCancel}
            onNewBooking={() => navigate('/admin/calendar')}
            courts={courts}
            filters={{
                page: dashboardPage,
                name: dashboardNameFilter,
                date: dashboardDateFilter,
                code: dashboardCodeFilter,
                status: dashboardStatusFilter
            }}
            onFilterChange={(newFilters: any) => {
                if (newFilters.page !== undefined) setDashboardPage(newFilters.page);
                if (newFilters.name !== undefined) { setDashboardNameFilter(newFilters.name); setDashboardPage(1); }
                if (newFilters.code !== undefined) { setDashboardCodeFilter(newFilters.code); setDashboardPage(1); }
                if (newFilters.status !== undefined) { setDashboardStatusFilter(newFilters.status); setDashboardPage(1); }
                if (newFilters.date !== undefined) { setDashboardDateFilter(newFilters.date); setDashboardPage(1); }
            }}
            onRefresh={() => {
                setIsRefreshing(true);
                fetchAdminDashboard(
                    getAccessTokenSilently,
                    dashboardPage,
                    10,
                    dashboardDateFilter,
                    dashboardNameFilter,
                    dashboardCodeFilter,
                    dashboardStatusFilter
                ).finally(() => setIsRefreshing(false));
            }}
        />
    );
};

export const AdminSubscriptionsSubPage: React.FC = () => {
    return <AdminSubscriptions />;
};

export const AdminCourtsSubPage: React.FC = () => {
    const { courts, onSaveCourt, onDeleteCourt } = useOutletContext<any>();
    return <AdminCourts courts={courts} onSaveCourt={onSaveCourt} onDeleteCourt={onDeleteCourt} />;
};

export const AdminSchedulesSubPage: React.FC = () => {
    const { courts, schedules, onUpdateSchedule } = useOutletContext<any>();
    return <AdminSchedules courts={courts} schedules={schedules} onUpdateSchedule={onUpdateSchedule} />;
};

export const AdminCalendarSubPage: React.FC = () => {
    const { courts } = useOutletContext<any>();
    return <AdminCalendar courts={courts} />;
};

export const AdminAgendaSubPage: React.FC = () => {
    const { courts } = useOutletContext<any>();
    return <AdminAgenda courts={courts} />;
};

export const AdminSettingsSubPage: React.FC = () => {
    const { currentSportCenter } = useOutletContext<any>();
    return <AdminSettings sportCenter={currentSportCenter} />;
};
