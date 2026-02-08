'use client';

import { memo, useState, useCallback } from 'react';
import type { ScreenerFilters } from '../types';

interface ScreenerHeaderProps {
  lastUpdated: Date | null;
  tokenCount: number;
  filters: ScreenerFilters;
  onFiltersChange: (filters: ScreenerFilters) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export const ScreenerHeader = memo(function ScreenerHeader({
  lastUpdated,
  tokenCount,
  filters,
  onFiltersChange,
  onRefresh,
  loading
}: ScreenerHeaderProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = useCallback((key: keyof ScreenerFilters, value: number | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  return (
    <div className="px-3 py-2 border-b border-white/10 shrink-0">
      {/* Main Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white">Screener</h1>
          <span className="text-xs text-gray-500 hidden sm:inline">Solana</span>
          <span className="text-xs text-[#00DC82] bg-[#00DC82]/10 px-2 py-0.5 rounded">
            {tokenCount} tokens
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Last Updated */}
          {lastUpdated && (
            <span className="text-[10px] text-gray-500 hidden sm:inline">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded transition-colors ${showFilters ? 'bg-[#00DC82]/20 text-[#00DC82]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters Row */}
      {showFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* Min Liquidity */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Min Liq:</label>
            <select
              value={filters.minLiquidity || ''}
              onChange={(e) => handleFilterChange('minLiquidity', e.target.value ? Number(e.target.value) : undefined)}
              className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-[#00DC82] focus:outline-none"
            >
              <option value="">Any</option>
              <option value="1000">$1K+</option>
              <option value="5000">$5K+</option>
              <option value="10000">$10K+</option>
              <option value="50000">$50K+</option>
              <option value="100000">$100K+</option>
            </select>
          </div>

          {/* Min Volume */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Min Vol:</label>
            <select
              value={filters.minVolume || ''}
              onChange={(e) => handleFilterChange('minVolume', e.target.value ? Number(e.target.value) : undefined)}
              className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-[#00DC82] focus:outline-none"
            >
              <option value="">Any</option>
              <option value="1000">$1K+</option>
              <option value="10000">$10K+</option>
              <option value="50000">$50K+</option>
              <option value="100000">$100K+</option>
            </select>
          </div>

          {/* Max Age */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Age:</label>
            <select
              value={filters.maxAge || ''}
              onChange={(e) => handleFilterChange('maxAge', e.target.value ? Number(e.target.value) : undefined)}
              className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-[#00DC82] focus:outline-none"
            >
              <option value="">Any</option>
              <option value="1">≤ 1h</option>
              <option value="6">≤ 6h</option>
              <option value="24">≤ 24h</option>
              <option value="168">≤ 7d</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(filters.minLiquidity || filters.minVolume || filters.maxAge) && (
            <button
              onClick={() => onFiltersChange({})}
              className="text-xs text-[#00DC82] hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default ScreenerHeader;
