"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LegacySpaceSchedulePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) router.replace(`/admin/spaces/${params.id}`);
  }, [params?.id, router]);

  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-12 text-sm font-semibold text-slate-500">
      <Loader2 size={18} className="animate-spin" /> Abriendo el espacio...
    </div>
  );
}
