"use client";
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';

import { AdminDashboard } from './admin/AdminDashboard';
import { AdminCourts } from './admin/AdminCourts';
import { AdminSchedules } from './admin/AdminSchedules';
import { AdminCalendar } from './admin/AdminCalendar';
import { AdminAgenda } from './admin/AdminAgenda';
import { AdminSettings } from './admin/AdminSettings';
import { AdminQR } from './admin/AdminQR';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminPanelProvider, useAdminPanel } from '@/context/AdminPanelContext';

interface AdminPanelProps {
    children?: React.ReactNode;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ children }) => {
    return (
        <AdminPanelProvider>
            <AdminPanelContent children={children} />
        </AdminPanelProvider>
    );
};

const AdminPanelContent: React.FC<AdminPanelProps> = ({ children }) => {
    const { currentSportCenter } = useAdminPanel();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
            <AdminSidebar sportCenterName={currentSportCenter?.name} />
            
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto pt-16 lg:pt-0">
                    {children}
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
    } = useAdminPanel();
    const { getAccessTokenSilently } = useAuth0();
    const router = useRouter();
    const lastFetchParams = React.useRef<string>("");

    React.useEffect(() => {
        const currentParams = JSON.stringify({
            dashboardPage,
            dashboardDateFilter,
            dashboardNameFilter,
            dashboardCodeFilter,
            dashboardStatusFilter
        });

        if (lastFetchParams.current === currentParams) return;
        lastFetchParams.current = currentParams;

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
    }, [
        fetchAdminDashboard,
        getAccessTokenSilently,
        dashboardPage,
        dashboardDateFilter,
        dashboardNameFilter,
        dashboardCodeFilter,
        dashboardStatusFilter
    ]);

    return (
        <AdminDashboard
            dashboardData={adminDashboardData}
            onCancelBooking={handleDashboardCancel}
            onNewBooking={() => router.push('/admin/calendar')}
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

export const AdminCourtsSubPage: React.FC = () => {
    const { courts, onSaveCourt, onDeleteCourt, currentSportCenter } = useAdminPanel();
    return <AdminCourts courts={courts} onSaveCourt={onSaveCourt} onDeleteCourt={onDeleteCourt} currentSportCenter={currentSportCenter} />;
};

export const AdminSchedulesSubPage: React.FC = () => {
    const { courts, schedules, onUpdateSchedule, onUpdateScheduleSlot, centerDefaultSchedule, centerScheduleOverrides, centerActiveDays } = useAdminPanel();
    return (
        <AdminSchedules 
            courts={courts} 
            schedules={schedules} 
            onUpdateSchedule={onUpdateSchedule} 
            onUpdateScheduleSlot={onUpdateScheduleSlot}
            centerDefaultSchedule={centerDefaultSchedule}
            centerScheduleOverrides={centerScheduleOverrides}
            centerActiveDays={centerActiveDays}
        />
    );
};

export const AdminCalendarSubPage: React.FC = () => {
    const { courts } = useAdminPanel();
    return <AdminCalendar courts={courts} />;
};

export const AdminAgendaSubPage: React.FC = () => {
    const { courts } = useAdminPanel();
    return <AdminAgenda courts={courts} />;
};

export const AdminSettingsSubPage: React.FC = () => {
    const { currentSportCenter } = useAdminPanel();
    return <AdminSettings sportCenter={currentSportCenter} />;
};

export const AdminQRSubPage: React.FC = () => {
    const { currentSportCenter } = useAdminPanel();
    return <AdminQR sportCenter={currentSportCenter} />;
};
