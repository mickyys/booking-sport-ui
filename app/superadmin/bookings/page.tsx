"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import { apiError, SuperadminBooking, SuperadminCenter, sa } from '@/api/superadminApi';
import { Pager, PageHeader, fieldCls, formatCLP, useDebounced } from '@/components/superadmin/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const LIMIT = 25;
const statusStyle: Record<string, string> = {
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
  expired: 'bg-slate-100 text-slate-700 ring-slate-500/20',
};
const statusLabel: Record<string, string> = { confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada', expired: 'Expirada' };

export default function BookingsPage() {
  const { getAccessTokenSilently } = useAuth0();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [centerId, setCenterId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [centers, setCenters] = useState<SuperadminCenter[]>([]);
  const [data, setData] = useState<{ items: SuperadminBooking[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const dq = useDebounced(q);

  const filters = { q: dq, status, center_id: centerId, from, to };

  useEffect(() => {
    sa.listCenters(getAccessTokenSilently, { limit: 100 }).then((r) => setCenters(r.items)).catch(() => {});
  }, [getAccessTokenSilently]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await sa.listBookings(getAccessTokenSilently, { ...filters, page, limit: LIMIT })); }
    catch (e) { toast.error(apiError(e, 'No se pudieron cargar las reservas')); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAccessTokenSilently, dq, status, centerId, from, to, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [dq, status, centerId, from, to]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = await sa.exportBookings(getAccessTokenSilently, filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'reservas.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error(apiError(e, 'No se pudo exportar')); }
    finally { setExporting(false); }
  };

  return (
    <>
      <PageHeader
        title="Reservas"
        subtitle="Reservas de todos los centros."
        actions={
          <button type="button" onClick={exportCsv} disabled={exporting} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
            <Download size={16} aria-hidden="true" /> {exporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input aria-label="Buscar reserva" placeholder="Código, email o nombre" value={q} onChange={(e) => setQ(e.target.value)} className={`${fieldCls} pl-9`} />
        </div>
        <select aria-label="Centro" value={centerId} onChange={(e) => setCenterId(e.target.value)} className={fieldCls}>
          <option value="">Todos los centros</option>
          {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select aria-label="Estado" value={status} onChange={(e) => setStatus(e.target.value)} className={fieldCls}>
          <option value="">Todos los estados</option>
          {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input aria-label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={fieldCls} />
        <input aria-label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} className={fieldCls} />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-busy={loading}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead><TableHead>Centro / cancha</TableHead><TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !data
              ? Array.from({ length: 6 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><div className="h-6 animate-pulse rounded bg-slate-100" /></TableCell></TableRow>)
              : data?.items.length === 0
              ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-slate-600">No hay reservas con esos filtros.</TableCell></TableRow>
              : data?.items.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.booking_code || b.id.slice(-6)}</TableCell>
                    <TableCell><p className="font-semibold text-slate-900">{b.sport_center_name || '—'}</p><p className="text-xs text-slate-600">{b.court_name || ''}</p></TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">{(b.local_date || b.date.slice(0, 10))} {String(b.hour).padStart(2, '0')}:{String(b.minutes).padStart(2, '0')}</TableCell>
                    <TableCell className="text-sm">{b.guest_details?.email || b.user_id || '—'}</TableCell>
                    <TableCell><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusStyle[b.status] || statusStyle.expired}`}>{statusLabel[b.status] || b.status}</span></TableCell>
                    <TableCell className="text-right tabular-nums">{formatCLP(b.final_price)}{b.pending_amount > 0 && <p className="text-xs text-amber-700">Pendiente {formatCLP(b.pending_amount)}</p>}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        <Pager page={page} limit={LIMIT} total={data?.total ?? 0} onPage={setPage} />
      </div>
    </>
  );
}
