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
    const {
        fetchAdminCourts,
        adminCourts,
        deleteAdminCourt,
        updateAdminSchedule,
        updateAdminScheduleSlot,
        fetchAdminDashboard,
        adminDashboardData,
        cancelBooking: storeCancelBooking
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

    const backendCourts = adminCourts ? adminCourts.flatMap((ac: any) => ac.courts?.map((c: any) => ({
        ...c,
        id: c.id || c._id,
        image: c.image || '/images/cancha1.jpeg',
        centerName: ac.sport_center?.name,
        centerId: ac.sport_center?.id || ac.sport_center?._id,
    })) || []) : [];

    const currentSportCenter = adminCourts && adminCourts.length > 0 ? adminCourts[0].sport_center : null;
    const courts = backendCourts;

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
            toast.success("Horario actualizado con éxito");
        } catch (error) {
            toast.error("Error al actualizar horario");
        }
    };

    const onUpdateScheduleSlot = async (courtId: string, slot: any) => {
        try {
            await updateAdminScheduleSlot(courtId, slot, getAccessTokenSilently);
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
        <AdminPanelContext.Provider value={{
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
            fetchAdminDashboard
        }}>
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
