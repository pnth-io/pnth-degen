'use client';

import { useEffect } from 'react';
import { useSolPriceStore } from '@/store/useSolPriceStore';

export function SolPriceProvider() {
  const startPolling = useSolPriceStore((s) => s.startPolling);
  const stopPolling = useSolPriceStore((s) => s.stopPolling);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return null;
}
