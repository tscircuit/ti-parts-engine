import { expect, test } from "bun:test";

import { createDefaultBridgeFetch } from "../index";

test("default bridge fetch uses global fetch directly outside the browser", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ input: string | URL; init?: RequestInit }> = [];

  globalThis.fetch = (async (input, init) => {
    calls.push({ input: input as string | URL, init });
    return new Response("ok");
  }) as typeof fetch;

  try {
    const response = await createDefaultBridgeFetch()("https://example.com/a", {
      headers: { Accept: "application/json" },
    });

    expect(await response.text()).toBe("ok");
    expect(calls).toHaveLength(1);
    expect(calls[0]!.input.toString()).toBe("https://example.com/a");
    expect(new Headers(calls[0]!.init?.headers).get("X-Target-Url")).toBeNull();
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("default bridge fetch uses the tscircuit dev-server proxy for browser cross-origin requests", async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  const calls: Array<{ input: string | URL; init?: RequestInit }> = [];

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location: new URL("http://localhost:3020/#file=index.tsx"),
      TSCIRCUIT_FILESERVER_API_BASE_URL: "http://localhost:3020",
    },
  });

  globalThis.fetch = (async (input, init) => {
    calls.push({ input: input as string | URL, init });
    return new Response("ok");
  }) as typeof fetch;

  try {
    const response = await createDefaultBridgeFetch()(
      "https://ti-api-cors-proxy.seve.workers.dev/v1/export/kicad?mpn=LM358&version=6",
      {
        headers: {
          Accept: "application/zip",
          Authorization: "Bearer secret-token",
        },
      },
    );

    expect(await response.text()).toBe("ok");
    expect(calls).toHaveLength(1);
    expect(calls[0]!.input.toString()).toBe("http://localhost:3020/proxy");

    const headers = new Headers(calls[0]!.init?.headers);
    expect(headers.get("X-Target-Url")).toBe(
      "https://ti-api-cors-proxy.seve.workers.dev/v1/export/kicad?mpn=LM358&version=6",
    );
    expect(headers.get("X-Sender-Origin")).toBe(
      "https://ti-api-cors-proxy.seve.workers.dev",
    );
    expect(headers.get("Authorization")).toBe("Bearer secret-token");
    expect(headers.get("Accept")).toBe("application/zip");
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
});
