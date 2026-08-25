"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FacilitiesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/spaces');
  }, [router]);
  return null;
}