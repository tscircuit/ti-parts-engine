import type { BridgeFetch } from "./types.ts";

declare const window:
  | undefined
  | {
      location?: Location;
      TSCIRCUIT_FILESERVER_API_BASE_URL?: string;
    };

export const createDefaultBridgeFetch = (): BridgeFetch => {
  return async (input, init) => {
    const targetUrl = input.toString();
    const proxyEndpointUrl = getTscircuitProxyEndpointUrl(targetUrl);

    if (!proxyEndpointUrl) {
      return globalThis.fetch(input, init);
    }

    const headers = new Headers(init?.headers);
    headers.set("X-Target-Url", targetUrl);

    const targetOrigin = safeGetOrigin(targetUrl);
    if (targetOrigin) {
      headers.set("X-Sender-Origin", targetOrigin);
    }

    return globalThis.fetch(proxyEndpointUrl, {
      ...init,
      headers,
    });
  };
};

function getTscircuitProxyEndpointUrl(targetUrl: string): string | null {
  if (typeof window === "undefined" || !window.location) {
    return null;
  }

  const targetOrigin = safeGetOrigin(targetUrl);
  const currentOrigin = window.location.origin;
  if (!targetOrigin || targetOrigin === currentOrigin) {
    return null;
  }

  if (window.TSCIRCUIT_FILESERVER_API_BASE_URL) {
    return `${window.TSCIRCUIT_FILESERVER_API_BASE_URL.replace(/\/+$/, "")}/proxy`;
  }

  if (isLocalHttpOrigin(currentOrigin)) {
    return `${currentOrigin}/proxy`;
  }

  return null;
}

function safeGetOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function isLocalHttpOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      (url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "::1")
    );
  } catch {
    return false;
  }
}
