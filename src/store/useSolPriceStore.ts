'use client';

import { create } from 'zustand';
import { getMobulaClient } from '@/lib/mobulaClient';

const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
const POLL_INTERVAL_MS = 30_000; // 30 seconds
const MIGRATION_SOL = 420; // pump.fun migration threshold in SOL

interface SolPriceState {
  solPriceUSD: number;
  migrationMcapUSD: number;
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;

  // internal
  _intervalId: ReturnType<typeof setInterval> | null;

  // actions
  fetchPrice: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

export const useSolPriceStore = create<SolPriceState>()((set, get) => ({
  solPriceUSD: 0,
  migrationMcapUSD: 0,
  lastUpdated: 0,
  isLoading: false,
  error: null,
  _intervalId: null,

  fetchPrice: async () => {
    try {
      set({ isLoading: true, error: null });

      const client = getMobulaClient();
      const response = await client.fetchTokenDetails({
        address: SOL_ADDRESS,
        blockchain: 'solana',
      });

      const price = response?.data?.priceUSD;
      if (price && Number.isFinite(price) && price > 0) {
        set({
          solPriceUSD: price,
          migrationMcapUSD: MIGRATION_SOL * price,
          lastUpdated: Date.now(),
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.warn('[SolPrice] fetch failed:', e);
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : 'Failed to fetch SOL price',
      });
    }
  },

  startPolling: () => {
    const state = get();
    if (state._intervalId) return; // already polling

    // fetch immediately
    state.fetchPrice();

    const id = setInterval(() => {
      get().fetchPrice();
    }, POLL_INTERVAL_MS);

    set({ _intervalId: id });
  },

  stopPolling: () => {
    const state = get();
    if (state._intervalId) {
      clearInterval(state._intervalId);
      set({ _intervalId: null });
    }
  },
}));
