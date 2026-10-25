"use client";
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth0 } from '@auth0/auth0-react';
import { Ban, PauseCircle, Pencil, Plus, Search, Star, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiError, CenterStatus, SuperadminCenter, sa } from '@/api/superadminApi';
import { Pager, PageHeader, PaymentModeBadge, StatusBadge, fieldCls, useDebounced } from '@/components/superadmin/ui';
import { FeaturedDialog, StatusDialog } from '@/components/superadmin/CenterDialogs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const LIMIT = 20;
const iconBtn = 'flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-600';

function CentersList() {
  const { getAccessTokenSilently } = useAuth0();
  const params = useSearchParams();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(params.get('status') || '');
  const [paymentMode, setPaymentMode] = useState(params.get('payment_mode') || '');
  const [featured, setFeatured] = useState(params.get('featured') || '');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: SuperadminCenter[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusTarget, setStatusTarget] = useState<{ center: SuperadminCenter; status: CenterStatus } | null>(null);
  const [featuredCenter, setFeaturedCenter] = useState<SuperadminCenter | null>(null);
  const dq = useDebounced(q);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await sa.listCenters(getAccessTokenSilently, { q: dq, status, payment_mode: paymentMode, featured, page, limit: LIMIT }));
    } catch (e) {
      toast.error(apiError(e, 'No se pudieron cargar los centros'));
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently, dq, status, paymentMode, featured, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [dq, status, paymentMode, featured]);

  const changeStatus = async (s: CenterStatus, reason: string) => {
    if (!statusTarget) return;
    try {
      await sa.setStatus(getAccessTokenSilently, statusTarget.center.id, s, reason);
      toast.success('Estado actualizado');
      setStatusTarget(null);
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  const saveFeatured = async (v: { is_featured: boolean; priority: number; until: string | null }) => {
    if (!featuredCenter) return;
    try {
      await sa.setFeatured(getAccessTokenSilently, featuredCenter.id, v);
      toast.success('Destacado actualizado');
      setFeaturedCenter(null);
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  return (
    <>
      <PageHeader
        title="Centros deportivos"
        subtitle="Crea, edita, destaca y controla el estado de cada centro."
        actions={
          <Link href="/superadmin/centers/new" className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
            <Plus size={16} aria-hidden="true" /> Nuevo centro
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input aria-label="Buscar centro" placeholder="Nombre, slug, email o RUT" value={q} onChange={(e) => setQ(e.target.value)} className={`${fieldCls} pl-9`} />
        </div>
        <select aria-label="Estado" value={status} onChange={(e) => setStatus(e.target.value)} className={fieldCls}>
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="suspended">Suspendidos</option>
          <option value="blocked">Bloqueados</option>
        </select>
        <select aria-label="Modo de pago" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className={fieldCls}>
          <option value="">Todos los modos de pago</option>
          <option value="pay_online">Pago online</option>
          <option value="pay_at_center">Paga en el centro</option>
        </select>
        <select aria-label="Destacado" value={featured} onChange={(e) => setFeatured(e.target.value)} className={fieldCls}>
          <option value="">Destacados y no</option>
          <option value="true">Solo destacados</option>
          <option value="false">No destacados</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-busy={loading}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Centro</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="text-right">Comisión</TableHead>
              <TableHead>Destacado</TableHead>
              <TableHead className="text-right"><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !data
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6}><div className="h-6 animate-pulse rounded bg-slate-100" /></TableCell></TableRow>
                ))
              : data?.items.length === 0
              ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-slate-600">No hay centros con esos filtros.</TableCell></TableRow>
              : data?.items.map((c) => {
                  const st = (c.status || 'active') as CenterStatus;
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-semibold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-600">{c.city || '—'} · {c.admin_email || 'sin admin'}</p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={st} />
                        {c.status_reason && st !== 'active' && <p className="mt-1 max-w-[16rem] truncate text-xs text-slate-600" title={c.status_reason}>{c.status_reason}</p>}
                      </TableCell>
                      <TableCell><PaymentModeBadge mode={c.payment_mode} /></TableCell>
                      <TableCell className="text-right tabular-nums">{c.payment_mode === 'pay_online' ? `${c.marketplace_fee_percent ?? 0}%` : '—'}</TableCell>
                      <TableCell>
                        {c.is_featured
                          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-800"><Star size={14} className="fill-yellow-400 text-yellow-500" aria-hidden="true" /> Prioridad {c.featured_priority ?? 0}</span>
                          : <span className="text-xs text-slate-500">No</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Link href={`/superadmin/centers/${c.id}`} className={iconBtn} aria-label={`Editar ${c.name}`} title="Editar"><Pencil size={18} aria-hidden="true" /></Link>
                          <button type="button" className={iconBtn} onClick={() => setFeaturedCenter(c)} aria-label={`Configurar destacado de ${c.name}`} title="Destacar"><Star size={18} aria-hidden="true" /></button>
                          {st === 'active' ? (
                            <>
                              <button type="button" className={iconBtn} onClick={() => setStatusTarget({ center: c, status: 'suspended' })} aria-label={`Suspender ${c.name}`} title="Suspender"><PauseCircle size={18} aria-hidden="true" /></button>
                              <button type="button" className={`${iconBtn} hover:!bg-red-50 hover:!text-red-700`} onClick={() => setStatusTarget({ center: c, status: 'blocked' })} aria-label={`Bloquear ${c.name}`} title="Bloquear"><Ban size={18} aria-hidden="true" /></button>
                            </>
                          ) : (
                            <button type="button" className={`${iconBtn} hover:!bg-emerald-50 hover:!text-emerald-700`} onClick={() => setStatusTarget({ center: c, status: 'active' })} aria-label={`Reactivar ${c.name}`} title="Reactivar"><CheckCircle2 size={18} aria-hidden="true" /></button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
        <Pager page={page} limit={LIMIT} total={data?.total ?? 0} onPage={setPage} />
      </div>

      <StatusDialog center={statusTarget?.center ?? null} target={statusTarget?.status ?? 'active'} onClose={() => setStatusTarget(null)} onConfirm={changeStatus} />
      <FeaturedDialog center={featuredCenter} onClose={() => setFeaturedCenter(null)} onConfirm={saveFeatured} />
    </>
  );
}

export default function CentersPage() {
  return <Suspense fallback={null}><CentersList /></Suspense>;
}
