export interface ScreenerToken {
  address: string;
  pairAddress: string;
  symbol: string;
  name: string;
  logo?: string;
  price: number;
  priceChange5m: number;
  priceChange1h: number;
  priceChange6h: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  trades24h: number;
  buys24h: number;
  sells24h: number;
  buyers24h: number;
  sellers24h: number;
  createdAt: string;
  exchange?: string;
  security?: {
    buyTax: string;
    sellTax: string;
    honeypot?: boolean;
  };
}

export type SortField = 
  | 'volume24h' 
  | 'liquidity' 
  | 'priceChange5m' 
  | 'priceChange1h' 
  | 'priceChange24h' 
  | 'marketCap'
  | 'createdAt'
  | 'trades24h';

export type SortDirection = 'asc' | 'desc';

export interface ScreenerFilters {
  minLiquidity?: number;
  minVolume?: number;
  maxAge?: number; // hours
}
