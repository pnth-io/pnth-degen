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
const PADDING = { top: 60, right: 40, bottom: 80, left: 80 }; // Increased bottom padding
const CHART_BOTTOM_MARGIN = 30; // Extra margin above X-axis for bubbles

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
  
  // Check if source contains pump or is empty (default to pump)
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
  
  // Determine last trade direction from buys vs sells or price change
  const buys = Number(data.buys_24h || data.buys || 0);
  const sells = Number(data.sells_24h || data.sells || 0);
  const priceChange = Number(data.price_change_24h || data.priceChange24h || 0);
  
  // Use buys vs sells ratio if available, otherwise fall back to price change
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

// Calculate bubble properties
function calculateBubble(
  token: PulseToken,
  type: ViewName,
  containerWidth: number,
  containerHeight: number,
  maxAgeMs: number
): TokenBubble | null {
  const data = extractTokenData(token);
  const now = Date.now();
  
  // Calculate age in ms
  const referenceTime = type === 'bonded' && data.bondedAt ? data.bondedAt : data.createdAt;
  const age = now - referenceTime;
  
  // Filter out tokens older than maxAge or with mcap > 100k
  if (age > maxAgeMs || age < 0) return null;
  if (data.marketCap > MAX_MCAP) return null;
  
  // Calculate X position based on age (tokens move right as they age)
  const chartWidth = containerWidth - PADDING.left - PADDING.right;
  const xPercent = age / maxAgeMs; // 0 = just created, 1 = max age
  const x = PADDING.left + xPercent * chartWidth;
  
  // Calculate Y position (mcap: 0 = bottom, 100k = top)
  // Add margin above X-axis so bubbles don't touch the timeline
  const chartHeight = containerHeight - PADDING.top - PADDING.bottom - CHART_BOTTOM_MARGIN;
  const yBase = containerHeight - PADDING.bottom - CHART_BOTTOM_MARGIN;
  const y = yBase - (data.marketCap / MAX_MCAP) * chartHeight;
  
  // Size based on market cap (logarithmic scale)
  const logMcap = Math.log10(Math.max(data.marketCap, 100));
  const logMax = Math.log10(MAX_MCAP);
  const sizeRatio = logMcap / logMax;
  const size = MIN_BUBBLE_SIZE + sizeRatio * (MAX_BUBBLE_SIZE - MIN_BUBBLE_SIZE);
  
  // Color based on last trade direction (buy = green, sell = red)
  const color = data.lastTradeIsBuy ? '#61CA87' : '#ef4444';
  
  // Determine if has logo (show logo when mcap >= $25k)
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

// Format age for display
function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

// Format time for slider display
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

// Clickable X-axis for time range selection
const ClickableXAxis = memo(({ 
  width, 
  height,
  maxAgeMs,
  onTimeClick
}: { 
  width: number; 
  height: number;
  maxAgeMs: number;
  onTimeClick: (ms: number) => void;
}) => {
  const chartWidth = width - PADDING.left - PADDING.right;
  const axisY = height - PADDING.bottom + 15;
  
  // Handle click on X-axis area
  const handleAxisClick = useCallback((e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / chartWidth;
    // Map click position to time: left = 30s, right = 10m
    const newTime = MIN_TIME_MS + ratio * (MAX_TIME_MS - MIN_TIME_MS);
    onTimeClick(Math.round(newTime));
  }, [chartWidth, onTimeClick]);
  
  // Generate tick marks
  const maxMinutes = maxAgeMs / 60000;
  const numLabels = Math.min(6, Math.ceil(maxMinutes) + 1);
  const step = maxMinutes / (numLabels - 1);
  const labels = Array.from({ length: numLabels }, (_, i) => i * step);
  
  // Current position indicator
  const currentRatio = (maxAgeMs - MIN_TIME_MS) / (MAX_TIME_MS - MIN_TIME_MS);
  const indicatorX = PADDING.left + currentRatio * chartWidth;
  
  return (
    <g className="x-axis-clickable">
      {/* Clickable area */}
      <rect
        x={PADDING.left}
        y={axisY - 20}
        width={chartWidth}
        height={60}
        fill="transparent"
        className="cursor-pointer"
        onClick={handleAxisClick}
      />
      
      {/* Axis line */}
      <line
        x1={PADDING.left}
        y1={axisY}
        x2={width - PADDING.right}
        y2={axisY}
        stroke="rgba(97, 202, 135, 0.3)"
        strokeWidth={2}
      />
      
      {/* Tick marks and labels */}
      {labels.map((min, i) => {
        const x = PADDING.left + (i / (numLabels - 1)) * chartWidth;
        const label = min < 1 ? `${Math.round(min * 60)}s` : `${min.toFixed(min % 1 === 0 ? 0 : 1)}m`;
        return (
          <g key={i}>
            <line
              x1={x}
              y1={axisY - 5}
              x2={x}
              y2={axisY + 5}
              stroke="rgba(97, 202, 135, 0.5)"
              strokeWidth={1}
            />
            <text
              x={x}
              y={axisY + 20}
              className="fill-textTertiary text-xs"
              textAnchor="middle"
            >
              {label}
            </text>
          </g>
        );
      })}
      
      {/* Current time indicator */}
      <circle
        cx={indicatorX}
        cy={axisY}
        r={6}
        fill="#61CA87"
        className="drop-shadow-lg"
      />
      
      {/* Current time label */}
      <text
        x={indicatorX}
        y={axisY + 35}
        className="fill-success text-xs font-bold"
        textAnchor="middle"
      >
        {formatTimeRange(maxAgeMs)}
      </text>
      
      {/* Axis title */}
      <text
        x={width / 2}
        y={height - 15}
        className="fill-textSecondary text-sm font-medium"
        textAnchor="middle"
      >
        TOKEN AGE — CLICK TO ADJUST RANGE
      </text>
    </g>
  );
});

ClickableXAxis.displayName = 'ClickableXAxis';

// Single bubble component with CSS animation
const TokenBubbleElement = memo(({ 
  bubble, 
  chartWidth,
  maxAgeMs,
  isHovered 
}: { 
  bubble: TokenBubble; 
  chartWidth: number;
  maxAgeMs: number;
  isHovered: boolean;
}) => {
  const remainingMs = maxAgeMs - bubble.age;
  const remainingPercent = remainingMs / maxAgeMs;
  const pixelsToMove = remainingPercent * chartWidth;
  const animationDuration = `${remainingMs}ms`;
  
  return (
    <g 
      className="token-bubble"
      style={{
        transform: `translateX(0)`,
        animation: `moveRight ${animationDuration} linear forwards`,
        // @ts-ignore
        '--move-distance': `${pixelsToMove}px`,
      }}
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
            className={`w-full h-full rounded-full overflow-hidden border-2 transition-transform duration-200 ${isHovered ? 'scale-125' : ''}`}
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
          r={bubble.size / 2}
          fill={bubble.color}
          opacity={0.8}
          className={`transition-transform duration-200 ${isHovered ? 'scale-125' : ''}`}
          style={{ transformOrigin: `${bubble.x}px ${bubble.y}px` }}
        />
      )}
      
      {/* Label for larger bubbles */}
      {bubble.size > 20 && (
        <text
          x={bubble.x}
          y={bubble.y + bubble.size / 2 + 12}
          className="fill-textSecondary text-[10px]"
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
  const [renderKey, setRenderKey] = useState(0);
  const [maxAgeMs, setMaxAgeMs] = useState(DEFAULT_TIME_MS);
  
  // Get token data from store
  const newTokens = usePulseDataStore((state) => state.sections.new.tokens);
  const bondingTokens = usePulseDataStore((state) => state.sections.bonding.tokens);
  const bondedTokens = usePulseDataStore((state) => state.sections.bonded.tokens);
  
  // Stream status
  const { isStreaming, hasInitialData } = usePulseStreamContext();
  
  // Force re-render every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => setRenderKey(k => k + 1), 10000);
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
  
  // Calculate bubbles - only pump tokens, filter out >100k mcap
  const bubbles = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return [];
    
    const allBubbles: TokenBubble[] = [];
    
    const processTokens = (tokens: PulseToken[], type: ViewName) => {
      for (const token of tokens) {
        if (!isPumpToken(token)) continue;
        
        const bubble = calculateBubble(token, type, dimensions.width, dimensions.height, maxAgeMs);
        if (bubble) allBubbles.push(bubble);
      }
    };
    
    processTokens(newTokens, 'new');
    processTokens(bondingTokens, 'bonding');
    processTokens(bondedTokens, 'bonded');
    
    return allBubbles;
  }, [newTokens, bondingTokens, bondedTokens, dimensions, renderKey, maxAgeMs]);
  
  const chartWidth = dimensions.width - PADDING.left - PADDING.right;
  
  const counts = useMemo(() => ({
    new: bubbles.filter(b => b.type === 'new').length,
    bonding: bubbles.filter(b => b.type === 'bonding').length,
    migrated: bubbles.filter(b => b.type === 'bonded').length,
  }), [bubbles]);
  
  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    let foundBubble: TokenBubble | null = null;
    for (const bubble of bubbles) {
      const currentAge = Date.now() - bubble.createdAt;
      const currentX = PADDING.left + (currentAge / maxAgeMs) * chartWidth;
      
      const dx = mouseX - currentX;
      const dy = mouseY - bubble.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= bubble.size / 2 + 8) {
        foundBubble = bubble;
        break;
      }
    }
    
    if (foundBubble) {
      setHoverInfo({ bubble: foundBubble, mouseX, mouseY });
    } else {
      setHoverInfo(null);
    }
  }, [bubbles, chartWidth, maxAgeMs]);
  
  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (hoverInfo) {
      e.preventDefault();
      // Correct route format: /token/solana:solana/ADDRESS
      window.open(`/token/solana:solana/${hoverInfo.bubble.address}`, '_blank');
    }
  }, [hoverInfo]);
  
  const containerRect = containerRef.current?.getBoundingClientRect() || null;
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-bgBase overflow-hidden cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* CSS for smooth animation */}
      <style jsx global>{`
        @keyframes moveRight {
          from { transform: translateX(0); }
          to { transform: translateX(var(--move-distance, 0)); }
        }
        .token-bubble { will-change: transform; }
      `}</style>
      
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
          
          {/* Axis labels */}
          <YAxisLabels height={dimensions.height} />
          <ClickableXAxis 
            width={dimensions.width} 
            height={dimensions.height} 
            maxAgeMs={maxAgeMs}
            onTimeClick={setMaxAgeMs}
          />
          
          {/* Migration line */}
          <MigrationLine width={dimensions.width} height={dimensions.height} />
          
          {/* Bubbles */}
          {bubbles.map((bubble) => (
            <TokenBubbleElement
              key={`${bubble.type}-${bubble.address}`}
              bubble={bubble}
              chartWidth={chartWidth}
              maxAgeMs={maxAgeMs}
              isHovered={hoverInfo?.bubble.address === bubble.address}
            />
          ))}
        </svg>
      )}
      
      {/* Hover card */}
      {hoverInfo && <HoverCard info={hoverInfo} containerRect={containerRect} />}
      
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
