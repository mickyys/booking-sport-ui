"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { format, addDays } from 'date-fns';
import { useAuth0 } from '@auth0/auth0-react';
import { useBookingStore } from '@/store/useBookingStore';
import { toast } from 'sonner';

interface AdminPanelContextType {
    adminDashboardData: any;
    handleDashboardCancel: (booking: any) => Promise<void>;
    courts: any[];
    dashboardPage: number;
    dashboardNameFilter: string;
    dashboardCodeFilter: string;
    dashboardStatusFilter: string;
    dashboardDateFilter: string;
    setDashboardPage: (page: number) => void;
    setDashboardNameFilter: (name: string) => void;
    setDashboardCodeFilter: (code: string) => void;
    setDashboardStatusFilter: (status: string) => void;
    setDashboardDateFilter: (date: string) => void;
    onSaveCourt: (court: any) => void;
    onDeleteCourt: (id: any) => Promise<void>;
    schedules: any[];
    onUpdateSchedule: (schedule: any) => Promise<void>;
    onUpdateScheduleSlot: (courtId: string, slot: any) => Promise<void>;
    currentSportCenter: any;
    isRefreshing: boolean;
    setIsRefreshing: (val: boolean) => void;
    fetchAdminDashboard: any;
    centerDefaultSchedule: any;
    centerScheduleOverrides: any;
    centerActiveDays: number[];
}

const AdminPanelContext = createContext<AdminPanelContextType | undefined>(undefined);

export const AdminPanelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

    // Use selectors to avoid unnecessary re-renders when other parts of the store change
    const fetchAdminCourts = useBookingStore(state => state.fetchAdminCourts);
    const adminCourts = useBookingStore(state => state.adminCourts);
    const deleteAdminCourt = useBookingStore(state => state.deleteAdminCourt);
    const updateAdminSchedule = useBookingStore(state => state.updateAdminSchedule);
    const updateAdminScheduleSlot = useBookingStore(state => state.updateAdminScheduleSlot);
    const fetchAdminDashboard = useBookingStore(state => state.fetchAdminDashboard);
    const adminDashboardData = useBookingStore(state => state.adminDashboardData);
    const storeCancelBooking = useBookingStore(state => state.cancelBooking);
    const fetchSportCenterByID = useBookingStore(state => state.fetchSportCenterByID);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loadedSportCenter, setLoadedSportCenter] = useState<any>(null);

    React.useEffect(() => {
        fetchSportCenterByID('my', getAccessTokenSilently).then((center) => {
            if (center) setLoadedSportCenter(center);
        });
    }, []);

    React.useEffect(() => {
        if (!adminCourts || adminCourts.length === 0) {
            fetchAdminCourts(getAccessTokenSilently);
        }
    }, []);

    const backendCourts = React.useMemo(() => adminCourts ? adminCourts.flatMap((ac: any) => ac.courts?.map((c: any) => ({
        ...c,
        id: c.id || c._id,
        image: c.image_url || c.image || '/images/cancha1.jpeg',
        centerName: ac.sport_center?.name,
        centerId: ac.sport_center?.id || ac.sport_center?._id,
    })) || []) : [], [adminCourts]);

    const currentSportCenter = React.useMemo(() => {
        if (loadedSportCenter) return loadedSportCenter;
        if (adminCourts && adminCourts.length > 0) return adminCourts[0].sport_center;
        return null;
    }, [loadedSportCenter, adminCourts]);
    const courts = backendCourts;

    const centerDefaultSchedule = React.useMemo(() => currentSportCenter?.default_schedule || { start_time: '19:00', end_time: '20:00' }, [currentSportCenter]);
    const centerScheduleOverrides = React.useMemo(() => currentSportCenter?.schedule_overrides || {}, [currentSportCenter]);
    const centerActiveDays = React.useMemo(() => currentSportCenter?.active_days || [1, 2, 3, 4, 5, 6], [currentSportCenter]);

    const schedules = React.useMemo(() => backendCourts.map(c => ({
        courtId: c.id,
        slots: c.schedule?.map((s: any) => ({
            hour: s.hour,
            minutes: s.minutes || 0,
            price: s.price || 0,
            enabled: s.status === 'available',
            paymentRequired: s.payment_required,
            paymentOptional: s.payment_optional || false,
            partialPaymentEnabled: s.partial_payment_enabled ?? false,
            dayOfWeek: s.day_of_week
        })) || []
    })), [backendCourts]);

    const onSaveCourt = React.useCallback((court: any) => fetchAdminCourts(getAccessTokenSilently), [fetchAdminCourts, getAccessTokenSilently]);

    const onDeleteCourt = React.useCallback(async (id: any) => {
        try {
            await deleteAdminCourt(id, getAccessTokenSilently);
            await fetchAdminCourts(getAccessTokenSilently);
            toast.success("Cancha eliminada con éxito");
        } catch (error) {
            toast.error("Hubo un error al eliminar la cancha");
        }
    }, [deleteAdminCourt, fetchAdminCourts, getAccessTokenSilently]);

    const onUpdateSchedule = React.useCallback(async (schedule: any) => {
        try {
            await updateAdminSchedule(schedule.courtId, schedule.slots, getAccessTokenSilently);
            toast.success("Horario actualizado con éxito");
        } catch (error) {
            toast.error("Error al actualizar horario");
        }
    }, [updateAdminSchedule, getAccessTokenSilently]);

    const onUpdateScheduleSlot = React.useCallback(async (courtId: string, slot: any) => {
        try {
            await updateAdminScheduleSlot(courtId, slot, getAccessTokenSilently);
            toast.success("Horario actualizado con éxito");
        } catch (error) {
            toast.error("Error al actualizar horario");
        }
    }, [updateAdminScheduleSlot, getAccessTokenSilently]);

    const handleDashboardCancel = React.useCallback(async (booking: any) => {
        try {
            await storeCancelBooking(booking.id, getAccessTokenSilently);
            toast.success("Reserva cancelada con éxito");
            fetchAdminDashboard(getAccessTokenSilently);
        } catch (error) {
            toast.error("Error al cancelar la reserva");
        }
    }, [storeCancelBooking, fetchAdminDashboard, getAccessTokenSilently]);

    const contextValue = React.useMemo(() => ({
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
        onUpdateScheduleSlot,
        currentSportCenter,
        isRefreshing,
        setIsRefreshing,
        fetchAdminDashboard,
        centerDefaultSchedule,
        centerScheduleOverrides,
        centerActiveDays
    }), [
        adminDashboardData,
        handleDashboardCancel,
        courts,
        dashboardPage,
        dashboardNameFilter,
        dashboardCodeFilter,
        dashboardStatusFilter,
        dashboardDateFilter,
        onSaveCourt,
        onDeleteCourt,
        schedules,
        onUpdateSchedule,
        onUpdateScheduleSlot,
        currentSportCenter,
        isRefreshing,
        fetchAdminDashboard,
        centerDefaultSchedule,
        centerScheduleOverrides,
        centerActiveDays
    ]);

    return (
        <AdminPanelContext.Provider value={contextValue}>
            {children}
        </AdminPanelContext.Provider>
    );
};

export const useAdminPanel = () => {
    const context = useContext(AdminPanelContext);
    if (context === undefined) {
        throw new Error('useAdminPanel must be used within an AdminPanelProvider');
    }
    return context;
};
