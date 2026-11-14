"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Check, Copy, Search, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiError, BookingErrorLog, SuperadminCenter, sa } from '@/api/superadminApi';
import { Pager, PageHeader, fieldCls, formatDateTime, useDebounced } from '@/components/superadmin/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const LIMIT = 25;
const operationLabel: Record<string, string> = {
  payment_create: 'Crear pago',
  payment_webhook: 'Webhook de pago',
  booking_create: 'Crear reserva',
  booking_cancel: 'Cancelar reserva',
  booking_reschedule: 'Reagendar reserva',
  facility_booking_create: 'Reserva de sede',
};

const Row: React.FC<{ label: string; value?: string | number }> = ({ label, value }) =>
  value === undefined || value === '' ? null : (
    <div className="grid grid-cols-[9rem_1fr] gap-2 py-1 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-all font-medium text-slate-900">{value}</dd>
    </div>
  );

export default function ErrorLogsPage() {
  const { getAccessTokenSilently } = useAuth0();
  const [q, setQ] = useState('');
  const [operation, setOperation] = useState('');
  const [centerId, setCenterId] = useState('');
  const [resolved, setResolved] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [centers, setCenters] = useState<SuperadminCenter[]>([]);
  const [data, setData] = useState<{ items: BookingErrorLog[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BookingErrorLog | null>(null);
  const dq = useDebounced(q);

  useEffect(() => {
    sa.listCenters(getAccessTokenSilently, { limit: 100 }).then((r) => setCenters(r.items)).catch(() => {});
  }, [getAccessTokenSilently]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await sa.listErrorLogs(getAccessTokenSilently, {
        q: dq, operation, center_id: centerId, resolved, from, to, page, limit: LIMIT,
      }));
    } catch (e) { toast.error(apiError(e, 'No se pudieron cargar los errores')); }
    finally { setLoading(false); }
  }, [getAccessTokenSilently, dq, operation, centerId, resolved, from, to, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [dq, operation, centerId, resolved, from, to]);

  const toggleResolved = async (log: BookingErrorLog) => {
    try {
      await sa.resolveErrorLog(getAccessTokenSilently, log.id, !log.resolved);
      setSelected(null);
      await load();
    } catch (e) { toast.error(apiError(e, 'No se pudo actualizar')); }
  };

  const copy = (text: string) => {
    void navigator.clipboard?.writeText(text);
    toast.success('Copiado');
  };

  return (
    <>
      <PageHeader title="Errores de pago y reserva" subtitle="Errores que vieron los usuarios. Se eliminan automáticamente a los 3 meses." />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input aria-label="Buscar error" placeholder="Código ERR-, email, reserva o pago" value={q} onChange={(e) => setQ(e.target.value)} className={`${fieldCls} pl-9`} />
        </div>
        <select aria-label="Operación" value={operation} onChange={(e) => setOperation(e.target.value)} className={fieldCls}>
          <option value="">Todas las operaciones</option>
          {Object.entries(operationLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select aria-label="Centro" value={centerId} onChange={(e) => setCenterId(e.target.value)} className={fieldCls}>
          <option value="">Todos los centros</option>
          {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select aria-label="Estado" value={resolved} onChange={(e) => setResolved(e.target.value)} className={fieldCls}>
          <option value="">Todos</option>
          <option value="false">Pendientes</option>
          <option value="true">Resueltos</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={fieldCls} />
          <input aria-label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} className={fieldCls} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-busy={loading}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead><TableHead>Fecha</TableHead><TableHead>Operación</TableHead>
              <TableHead>Usuario</TableHead><TableHead>Error</TableHead><TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !data
              ? Array.from({ length: 6 }).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><div className="h-6 animate-pulse rounded bg-slate-100" /></TableCell></TableRow>)
              : data?.items.length === 0
              ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-slate-600">No hay errores con esos filtros.</TableCell></TableRow>
              : data?.items.map((l) => (
                  <TableRow key={l.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelected(l)}>
                    <TableCell className="font-mono text-xs font-semibold">{l.tracking_id}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs tabular-nums">{formatDateTime(l.created_at)}</TableCell>
                    <TableCell className="text-sm">{operationLabel[l.operation] || l.operation}</TableCell>
                    <TableCell className="text-sm">{l.user_email || l.user_id || '—'}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-slate-700" title={l.message}>{l.message}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${l.resolved ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-amber-50 text-amber-800 ring-amber-600/25'}`}>
                        {l.resolved ? 'Resuelto' : 'Pendiente'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        <Pager page={page} limit={LIMIT} total={data?.total ?? 0} onPage={setPage} />
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={`Error ${selected.tracking_id}`} onClick={() => setSelected(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-mono text-lg font-bold text-slate-900">{selected.tracking_id}</h2>
                <p className="text-sm text-slate-600">{operationLabel[selected.operation] || selected.operation} · {formatDateTime(selected.created_at)}</p>
              </div>
              <button type="button" onClick={() => copy(selected.tracking_id)} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                <Copy size={16} aria-hidden="true" /> Copiar
              </button>
            </div>
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 break-words">{selected.message}</div>
            <dl className="divide-y divide-slate-100">
              <Row label="Estado HTTP" value={selected.http_status} />
              <Row label="Usuario" value={selected.user_name} />
              <Row label="Email" value={selected.user_email} />
              <Row label="Teléfono" value={selected.user_phone} />
              <Row label="ID de usuario" value={selected.user_id} />
              <Row label="Código reserva" value={selected.booking_code} />
              <Row label="ID reserva" value={selected.booking_id} />
              <Row label="Centro" value={centers.find((c) => c.id === selected.sport_center_id)?.name || selected.sport_center_id} />
              <Row label="Cancha" value={selected.court_id} />
              <Row label="Pago Mercado Pago" value={selected.mp_payment_id} />
              <Row label="Trace ID" value={selected.trace_id} />
              <Row label="Petición" value={selected.method ? `${selected.method} ${selected.path ?? ''}` : undefined} />
              <Row label="Cliente" value={selected.client} />
              <Row label="IP" value={selected.ip} />
              <Row label="User-Agent" value={selected.user_agent} />
              <Row label="Resuelto por" value={selected.resolved ? selected.resolved_by : undefined} />
              <Row label="Resuelto el" value={selected.resolved_at ? formatDateTime(selected.resolved_at) : undefined} />
            </dl>
            {selected.provider_response && (
              <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{selected.provider_response}</pre>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setSelected(null)} className="inline-flex h-11 cursor-pointer items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cerrar</button>
              <button type="button" onClick={() => toggleResolved(selected)} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">
                {selected.resolved ? <><Undo2 size={16} aria-hidden="true" /> Reabrir</> : <><Check size={16} aria-hidden="true" /> Marcar resuelto</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
