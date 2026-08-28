import type { Destination } from "./types.ts";

export type HttpDestinationOptions = {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  name?: string;
};

export function createHttpDestination(options: HttpDestinationOptions): Destination {
  const method = options.method ?? "POST";
  const headers = options.headers ?? {};
  const url = options.url;

  return {
    label: options.name ?? `http:${url}`,
    async send(payload: string) {
      const response = await fetch(url, {
        method,
        headers,
        body: payload,
      });

      if (!response.ok) {
        const body = await response.text();
        const snippet = body.length > 200 ? `${body.slice(0, 200)}...` : body;
        throw new Error(`HTTP ${response.status} ${response.statusText}: ${snippet}`);
      }
    },
  };
}
