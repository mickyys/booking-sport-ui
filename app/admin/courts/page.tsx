"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CourtsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/spaces');
  }, [router]);
  return null;
}