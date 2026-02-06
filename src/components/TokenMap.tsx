'use client';

import { useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import usePulseDataStore, { PulseToken } from '@/features/pulse/store/usePulseDataStore';
import { formatCryptoPrice, formatPercentage, formatPureNumber } from '@mobula_labs/sdk';
import SafeImage from '@/components/SafeImage';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  UserRound,
  Bot,
  Crown,
  ChefHat,
  Crosshair,
  Ghost,
  Boxes,
} from 'lucide-react';
import { TradeTimeCell } from '@/components/ui/tradetimecell';
import { getBuyPercent } from '@/components/shared/StatsCard';

interface TokenBubble {
  address: string;
  chainId: string;
  name: string;
  symbol: string;
  logo?: string;
  marketCap: number;
  volume: number;
  priceChange24h: number;
  createdAt: Date;
  ageMs: number;
  x: number;
  y: number;
  size: number;
  // Additional fields for hover card
  holdersCount: number;
  proTradersCount: number;
  deployerMigrations: number;
  buys24h: number;
  sells24h: number;
  fees24h: number;
  bondingPercentage: number;
  top10Holdings: number;
  devHoldingsPercentage: number;
  snipersHoldings: number;
  insidersHoldings: number;
  bundlersHoldings: number;
  createdAtStr: string;
}

// Extract token details from PulseToken
function extractTokenDetails(token: PulseToken): TokenBubble | null {
  const flatToken = token?.token?.address ? { ...token, ...token.token } : token;
  
  const address = flatToken?.address;
  const chainId = flatToken?.chainId || '';
  
  if (!address) return null;
  
  const name = (flatToken as any)?.name || 'Unknown';
  const symbol = (flatToken as any)?.symbol || '???';
  const logo = (flatToken as any)?.logo;
  const marketCap = Number((flatToken as any)?.marketCap) || 0;
  const volume = Number((flatToken as any)?.organic_volume_sell_24h) || 0;
  const priceChange24h = Number((flatToken as any)?.price_change_24h) || 0;
  
  const createdAtStr = (flatToken as any)?.created_at || (flatToken as any)?.createdAt || '';
  const createdAt = createdAtStr ? new Date(createdAtStr) : new Date();
  const ageMs = Date.now() - createdAt.getTime();
  
  return {
    address,
    chainId,
    name,
    symbol,
    logo,
    marketCap,
    volume,
    priceChange24h,
    createdAt,
    ageMs,
    x: 0,
    y: 0,
    size: 0,
    // Additional fields
    holdersCount: Number((flatToken as any)?.holdersCount || (flatToken as any)?.holders_count) || 0,
    proTradersCount: Number((flatToken as any)?.proTradersCount) || 0,
    deployerMigrations: Number((flatToken as any)?.deployerMigrations) || 0,
    buys24h: Number((flatToken as any)?.buys_24h) || 0,
    sells24h: Number((flatToken as any)?.sells_24h) || 0,
    fees24h: Number((flatToken as any)?.fees_paid_24h) || 0,
    bondingPercentage: Number((flatToken as any)?.bondingPercentage) || 0,
    top10Holdings: Number((flatToken as any)?.top10Holdings) || 0,
    devHoldingsPercentage: Number((flatToken as any)?.devHoldingsPercentage) || 0,
    snipersHoldings: Number((flatToken as any)?.snipersHoldings) || 0,
    insidersHoldings: Number((flatToken as any)?.insidersHoldings) || 0,
    bundlersHoldings: Number((flatToken as any)?.bundlersHoldings) || 0,
    createdAtStr,
  };
}

// Calculate X position based on age (log scale)
function calculateX(ageMs: number, minAge: number, maxAge: number): number {
  if (maxAge <= minAge) return 50;
  
  const logMin = Math.log10(Math.max(minAge, 1000));
  const logMax = Math.log10(Math.max(maxAge, 1000));
  const logAge = Math.log10(Math.max(ageMs, 1000));
  
  const normalized = (logAge - logMin) / (logMax - logMin);
  return 5 + normalized * 90;
}

// Calculate Y position based on market cap (log scale, inverted)
function calculateY(marketCap: number, minMcap: number, maxMcap: number): number {
  if (maxMcap <= minMcap || marketCap <= 0) return 50;
  
  const logMin = Math.log10(Math.max(minMcap, 1));
  const logMax = Math.log10(Math.max(maxMcap, 1));
  const logMcap = Math.log10(Math.max(marketCap, 1));
  
  const normalized = (logMcap - logMin) / (logMax - logMin);
  return 95 - normalized * 90;
}

// Calculate bubble size based on volume (log scale)
function calculateSize(volume: number, minVol: number, maxVol: number): number {
  const MIN_SIZE = 24;
  const MAX_SIZE = 72;
  
  if (maxVol <= minVol || volume <= 0) return MIN_SIZE;
  
  const logMin = Math.log10(Math.max(minVol, 1));
  const logMax = Math.log10(Math.max(maxVol, 1));
  const logVol = Math.log10(Math.max(volume, 1));
  
  const normalized = (logVol - logMin) / (logMax - logMin);
  return MIN_SIZE + normalized * (MAX_SIZE - MIN_SIZE);
}

// Format age for display
function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface TokenBubbleComponentProps {
  bubble: TokenBubble;
  onClick: () => void;
}

function TokenBubbleComponent({ bubble, onClick }: TokenBubbleComponentProps) {
  const isPositive = bubble.priceChange24h >= 0;
  const buyPercent = getBuyPercent(bubble.buys24h, bubble.sells24h);
  const hasMigrations = bubble.deployerMigrations > 0;
  
  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 ease-out group"
          style={{
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
            width: bubble.size,
            height: bubble.size,
            zIndex: 10,
          }}
          onClick={onClick}
        >
          {/* Bubble */}
          <div
            className={`
              w-full h-full rounded-full flex items-center justify-center
              border-2 transition-all duration-200
              ${isPositive 
                ? 'bg-success/20 border-success/50 group-hover:bg-success/30 group-hover:border-success' 
                : 'bg-error/20 border-error/50 group-hover:bg-error/30 group-hover:border-error'
              }
              group-hover:scale-110 group-hover:shadow-lg
            `}
            style={{
              boxShadow: `0 0 10px ${isPositive ? 'rgba(97, 202, 135, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            }}
          >
            {bubble.logo ? (
              <SafeImage
                src={bubble.logo}
                alt={bubble.symbol}
                width={Math.floor(bubble.size * 0.6)}
                height={Math.floor(bubble.size * 0.6)}
                className="rounded-full object-cover"
              />
            ) : (
              <span 
                className={`font-bold ${isPositive ? 'text-success' : 'text-error'}`}
                style={{ fontSize: Math.max(10, bubble.size * 0.25) }}
              >
                {bubble.symbol.slice(0, 3)}
              </span>
            )}
          </div>
        </div>
      </HoverCardTrigger>

      <HoverCardContent side="top" className="w-80 p-0 bg-bgPrimary border-borderDefault">
        {/* Header with Image and Name */}
        <div className="flex items-start gap-3 p-3 border-b border-borderDefault">
          {bubble.logo ? (
            <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-bgSecondary">
              <SafeImage
                src={bubble.logo}
                alt={bubble.symbol}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-12 h-12 rounded bg-bgSecondary flex items-center justify-center">
              <span className="text-lg font-bold text-textTertiary">
                {bubble.symbol.slice(0, 1).toUpperCase()}
              </span>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-textPrimary truncate">{bubble.name}</h3>
            <p className="text-xs text-textTertiary font-mono uppercase">{bubble.symbol}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-textTertiary">
              <TradeTimeCell
                timestamp={bubble.createdAtStr}
                showAbsolute={false}
                hash=""
              />
              <span className="text-accentPurple font-mono">
                {bubble.address.slice(0, 6)}...{bubble.address.slice(-4)}
              </span>
            </div>
          </div>

          {/* Price Change Badge */}
          <div className={`px-2 py-1 rounded text-xs font-semibold ${
            isPositive ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
          }`}>
            {isPositive ? '+' : ''}{formatPercentage(bubble.priceChange24h)}
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-2 gap-2 p-3 border-b border-borderDefault">
          <div className="flex justify-between items-center">
            <span className="text-xs text-textTertiary">MCap</span>
            <span className="text-xs text-textPrimary font-semibold">{formatCryptoPrice(bubble.marketCap)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-textTertiary">Volume</span>
            <span className="text-xs text-textPrimary font-semibold">{formatCryptoPrice(bubble.volume)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-textTertiary">Fees</span>
            <span className="text-xs text-success font-semibold">{formatCryptoPrice(bubble.fees24h)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-textTertiary">Bonding</span>
            <span className="text-xs text-textPrimary font-semibold">{formatPercentage(bubble.bondingPercentage)}</span>
          </div>
        </div>

        {/* Holders & Traders */}
        <div className="flex items-center gap-4 px-3 py-2 border-b border-borderDefault text-xs text-textTertiary">
          <span className="flex items-center gap-1">
            <UserRound size={12} />
            {formatPureNumber(bubble.holdersCount, { maxFractionDigits: 0, minFractionDigits: 0 })}
          </span>
          <span className="flex items-center gap-1">
            <Bot size={12} />
            {bubble.proTradersCount}
          </span>
          <span className={`flex items-center gap-1 ${hasMigrations ? 'text-success' : ''}`}>
            <Crown size={12} className={hasMigrations ? 'text-success' : ''} />
            {bubble.deployerMigrations}
          </span>
        </div>

        {/* Audit Stats */}
        <div className="flex flex-wrap gap-1 p-2 border-b border-borderDefault">
          <div className="bg-bgContainer px-1.5 py-0.5 text-[10px] flex items-center gap-1 border border-[#2A2D3880] rounded">
            <ChefHat size={10} className="text-success" />
            <span className="text-success font-medium">{bubble.devHoldingsPercentage.toFixed(0)}%</span>
          </div>
          <div className="bg-bgContainer px-1.5 py-0.5 text-[10px] flex items-center gap-1 border border-[#2A2D3880] rounded">
            <Crosshair size={10} className="text-success" />
            <span className="text-success font-medium">{bubble.snipersHoldings.toFixed(0)}%</span>
          </div>
          <div className="bg-bgContainer px-1.5 py-0.5 text-[10px] flex items-center gap-1 border border-[#2A2D3880] rounded">
            <Ghost size={10} className="text-success" />
            <span className="text-success font-medium">{bubble.insidersHoldings.toFixed(0)}%</span>
          </div>
          <div className="bg-bgContainer px-1.5 py-0.5 text-[10px] flex items-center gap-1 border border-[#2A2D3880] rounded">
            <Boxes size={10} className="text-success" />
            <span className="text-success font-medium">{bubble.bundlersHoldings.toFixed(0)}%</span>
          </div>
        </div>

        {/* Buy/Sell Bar */}
        <div className="p-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-success">Buys: {bubble.buys24h}</span>
            <span className="text-error">Sells: {bubble.sells24h}</span>
          </div>
          <div className="w-full h-1.5 bg-error/30 rounded-full overflow-hidden relative">
            <div
              className="absolute top-0 left-0 h-full bg-success rounded-full transition-all duration-300"
              style={{ width: `${buyPercent}%` }}
            />
          </div>
        </div>

        {/* Click to view */}
        <div className="px-3 pb-2 text-center">
          <span className="text-success text-xs">Click to view token details</span>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export default function TokenMap() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get all tokens from all views - these update in real-time via WebSocket
  const newTokens = usePulseDataStore((state) => state.sections.new.tokens);
  const bondingTokens = usePulseDataStore((state) => state.sections.bonding.tokens);
  const bondedTokens = usePulseDataStore((state) => state.sections.bonded.tokens);
  
  // Combine and process all tokens - recomputes when store updates
  const bubbles = useMemo(() => {
    const allTokens = [...newTokens, ...bondingTokens, ...bondedTokens];
    
    const extracted = allTokens
      .map(extractTokenDetails)
      .filter((t): t is TokenBubble => t !== null && t.marketCap > 0);
    
    // Deduplicate by address
    const uniqueMap = new Map<string, TokenBubble>();
    for (const token of extracted) {
      const existing = uniqueMap.get(token.address);
      if (!existing || token.marketCap > existing.marketCap) {
        uniqueMap.set(token.address, token);
      }
    }
    
    const unique = Array.from(uniqueMap.values());
    
    if (unique.length === 0) return [];
    
    // Calculate ranges for scaling
    const ages = unique.map(t => t.ageMs);
    const mcaps = unique.map(t => t.marketCap);
    const volumes = unique.map(t => t.volume);
    
    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    const minMcap = Math.min(...mcaps.filter(m => m > 0));
    const maxMcap = Math.max(...mcaps);
    const minVol = Math.min(...volumes.filter(v => v > 0));
    const maxVol = Math.max(...volumes);
    
    // Calculate positions and sizes
    return unique.map(token => ({
      ...token,
      x: calculateX(token.ageMs, minAge, maxAge),
      y: calculateY(token.marketCap, minMcap, maxMcap),
      size: calculateSize(token.volume, minVol, maxVol),
    }));
  }, [newTokens, bondingTokens, bondedTokens]);
  
  const handleTokenClick = useCallback((bubble: TokenBubble) => {
    router.push(`/token/${bubble.chainId}/${bubble.address}`);
  }, [router]);
  
  // Y-axis labels (Market Cap)
  const yLabels = ['$1B+', '$100M', '$10M', '$1M', '$100K', '$10K'];
  
  // X-axis labels (Age)
  const xLabels = ['New', '1h', '6h', '24h', '7d', '30d+'];
  
  return (
    <div className="w-full h-[calc(100vh-280px)] min-h-[500px] bg-bgPrimary rounded-lg border border-borderDefault overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-borderDefault bg-bgSecondary">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-textPrimary">Token Map</h2>
          <span className="text-xs text-textTertiary">
            {bubbles.length} tokens • Real-time
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-textTertiary">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success/40 border border-success/60" />
            <span>Price Up</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-error/40 border border-error/60" />
            <span>Price Down</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Size = Volume</span>
          </div>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="relative flex h-[calc(100%-56px)]">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between py-4 px-2 text-xs text-textTertiary w-16 bg-bgSecondary/50">
          {yLabels.map((label, i) => (
            <div key={i} className="text-right pr-2">{label}</div>
          ))}
        </div>
        
        {/* Main map area */}
        <div className="flex-1 flex flex-col">
          <div 
            ref={containerRef}
            className="relative flex-1 bg-gradient-to-b from-bgPrimary to-bgSecondary/30"
          >
            {/* Grid lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
              {/* Horizontal lines */}
              {[20, 40, 60, 80].map(y => (
                <line
                  key={`h-${y}`}
                  x1="0%"
                  y1={`${y}%`}
                  x2="100%"
                  y2={`${y}%`}
                  stroke="currentColor"
                  strokeDasharray="4 4"
                  className="text-borderDefault"
                />
              ))}
              {/* Vertical lines */}
              {[20, 40, 60, 80].map(x => (
                <line
                  key={`v-${x}`}
                  x1={`${x}%`}
                  y1="0%"
                  x2={`${x}%`}
                  y2="100%"
                  stroke="currentColor"
                  strokeDasharray="4 4"
                  className="text-borderDefault"
                />
              ))}
            </svg>
            
            {/* Token bubbles */}
            {bubbles.map(bubble => (
              <TokenBubbleComponent
                key={bubble.address}
                bubble={bubble}
                onClick={() => handleTokenClick(bubble)}
              />
            ))}
            
            {/* Empty state */}
            {bubbles.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-textTertiary">
                  <div className="text-4xl mb-2">🗺️</div>
                  <div className="text-sm">Loading tokens...</div>
                  <div className="text-xs mt-1">Tokens will appear as bubbles on the map</div>
                </div>
              </div>
            )}
          </div>
          
          {/* X-axis labels */}
          <div className="flex justify-between px-4 py-2 text-xs text-textTertiary bg-bgSecondary/50 border-t border-borderDefault">
            {xLabels.map((label, i) => (
              <div key={i}>{label}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
