import { request } from "../../helpers/request";
import { POLYMARKET_BASE_URL } from "../../constants";
import type { PolymarketTag } from "./events";

export interface GetTagsParams {
  limit?: number;
  offset?: number;
  slug?: string;
  id?: string;
  label?: string;
}

export async function getTags(params?: GetTagsParams): Promise<PolymarketTag[]> {
  return request<PolymarketTag[]>(POLYMARKET_BASE_URL, "/tags", {
    params,
  });
}

export async function getTagBySlug(slug: string): Promise<PolymarketTag[]> {
  return getTags({ slug });
}
