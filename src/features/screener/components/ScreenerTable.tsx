'use client';

import { memo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ScreenerToken, SortField, SortDirection } from '../types';

interface ScreenerTableProps {
  tokens: ScreenerToken[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  loading?: boolean;
}

const formatNumber = (num: number, decimals = 2): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
  return num.toFixed(decimals);
};

const formatPrice = (price: number): string => {
  if (price < 0.00001) return price.toExponential(2);
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  return price.toFixed(2);
};

const formatAge = (createdAt: string): string => {
  const diff = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(diff / (1000 * 60));
  return `${mins}m`;
};

const PriceChange = memo(({ value }: { value: number }) => {
  const isPositive = value > 0;
  const isNegative = value < 0;
  return (
    <span className={`font-mono text-xs ${isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400'}`}>
      {isPositive ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
});
PriceChange.displayName = 'PriceChange';

const SortHeader = memo(({ 
  label, 
  field, 
  currentField, 
  direction, 
  onSort,
  className = ''
}: { 
  label: string;
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  className?: string;
}) => {
  const isActive = field === currentField;
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 hover:text-white transition-colors ${className} ${isActive ? 'text-[#00DC82]' : 'text-gray-400'}`}
    >
      <span className="text-xs font-medium">{label}</span>
      {isActive && (
        <span className="text-[10px]">{direction === 'desc' ? '↓' : '↑'}</span>
      )}
    </button>
  );
});
SortHeader.displayName = 'SortHeader';

const TokenRow = memo(({ token, index }: { token: ScreenerToken; index: number }) => {
  return (
    <Link 
      href={`/pair/solana/${token.pairAddress}`}
      className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
    >
      {/* Rank */}
      <span className="text-xs text-gray-500 w-6 shrink-0">#{index + 1}</span>
      
      {/* Token Info */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {token.logo ? (
          <Image
            src={token.logo}
            alt={token.symbol}
            width={24}
            height={24}
            className="rounded-full shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-700 shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{token.symbol}</p>
          <p className="text-[10px] text-gray-500 truncate">{token.name}</p>
        </div>
      </div>
      
      {/* Price - Hidden on mobile */}
      <div className="hidden sm:block w-20 text-right">
        <p className="text-xs text-white font-mono">${formatPrice(token.price)}</p>
      </div>
      
      {/* Price Changes */}
      <div className="flex gap-3 shrink-0">
        <div className="w-14 text-right hidden md:block">
          <PriceChange value={token.priceChange5m} />
        </div>
        <div className="w-14 text-right">
          <PriceChange value={token.priceChange1h} />
        </div>
        <div className="w-14 text-right hidden sm:block">
          <PriceChange value={token.priceChange24h} />
        </div>
      </div>
      
      {/* Volume */}
      <div className="w-16 text-right hidden sm:block">
        <p className="text-xs text-white font-mono">${formatNumber(token.volume24h, 1)}</p>
      </div>
      
      {/* Liquidity - Hidden on mobile */}
      <div className="w-16 text-right hidden md:block">
        <p className="text-xs text-white font-mono">${formatNumber(token.liquidity, 1)}</p>
      </div>
      
      {/* Txns */}
      <div className="w-12 text-right">
        <p className="text-xs text-gray-300 font-mono">{token.trades24h}</p>
        <p className="text-[10px] text-gray-500">
          <span className="text-green-400">{token.buys24h}</span>
          <span className="text-gray-600">/</span>
          <span className="text-red-400">{token.sells24h}</span>
        </p>
      </div>
      
      {/* Age */}
      <div className="w-10 text-right">
        <p className="text-xs text-gray-400">{formatAge(token.createdAt)}</p>
      </div>
    </Link>
  );
});
TokenRow.displayName = 'TokenRow';

const MobileTokenCard = memo(({ token, index }: { token: ScreenerToken; index: number }) => {
  return (
    <Link 
      href={`/pair/solana/${token.pairAddress}`}
      className="block p-3 hover:bg-white/5 transition-colors border-b border-white/5"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">#{index + 1}</span>
          {token.logo ? (
            <Image
              src={token.logo}
              alt={token.symbol}
              width={20}
              height={20}
              className="rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-700" />
          )}
          <span className="text-sm font-medium text-white">{token.symbol}</span>
        </div>
        <span className="text-xs text-gray-400">{formatAge(token.createdAt)}</span>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-white font-mono">${formatPrice(token.price)}</span>
        <div className="flex gap-3">
          <div className="text-center">
            <p className="text-[10px] text-gray-500">1h</p>
            <PriceChange value={token.priceChange1h} />
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500">24h</p>
            <PriceChange value={token.priceChange24h} />
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2">
        <span>Vol: ${formatNumber(token.volume24h, 1)}</span>
        <span>Liq: ${formatNumber(token.liquidity, 1)}</span>
        <span className="text-green-400">{token.buys24h}B</span>
        <span className="text-red-400">{token.sells24h}S</span>
      </div>
    </Link>
  );
});
MobileTokenCard.displayName = 'MobileTokenCard';

export const ScreenerTable = memo(function ScreenerTable({ 
  tokens, 
  sortField, 
  sortDirection, 
  onSort,
  loading 
}: ScreenerTableProps) {
  const handleSort = useCallback((field: SortField) => {
    onSort(field);
  }, [onSort]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400">Loading tokens...</div>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No tokens found
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Desktop Header */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-black/30 border-b border-white/10 shrink-0">
        <span className="w-6 shrink-0"></span>
        <div className="flex-1 min-w-0">
          <span className="text-xs text-gray-400">Token</span>
        </div>
        <div className="hidden sm:block w-20 text-right">
          <span className="text-xs text-gray-400">Price</span>
        </div>
        <div className="flex gap-3 shrink-0">
          <SortHeader label="5m" field="priceChange5m" currentField={sortField} direction={sortDirection} onSort={handleSort} className="w-14 justify-end hidden md:flex" />
          <SortHeader label="1h" field="priceChange1h" currentField={sortField} direction={sortDirection} onSort={handleSort} className="w-14 justify-end" />
          <SortHeader label="24h" field="priceChange24h" currentField={sortField} direction={sortDirection} onSort={handleSort} className="w-14 justify-end hidden sm:flex" />
        </div>
        <SortHeader label="Vol" field="volume24h" currentField={sortField} direction={sortDirection} onSort={handleSort} className="w-16 justify-end hidden sm:flex" />
        <SortHeader label="Liq" field="liquidity" currentField={sortField} direction={sortDirection} onSort={handleSort} className="w-16 justify-end hidden md:flex" />
        <SortHeader label="Txns" field="trades24h" currentField={sortField} direction={sortDirection} onSort={handleSort} className="w-12 justify-end" />
        <SortHeader label="Age" field="createdAt" currentField={sortField} direction={sortDirection} onSort={handleSort} className="w-10 justify-end" />
      </div>

      {/* Mobile Header */}
      <div className="sm:hidden flex items-center justify-between px-3 py-2 bg-black/30 border-b border-white/10 shrink-0">
        <span className="text-xs text-gray-400">Token</span>
        <div className="flex gap-4">
          <SortHeader label="1h" field="priceChange1h" currentField={sortField} direction={sortDirection} onSort={handleSort} />
          <SortHeader label="Vol" field="volume24h" currentField={sortField} direction={sortDirection} onSort={handleSort} />
        </div>
      </div>

      {/* Token List */}
      <div className="flex-1 overflow-y-auto">
        {/* Desktop View */}
        <div className="hidden sm:block">
          {tokens.map((token, index) => (
            <TokenRow key={token.address} token={token} index={index} />
          ))}
        </div>
        
        {/* Mobile View */}
        <div className="sm:hidden">
          {tokens.map((token, index) => (
            <MobileTokenCard key={token.address} token={token} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
});

export default ScreenerTable;
