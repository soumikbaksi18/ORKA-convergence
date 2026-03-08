import axios, { type AxiosRequestConfig, type Method } from "axios";
import { PROXY_URL } from "../constants";

interface RequestOptions {
  method?: Method;
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
}

export async function request<T = any>(
  baseUrl: string,
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", params, data, headers } = options;

  // Build the actual target URL (with query params)
  const targetUrl = new URL(`${baseUrl}${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        targetUrl.searchParams.set(key, String(value));
      }
    }
  }

  // If PROXY_URL is configured, route through the Cloudflare proxy worker
  if (PROXY_URL) {
    const config: AxiosRequestConfig = {
      method,
      url: PROXY_URL,
      headers: {
        "X-Target-URL": targetUrl.toString(),
        ...headers,
      },
      data,
    };

    const response = await axios.request<T>(config);
    return response.data;
  }

  // Direct request (no proxy)
  const config: AxiosRequestConfig = {
    method,
    url: targetUrl.toString(),
    data,
    headers,
  };

  const response = await axios.request<T>(config);
  return response.data;
}
