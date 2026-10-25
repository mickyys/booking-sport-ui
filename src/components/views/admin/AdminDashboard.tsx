"use client";
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import { useBookingStore } from '@/store/useBookingStore';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DashboardStats } from './dashboard/DashboardStats';
import { DashboardToolbar } from './dashboard/DashboardToolbar';
import { DashboardList } from './dashboard/DashboardList';
import { DashboardDetailDialog } from './dashboard/DashboardDetailDialog';
import { formatBookingTime, getCustomerName, toDate } from './dashboard/dashboardUtils';

interface AdminDashboardProps {
    dashboardData: any | null;
    onCancelBooking: (booking: any) => void;
    onNewBooking: () => void;
    courts: any[];
    filters: {
        page: number;
        name: string;
        date: string;
        code: string;
        status: string;
    };
    onFilterChange: (newFilters: any) => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

const EMPTY_DATE_FILTER = '|';

const formatRangeLabel = (value: string): string => {
    const [from, to] = (value || '').split('|');
    const fromDate = from ? parseISO(from) : null;
    const toDateValue = to ? parseISO(to) : null;
    if (fromDate && toDateValue) {
        return `del ${format(fromDate, 'd MMM', { locale: es })} al ${format(toDateValue, 'd MMM', { locale: es })}`;
    }
    if (fromDate) return `desde el ${format(fromDate, 'd MMM', { locale: es })}`;
    if (toDateValue) return `hasta el ${format(toDateValue, 'd MMM', { locale: es })}`;
    return 'de todas las fechas';
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
    dashboardData,
    onCancelBooking,
    onNewBooking,
    courts,
    filters,
    onFilterChange,
    onRefresh = () => {},
    isRefreshing = false,
}) => {
    const { getAccessTokenSilently } = useAuth0();
    const verifyPayment = useBookingStore((s) => s.verifyPayment);
    const [selected, setSelected] = React.useState<any | null>(null);
    const [detailOpen, setDetailOpen] = React.useState(false);
    const [bookingToCancel, setBookingToCancel] = React.useState<any | null>(null);
    const refreshRef = React.useRef(onRefresh);
    refreshRef.current = onRefresh;

    React.useEffect(() => {
        const refreshOnFocus = () => {
            if (document.visibilityState === 'visible') refreshRef.current();
        };
        document.addEventListener('visibilitychange', refreshOnFocus);
        return () => document.removeEventListener('visibilitychange', refreshOnFocus);
    }, []);

    const handleVerifyPayment = async (booking: any) => {
        try {
            const res = await verifyPayment(booking.id, getAccessTokenSilently);
            if (res.booking_status === 'confirmed') {
                toast.success('Pago aprobado: reserva confirmada');
                setDetailOpen(false);
            } else if (res.mp_status === 'in_process' || res.mp_status === 'authorized') {
                toast.info('Mercado Pago aún está revisando el pago');
            } else if (res.mp_status === 'rejected' || res.mp_status === 'cancelled') {
                toast.error('Mercado Pago rechazó el pago');
            } else if (res.mp_status === 'not_found') {
                toast.info('No se encontró ningún pago en Mercado Pago para esta reserva');
            } else {
                toast.info('El pago sigue pendiente');
            }
            refreshRef.current();
        } catch {
            toast.error('No se pudo verificar el pago');
        }
    };

    const recentBookings: any[] = dashboardData?.recentBookings || [];
    const totalRecentCount: number = dashboardData?.totalRecentCount || 0;
    const perPage: number = dashboardData?.limit || 10;
    const totalPages: number = dashboardData?.totalPages || Math.ceil(totalRecentCount / perPage) || 1;
    const hasFilters =
        !!filters.name || !!filters.code || !!filters.status || filters.date !== EMPTY_DATE_FILTER;

    const handleClear = () =>
        onFilterChange({ name: '', code: '', status: '', date: EMPTY_DATE_FILTER });

    const cancelDate = bookingToCancel ? toDate(bookingToCancel.date) : null;

    return (
        <div className="space-y-5 pb-6 sm:space-y-6">
            <div className="flex items-center justify-between gap-3">
                <h1 className="min-w-0 truncate text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    Inicio
                </h1>
                <button
                    type="button"
                    onClick={onNewBooking}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 px-4 text-sm font-black text-white transition-colors hover:bg-emerald-600"
                >
                    Nueva reserva
                </button>
            </div>

            {dashboardData && <DashboardStats data={dashboardData} />}

            <DashboardToolbar filters={filters} onChange={onFilterChange} />

            <p aria-live="polite" className="px-1 text-xs font-medium text-slate-500">
                {dashboardData
                    ? `${totalRecentCount} ${totalRecentCount === 1 ? 'reserva' : 'reservas'} ${formatRangeLabel(filters.date)}`
                    : 'Cargando reservas…'}
            </p>

            <div className={isRefreshing && dashboardData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                <DashboardList
                    bookings={recentBookings}
                    courts={courts}
                    loading={!dashboardData}
                    hasFilters={hasFilters}
                    onSelect={(booking) => {
                        setSelected(booking);
                        setDetailOpen(true);
                    }}
                    onClearFilters={handleClear}
                />
            </div>

            {dashboardData && totalRecentCount > 0 && (
                <nav aria-label="Paginación" className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        disabled={isRefreshing || filters.page <= 1}
                        onClick={() => onFilterChange({ page: filters.page - 1 })}
                        className="min-h-11 min-w-24 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                        Anterior
                    </button>
                    <span className="text-sm font-semibold text-slate-600">
                        Página {filters.page} de {totalPages}
                    </span>
                    <button
                        type="button"
                        disabled={isRefreshing || filters.page >= totalPages}
                        onClick={() => onFilterChange({ page: filters.page + 1 })}
                        className="min-h-11 min-w-24 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                        Siguiente
                    </button>
                </nav>
            )}

            <DashboardDetailDialog
                booking={selected}
                courts={courts}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onCancel={setBookingToCancel}
                onVerifyPayment={handleVerifyPayment}
            />

            <AlertDialog open={!!bookingToCancel} onOpenChange={(open) => !open && setBookingToCancel(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de cancelar esta reserva?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. La reserva de {bookingToCancel && getCustomerName(bookingToCancel)}
                            {cancelDate && ` para el ${format(cancelDate, "d 'de' MMMM", { locale: es })}`}
                            {bookingToCancel && ` a las ${formatBookingTime(bookingToCancel)}`} será cancelada.
                            {bookingToCancel?.payment_method === 'flow' && (
                                <span className="mt-2 block rounded-lg border border-blue-100 bg-blue-50 p-2 text-xs font-medium text-blue-700">
                                    Nota: Los pagos vía Flow tienen devolución del 100% garantizada.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, mantener</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (bookingToCancel) {
                                    onCancelBooking(bookingToCancel);
                                    setBookingToCancel(null);
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            Sí, cancelar reserva
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
