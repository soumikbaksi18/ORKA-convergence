import { request } from "../../helpers/request";
import { POLYMARKET_BASE_URL } from "../../constants";

export interface PolymarketImageOptimized {
  id: string;
  imageUrlSource: string;
  imageUrlOptimized: string;
  imageSizeKbSource: number;
  imageSizeKbOptimized: number;
  imageOptimizedComplete: boolean;
  imageOptimizedLastUpdated: string;
  relID: number;
  field: string;
  relname: string;
}

export interface PolymarketCategory {
  id: string;
  label: string;
  parentCategory: string;
  slug: string;
  publishedAt: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolymarketTag {
  id: string;
  label: string;
  slug: string;
  forceShow: boolean;
  publishedAt: string;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
  forceHide: boolean;
  isCarousel: boolean;
}

export interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  resolutionSource: string;
  endDate: string;
  startDate: string;
  category: string;
  liquidity: string;
  volume: string;
  active: boolean;
  closed: boolean;
  image: string;
  icon: string;
  description: string;
  outcomes: string;
  outcomePrices: string;
  marketType: string;
  formatType: string;
  clobTokenIds: string;
  enableOrderBook: boolean;
  acceptingOrders: boolean;
  negRiskOther: boolean;
  volumeNum: number;
  liquidityNum: number;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  volume1yr: number;
  lastTradePrice: number;
  bestBid: number;
  bestAsk: number;
  oneDayPriceChange: number;
  oneWeekPriceChange: number;
  spread: number;
  competitive: number;
  categories: PolymarketCategory[];
  tags: PolymarketTag[];
  imageOptimized?: PolymarketImageOptimized;
  iconOptimized?: PolymarketImageOptimized;
}

export interface PolymarketEvent {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  resolutionSource: string;
  startDate: string;
  creationDate: string;
  endDate: string;
  image: string;
  icon: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  liquidity: number;
  volume: number;
  openInterest: number;
  category: string;
  subcategory: string;
  competitive: number;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  volume1yr: number;
  negRisk: boolean;
  negRiskMarketID: string;
  commentCount: number;
  markets: PolymarketMarket[];
  categories: PolymarketCategory[];
  tags: PolymarketTag[];
  imageOptimized?: PolymarketImageOptimized;
  iconOptimized?: PolymarketImageOptimized;
  featuredImageOptimized?: PolymarketImageOptimized;
}

export interface GetEventsParams {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  slug?: string;
  id?: string;
  ticker?: string;
  category?: string;
  tag?: string;
}

export async function getEvents(params?: GetEventsParams): Promise<PolymarketEvent[]> {
  return request<PolymarketEvent[]>(POLYMARKET_BASE_URL, "/events", {
    params,
  });
}

export async function getEventBySlug(slug: string): Promise<PolymarketEvent[]> {
  return getEvents({ slug });
}

export async function getEventById(id: string): Promise<PolymarketEvent[]> {
  return getEvents({ id });
}

export async function getEventDetail(id: string): Promise<PolymarketEvent> {
  return request<PolymarketEvent>(POLYMARKET_BASE_URL, `/events/${id}`);
}
