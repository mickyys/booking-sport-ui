"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import {
  ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronLeft, ChevronRight, Columns3, Download, Loader2,
  Mail, Plus, Search, Upload, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AccessImportResult, AccessListParams, AccessRequest, AccessSortKey, AccessStatus, bulkSetAccessStatus,
  createManualAccess, downloadAccessTemplate, exportAccessRequests, getAccessStats, importAccessFile,
  listAccessRequests, resendAccessApproval, setAccessStatus, AccessBulkResult,
} from '@/api/accessApi';
import { formatRUT } from '@/utils/rut';

const STATUS_LABEL: Record<AccessStatus, string> = {
  pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada', revoked: 'Revocada',
};
const STATUS_CLASS: Record<AccessStatus, string> = {
  pending: 'border-amber-300 bg-amber-50 text-amber-800',
  approved: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  rejected: 'border-red-300 bg-red-50 text-red-800',
  revoked: 'border-slate-300 bg-slate-100 text-slate-700',
};
const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
  { value: 'revoked', label: 'Revocadas' },
];
const PAGE_SIZES = [10, 25, 50, 100];
const SOURCE_LABEL = { form: 'Formulario', admin: 'Pre-registro' } as const;

interface Filters {
  status: string;
  q: string;
  from: string;
  to: string;
  sort: AccessSortKey;
  dir: 'asc' | 'desc';
  page: number;
  limit: number;
}

const DEFAULTS: Filters = { status: 'pending', q: '', from: '', to: '', sort: 'created_at', dir: 'desc', page: 1, limit: 25 };

const SORT_KEYS: AccessSortKey[] = ['created_at', 'name', 'rut', 'email', 'status', 'decided_at'];

function readUrl(): Filters {
  if (typeof window === 'undefined') return DEFAULTS;
  const p = new URLSearchParams(window.location.search);
  const status = p.get('status');
  const sort = p.get('sort') as AccessSortKey | null;
  const limit = Number(p.get('limit'));
  const page = Number(p.get('page'));
  return {
    status: status === null ? DEFAULTS.status : status === 'all' ? '' : status,
    q: p.get('q') || '',
    from: p.get('from') || '',
    to: p.get('to') || '',
    sort: sort && SORT_KEYS.includes(sort) ? sort : DEFAULTS.sort,
    dir: p.get('dir') === 'asc' ? 'asc' : 'desc',
    page: page >= 1 ? Math.floor(page) : 1,
    limit: PAGE_SIZES.includes(limit) ? limit : DEFAULTS.limit,
  };
}

function writeUrl(f: Filters) {
  const p = new URLSearchParams(window.location.search);
  const set = (key: string, value: string, def: string) => (value === def ? p.delete(key) : p.set(key, value));
  set('status', f.status === '' ? 'all' : f.status, DEFAULTS.status);
  set('q', f.q, '');
  set('from', f.from, '');
  set('to', f.to, '');
  set('sort', f.sort, DEFAULTS.sort);
  set('dir', f.dir, DEFAULTS.dir);
  set('page', String(f.page), '1');
  set('limit', String(f.limit), String(DEFAULTS.limit));
  const qs = p.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
}

const dateFmt = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
const fmtDate = (iso?: string) => (iso ? dateFmt.format(new Date(iso)) : '—');

function waiting(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return 'hoy';
  return days === 1 ? 'hace 1 día' : `hace ${days} días`;
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

const canApprove = (s: AccessStatus) => s === 'pending' || s === 'rejected' || s === 'revoked';
const canReject = (s: AccessStatus) => s === 'pending' || s === 'approved';
const canRevoke = (s: AccessStatus) => s === 'approved';

interface Decision {
  status: AccessStatus;
  ids: string[];
  allMatching: boolean;
  count: number;
}

type OptionalColumn = 'created' | 'decided' | 'source';

export const AccessRequestsTab: React.FC = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [filters, setFilters] = useState<Filters>(readUrl);
  const [qInput, setQInput] = useState(filters.q);
  const [items, setItems] = useState<AccessRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allMatching, setAllMatching] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState('');
  const [bulkResult, setBulkResult] = useState<AccessBulkResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [manual, setManual] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [columns, setColumns] = useState<Record<OptionalColumn, boolean>>({ created: true, decided: true, source: false });
  const requestSeq = useRef(0);

  const update = useCallback((patch: Partial<Filters>, resetPage = true) => {
    setFilters((prev) => ({ ...prev, ...patch, page: resetPage && patch.page === undefined ? 1 : patch.page ?? prev.page }));
  }, []);

  useEffect(() => { writeUrl(filters); }, [filters]);

  // Búsqueda con debounce.
  useEffect(() => {
    if (qInput === filters.q) return;
    const t = setTimeout(() => update({ q: qInput.trim() }), 300);
    return () => clearTimeout(t);
  }, [qInput, filters.q, update]);

  const listParams = useMemo<AccessListParams>(() => ({
    status: filters.status, q: filters.q, from: filters.from, to: filters.to,
    sort: filters.sort, dir: filters.dir, page: filters.page, limit: filters.limit,
  }), [filters]);

  const load = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const [list, stats] = await Promise.all([
        listAccessRequests(getAccessTokenSilently, listParams),
        getAccessStats(getAccessTokenSilently),
      ]);
      if (seq !== requestSeq.current) return;
      setItems(list.items);
      setTotal(list.total);
      setTotalPages(Math.max(1, list.total_pages));
      setCounts(stats);
      if (list.page > Math.max(1, list.total_pages)) update({ page: Math.max(1, list.total_pages) }, false);
    } catch (e: any) {
      if (seq === requestSeq.current) toast.error(e.message);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [getAccessTokenSilently, listParams, update]);

  useEffect(() => { load(); }, [load]);

  // Al cambiar filtros se descarta la selección; al paginar se conserva.
  const filterKey = `${filters.status}|${filters.q}|${filters.from}|${filters.to}`;
  useEffect(() => { setSelected(new Set()); setAllMatching(false); }, [filterKey]);

  const hasFilters = filters.status !== DEFAULTS.status || filters.q !== '' || filters.from !== '' || filters.to !== '';
  const clearFilters = () => {
    setQInput('');
    setFilters({ ...DEFAULTS, limit: filters.limit });
  };

  const pageIds = items.map((r) => r.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const somePageSelected = pageIds.some((id) => selected.has(id));
  const selectedCount = allMatching ? total : selected.size;

  const togglePage = (checked: boolean) => {
    setAllMatching(false);
    setSelected((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  };
  const toggleOne = (id: string, checked: boolean) => {
    setAllMatching(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };
  const clearSelection = () => { setSelected(new Set()); setAllMatching(false); };

  const toggleSort = (key: AccessSortKey) => {
    if (filters.sort === key) update({ dir: filters.dir === 'asc' ? 'desc' : 'asc' });
    else update({ sort: key, dir: key === 'created_at' || key === 'decided_at' ? 'desc' : 'asc' });
  };
  const SortHead: React.FC<{ k: AccessSortKey; children: React.ReactNode; className?: string }> = ({ k, children, className }) => (
    <TableHead className={className} aria-sort={filters.sort === k ? (filters.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="inline-flex items-center gap-1 font-medium hover:text-slate-900" onClick={() => toggleSort(k)}>
        {children}
        {filters.sort === k
          ? (filters.dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)
          : <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />}
      </button>
    </TableHead>
  );

  const startDecision = (d: Decision) => {
    if (d.status === 'approved') {
      void runDecision(d, '');
    } else {
      setReason('');
      setDecision(d);
    }
  };

  const runDecision = async (d: Decision, why: string) => {
    setBusy(true);
    try {
      const single = !d.allMatching && d.ids.length === 1;
      if (single) {
        await setAccessStatus(getAccessTokenSilently, d.ids[0], d.status, why || undefined);
        toast.success(d.status === 'approved' ? 'Solicitud aprobada; se envió el correo' : 'Solicitud actualizada');
      } else {
        const result = await bulkSetAccessStatus(getAccessTokenSilently, {
          status: d.status,
          reason: why || undefined,
          ...(d.allMatching
            ? { filter: { status: filters.status, q: filters.q, from: filters.from, to: filters.to } }
            : { ids: d.ids }),
        });
        const parts = [`${result.updated} actualizada${result.updated === 1 ? '' : 's'}`];
        if (result.skipped) parts.push(`${result.skipped} omitida${result.skipped === 1 ? '' : 's'}`);
        if (result.failed.length) parts.push(`${result.failed.length} con error`);
        if (result.failed.length || result.truncated) setBulkResult(result);
        (result.failed.length ? toast.warning : toast.success)(parts.join(', '));
      }
      setDecision(null);
      setReason('');
      setDetailId(null);
      clearSelection();
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportAccessRequests(getAccessTokenSilently, listParams);
      saveBlob(blob, `solicitudes_acceso_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExporting(false);
    }
  };

  const resend = async (id: string) => {
    try {
      await resendAccessApproval(getAccessTokenSilently, id);
      toast.success('Correo de aprobación reenviado');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const detailIndex = detailId ? items.findIndex((r) => r.id === detailId) : -1;
  const detail = detailIndex >= 0 ? items[detailIndex] : null;

  const rowActions = (r: AccessRequest) => (
    <>
      {canApprove(r.status) && (
        <Button size="sm" onClick={() => startDecision({ status: 'approved', ids: [r.id], allMatching: false, count: 1 })}>Aprobar</Button>
      )}
      {canReject(r.status) && (
        <Button size="sm" variant="outline" onClick={() => startDecision({ status: 'rejected', ids: [r.id], allMatching: false, count: 1 })}>Rechazar</Button>
      )}
      {canRevoke(r.status) && (
        <Button size="sm" variant="outline" onClick={() => startDecision({ status: 'revoked', ids: [r.id], allMatching: false, count: 1 })}>Revocar</Button>
      )}
    </>
  );

  const from = total === 0 ? 0 : (filters.page - 1) * filters.limit + 1;
  const to = Math.min(filters.page * filters.limit, total);
  const colCount = 5 + Number(columns.created) + Number(columns.decided) + Number(columns.source);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <Button key={f.value || 'all'} size="sm" variant={filters.status === f.value ? 'default' : 'outline'} onClick={() => update({ status: f.value })}>
            {f.label}{f.value && counts[f.value] != null ? ` (${counts[f.value]})` : ''}
          </Button>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}><Upload className="mr-1 h-4 w-4" />Importar</Button>
          <Button size="sm" variant="outline" onClick={handleExport} disabled={exporting || total === 0}>
            {exporting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}Descargar Excel
          </Button>
          <Button size="sm" onClick={() => setManual(true)}><Plus className="mr-1 h-4 w-4" />Pre-registrar</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="relative min-w-60 flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input className="pl-8" aria-label="Buscar por RUT, nombre o correo" placeholder="Buscar por RUT, nombre o correo"
            value={qInput} onChange={(e) => setQInput(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="acc-from" className="text-xs text-slate-500">Desde</Label>
          <Input id="acc-from" type="date" className="w-40" value={filters.from} max={filters.to || undefined} onChange={(e) => update({ from: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="acc-to" className="text-xs text-slate-500">Hasta</Label>
          <Input id="acc-to" type="date" className="w-40" value={filters.to} min={filters.from || undefined} onChange={(e) => update({ to: e.target.value })} />
        </div>
        {hasFilters && <Button size="sm" variant="ghost" onClick={clearFilters}><X className="mr-1 h-4 w-4" />Limpiar filtros</Button>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="ml-auto hidden md:inline-flex"><Columns3 className="mr-1 h-4 w-4" />Columnas</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {([['created', 'Fecha de solicitud'], ['decided', 'Última decisión'], ['source', 'Origen']] as Array<[OptionalColumn, string]>).map(([key, label]) => (
              <DropdownMenuCheckboxItem key={key} checked={columns[key]} onCheckedChange={(v) => setColumns((c) => ({ ...c, [key]: !!v }))}>
                {label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {selectedCount > 0 && (
        <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-2" role="region" aria-label="Acciones masivas">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-1 text-sm font-medium">{selectedCount} seleccionada{selectedCount === 1 ? '' : 's'}</span>
            <Button size="sm" onClick={() => startDecision({ status: 'approved', ids: [...selected], allMatching, count: selectedCount })}>
              <Check className="mr-1 h-4 w-4" />Aprobar
            </Button>
            <Button size="sm" variant="outline" onClick={() => startDecision({ status: 'rejected', ids: [...selected], allMatching, count: selectedCount })}>
              <X className="mr-1 h-4 w-4" />Rechazar
            </Button>
            {(filters.status === 'approved' || filters.status === '') && (
              <Button size="sm" variant="outline" onClick={() => startDecision({ status: 'revoked', ids: [...selected], allMatching, count: selectedCount })}>Revocar</Button>
            )}
            <Button size="sm" variant="ghost" className="ml-auto" onClick={clearSelection}>Limpiar selección</Button>
          </div>
          {!allMatching && allPageSelected && total > items.length && (
            <p className="px-1 text-sm text-slate-600">
              Seleccionaste las {items.length} de esta página.{' '}
              <button type="button" className="font-medium underline" onClick={() => setAllMatching(true)}>
                Seleccionar las {total} que coinciden con el filtro
              </button>
            </p>
          )}
          {allMatching && (
            <p className="px-1 text-sm text-slate-600">
              Se aplicará a las {total} solicitudes que coinciden con el filtro. Las que no admitan el cambio se omiten.
            </p>
          )}
        </div>
      )}

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox aria-label="Seleccionar página" checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
                  onCheckedChange={(v) => togglePage(v === true)} />
              </TableHead>
              <SortHead k="name">Nombre</SortHead>
              <SortHead k="rut">RUT</SortHead>
              <SortHead k="email">Correo</SortHead>
              <SortHead k="status">Estado</SortHead>
              {columns.created && <SortHead k="created_at">Solicitada</SortHead>}
              {columns.decided && <SortHead k="decided_at">Última decisión</SortHead>}
              {columns.source && <TableHead>Origen</TableHead>}
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && items.length === 0 && (
              <TableRow><TableCell colSpan={colCount}><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
            )}
            {!loading && items.length === 0 && (
              <TableRow><TableCell colSpan={colCount} className="py-8 text-center text-slate-500">Sin solicitudes{hasFilters ? ' con estos filtros' : ''}</TableCell></TableRow>
            )}
            {items.map((r) => (
              <TableRow key={r.id} data-state={selected.has(r.id) || allMatching ? 'selected' : undefined} className={loading ? 'opacity-60' : undefined}>
                <TableCell>
                  <Checkbox aria-label={`Seleccionar ${r.name || r.rut}`} checked={allMatching || selected.has(r.id)}
                    disabled={allMatching} onCheckedChange={(v) => toggleOne(r.id, v === true)} />
                </TableCell>
                <TableCell><button className="text-left font-medium underline-offset-2 hover:underline" onClick={() => setDetailId(r.id)}>{r.name || '—'}</button></TableCell>
                <TableCell className="whitespace-nowrap">{formatRUT(r.rut)}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell><Badge variant="outline" className={STATUS_CLASS[r.status]}>{STATUS_LABEL[r.status]}</Badge></TableCell>
                {columns.created && (
                  <TableCell className="whitespace-nowrap text-sm text-slate-600">
                    {fmtDate(r.created_at)}
                    {r.status === 'pending' && <span className="block text-xs text-amber-700">{waiting(r.created_at)}</span>}
                  </TableCell>
                )}
                {columns.decided && (
                  <TableCell className="text-sm text-slate-600">
                    {r.decided_at ? <>{fmtDate(r.decided_at)}<span className="block text-xs text-slate-500">{r.decided_by_email}</span></> : '—'}
                  </TableCell>
                )}
                {columns.source && <TableCell className="text-sm">{SOURCE_LABEL[r.source] || r.source}</TableCell>}
                <TableCell className="space-x-1 whitespace-nowrap text-right">{rowActions(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2 md:hidden">
        {items.length > 0 && (
          <label className="flex items-center gap-2 px-1 text-sm">
            <Checkbox aria-label="Seleccionar página" checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
              onCheckedChange={(v) => togglePage(v === true)} />
            Seleccionar página
          </label>
        )}
        {loading && items.length === 0 && <Loader2 className="mx-auto animate-spin" />}
        {!loading && items.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Sin solicitudes{hasFilters ? ' con estos filtros' : ''}</p>}
        {items.map((r) => (
          <div key={r.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-start gap-2">
              <Checkbox className="mt-1" aria-label={`Seleccionar ${r.name || r.rut}`} checked={allMatching || selected.has(r.id)}
                disabled={allMatching} onCheckedChange={(v) => toggleOne(r.id, v === true)} />
              <button className="min-w-0 flex-1 text-left" onClick={() => setDetailId(r.id)}>
                <span className="block truncate font-medium">{r.name || formatRUT(r.rut)}</span>
                <span className="block text-sm text-slate-600">{formatRUT(r.rut)}</span>
                <span className="block truncate text-sm text-slate-600">{r.email}</span>
              </button>
              <Badge variant="outline" className={STATUS_CLASS[r.status]}>{STATUS_LABEL[r.status]}</Badge>
            </div>
            <p className="text-xs text-slate-500">
              {fmtDate(r.created_at)}{r.status === 'pending' ? ` · ${waiting(r.created_at)}` : ''}
            </p>
            <div className="flex flex-wrap gap-1">{rowActions(r)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span>{total === 0 ? 'Sin resultados' : `Mostrando ${from}–${to} de ${total}`}</span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">
            Filas
            <select className="h-8 rounded-md border px-1" value={filters.limit} onChange={(e) => update({ limit: Number(e.target.value) })}>
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <Button size="icon" variant="outline" className="h-8 w-8" aria-label="Página anterior" disabled={filters.page <= 1 || loading}
            onClick={() => update({ page: filters.page - 1 }, false)}><ChevronLeft className="h-4 w-4" /></Button>
          <span>Página {filters.page} de {totalPages}</span>
          <Button size="icon" variant="outline" className="h-8 w-8" aria-label="Página siguiente" disabled={filters.page >= totalPages || loading}
            onClick={() => update({ page: filters.page + 1 }, false)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>{detail.name || formatRUT(detail.rut)}</SheetTitle>
                <SheetDescription asChild>
                  <div><Badge variant="outline" className={STATUS_CLASS[detail.status]}>{STATUS_LABEL[detail.status]}</Badge></div>
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-4 text-sm">
                <dl className="space-y-2">
                  {(detail.answers || []).map((a) => (
                    <div key={a.key}><dt className="font-semibold text-slate-700">{a.label}</dt><dd className="text-slate-600">{a.value || '—'}</dd></div>
                  ))}
                </dl>
                <div>
                  <h3 className="mb-1 font-semibold text-slate-700">Historial</h3>
                  <ul className="space-y-1 text-slate-600">
                    <li>{fmtDate(detail.created_at)} · {detail.source === 'admin' ? 'Pre-registrada por el centro' : 'Solicitud recibida'}</li>
                    {detail.decided_at && (
                      <li>{fmtDate(detail.decided_at)} · {STATUS_LABEL[detail.status]}{detail.decided_by_email ? ` por ${detail.decided_by_email}` : ''}</li>
                    )}
                    {detail.verified_at && <li>{fmtDate(detail.verified_at)} · Primera verificación del RUT</li>}
                    {detail.last_verified_at && <li>{fmtDate(detail.last_verified_at)} · Última verificación</li>}
                  </ul>
                  {detail.reason && <p className="mt-2 rounded bg-slate-50 p-2 text-slate-700"><strong>Motivo:</strong> {detail.reason}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {rowActions(detail)}
                  {detail.status === 'approved' && (
                    <Button size="sm" variant="outline" onClick={() => resend(detail.id)}><Mail className="mr-1 h-4 w-4" />Reenviar correo</Button>
                  )}
                </div>
                <div className="flex justify-between border-t pt-3">
                  <Button size="sm" variant="ghost" disabled={detailIndex <= 0} onClick={() => setDetailId(items[detailIndex - 1].id)}>
                    <ChevronLeft className="mr-1 h-4 w-4" />Anterior
                  </Button>
                  <Button size="sm" variant="ghost" disabled={detailIndex >= items.length - 1} onClick={() => setDetailId(items[detailIndex + 1].id)}>
                    Siguiente<ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!decision} onOpenChange={(o) => !o && !busy && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision?.status === 'revoked' ? 'Revocar acceso' : 'Rechazar solicitud'}
              {decision && decision.count > 1 ? ` (${decision.count})` : ''}
            </DialogTitle>
            <DialogDescription>
              El motivo es obligatorio{decision?.status === 'rejected' ? ' y se enviará a los solicitantes' : ''}
              {decision && decision.count > 1 ? '. Se usará el mismo motivo para todas.' : '.'}
            </DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} aria-label="Motivo" />
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setDecision(null)}>Cancelar</Button>
            <Button disabled={busy || reason.trim().length < 5} onClick={() => decision && runDecision(decision, reason.trim())}>
              {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!bulkResult} onOpenChange={(o) => !o && setBulkResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resultado de la acción múltiple</DialogTitle>
            <DialogDescription>
              {bulkResult?.updated} actualizada{bulkResult?.updated === 1 ? '' : 's'}
              {bulkResult?.skipped ? `, ${bulkResult.skipped} omitidas` : ''}
              {bulkResult?.truncated ? '. Se procesaron las primeras 1000; repite la acción para el resto.' : ''}
            </DialogDescription>
          </DialogHeader>
          {!!bulkResult?.failed.length && (
            <ul className="max-h-60 space-y-1 overflow-y-auto text-sm">
              {bulkResult.failed.map((f) => <li key={f.id} className="rounded bg-red-50 p-2 text-red-800">{f.rut ? `${formatRUT(f.rut)}: ` : ''}{f.error}</li>)}
            </ul>
          )}
          <DialogFooter><Button onClick={() => setBulkResult(null)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ManualDialog open={manual} onOpenChange={setManual} onDone={load} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onDone={load} />
    </div>
  );
};

const ManualDialog: React.FC<{ open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }> = ({ open, onOpenChange, onDone }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createManualAccess(getAccessTokenSilently, { rut, email, name });
      toast.success('Persona registrada y aprobada');
      onOpenChange(false);
      setRut(''); setEmail(''); setName('');
      onDone();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Pre-registrar persona aprobada</DialogTitle><DialogDescription>Se aprueba de inmediato y recibirá un correo.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label htmlFor="m-rut">RUT</Label><Input id="m-rut" value={rut} onChange={(e) => setRut(formatRUT(e.target.value))} required /></div>
          <div><Label htmlFor="m-email">Correo</Label><Input id="m-email" name="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><Label htmlFor="m-name">Nombre</Label><Input id="m-name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <DialogFooter><Button type="submit" disabled={busy}>Guardar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ImportDialog: React.FC<{ open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void }> = ({ open, onOpenChange, onDone }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<AccessImportResult | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => { setFile(null); setPreview(null); };

  const pick = async (f: File | null) => {
    setFile(f);
    setPreview(null);
    if (!f) return;
    setBusy(true);
    try {
      setPreview(await importAccessFile(getAccessTokenSilently, f, true));
    } catch (e: any) {
      toast.error(e.message);
      setFile(null);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await importAccessFile(getAccessTokenSilently, file, false);
      toast.success(`${res.imported} persona${res.imported === 1 ? '' : 's'} aprobada${res.imported === 1 ? '' : 's'}`);
      if (res.errors.length) toast.warning(`${res.errors.length} fila${res.errors.length === 1 ? '' : 's'} con error`);
      onOpenChange(false);
      reset();
      onDone();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const template = async () => {
    try {
      saveBlob(await downloadAccessTemplate(getAccessTokenSilently), 'plantilla_acceso.xlsx');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar personas aprobadas</DialogTitle>
          <DialogDescription>
            Sube un Excel o CSV con las columnas RUT, Correo y Nombre. Todas las filas válidas se aprueban y reciben un correo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Button type="button" variant="outline" size="sm" onClick={template}><Download className="mr-1 h-4 w-4" />Descargar plantilla</Button>
          <Input type="file" accept=".xlsx,.csv" aria-label="Archivo" disabled={busy} onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          {busy && <Loader2 className="animate-spin" />}
          {preview && (
            <div className="space-y-2 text-sm">
              <p>{preview.total} filas leídas: <strong>{preview.valid} válidas</strong>, {preview.errors.length} con error.</p>
              {preview.errors.length > 0 && (
                <ul className="max-h-48 space-y-1 overflow-y-auto">
                  {preview.errors.map((er, i) => <li key={i} className="rounded bg-red-50 p-2 text-red-800">Fila {er.line}{er.rut ? ` (${er.rut})` : ''}: {er.error}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button disabled={busy || !preview || preview.valid === 0} onClick={confirm}>
            Importar{preview ? ` ${preview.valid}` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
