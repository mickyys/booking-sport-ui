"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { toast } from 'sonner';
import { apiError, AuditLog, sa } from '@/api/superadminApi';
import { Pager, PageHeader, formatDateTime } from '@/components/superadmin/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const LIMIT = 30;

export default function AuditPage() {
  const { getAccessTokenSilently } = useAuth0();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: AuditLog[]; total: number } | null>(null);

  const load = useCallback(async () => {
    try { setData(await sa.listAudit(getAccessTokenSilently, { page, limit: LIMIT })); }
    catch (e) { toast.error(apiError(e, 'No se pudo cargar la auditoría')); }
  }, [getAccessTokenSilently, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader title="Auditoría" subtitle="Registro de acciones realizadas por superadmins." />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Fecha</TableHead><TableHead>Actor</TableHead><TableHead>Acción</TableHead><TableHead>Entidad</TableHead><TableHead>Motivo</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {!data
              ? Array.from({ length: 6 }).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><div className="h-6 animate-pulse rounded bg-slate-100" /></TableCell></TableRow>)
              : data.items.length === 0
              ? <TableRow><TableCell colSpan={5} className="py-10 text-center text-slate-600">Sin registros.</TableCell></TableRow>
              : data.items.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap text-xs tabular-nums">{formatDateTime(a.created_at)}</TableCell>
                    <TableCell className="text-sm">{a.actor_email || a.actor_id}</TableCell>
                    <TableCell className="font-semibold">{a.action}</TableCell>
                    <TableCell className="font-mono text-xs">{a.entity_type}{a.entity_id ? `:${a.entity_id.slice(-8)}` : ''}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-slate-700" title={a.reason}>{a.reason || '—'}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        <Pager page={page} limit={LIMIT} total={data?.total ?? 0} onPage={setPage} />
      </div>
    </>
  );
}
