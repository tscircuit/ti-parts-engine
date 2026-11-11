// Run with Node.js 24.22.1:
// node --test tests/default-bridge-fetch-loopback.test.ts
// These are interface tests with synthetic browser state and a recording fetch.
// They do not make network requests or validate a real browser/proxy.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createDefaultBridgeFetch } from "../lib/ultra-librarian-bridge-client/createDefaultBridgeFetch.ts";

const target = "https://parts.example/search";

type BrowserState = {
  location?: URL;
  TSCIRCUIT_FILESERVER_API_BASE_URL?: string;
};
type CapturedRequest = { input: string | URL; init?: RequestInit };

async function withRecordingFetch(
  browser: BrowserState | undefined,
  run: (context: {
    calls: CapturedRequest[];
    response: Response;
  }) => Promise<void>,
) {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");
  const calls: CapturedRequest[] = [];
  const response = new Response("fixture");

  try {
    if (browser === undefined) {
      Reflect.deleteProperty(globalThis, "window");
    } else {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: browser,
      });
    }
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      writable: true,
      value: async (input: string | URL, init?: RequestInit) => {
        calls.push({ input, init });
        return response;
      },
    });
    await run({ calls, response });
  } finally {
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
    if (originalFetch) {
      Object.defineProperty(globalThis, "fetch", originalFetch);
    } else {
      Reflect.deleteProperty(globalThis, "fetch");
    }
  }
}

const cases: Array<{
  name: string;
  page: string;
  input?: string;
  override?: string;
  expected: string;
}> = [
  {
    name: "localhost uses the automatic proxy",
    page: "http://localhost:3020/",
    expected: "http://localhost:3020/proxy",
  },
  {
    name: "IPv4 loopback uses the automatic proxy",
    page: "http://127.0.0.1:3020/",
    expected: "http://127.0.0.1:3020/proxy",
  },
  {
    name: "IPv6 loopback uses the automatic HTTP proxy",
    page: "http://[::1]:3020/",
    expected: "http://[::1]:3020/proxy",
  },
  {
    name: "IPv6 loopback uses the automatic HTTPS proxy",
    page: "https://[::1]:3443/",
    expected: "https://[::1]:3443/proxy",
  },
  {
    name: "expanded IPv6 loopback is canonicalized before selection",
    page: "http://[0:0:0:0:0:0:0:1]:3020/",
    expected: "http://[::1]:3020/proxy",
  },
  {
    name: "IPv6 loopback with the default port uses the canonical origin",
    page: "http://[::1]:80/",
    expected: "http://[::1]/proxy",
  },
  {
    name: "a different IPv6 address stays direct",
    page: "http://[::2]:3020/",
    expected: target,
  },
  {
    name: "IPv4-mapped IPv6 does not expand the loopback allowlist",
    page: "http://[::ffff:127.0.0.1]:3020/",
    expected: target,
  },
  {
    name: "a remote browser origin stays direct",
    page: "https://app.example/",
    expected: target,
  },
  {
    name: "a hostname containing localhost stays direct",
    page: "http://localhost.example:3020/",
    expected: target,
  },
  {
    name: "another IPv4 address stays direct",
    page: "http://192.0.2.10:3020/",
    expected: target,
  },
  {
    name: "non-HTTP IPv6 loopback stays direct",
    page: "ftp://[::1]:3020/",
    expected: target,
  },
  {
    name: "same-origin IPv6 requests stay direct",
    page: "http://[::1]:3020/editor",
    input: "http://[::1]:3020/search",
    expected: "http://[::1]:3020/search",
  },
  {
    name: "canonicalized same-origin IPv6 requests stay direct",
    page: "http://[0:0:0:0:0:0:0:1]:80/editor",
    input: "http://[::1]/search",
    expected: "http://[::1]/search",
  },
  {
    name: "an explicit proxy still takes priority on IPv6 loopback",
    page: "http://[::1]:3020/",
    override: "http://localhost:4040///",
    expected: "http://localhost:4040/proxy",
  },
  {
    name: "an explicit proxy still works on a remote browser origin",
    page: "https://app.example/",
    override: "https://proxy.example/base/",
    expected: "https://proxy.example/base/proxy",
  },
  {
    name: "same-origin requests stay direct even with an explicit proxy",
    page: "http://[::1]:3020/",
    input: "http://[::1]:3020/search",
    override: "http://localhost:4040/",
    expected: "http://[::1]:3020/search",
  },
  {
    name: "relative request inputs keep the existing direct path",
    page: "http://[::1]:3020/",
    input: "/search",
    expected: "/search",
  },
];

for (const fixture of cases) {
  test(fixture.name, async () => {
    const browser: BrowserState = { location: new URL(fixture.page) };
    if (fixture.override !== undefined) {
      browser.TSCIRCUIT_FILESERVER_API_BASE_URL = fixture.override;
    }
    await withRecordingFetch(browser, async ({ calls, response }) => {
      const input = fixture.input ?? target;
      assert.strictEqual(await createDefaultBridgeFetch()(input), response);
      assert.equal(calls.length, 1);
      assert.ok(calls[0]);
      assert.equal(String(calls[0].input), fixture.expected);
      const headers = new Headers(calls[0].init?.headers);
      if (fixture.expected === input) {
        assert.equal(headers.get("X-Target-Url"), null);
        assert.equal(headers.get("X-Sender-Origin"), null);
      } else {
        assert.equal(headers.get("X-Target-Url"), input);
        assert.equal(headers.get("X-Sender-Origin"), "https://parts.example");
      }
    });
  });
}

test("without a browser, fetch receives the original input and init", async () => {
  await withRecordingFetch(undefined, async ({ calls, response }) => {
    const input = new URL(target);
    const init = { method: "POST", body: "fixture body" };
    assert.strictEqual(await createDefaultBridgeFetch()(input, init), response);
    assert.equal(calls.length, 1);
    assert.ok(calls[0]);
    assert.strictEqual(calls[0].input, input);
    assert.strictEqual(calls[0].init, init);
  });
});

test("a browser without location keeps the direct path", async () => {
  await withRecordingFetch({}, async ({ calls }) => {
    await createDefaultBridgeFetch()(target);
    assert.equal(calls.length, 1);
    assert.ok(calls[0]);
    assert.equal(calls[0].input, target);
  });
});

test("same-origin direct requests preserve input, init and headers", async () => {
  await withRecordingFetch(
    { location: new URL("http://[::1]:3020/") },
    async ({ calls, response }) => {
      const input = new URL("http://[::1]:3020/search");
      const headers = new Headers({ Accept: "application/json" });
      const init = { method: "POST", body: "fixture body", headers };
      assert.strictEqual(await createDefaultBridgeFetch()(input, init), response);
      assert.equal(calls.length, 1);
      assert.ok(calls[0]);
      assert.strictEqual(calls[0].input, input);
      assert.strictEqual(calls[0].init, init);
      assert.deepEqual([...headers], [["accept", "application/json"]]);
    },
  );
});

test("the IPv6 proxy clones headers and preserves POST request options", async () => {
  await withRecordingFetch(
    { location: new URL("http://[::1]:3020/") },
    async ({ calls, response }) => {
      const input = new URL(target);
      const headers = new Headers({
        Accept: "application/zip",
        Authorization: "Bearer fixture-only",
        "Content-Type": "application/json",
      });
      const originalHeaders = [...headers];
      const body = JSON.stringify({ fixture: true });
      const controller = new AbortController();
      const init: RequestInit = {
        method: "POST",
        body,
        headers,
        signal: controller.signal,
        redirect: "manual",
      };

      assert.strictEqual(await createDefaultBridgeFetch()(input, init), response);
      assert.equal(calls.length, 1);
      assert.ok(calls[0]);
      const call = calls[0];
      assert.equal(call.input, "http://[::1]:3020/proxy");
      assert.ok(call.init);
      assert.ok(call.init.headers instanceof Headers);
      assert.notStrictEqual(call.init, init);
      assert.notStrictEqual(call.init.headers, headers);
      assert.equal(call.init.method, "POST");
      assert.equal(call.init.body, body);
      assert.strictEqual(call.init.signal, controller.signal);
      assert.equal(call.init.redirect, "manual");
      assert.equal(call.init.headers.get("Accept"), "application/zip");
      assert.equal(call.init.headers.get("Authorization"), "Bearer fixture-only");
      assert.equal(call.init.headers.get("Content-Type"), "application/json");
      assert.equal(call.init.headers.get("X-Target-Url"), target);
      assert.equal(call.init.headers.get("X-Sender-Origin"), "https://parts.example");
      assert.deepEqual([...headers], originalHeaders);
      assert.strictEqual(init.headers, headers);
    },
  );
});
