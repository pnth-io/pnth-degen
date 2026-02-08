'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ScreenerToken, SortField, SortDirection, ScreenerFilters } from '../types';

const FETCH_INTERVAL = 30000; // 30 seconds full refresh
const MAX_TOKENS = 100;
const API_URL = 'https://api.mobula.io/api/1/market/blockchain/pairs';

interface UseScreenerDataReturn {
  tokens: ScreenerToken[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  sortField: SortField;
  sortDirection: SortDirection;
  setSortField: (field: SortField) => void;
  setSortDirection: (dir: SortDirection) => void;
  filters: ScreenerFilters;
  setFilters: (filters: ScreenerFilters) => void;
  refresh: () => Promise<void>;
}

function mapMobulaToken(item: any): ScreenerToken {
  return {
    address: item.address || item.tokenAddress || '',
    pairAddress: item.pairAddress || item.address || '',
    symbol: item.symbol || 'UNKNOWN',
    name: item.name || item.symbol || 'Unknown',
    logo: item.logo || item.image,
    price: item.price || 0,
    priceChange5m: item.price_change_5min || item.priceChange5m || 0,
    priceChange1h: item.price_change_1h || item.priceChange1h || 0,
    priceChange6h: item.price_change_6h || item.priceChange6h || 0,
    priceChange24h: item.price_change_24h || item.priceChange24h || 0,
    volume24h: item.volume_24h || item.volume24h || 0,
    liquidity: item.liquidity || 0,
    marketCap: item.marketCap || item.market_cap || 0,
    trades24h: item.trades_24h || item.trades24h || 0,
    buys24h: item.buys_24h || item.buys24h || 0,
    sells24h: item.sells_24h || item.sells24h || 0,
    buyers24h: item.buyers_24h || item.buyers24h || 0,
    sellers24h: item.sellers_24h || item.sellers24h || 0,
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    exchange: item.exchange?.name || item.dex,
    security: item.security,
  };
}

export function useScreenerData(): UseScreenerDataReturn {
  const [tokens, setTokens] = useState<ScreenerToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortField, setSortField] = useState<SortField>('volume24h');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState<ScreenerFilters>({});

  // Refs for cleanup
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tokenCacheRef = useRef<Map<string, ScreenerToken>>(new Map());
  const mountedRef = useRef(true);

  const fetchTokens = useCallback(async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_MOBULA_API_KEY;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = apiKey;
      }

      const url = `${API_URL}?blockchain=solana&sortBy=volume&limit=${MAX_TOKENS}`;
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const json = await response.json();
      if (!mountedRef.current) return;

      const data = json?.data || json || [];
      const mapped = (Array.isArray(data) ? data : []).map(mapMobulaToken);
      
      // Update cache
      tokenCacheRef.current.clear();
      mapped.forEach(token => {
        tokenCacheRef.current.set(token.address, token);
      });

      setTokens(mapped);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('Screener fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Sort and filter tokens
  const sortedTokens = useCallback(() => {
    let filtered = [...tokens];

    // Apply filters
    if (filters.minLiquidity) {
      filtered = filtered.filter(t => t.liquidity >= (filters.minLiquidity || 0));
    }
    if (filters.minVolume) {
      filtered = filtered.filter(t => t.volume24h >= (filters.minVolume || 0));
    }
    if (filters.maxAge) {
      const cutoff = Date.now() - (filters.maxAge * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.createdAt).getTime() >= cutoff);
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      
      if (sortField === 'createdAt') {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return sortDirection === 'desc' ? bTime - aTime : aTime - bTime;
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
      }
      return 0;
    });

    return filtered;
  }, [tokens, sortField, sortDirection, filters]);

  // Initial fetch and interval setup
  useEffect(() => {
    mountedRef.current = true;
    
    // Initial fetch
    fetchTokens();

    // Set up polling interval
    fetchIntervalRef.current = setInterval(() => {
      fetchTokens();
    }, FETCH_INTERVAL);

    // Cleanup
    return () => {
      mountedRef.current = false;
      
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
        fetchIntervalRef.current = null;
      }
      
      tokenCacheRef.current.clear();
    };
  }, [fetchTokens]);

  return {
    tokens: sortedTokens(),
    loading,
    error,
    lastUpdated,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    filters,
    setFilters,
    refresh: fetchTokens,
  };
}
