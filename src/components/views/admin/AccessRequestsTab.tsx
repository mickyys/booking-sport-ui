"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import {
  ArrowDown, ArrowUp, ArrowUpDown, Ban, Calendar, Check, ChevronLeft, ChevronRight, Columns3, Download, Loader2,
  Mail, MoreHorizontal, Plus, Search, Upload, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AccessImportResult, AccessListParams, AccessRequest, AccessSortKey, AccessStatus, bulkSetAccessStatus,
  createManualAccess, downloadAccessTemplate, exportAccessRequests, getAccessStats, importAccessFile,
  getAccessForm, listAccessRequests, resendAccessApproval, setAccessStatus, AccessBulkResult,
} from '@/api/accessApi';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRUT } from '@/utils/rut';
import { AccessEmptyState, AccessStatsCards, PersonAvatar, StatusBadge } from './AccessParts';

const STATUS_LABEL: Record<AccessStatus, string> = {
  pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada', revoked: 'Revocada',
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

const EXTRA_COLS_KEY = 'access_extra_columns';
const DEFAULT_EXTRA_VISIBLE = 2;
const answerOf = (r: AccessRequest, key: string) => r.answers?.find((a) => a.key === key)?.value || '';

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
  const [formFields, setFormFields] = useState<Array<{ key: string; label: string }>>([]);
  const [extraVisible, setExtraVisible] = useState<Record<string, boolean>>({});
  const requestSeq = useRef(0);

  useEffect(() => {
    try { setExtraVisible(JSON.parse(localStorage.getItem(EXTRA_COLS_KEY) || '{}')); } catch { /* sin preferencia guardada */ }
    getAccessForm(getAccessTokenSilently)
      .then((r) => setFormFields(r.form.fields.filter((f) => !f.locked).map((f) => ({ key: f.key, label: f.label }))))
      .catch(() => { /* las columnas se derivan de las filas */ });
  }, [getAccessTokenSilently]);

  // Campos definidos en el formulario, más los que solo existen en respuestas antiguas.
  const extraCols = useMemo(() => {
    const cols = [...formFields];
    items.forEach((r) => (r.answers || []).forEach((a) => {
      if (!cols.some((c) => c.key === a.key)) cols.push({ key: a.key, label: a.label });
    }));
    return cols.filter((c) => c.key);
  }, [formFields, items]);
  const visibleExtra = extraCols.filter((c, i) => extraVisible[c.key] ?? i < DEFAULT_EXTRA_VISIBLE);
  const toggleExtra = (key: string, v: boolean) => setExtraVisible((prev) => {
    const next = { ...prev, [key]: v };
    try { localStorage.setItem(EXTRA_COLS_KEY, JSON.stringify(next)); } catch { /* ignorar */ }
    return next;
  });

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
      <button type="button" className="inline-flex cursor-pointer items-center gap-1 rounded font-medium hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" onClick={() => toggleSort(k)}>
        {children}
        {filters.sort === k
          ? (filters.dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />)
          : <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />}
      </button>
    </TableHead>
  );

  const startDecision = (d: Decision) => {
    if (d.status === 'approved' && d.count === 1) {
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

  const decide = (r: AccessRequest, status: AccessStatus) =>
    startDecision({ status, ids: [r.id], allMatching: false, count: 1 });

  // labels=true: botones con texto y alto táctil (móvil y panel); false: solo ícono (tabla).
  const rowActions = (r: AccessRequest, labels = false) => {
    const size = labels ? 'h-11 flex-1 px-4' : 'h-8 w-8 p-0';
    const text = (t: string) => (labels ? t : <span className="sr-only">{t}</span>);
    return (
      <>
        {canApprove(r.status) && (
          <Button size="sm" title="Aprobar" className={`${size} bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500`} onClick={() => decide(r, 'approved')}>
            <Check className="h-4 w-4" aria-hidden="true" />{text('Aprobar')}
          </Button>
        )}
        {canReject(r.status) && (
          <Button size="sm" variant="outline" title="Rechazar" className={`${size} border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800`} onClick={() => decide(r, 'rejected')}>
            <X className="h-4 w-4" aria-hidden="true" />{text('Rechazar')}
          </Button>
        )}
        {canRevoke(r.status) && (
          <Button size="sm" variant="outline" title="Revocar" className={`${size} border-slate-300 text-slate-700 hover:bg-slate-100`} onClick={() => decide(r, 'revoked')}>
            <Ban className="h-4 w-4" aria-hidden="true" />{text('Revocar')}
          </Button>
        )}
      </>
    );
  };

  const from = total === 0 ? 0 : (filters.page - 1) * filters.limit + 1;
  const to = Math.min(filters.page * filters.limit, total);
  const colCount = 6 + visibleExtra.length + Number(columns.created) + Number(columns.decided) + Number(columns.source);
  const dateCount = Number(!!filters.from) + Number(!!filters.to);
  const firstLoad = loading && items.length === 0;

  const emptyState = (
    <AccessEmptyState
      title={hasFilters ? 'Sin resultados' : 'No hay solicitudes'}
      description={hasFilters
        ? 'Ninguna solicitud coincide con los filtros actuales.'
        : filters.status === 'pending'
          ? 'Estás al día: no hay solicitudes pendientes de revisión.'
          : 'Cuando alguien pida acceso a tu centro, aparecerá aquí.'}
      action={hasFilters
        ? <Button variant="outline" className="h-10" onClick={clearFilters}><X className="mr-2 h-4 w-4" />Limpiar filtros</Button>
        : <Button className="h-10 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setManual(true)}><Plus className="mr-2 h-4 w-4" />Pre-registrar persona</Button>}
    />
  );

  const bulkLabel = (d: Decision | null) => (d?.status === 'approved' ? 'Aprobar' : d?.status === 'revoked' ? 'Revocar acceso' : 'Rechazar solicitud');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10"><MoreHorizontal className="mr-2 h-4 w-4" />Más acciones</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem className="h-10 cursor-pointer" onSelect={() => setImportOpen(true)}><Upload className="mr-2 h-4 w-4" />Importar Excel / CSV</DropdownMenuItem>
            <DropdownMenuItem className="h-10 cursor-pointer" disabled={exporting || total === 0} onSelect={handleExport}>
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Exportar resultados
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button className="h-10 bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500" onClick={() => setManual(true)}>
          <Plus className="mr-2 h-4 w-4" />Pre-registrar
        </Button>
      </div>

      <AccessStatsCards counts={counts} active={filters.status} loaded={Object.keys(counts).length > 0}
        onSelect={(s) => update({ status: s })} />

      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input aria-label="Buscar por RUT, nombre o correo" placeholder="Buscar por nombre, RUT o correo"
            value={qInput} onChange={(e) => setQInput(e.target.value)} className="h-10 pl-9" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filters.status === '' ? 'all' : filters.status} onValueChange={(v) => update({ status: v === 'all' ? '' : v })}>
            <SelectTrigger className="h-10 w-full sm:w-44" aria-label="Estado"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((f) => (
                <SelectItem key={f.value || 'all'} value={f.value === '' ? 'all' : f.value}>
                  {f.label}{f.value && counts[f.value] != null ? ` (${counts[f.value]})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10" aria-label="Filtrar por rango de fechas">
                <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />Fechas
                {dateCount > 0 && <span className="ml-2 rounded-full bg-emerald-600 px-1.5 text-xs font-semibold text-white">{dateCount}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3">
              <div>
                <Label htmlFor="acc-from" className="text-xs text-slate-600">Desde</Label>
                <Input id="acc-from" type="date" className="h-10" value={filters.from} max={filters.to || undefined} onChange={(e) => update({ from: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="acc-to" className="text-xs text-slate-600">Hasta</Label>
                <Input id="acc-to" type="date" className="h-10" value={filters.to} min={filters.from || undefined} onChange={(e) => update({ to: e.target.value })} />
              </div>
              {dateCount > 0 && <Button variant="ghost" size="sm" onClick={() => update({ from: '', to: '' })}>Quitar fechas</Button>}
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="hidden h-10 w-10 md:inline-flex" aria-label="Columnas visibles"><Columns3 className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {([['created', 'Fecha de solicitud'], ['decided', 'Última decisión'], ['source', 'Origen']] as Array<[OptionalColumn, string]>).map(([key, label]) => (
                <DropdownMenuCheckboxItem key={key} checked={columns[key]} onCheckedChange={(v) => setColumns((c) => ({ ...c, [key]: !!v }))}>
                  {label}
                </DropdownMenuCheckboxItem>
              ))}
              {extraCols.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Campos del formulario</DropdownMenuLabel>
                  {extraCols.map((c, i) => (
                    <DropdownMenuCheckboxItem key={c.key} checked={extraVisible[c.key] ?? i < DEFAULT_EXTRA_VISIBLE}
                      onSelect={(e) => e.preventDefault()} onCheckedChange={(v) => toggleExtra(c.key, !!v)}>
                      {c.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {hasFilters && <Button variant="ghost" className="h-10" onClick={clearFilters}><X className="mr-1 h-4 w-4" />Limpiar</Button>}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="sticky bottom-4 z-20 space-y-1 rounded-2xl border border-emerald-200 bg-white p-3 shadow-lg" role="region" aria-label="Acciones masivas">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-1 text-sm font-semibold text-slate-900">{selectedCount} seleccionada{selectedCount === 1 ? '' : 's'}</span>
            <Button size="sm" className="h-9 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => startDecision({ status: 'approved', ids: [...selected], allMatching, count: selectedCount })}>
              <Check className="mr-1 h-4 w-4" />Aprobar
            </Button>
            <Button size="sm" variant="outline" className="h-9 border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => startDecision({ status: 'rejected', ids: [...selected], allMatching, count: selectedCount })}>
              <X className="mr-1 h-4 w-4" />Rechazar
            </Button>
            {(filters.status === 'approved' || filters.status === '') && (
              <Button size="sm" variant="outline" className="h-9" onClick={() => startDecision({ status: 'revoked', ids: [...selected], allMatching, count: selectedCount })}>
                <Ban className="mr-1 h-4 w-4" />Revocar
              </Button>
            )}
            <Button size="sm" variant="ghost" className="ml-auto h-9" onClick={clearSelection}>Limpiar selección</Button>
          </div>
          {!allMatching && allPageSelected && total > items.length && (
            <p className="px-1 text-sm text-slate-600">
              Seleccionaste las {items.length} de esta página.{' '}
              <button type="button" className="cursor-pointer font-medium text-emerald-700 underline" onClick={() => setAllMatching(true)}>
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

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block" aria-busy={loading}>
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox aria-label="Seleccionar página" checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
                  onCheckedChange={(v) => togglePage(v === true)} />
              </TableHead>
              <SortHead k="name">Persona</SortHead>
              <SortHead k="rut">RUT</SortHead>
              <SortHead k="email">Correo</SortHead>
              <SortHead k="status">Estado</SortHead>
              {visibleExtra.map((c) => <TableHead key={c.key} className="whitespace-nowrap">{c.label}</TableHead>)}
              {columns.created && <SortHead k="created_at">Solicitada</SortHead>}
              {columns.decided && <SortHead k="decided_at">Última decisión</SortHead>}
              {columns.source && <TableHead>Origen</TableHead>}
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {firstLoad && Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={`sk-${i}`}>
                {Array.from({ length: colCount }).map((__, c) => <TableCell key={c}><Skeleton className="h-5 w-full" /></TableCell>)}
              </TableRow>
            ))}
            {!loading && items.length === 0 && (
              <TableRow className="hover:bg-transparent"><TableCell colSpan={colCount}>{emptyState}</TableCell></TableRow>
            )}
            {items.map((r) => (
              <TableRow key={r.id} data-state={selected.has(r.id) || allMatching ? 'selected' : undefined}
                className={`transition-colors duration-150 hover:bg-slate-50 data-[state=selected]:bg-emerald-50/60 ${loading ? 'opacity-60' : ''}`}>
                <TableCell>
                  <Checkbox aria-label={`Seleccionar ${r.name || r.rut}`} checked={allMatching || selected.has(r.id)}
                    disabled={allMatching} onCheckedChange={(v) => toggleOne(r.id, v === true)} />
                </TableCell>
                <TableCell>
                  <button className="flex cursor-pointer items-center gap-3 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" onClick={() => setDetailId(r.id)}>
                    <PersonAvatar name={r.name} email={r.email} />
                    <span className="text-sm font-semibold text-slate-900 hover:underline">{r.name || '—'}</span>
                  </button>
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs text-slate-700">{formatRUT(r.rut)}</TableCell>
                <TableCell className="text-sm text-slate-600">{r.email}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                {visibleExtra.map((c) => (
                  <TableCell key={c.key} className="max-w-[14rem] truncate text-sm text-slate-600" title={answerOf(r, c.key) || undefined}>
                    {answerOf(r, c.key) || '—'}
                  </TableCell>
                ))}
                {columns.created && (
                  <TableCell className="whitespace-nowrap text-sm text-slate-600">
                    {fmtDate(r.created_at)}
                    {r.status === 'pending' && <span className="block text-xs font-medium text-amber-700">{waiting(r.created_at)}</span>}
                  </TableCell>
                )}
                {columns.decided && (
                  <TableCell className="text-sm text-slate-600">
                    {r.decided_at ? <>{fmtDate(r.decided_at)}<span className="block text-xs text-slate-500">{r.decided_by_email}</span></> : '—'}
                  </TableCell>
                )}
                {columns.source && <TableCell className="text-sm">{SOURCE_LABEL[r.source] || r.source}</TableCell>}
                <TableCell><div className="flex items-center justify-end gap-1">{rowActions(r)}</div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden" aria-busy={loading}>
        {items.length > 0 && (
          <label className="flex min-h-11 items-center gap-2 px-1 text-sm text-slate-700">
            <Checkbox aria-label="Seleccionar página" checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
              onCheckedChange={(v) => togglePage(v === true)} />
            Seleccionar página
          </label>
        )}
        {firstLoad && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
        {!loading && items.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white">{emptyState}</div>}
        {items.map((r) => (
          <div key={r.id} className={`space-y-3 rounded-2xl border bg-white p-4 shadow-sm ${selected.has(r.id) || allMatching ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'}`}>
            <div className="flex items-start gap-3">
              <Checkbox className="mt-2.5" aria-label={`Seleccionar ${r.name || r.rut}`} checked={allMatching || selected.has(r.id)}
                disabled={allMatching} onCheckedChange={(v) => toggleOne(r.id, v === true)} />
              <PersonAvatar name={r.name} email={r.email} className="mt-0.5" />
              <button className="min-w-0 flex-1 cursor-pointer text-left" onClick={() => setDetailId(r.id)}>
                <span className="block truncate font-semibold text-slate-900">{r.name || formatRUT(r.rut)}</span>
                <span className="block font-mono text-xs text-slate-600">{formatRUT(r.rut)}</span>
                <span className="block truncate text-sm text-slate-600">{r.email}</span>
                {visibleExtra.slice(0, 2).filter((c) => answerOf(r, c.key)).map((c) => (
                  <span key={c.key} className="block truncate text-xs text-slate-500">{c.label}: {answerOf(r, c.key)}</span>
                ))}
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <StatusBadge status={r.status} />
              <p className="text-xs text-slate-500">
                {fmtDate(r.created_at)}{r.status === 'pending' ? ` · ${waiting(r.created_at)}` : ''}
              </p>
            </div>
            <div className="flex gap-2">{rowActions(r, true)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span aria-live="polite">{total === 0 ? 'Sin resultados' : `Mostrando ${from}–${to} de ${total}`}</span>
        <div className="flex items-center gap-2">
          <span>Filas</span>
          <Select value={String(filters.limit)} onValueChange={(v) => update({ limit: Number(v) })}>
            <SelectTrigger className="h-9 w-20" aria-label="Filas por página"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="icon" variant="outline" className="h-9 w-9" aria-label="Página anterior" disabled={filters.page <= 1 || loading}
            onClick={() => update({ page: filters.page - 1 }, false)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="tabular-nums">Página {filters.page} de {totalPages}</span>
          <Button size="icon" variant="outline" className="h-9 w-9" aria-label="Página siguiente" disabled={filters.page >= totalPages || loading}
            onClick={() => update({ page: filters.page + 1 }, false)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          {detail && (
            <>
              <SheetHeader className="border-b border-slate-200 bg-slate-50/70">
                <div className="flex items-center gap-3 pr-8">
                  <PersonAvatar name={detail.name} email={detail.email} className="h-12 w-12 text-sm" />
                  <div className="min-w-0">
                    <SheetTitle className="truncate">{detail.name || formatRUT(detail.rut)}</SheetTitle>
                    <SheetDescription asChild>
                      <div className="mt-1"><StatusBadge status={detail.status} /></div>
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="flex-1 space-y-6 overflow-y-auto p-4 text-sm">
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Datos</h3>
                  <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    <div className="flex justify-between gap-4 p-3"><dt className="text-slate-500">RUT</dt><dd className="font-mono text-slate-900">{formatRUT(detail.rut)}</dd></div>
                    <div className="flex justify-between gap-4 p-3"><dt className="text-slate-500">Correo</dt><dd className="break-all text-right text-slate-900">{detail.email}</dd></div>
                    {(detail.answers || []).map((a) => (
                      <div key={a.key} className="flex justify-between gap-4 p-3"><dt className="text-slate-500">{a.label}</dt><dd className="text-right text-slate-900">{a.value || '—'}</dd></div>
                    ))}
                  </dl>
                </section>
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Historial</h3>
                  <ol className="space-y-3 border-l-2 border-emerald-200 pl-4 text-slate-600">
                    {[
                      { at: detail.created_at, text: detail.source === 'admin' ? 'Pre-registrada por el centro' : 'Solicitud recibida' },
                      detail.decided_at && { at: detail.decided_at, text: `${STATUS_LABEL[detail.status]}${detail.decided_by_email ? ` por ${detail.decided_by_email}` : ''}` },
                      detail.verified_at && { at: detail.verified_at, text: 'Primera verificación del RUT' },
                      detail.last_verified_at && { at: detail.last_verified_at, text: 'Última verificación' },
                    ].filter((e): e is { at: string; text: string } => !!e).map((e, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" aria-hidden="true" />
                        <p className="text-slate-800">{e.text}</p>
                        <p className="text-xs text-slate-500">{fmtDate(e.at)}</p>
                      </li>
                    ))}
                  </ol>
                  {detail.reason && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-slate-700"><strong>Motivo:</strong> {detail.reason}</p>}
                </section>
              </div>
              <div className="space-y-3 border-t border-slate-200 bg-white p-4">
                <div className="flex flex-wrap gap-2">
                  {rowActions(detail, true)}
                  {detail.status === 'approved' && (
                    <Button variant="outline" className="h-11 flex-1" onClick={() => resend(detail.id)}><Mail className="mr-1 h-4 w-4" />Reenviar correo</Button>
                  )}
                </div>
                <div className="flex justify-between">
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
              {bulkLabel(decision)}
              {decision && decision.count > 1 ? ` (${decision.count})` : ''}
            </DialogTitle>
            <DialogDescription>
              {decision?.status === 'approved'
                ? `Se enviará un correo de aprobación a ${decision.count} persona${decision.count === 1 ? '' : 's'}.`
                : <>El motivo es obligatorio{decision?.status === 'rejected' ? ' y se enviará a los solicitantes' : ''}
                  {decision && decision.count > 1 ? '. Se usará el mismo motivo para todas.' : '.'}</>}
            </DialogDescription>
          </DialogHeader>
          {decision?.status !== 'approved' && (
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} aria-label="Motivo" placeholder="Escribe el motivo (mínimo 5 caracteres)" />
          )}
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setDecision(null)}>Cancelar</Button>
            <Button disabled={busy || (decision?.status !== 'approved' && reason.trim().length < 5)} onClick={() => decision && runDecision(decision, reason.trim())}>
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
