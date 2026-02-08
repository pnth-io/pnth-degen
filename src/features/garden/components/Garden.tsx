'use client';

import { useRef, useEffect, useState, useMemo, useCallback, memo } from 'react';
import { usePulseDataStore, type PulseToken, type ViewName } from '@/features/pulse/store/usePulseDataStore';
import { usePulseStreamContext } from '@/features/pulse/context/PulseStreamContext';
import SafeImage from '@/components/SafeImage';
import { formatCryptoPrice } from '@mobula_labs/sdk';

// Constants
const MIN_TIME_MS = 30 * 1000; // 30 seconds
const MAX_TIME_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_TIME_MS = 5 * 60 * 1000; // 5 minutes default
const MAX_MCAP = 100_000; // $100k - filter out tokens above this
const MIGRATION_MCAP = 35_000; // $35k migration line
const LOGO_MCAP_THRESHOLD = 25_000; // $25k - show logo above this
const MIN_BUBBLE_SIZE = 8;
const MAX_BUBBLE_SIZE = 40;
const PADDING = { top: 60, right: 40, bottom: 50, left: 80 };
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

// Calculate bubble properties - now takes current time for real-time position
function calculateBubble(
  token: PulseToken,
  type: ViewName,
  containerWidth: number,
  containerHeight: number,
  maxAgeMs: number,
  now: number
): TokenBubble | null {
  const data = extractTokenData(token);
  
  const referenceTime = type === 'bonded' && data.bondedAt ? data.bondedAt : data.createdAt;
  const age = now - referenceTime;
  
  if (age > maxAgeMs || age < 0) return null;
  if (data.marketCap > MAX_MCAP) return null;
  
  const chartWidth = containerWidth - PADDING.left - PADDING.right;
  const xPercent = age / maxAgeMs;
  const x = PADDING.left + xPercent * chartWidth;
  
  const chartHeight = containerHeight - PADDING.top - PADDING.bottom - CHART_BOTTOM_MARGIN;
  const yBase = containerHeight - PADDING.bottom - CHART_BOTTOM_MARGIN;
  const y = yBase - (data.marketCap / MAX_MCAP) * chartHeight;
  
  const logMcap = Math.log10(Math.max(data.marketCap, 100));
  const logMax = Math.log10(MAX_MCAP);
  const sizeRatio = logMcap / logMax;
  const size = MIN_BUBBLE_SIZE + sizeRatio * (MAX_BUBBLE_SIZE - MIN_BUBBLE_SIZE);
  
  const color = data.lastTradeIsBuy ? '#61CA87' : '#ef4444';
  const hasLogo = data.marketCap >= LOGO_MCAP_THRESHOLD && !!data.logo;
  
  return {
    token,
    x,
    y,
    size,
    color,
    type,
    isMigrated: type === 'bonded',
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

// Hover card component
const HoverCard = memo(({ info, containerRect }: { info: HoverInfo; containerRect: DOMRect | null }) => {
  if (!containerRect) return null;
  
  const { bubble, mouseX, mouseY } = info;
  
  const cardWidth = 280;
  const cardHeight = 200;
  let left = mouseX + 15;
  let top = mouseY - cardHeight / 2;
  
  if (left + cardWidth > containerRect.width) {
    left = mouseX - cardWidth - 15;
  }
  if (top < 0) top = 10;
  if (top + cardHeight > containerRect.height) {
    top = containerRect.height - cardHeight - 10;
  }
  
  const currentAge = Date.now() - bubble.createdAt;
  
  return (
    <div
      className="absolute z-50 bg-bgContainer border border-borderDefault p-3 shadow-xl pointer-events-none"
      style={{ left, top, width: cardWidth }}
    >
      <div className="flex items-center gap-2 mb-2">
        {bubble.logo && (
          <div className={`relative ${bubble.isMigrated ? 'animate-pulse' : ''}`}>
            <SafeImage
              src={bubble.logo}
              alt={bubble.name}
              width={32}
              height={32}
              className="rounded-full"
            />
            {bubble.isMigrated && (
              <div className="absolute inset-0 rounded-full ring-2 ring-orange-500 ring-opacity-75" />
            )}
          </div>
        )}
        {!bubble.logo && (
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black"
            style={{ backgroundColor: bubble.color }}
          >
            {bubble.symbol.slice(0, 2)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-textPrimary font-semibold text-sm truncate">{bubble.name}</div>
          <div className="text-textTertiary text-xs">${bubble.symbol}</div>
        </div>
        <div className={`text-sm font-bold ${bubble.lastTradeIsBuy ? 'text-success' : 'text-red-500'}`}>
          {bubble.lastTradeIsBuy ? '↑ BUY' : '↓ SELL'}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-bgBase p-2">
          <div className="text-textTertiary">Market Cap</div>
          <div className="text-textPrimary font-medium">${formatCryptoPrice(bubble.marketCap)}</div>
        </div>
        <div className="bg-bgBase p-2">
          <div className="text-textTertiary">Age</div>
          <div className="text-textPrimary font-medium">{formatAge(currentAge)}</div>
        </div>
        <div className="bg-bgBase p-2">
          <div className="text-textTertiary">Status</div>
          <div className={`font-medium ${bubble.isMigrated ? 'text-orange-400' : bubble.type === 'bonding' ? 'text-yellow-400' : 'text-success'}`}>
            {bubble.isMigrated ? '🔥 Migrated' : bubble.type === 'bonding' ? 'Bonding' : 'New'}
          </div>
        </div>
        <div className="bg-bgBase p-2">
          <div className="text-textTertiary">24h Change</div>
          <div className={`font-medium ${bubble.priceChange >= 0 ? 'text-success' : 'text-red-500'}`}>
            {bubble.priceChange >= 0 ? '+' : ''}{bubble.priceChange.toFixed(1)}%
          </div>
        </div>
      </div>
      
      <div className="mt-2 text-center text-textTertiary text-[10px]">
        Click to view details
      </div>
    </div>
  );
});

HoverCard.displayName = 'HoverCard';

// Y-axis labels
const YAxisLabels = memo(({ height }: { height: number }) => {
  const labels = [0, 25, 50, 75, 100];
  const chartHeight = height - PADDING.top - PADDING.bottom - CHART_BOTTOM_MARGIN;
  const yBase = height - PADDING.bottom - CHART_BOTTOM_MARGIN;
  
  return (
    <>
      {labels.map((val) => {
        const y = yBase - (val / 100) * chartHeight;
        return (
          <text
            key={val}
            x={PADDING.left - 10}
            y={y}
            className="fill-textTertiary text-xs"
            textAnchor="end"
            dominantBaseline="middle"
          >
            ${val}K
          </text>
        );
      })}
    </>
  );
});

YAxisLabels.displayName = 'YAxisLabels';

// Migration line
const MigrationLine = memo(({ width, height }: { width: number; height: number }) => {
  const chartHeight = height - PADDING.top - PADDING.bottom - CHART_BOTTOM_MARGIN;
  const yBase = height - PADDING.bottom - CHART_BOTTOM_MARGIN;
  const y = yBase - (MIGRATION_MCAP / MAX_MCAP) * chartHeight;
  
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
        x={width - PADDING.right + 5}
        y={y}
        className="fill-orange-400 text-xs font-medium"
        textAnchor="start"
        dominantBaseline="middle"
      >
        MIGRATION ($35K)
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

// Full-width draggable time bar at the bottom
const TimeRangeBar = memo(({ 
  value, 
  onChange 
}: { 
  value: number; 
  onChange: (ms: number) => void;
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const valueToPos = (ms: number) => (ms - MIN_TIME_MS) / (MAX_TIME_MS - MIN_TIME_MS);
  const posToValue = (pos: number) => MIN_TIME_MS + Math.max(0, Math.min(1, pos)) * (MAX_TIME_MS - MIN_TIME_MS);
  
  const position = valueToPos(value);
  
  const updateFromEvent = useCallback((clientX: number) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const pos = (clientX - rect.left) / rect.width;
    onChange(Math.round(posToValue(pos)));
  }, [onChange]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateFromEvent(e.clientX);
  }, [updateFromEvent]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    updateFromEvent(e.clientX);
  }, [isDragging, updateFromEvent]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Time labels
  const labels = ['30s', '2m', '4m', '6m', '8m', '10m'];

  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 bg-bgContainer border-t border-borderDefault">
      {/* Time labels */}
      <div className="absolute top-0 left-0 right-0 flex justify-between px-4 pt-0.5">
        {labels.map((label, i) => (
          <span key={i} className="text-[10px] text-textTertiary">{label}</span>
        ))}
      </div>
      
      {/* Draggable bar area */}
      <div 
        ref={barRef}
        className="absolute bottom-1 left-4 right-4 h-4 cursor-ew-resize"
        onMouseDown={handleMouseDown}
      >
        {/* Track background */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-borderDefault rounded-full" />
        
        {/* Selected range (from 0 to handle) */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-success/50 rounded-full"
          style={{ width: `${position * 100}%` }}
        />
        
        {/* Draggable handle */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-success rounded-sm border border-success shadow-lg transition-transform ${
            isDragging ? 'scale-150' : 'hover:scale-125'
          }`}
          style={{ left: `calc(${position * 100}% - 6px)` }}
        />
        
        {/* Current value tooltip */}
        {isDragging && (
          <div 
            className="absolute -top-6 px-1.5 py-0.5 bg-success text-black text-[10px] font-bold rounded"
            style={{ left: `calc(${position * 100}% - 16px)` }}
          >
            {formatTimeRange(value)}
          </div>
        )}
      </div>
    </div>
  );
});

TimeRangeBar.displayName = 'TimeRangeBar';

// Single bubble - now with direct event handlers, no CSS animation
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

  return (
    <g 
      className="cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Fire effect for migrated */}
      {bubble.isMigrated && (
        <circle
          cx={bubble.x}
          cy={bubble.y}
          r={bubble.size / 2 + 4}
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
          x={bubble.x - bubble.size / 2}
          y={bubble.y - bubble.size / 2}
          width={bubble.size}
          height={bubble.size}
        >
          <div 
            className={`w-full h-full rounded-full overflow-hidden border-2 transition-transform duration-150 ${isHovered ? 'scale-125' : ''}`}
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
          cx={bubble.x}
          cy={bubble.y}
          r={isHovered ? bubble.size / 2 * 1.25 : bubble.size / 2}
          fill={bubble.color}
          opacity={0.9}
          className="transition-all duration-150"
        />
      )}
      
      {/* Label for larger bubbles */}
      {bubble.size > 20 && (
        <text
          x={bubble.x}
          y={bubble.y + bubble.size / 2 + 12}
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
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [maxAgeMs, setMaxAgeMs] = useState(DEFAULT_TIME_MS);
  
  const newTokens = usePulseDataStore((state) => state.sections.new.tokens);
  const bondingTokens = usePulseDataStore((state) => state.sections.bonding.tokens);
  const bondedTokens = usePulseDataStore((state) => state.sections.bonded.tokens);
  
  const { isStreaming, hasInitialData } = usePulseStreamContext();
  
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
        
        const bubble = calculateBubble(token, type, dimensions.width, dimensions.height, maxAgeMs, currentTime);
        if (bubble) allBubbles.push(bubble);
      }
    };
    
    processTokens(newTokens, 'new');
    processTokens(bondingTokens, 'bonding');
    processTokens(bondedTokens, 'bonded');
    
    return allBubbles;
  }, [newTokens, bondingTokens, bondedTokens, dimensions, currentTime, maxAgeMs]);
  
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
          <YAxisLabels height={dimensions.height} />
          
          {/* Migration line */}
          <MigrationLine width={dimensions.width} height={dimensions.height} />
          
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
      {hoverInfo && <HoverCard info={hoverInfo} containerRect={containerRect} />}
      
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
