"use client";
import React, { useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { downloadBookingsReport, MAX_BOOKINGS_REPORT_DAYS } from '@/api/bookingApi';
import { todaySantiagoKey } from '@/lib/santiago';

interface ExportBookingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS = [
    { value: '', label: 'Todas' },
    { value: 'confirmed', label: 'Confirmadas' },
    { value: 'cancelled', label: 'Canceladas' },
    { value: 'pending', label: 'Pendientes' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

// Cuenta ambos extremos; se calcula en UTC para no depender de la zona del navegador.
const rangeDays = (start: string, end: string) =>
    Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_MS) + 1;

export const ExportBookingsDialog: React.FC<ExportBookingsDialogProps> = ({ open, onOpenChange }) => {
    const { getAccessTokenSilently } = useAuth0();
    const today = useMemo(() => todaySantiagoKey(), []);
    const [start, setStart] = useState(`${today.slice(0, 8)}01`);
    const [end, setEnd] = useState(today);
    const [status, setStatus] = useState('');
    const [busy, setBusy] = useState(false);

    const days = start && end ? rangeDays(start, end) : 0;
    const error = !start || !end
        ? 'Elige las fechas.'
        : days < 1
            ? 'La fecha final es anterior a la inicial.'
            : days > MAX_BOOKINGS_REPORT_DAYS
                ? `El rango máximo es de ${MAX_BOOKINGS_REPORT_DAYS} días.`
                : null;

    const handleDownload = async () => {
        if (error) return;
        setBusy(true);
        try {
            const token = await getAccessTokenSilently();
            const blob = await downloadBookingsReport(token, { start, end, status });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `reservas_${start}_${end}.xlsx`;
            link.click();
            URL.revokeObjectURL(url);
            onOpenChange(false);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'No se pudo descargar el reporte');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Exportar reservas</DialogTitle>
                    <DialogDescription>
                        Descarga las reservas del período en un archivo Excel (.xlsx).
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1 text-sm font-semibold text-slate-700">
                        Desde
                        <input
                            type="date"
                            value={start}
                            max={end || undefined}
                            onChange={(e) => setStart(e.target.value)}
                            className="block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium"
                        />
                    </label>
                    <label className="space-y-1 text-sm font-semibold text-slate-700">
                        Hasta
                        <input
                            type="date"
                            value={end}
                            min={start || undefined}
                            onChange={(e) => setEnd(e.target.value)}
                            className="block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium"
                        />
                    </label>
                </div>

                <label className="block space-y-1 text-sm font-semibold text-slate-700">
                    Estado
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium"
                    >
                        {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </label>

                {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}

                <button
                    type="button"
                    onClick={handleDownload}
                    disabled={busy || !!error}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-black text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Descargar
                </button>
            </DialogContent>
        </Dialog>
    );
};
