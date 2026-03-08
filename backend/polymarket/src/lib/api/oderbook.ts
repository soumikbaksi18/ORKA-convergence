import { request } from "../../helpers/request";
import { CLOB_BASE_URL } from "../../constants";

export interface OrderbookLevel {
  price: string;
  size: string;
}

export interface Orderbook {
  market: string;
  asset_id: string;
  timestamp: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  min_order_size: string;
  tick_size: string;
  neg_risk: boolean;
  hash: string;
}

export const getOrderBook = async (clobTokenId: string): Promise<Orderbook> => {
  try {
    const book = await request<Orderbook>(CLOB_BASE_URL, "/book", {
      params: { token_id: clobTokenId },
    });
    return book;
  } catch (err: any) {
    console.log(err);
    throw new Error(err.message);
  }
};
