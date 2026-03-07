import type { HTTPSendRequester } from "@chainlink/cre-sdk";

type HttpMethod = "GET" | "POST";

interface RequestOptions {
  headers?: Record<string, string>;
  body?: string;
}

export const httpRequest = (
  sendRequester: HTTPSendRequester,
  method: HttpMethod,
  url: string,
  options?: RequestOptions,
) => {
  const req: Record<string, unknown> = {
    url,
    method,
  };

  if (options?.headers) req.headers = options.headers;
  if (options?.body) req.body = new TextEncoder().encode(options.body);

  const res = sendRequester.sendRequest(req).result();

  if (res.statusCode < 200 || res.statusCode >= 300) {
    const body = new TextDecoder().decode(res.body);
    throw new Error(`${method} ${url} returned status ${res.statusCode}: ${body}`);
  }

  const text = new TextDecoder().decode(res.body);
  return text;
};

export const httpGet = (
  sendRequester: HTTPSendRequester,
  url: string,
  options?: RequestOptions,
) => httpRequest(sendRequester, "GET", url, options);

export const httpPost = (
  sendRequester: HTTPSendRequester,
  url: string,
  body: string,
  options?: RequestOptions,
) => httpRequest(sendRequester, "POST", url, { ...options, body });
