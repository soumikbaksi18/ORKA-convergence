import axios, { type AxiosRequestConfig, type Method } from "axios";

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

  const config: AxiosRequestConfig = {
    method,
    url: `${baseUrl}${endpoint}`,
    params,
    data,
    headers,
  };

  const response = await axios.request<T>(config);
  return response.data;
}
