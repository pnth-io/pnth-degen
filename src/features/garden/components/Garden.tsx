'use client';

import { useRef, useEffect, useState, useMemo, useCallback, memo } from 'react';
import { usePulseDataStore, type PulseToken, type ViewName } from '@/features/pulse/store/usePulseDataStore';
import { usePulseStreamContext } from '@/features/pulse/context/PulseStreamContext';
import SafeImage from '@/components/SafeImage';
import { formatCryptoPrice, formatPercentage, formatPureNumber } from '@mobula_labs/sdk';
import { useSolPriceStore } from '@/store/useSolPriceStore';
import { TradeTimeCell } from '@/components/ui/tradetimecell';
import { getBuyPercent } from '@/components/shared/StatsCard';
import {
  UserRound,
  Bot,
  Crown,
  UserRoundCog,
  ChefHat,
  Crosshair,
  Ghost,
  Boxes,
  type LucideIcon,
} from 'lucide-react';

// Constants
const MIN_TIME_MS = 30 * 1000; // 30 seconds
const MAX_TIME_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_TIME_MS = 5 * 60 * 1000; // 5 minutes default
const MIGRATION_Y_PERCENT = 0.75; // migration line at 75% height
const FALLBACK_MIGRATION_MCAP = 35_000; // fallback until SOL price loads
const LOGO_MCAP_THRESHOLD = 10_000; // $10k - show logo above this
const BASE_BUBBLE_SIZE = 20;
const PADDING = { top: 60, right: 40, bottom: 15, left: 80 };
const CHART_BOTTOM_MARGIN = 30;

// Pump protocol identifiers
const PUMP_PROTOCOLS = ['pumpfun', 'pump.fun', 'pump', 'pumpswap'];

interface TokenBubble {
  token: PulseToken;
  x: number;
  y: number;
  size: number;
  color: string;
  type: ViewName;
  isMigrated: boolean;
  hasLogo: boolean;
  logo?: string;
  name: string;
  symbol: string;
  marketCap: number;
  age: number;
  address: string;
  priceChange: number;
  createdAt: number;
  lastTradeIsBuy: boolean;
}

interface HoverInfo {
  bubble: TokenBubble;
  mouseX: number;
  mouseY: number;
}

// Check if token is from pump protocol
function isPumpToken(token: PulseToken): boolean {
  const flat = token?.token?.address ? token.token : token;
  const data = flat as Record<string, unknown>;
  const source = ((data.source || data.preBondingFactory || '') as string).toLowerCase();
  return PUMP_PROTOCOLS.some(p => source.includes(p)) || source === '';
}

// Extract token data helper
function extractTokenData(token: PulseToken): {
  address: string;
  name: string;
  symbol: string;
  logo?: string;
  marketCap: number;
  createdAt: number;
  bondedAt?: number;
  priceChange: number;
  lastTradeIsBuy: boolean;
} {
  const flat = token?.token?.address ? token.token : token;
  const data = flat as Record<string, unknown>;
  
  const createdAtStr = (data.created_at || data.createdAt) as string | undefined;
  const bondedAtStr = data.bonded_at as string | undefined;
  
  const buys = Number(data.buys_24h || data.buys || 0);
  const sells = Number(data.sells_24h || data.sells || 0);
  const priceChange = Number(data.price_change_24h || data.priceChange24h || 0);
  
  let lastTradeIsBuy = true;
  if (buys > 0 || sells > 0) {
    lastTradeIsBuy = buys >= sells;
  } else {
    lastTradeIsBuy = priceChange >= 0;
  }
  
  return {
    address: (flat?.address || '') as string,
    name: (data.name || 'Unknown') as string,
    symbol: (data.symbol || '???') as string,
    logo: data.logo as string | undefined,
    marketCap: Number(data.marketCap || data.market_cap || 0),
    createdAt: createdAtStr ? new Date(createdAtStr).getTime() : Date.now(),
    bondedAt: bondedAtStr ? new Date(bondedAtStr).getTime() : undefined,
    priceChange,
    lastTradeIsBuy,
  };
}

// Non-linear Y: 0→migrationMcap occupies bottom 75%, migrationMcap→maxMcap compressed in top 25%
function mcapToY(
  mcap: number,
  migrationMcap: number,
  maxMcap: number,
  chartHeight: number,
  yBase: number
): number {
  if (migrationMcap <= 0 || migrationMcap >= maxMcap) {
    // fallback linear
    return yBase - (mcap / maxMcap) * chartHeight;
  }
  let yPercent: number;
  if (mcap <= migrationMcap) {
    yPercent = (mcap / migrationMcap) * MIGRATION_Y_PERCENT;
  } else {
    yPercent = MIGRATION_Y_PERCENT + ((mcap - migrationMcap) / (maxMcap - migrationMcap)) * (1 - MIGRATION_Y_PERCENT);
  }
  return yBase - yPercent * chartHeight;
}

// Calculate bubble properties - now takes current time for real-time position
function calculateBubble(
  token: PulseToken,
  type: ViewName,
  containerWidth: number,
  containerHeight: number,
  maxAgeMs: number,
  now: number,
  migrationMcap: number,
  maxMcap: number,
  migratedAddresses: Set<string>
): TokenBubble | null {
  const data = extractTokenData(token);

  const referenceTime = type === 'bonded' && data.bondedAt ? data.bondedAt : data.createdAt;
  const age = now - referenceTime;

  if (age > maxAgeMs || age < 0) return null;
  if (data.marketCap > maxMcap) return null;

  const chartWidth = containerWidth - PADDING.left - PADDING.right;
  const xPercent = age / maxAgeMs;
  const x = PADDING.left + xPercent * chartWidth;

  const chartHeight = containerHeight - PADDING.top - PADDING.bottom - CHART_BOTTOM_MARGIN;
  const yBase = containerHeight - PADDING.bottom - CHART_BOTTOM_MARGIN;
  const y = mcapToY(data.marketCap, migrationMcap, maxMcap, chartHeight, yBase);

  const color = data.lastTradeIsBuy ? '#61CA87' : '#ef4444';
  const hasLogo = data.marketCap >= LOGO_MCAP_THRESHOLD && !!data.logo;

  // Sticky migration: API says bonded OR mcap crossed migration threshold
  if (type === 'bonded' || data.marketCap >= migrationMcap) {
    migratedAddresses.add(data.address);
  }
  const isMigrated = migratedAddresses.has(data.address);

  let size = BASE_BUBBLE_SIZE;
  if (isMigrated) {
    size = 50;
  } else if (hasLogo) {
    size = 40;
  }

  return {
    token,
    x,
    y,
    size,
    color,
    type,
    isMigrated,
    hasLogo,
    logo: data.logo,
    name: data.name,
    symbol: data.symbol,
    marketCap: data.marketCap,
    age,
    address: data.address,
    priceChange: data.priceChange,
    createdAt: data.createdAt,
    lastTradeIsBuy: data.lastTradeIsBuy,
  };
}

function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatTimeRange(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
}

// Extract full token details for hover card (mirrors resolvePulseTokenDetails from Pulse)
function resolveTokenDetails(token: PulseToken): Record<string, unknown> {
  if (token?.token && typeof token.token === 'object') {
    const { token: nested, ...rest } = token;
    return { ...rest, ...nested } as Record<string, unknown>;
  }
  return token as unknown as Record<string, unknown>;
}

function formatAddressShort(address?: string): string {
  if (!address) return 'Unknown';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Stat badge for hover card (non-interactive, no tooltip wrapper)
const HoverStatBadge = memo(({ Icon, value, suffix, round, label }: {
  Icon: LucideIcon;
  value: number;
  suffix: string;
  round?: boolean;
  label: string;
}) => {
  const formatted = `${round ? value.toFixed(0) : value}${suffix}`;
  return (
    <div className="bg-bgContainer px-1 py-[2px] text-[10px] flex items-center gap-1.5 border border-[#2A2D3880]">
      <Icon size={12} className="text-success flex-shrink-0" />
      <span className="text-success font-medium text-[10px]">{formatted}</span>
    </div>
  );
});
HoverStatBadge.displayName = 'HoverStatBadge';

// Hover card component — matches Pulse TokenCard layout
const GardenHoverCard = memo(({ info, containerRect }: { info: HoverInfo; containerRect: DOMRect | null }) => {
  if (!containerRect) return null;

  const { bubble, mouseX, mouseY } = info;
  const td = resolveTokenDetails(bubble.token);

  const cardWidth = 340;
  const cardHeight = 220;
  let left = mouseX + 15;
  let top = mouseY - cardHeight / 2;

  if (left + cardWidth > containerRect.width) {
    left = mouseX - cardWidth - 15;
  }
  if (top < 0) top = 10;
  if (top + cardHeight > containerRect.height) {
    top = containerRect.height - cardHeight - 10;
  }

  // Extract all data like TokenCard does
  const logoSrc = (td.logo as string) || bubble.logo;
  const hasLogo = !!logoSrc;
  const symbol = (td.symbol as string) || bubble.symbol;
  const name = (td.name as string) || bubble.name;
  const address = (td.address as string) || bubble.address;
  const holdersCount = Number(td.holdersCount ?? td.holders_count ?? 0);
  const proTradersCount = Number(td.proTradersCount ?? 0);
  const deployerMigrations = Number(td.deployerMigrations ?? 0);
  const marketCap = Number(td.marketCap ?? td.market_cap ?? bubble.marketCap);
  const volume = Number(td.organic_volume_sell_24h ?? 0);
  const fees = Number(td.fees_paid_24h ?? 0);
  const priceChange = Number(td.price_change_24h ?? td.priceChange24h ?? bubble.priceChange);
  const buys = Number(td.buys_24h ?? td.buys ?? 0);
  const sells = Number(td.sells_24h ?? td.sells ?? 0);
  const buyPercent = getBuyPercent(buys, sells);

  // Timestamps
  const bondedAt = td.bonded_at as string | undefined;
  const createdAt = (td.createdAt ?? td.created_at ?? '') as string;
  const timestamp = bubble.isMigrated && bondedAt ? bondedAt : createdAt;

  // Stat values
  const top10 = Number(td.top10Holdings ?? 0);
  const devHoldings = Number(td.devHoldingsPercentage ?? 0);
  const snipers = Number(td.snipersHoldings ?? 0);
  const insiders = Number(td.insidersHoldings ?? 0);
  const bundlers = Number(td.bundlersHoldings ?? 0);
  const bondingPct = Number(td.bondingPercentage ?? 0);

  const source = (td.source as string) || 'Unknown';

  return (
    <div
      className="absolute z-50 bg-bgPrimary border border-borderDefault shadow-xl pointer-events-none rounded-md"
      style={{ left, top, width: cardWidth }}
    >
      <div className="px-3 py-2">
        {/* Header: Logo + Details + Market Data */}
        <div className="flex justify-between items-start gap-3">
          {/* Left: Logo + Info */}
          <div className="flex space-x-2.5 flex-1 min-w-0">
            {/* Logo */}
            {hasLogo ? (
              <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-bgBase">
                <SafeImage
                  src={logoSrc!}
                  alt={symbol}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-12 h-12 rounded bg-bgBase flex items-center justify-center">
                <span className="text-sm font-bold text-textTertiary">
                  {symbol.slice(0, 1).toUpperCase() || '?'}
                </span>
              </div>
            )}

            {/* Token details */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="text-textPrimary font-semibold text-sm truncate">{name}</div>
              <div className="flex items-center gap-2 text-xs text-textTertiary">
                <span className="font-semibold uppercase">{symbol}</span>
                {holdersCount > 0 && (
                  <span className="flex items-center gap-0.5">
                    <UserRound size={12} className="text-textTertiary" />
                    {formatPureNumber(holdersCount, { maxFractionDigits: 0, minFractionDigits: 0 })}
                  </span>
                )}
                {proTradersCount > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Bot size={12} className="text-textTertiary" />
                    {proTradersCount}
                  </span>
                )}
                {deployerMigrations > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Crown size={12} className="text-success" />
                    <span className="text-success">{deployerMigrations}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-textTertiary">
                <TradeTimeCell timestamp={timestamp} showAbsolute={false} hash="" />
                <span className="text-accentPurple font-mono">{formatAddressShort(address)}</span>
              </div>
            </div>
          </div>

          {/* Right: Market data */}
          <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
            <div className="flex gap-1 text-xs">
              <span className="text-textTertiary font-medium">Mcap</span>
              <span className="text-white font-semibold">{formatCryptoPrice(marketCap)}</span>
            </div>
            {volume > 0 && (
              <div className="flex gap-1 text-xs">
                <span className="text-textTertiary font-medium">Vol</span>
                <span className="text-white font-semibold">{formatCryptoPrice(volume)}</span>
              </div>
            )}
            {bubble.type !== 'bonded' && bondingPct > 0 && (
              <div className="flex gap-1 text-xs">
                <span className="text-textTertiary font-medium">Bond</span>
                <span className="text-success font-semibold">{formatPercentage(bondingPct)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats row: Fees, Price change, TX */}
        <div className="flex items-center justify-end mt-1.5 gap-1">
          {fees > 0 && (
            <div className="flex items-center gap-1 text-xs w-15">
              <span className="text-textTertiary">F</span>
              <span className="text-success font-normal truncate">
                {formatCryptoPrice(fees, { minFractionDigits: 1, maxFractionDigits: 1 })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs w-15">
            <span className="text-textTertiary">N</span>
            <span className={`${priceChange >= 0 ? 'text-success' : 'text-error'} font-normal truncate`}>
              {priceChange >= 0 ? '+' : ''}{formatPercentage(priceChange, { maxFractionDigits: 2, minFractionDigits: 2 })}
            </span>
          </div>
          {(buys + sells) > 0 && (
            <div className="flex items-center gap-1 text-xs w-15">
              <span className="text-textTertiary">TX</span>
              <span className="text-textPrimary font-normal truncate">{formatPureNumber(buys + sells)}</span>
            </div>
          )}
        </div>

        {/* Stat badges + buy/sell bar */}
        <div className="flex items-center w-full mt-1.5">
          <div className="flex items-center gap-1 flex-wrap flex-1">
            {top10 > 0 && <HoverStatBadge Icon={UserRoundCog} value={top10} suffix="%" round label="Top 10 Holdings" />}
            {devHoldings > 0 && <HoverStatBadge Icon={ChefHat} value={devHoldings} suffix="%" round label="Dev Holding" />}
            {snipers > 0 && <HoverStatBadge Icon={Crosshair} value={snipers} suffix="%" round label="Snipers" />}
            {insiders > 0 && <HoverStatBadge Icon={Ghost} value={insiders} suffix="%" round label="Insiders" />}
            {bundlers > 0 && <HoverStatBadge Icon={Boxes} value={bundlers} suffix="%" round label="Bundlers" />}
          </div>
        </div>

        {/* Buy/Sell ratio bar */}
        {(buys + sells) > 0 && (
          <div className="w-full h-1 bg-white rounded-full overflow-hidden relative mt-1.5">
            <div
              className="absolute top-0 left-0 h-full bg-success rounded-full"
              style={{ width: `${buyPercent}%` }}
            />
            <div
              className="absolute top-0 bg-black"
              style={{ left: `${buyPercent}%`, width: '2px', height: '100%' }}
            />
          </div>
        )}

        <div className="mt-1.5 text-center text-textTertiary text-[10px]">
          Click to view details
        </div>
      </div>
    </div>
  );
});

GardenHoverCard.displayName = 'GardenHoverCard';

// Y-axis labels — non-linear scale matching mcapToY
const YAxisLabels = memo(({ height, maxMcap, migrationMcap }: { height: number; maxMcap: number; migrationMcap: number }) => {
  const chartHeight = height - PADDING.top - PADDING.bottom - CHART_BOTTOM_MARGIN;
  const yBase = height - PADDING.bottom - CHART_BOTTOM_MARGIN;

  // Key mcap values to label
  const labelValues: number[] = [0];
  const migK = migrationMcap / 1000;
  const maxK = maxMcap / 1000;

  // Add evenly spaced labels below migration
  const belowStep = Math.max(5, Math.ceil(migK / 4 / 5) * 5);
  for (let v = belowStep; v < migK; v += belowStep) {
    labelValues.push(v * 1000);
  }
  // Always add migration value
  labelValues.push(migrationMcap);
  // Add a label or two above migration
  const aboveRange = maxMcap - migrationMcap;
  if (aboveRange > 5000) {
    const aboveMid = migrationMcap + aboveRange / 2;
    labelValues.push(Math.round(aboveMid / 1000) * 1000);
  }
  labelValues.push(maxMcap);

  return (
    <>
      {labelValues.map((mcapVal) => {
        const y = mcapToY(mcapVal, migrationMcap, maxMcap, chartHeight, yBase);
        const kVal = mcapVal / 1000;
        return (
          <text
            key={mcapVal}
            x={PADDING.left - 10}
            y={y}
            className="fill-textTertiary text-xs"
            textAnchor="end"
            dominantBaseline="middle"
          >
            ${kVal % 1 === 0 ? kVal.toFixed(0) : kVal.toFixed(1)}K
          </text>
        );
      })}
    </>
  );
});

YAxisLabels.displayName = 'YAxisLabels';

// Migration line
const MigrationLine = memo(({ width, height, migrationMcap }: { width: number; height: number; migrationMcap: number }) => {
  const chartHeight = height - PADDING.top - PADDING.bottom - CHART_BOTTOM_MARGIN;
  const yBase = height - PADDING.bottom - CHART_BOTTOM_MARGIN;
  const y = yBase - MIGRATION_Y_PERCENT * chartHeight;

  const label = migrationMcap >= 1000
    ? `MIGRATION ($${(migrationMcap / 1000).toFixed(1)}K)`
    : `MIGRATION ($${Math.round(migrationMcap)})`;

  return (
    <>
      <line
        x1={PADDING.left}
        y1={y}
        x2={width - PADDING.right}
        y2={y}
        stroke="#f97316"
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.6}
      />
      <text
        x={width - PADDING.right - 5}
        y={y - 10}
        className="fill-orange-400 text-xs font-medium"
        textAnchor="end"
        dominantBaseline="auto"
      >
        {label}
      </text>
    </>
  );
});

MigrationLine.displayName = 'MigrationLine';

// Stats header
const StatsHeader = memo(({ 
  newCount, 
  bondingCount, 
  migratedCount 
}: { 
  newCount: number; 
  bondingCount: number; 
  migratedCount: number;
}) => (
  <div className="absolute top-3 right-4 flex items-center gap-4 text-xs">
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-success" />
      <span className="text-textSecondary">{newCount} NEW</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-yellow-400" />
      <span className="text-textSecondary">{bondingCount} BONDING</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-orange-500" />
      <span className="text-textSecondary">{migratedCount} MIGRATED</span>
    </div>
  </div>
));

StatsHeader.displayName = 'StatsHeader';

// Time bar - drag right = more time, drag left = less time
const TimeRangeBar = memo(({ 
  value, 
  onChange 
}: { 
  value: number; 
  onChange: (ms: number) => void;
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; value: number } | null>(null);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, value };
  }, [value]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStartRef.current || !barRef.current) return;
    
    const deltaX = e.clientX - dragStartRef.current.x;
    const barWidth = barRef.current.offsetWidth;
    
    // Sensitivity: full bar width = full range
    const deltaRatio = deltaX / barWidth;
    const deltaMs = deltaRatio * (MAX_TIME_MS - MIN_TIME_MS);
    
    const newValue = Math.round(
      Math.max(MIN_TIME_MS, Math.min(MAX_TIME_MS, dragStartRef.current.value + deltaMs))
    );
    
    onChange(newValue);
  }, [onChange]);
  
  const handleMouseUp = useCallback(() => {
    dragStartRef.current = null;
  }, []);
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={barRef}
      className="absolute bottom-0 left-0 right-0 h-8 bg-bgContainer border-t border-borderDefault cursor-ew-resize select-none flex items-center justify-center"
      onMouseDown={handleMouseDown}
    >
      <span className="text-xs text-textSecondary pointer-events-none">
        {formatTimeRange(value)} <span className="text-textTertiary">← drag →</span>
      </span>
    </div>
  );
});

TimeRangeBar.displayName = 'TimeRangeBar';

// Single bubble — positioned via transform with CSS transition for smooth movement
const TokenBubbleElement = memo(({
  bubble,
  isHovered,
  onHover,
  onClick
}: {
  bubble: TokenBubble;
  isHovered: boolean;
  onHover: (bubble: TokenBubble | null, e?: React.MouseEvent) => void;
  onClick: (bubble: TokenBubble) => void;
}) => {
  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    onHover(bubble, e);
  }, [bubble, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(bubble);
  }, [bubble, onClick]);

  const r = bubble.size / 2;

  return (
    <g
      className="cursor-pointer"
      style={{
        transform: `translate(${bubble.x}px, ${bubble.y}px)`,
        transition: 'transform 1s linear',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Fire effect for migrated */}
      {bubble.isMigrated && (
        <circle
          cx={0}
          cy={0}
          r={r + 4}
          fill="none"
          stroke="#f97316"
          strokeWidth={2}
          opacity={0.6}
          className="animate-pulse"
        />
      )}

      {/* Main bubble */}
      {bubble.hasLogo && bubble.logo ? (
        <foreignObject
          x={-r}
          y={-r}
          width={bubble.size}
          height={bubble.size}
        >
          <div
            className="w-full h-full rounded-full overflow-hidden border-2"
            style={{ borderColor: bubble.color }}
          >
            <SafeImage
              src={bubble.logo}
              alt={bubble.name}
              width={bubble.size}
              height={bubble.size}
              className="w-full h-full object-cover"
            />
          </div>
        </foreignObject>
      ) : (
        <circle
          cx={0}
          cy={0}
          r={r}
          fill={bubble.color}
          opacity={0.9}
        />
      )}

      {/* Label for larger bubbles */}
      {bubble.size > 20 && (
        <text
          x={0}
          y={r + 12}
          className="fill-textSecondary text-[10px] pointer-events-none"
          textAnchor="middle"
        >
          {bubble.symbol}
        </text>
      )}
    </g>
  );
});

TokenBubbleElement.displayName = 'TokenBubbleElement';

// Main Garden component
export default function Garden() {
  const containerRef = useRef<HTMLDivElement>(null);
  const migratedAddressesRef = useRef(new Set<string>());
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [maxAgeMs, setMaxAgeMs] = useState(DEFAULT_TIME_MS);
  const newTokens = usePulseDataStore((state) => state.sections.new.tokens);
  const bondingTokens = usePulseDataStore((state) => state.sections.bonding.tokens);
  const bondedTokens = usePulseDataStore((state) => state.sections.bonded.tokens);

  const { isStreaming, hasInitialData } = usePulseStreamContext();

  const migrationMcap = useSolPriceStore((s) => s.migrationMcapUSD) || FALLBACK_MIGRATION_MCAP;
  const maxMcap = migrationMcap * 2;
  
  // Update positions every second for smooth movement
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  
  // Calculate bubbles with current time for real-time positions
  const bubbles = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return [];
    
    const allBubbles: TokenBubble[] = [];
    
    const processTokens = (tokens: PulseToken[], type: ViewName) => {
      for (const token of tokens) {
        if (!isPumpToken(token)) continue;
        
        const bubble = calculateBubble(token, type, dimensions.width, dimensions.height, maxAgeMs, currentTime, migrationMcap, maxMcap, migratedAddressesRef.current);
        if (bubble) allBubbles.push(bubble);
      }
    };

    processTokens(newTokens, 'new');
    processTokens(bondingTokens, 'bonding');
    processTokens(bondedTokens, 'bonded');

    return allBubbles;
  }, [newTokens, bondingTokens, bondedTokens, dimensions, currentTime, maxAgeMs, migrationMcap, maxMcap]);
  
  const counts = useMemo(() => ({
    new: bubbles.filter(b => b.type === 'new').length,
    bonding: bubbles.filter(b => b.type === 'bonding').length,
    migrated: bubbles.filter(b => b.type === 'bonded').length,
  }), [bubbles]);
  
  // Hover handler
  const handleBubbleHover = useCallback((bubble: TokenBubble | null, e?: React.MouseEvent) => {
    if (bubble && e) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setHoverInfo({
          bubble,
          mouseX: e.clientX - rect.left,
          mouseY: e.clientY - rect.top,
        });
      }
    } else {
      setHoverInfo(null);
    }
  }, []);
  
  // Click handler
  const handleBubbleClick = useCallback((bubble: TokenBubble) => {
    window.open(`/token/solana:solana/${bubble.address}`, '_blank');
  }, []);
  
  const containerRect = containerRef.current?.getBoundingClientRect() || null;
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-bgBase overflow-hidden"
    >
      {/* Stats header */}
      <StatsHeader 
        newCount={counts.new} 
        bondingCount={counts.bonding} 
        migratedCount={counts.migrated} 
      />
      
      {/* Status indicator */}
      <div className="absolute top-3 left-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-success animate-pulse' : 'bg-yellow-500'}`} />
        <span className={`text-xs ${isStreaming ? 'text-success' : 'text-yellow-500'}`}>
          {isStreaming ? 'LIVE' : 'CONNECTING'}
        </span>
        <span className="text-xs text-textTertiary ml-2">PUMP.FUN</span>
      </div>
      
      {/* SVG Chart */}
      {dimensions.width > 0 && dimensions.height > 0 && (
        <svg width={dimensions.width} height={dimensions.height} className="absolute inset-0">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(97, 202, 135, 0.05)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect 
            x={PADDING.left} 
            y={PADDING.top} 
            width={dimensions.width - PADDING.left - PADDING.right}
            height={dimensions.height - PADDING.top - PADDING.bottom - CHART_BOTTOM_MARGIN}
            fill="url(#grid)" 
          />
          
          {/* Y-axis labels only */}
          <YAxisLabels height={dimensions.height} maxMcap={maxMcap} migrationMcap={migrationMcap} />
          
          {/* Migration line */}
          <MigrationLine width={dimensions.width} height={dimensions.height} migrationMcap={migrationMcap} />
          
          {/* Bubbles - with direct event handlers */}
          {bubbles.map((bubble) => (
            <TokenBubbleElement
              key={`${bubble.type}-${bubble.address}`}
              bubble={bubble}
              isHovered={hoverInfo?.bubble.address === bubble.address}
              onHover={handleBubbleHover}
              onClick={handleBubbleClick}
            />
          ))}
        </svg>
      )}
      
      {/* Hover card */}
      {hoverInfo && <GardenHoverCard info={hoverInfo} containerRect={containerRect} />}
      
      {/* Time range bar */}
      <TimeRangeBar value={maxAgeMs} onChange={setMaxAgeMs} />
      
      {/* Loading state */}
      {!hasInitialData && (
        <div className="absolute inset-0 flex items-center justify-center bg-bgBase/80">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-success border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <div className="text-textSecondary text-sm">Loading tokens...</div>
          </div>
        </div>
      )}
    </div>
  );
}
