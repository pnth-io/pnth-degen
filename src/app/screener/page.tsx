'use client';

import { useCallback } from 'react';
import { ScreenerTable, ScreenerHeader } from '@/features/screener/components';
import { useScreenerData } from '@/features/screener/hooks/useScreenerData';
import type { SortField } from '@/features/screener/types';

export default function ScreenerPage() {
  const {
    tokens,
    loading,
    error,
    lastUpdated,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    filters,
    setFilters,
    refresh,
  } = useScreenerData();

  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField, sortDirection, setSortField, setSortDirection]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">Error loading screener</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-[#00DC82]/20 text-[#00DC82] rounded hover:bg-[#00DC82]/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-transparent">
      <ScreenerHeader
        lastUpdated={lastUpdated}
        tokenCount={tokens.length}
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={refresh}
        loading={loading}
      />
      <div className="flex-1 overflow-hidden">
        <ScreenerTable
          tokens={tokens}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          loading={loading}
        />
      </div>
    </div>
  );
}
