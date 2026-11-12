"use client";
import React from 'react';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter, usePathname } from 'next/navigation';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth } from '@/hooks/useAuth';

import { AdminDashboard } from './admin/AdminDashboard';
import { AdminCourts } from './admin/AdminCourts';
import { AdminAgenda } from './admin/AdminAgenda';
import { AdminSettings } from './admin/AdminSettings';
import { AdminQR } from './admin/AdminQR';
import { AdminUsers } from './admin/AdminUsers';
import { AdminSpaces } from './admin/AdminSpaces';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminPanelProvider, useAdminPanel } from '@/context/AdminPanelContext';
import { MPStatusBanner } from '@/components/admin/MPStatusBanner';

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
    const { logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const onboardingPending = (currentSportCenter as any)?.onboarding_status === 'pending';
    const onOnboardingRoute = pathname?.startsWith('/admin/onboarding') ?? false;
    // Mientras el onboarding está pendiente solo se permite el wizard y los
    // espacios (para definir los horarios de las canchas ya creadas).
    const allowedWhilePending =
        onOnboardingRoute || (pathname?.startsWith('/admin/spaces') ?? false);

    // Wizard post-login: mientras el centro esté en "pending", el admin debe
    // completar la configuración antes de usar el resto del panel.
    React.useEffect(() => {
        if (!currentSportCenter) return;
        if (onboardingPending && !allowedWhilePending) {
            router.replace('/admin/onboarding');
        }
    }, [currentSportCenter, onboardingPending, allowedWhilePending, router]);

    // Pantalla dedicada: sin menú lateral ni accesos al resto del panel.
    if (onboardingPending && onOnboardingRoute) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
                    <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-slate-900">ReservaloYA</p>
                            <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Configuración inicial
                                {currentSportCenter?.name ? ` · ${currentSportCenter.name}` : ''}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={logout}
                            className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        >
                            <LogOut size={16} aria-hidden="true" />
                            Cerrar sesión
                        </button>
                    </div>
                </header>
                <main className="flex-1 px-4 py-6 lg:py-10">
                    <div className="mx-auto max-w-5xl">{children}</div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
            <AdminSidebar sportCenterName={currentSportCenter?.name} isFeatured={!!currentSportCenter?.is_featured} />

            <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0">
                {onboardingPending && (
                    <div className="border-b border-amber-200 bg-amber-50">
                        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm font-semibold text-amber-800">
                                Estás configurando tu centro. Cuando termines, vuelve al onboarding para finalizar.
                            </p>
                            <Link
                                href="/admin/onboarding"
                                className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-amber-700"
                            >
                                Volver al onboarding
                            </Link>
                        </div>
                    </div>
                )}
                <MPStatusBanner />
                <main className="flex-1 p-4 pb-24 lg:p-8 lg:pb-8 lg:overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
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
            onNewBooking={() => router.push('/admin')}
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
    const { getAccessTokenSilently } = useAuth0();
    const fetchAdminCourts = useBookingStore(state => state.fetchAdminCourts);

    React.useEffect(() => {
        if (courts.length === 0) {
            fetchAdminCourts(getAccessTokenSilently);
        }
    }, [courts.length, fetchAdminCourts, getAccessTokenSilently]);

    return <AdminCourts courts={courts} onSaveCourt={onSaveCourt} onDeleteCourt={onDeleteCourt} currentSportCenter={currentSportCenter} />;
};

export const AdminAgendaSubPage: React.FC = () => {
    return <AdminAgenda />;
};

export const AdminSettingsSubPage: React.FC = () => {
    const { currentSportCenter } = useAdminPanel();
    return <AdminSettings sportCenter={currentSportCenter} />;
};

export const AdminQRSubPage: React.FC = () => {
    const { currentSportCenter } = useAdminPanel();
    return <AdminQR sportCenter={currentSportCenter} />;
};

export const AdminUsersSubPage: React.FC = () => {
    return <AdminUsers />;
};

export const AdminSpacesSubPage: React.FC = () => {
    const { currentSportCenter } = useAdminPanel();
    return <AdminSpaces sportCenter={currentSportCenter} />;
};
