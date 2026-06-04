import { afterEach } from "bun:test";
import { ULKiCadProxyServer } from "@tscircuit/fake-ul-kicad-proxy";

export type CapturedHttpRequest = {
  pathname: string;
  search: string;
  method: string;
  headers: Headers;
  body: string;
};

type TestServer = {
  stop(force?: boolean): Promise<void>;
};

type TestServerOptions = {
  searchResponseBody?: string;
  archiveResponseBody?: ArrayBuffer | Uint8Array;
  archiveContentType?: string;
};

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);
const testServers = new Set<ULKiCadProxyServer>();

afterEach(async () => {
  await Promise.all([...testServers].map((server) => server.stop()));
  testServers.clear();
});

export const getTestServer = async (options: TestServerOptions = {}) => {
  const capturedRequests: CapturedHttpRequest[] = [];
  const fakeServer = new ULKiCadProxyServer();
  const handleFakeProxyRequest = fakeServer.handleRequest;
  const archiveContentType = options.archiveContentType ?? "application/zip";

  fakeServer.handleRequest = async (request) => {
    const requestUrl = new URL(request.url);
    const requestBody = METHODS_WITHOUT_BODY.has(request.method)
      ? ""
      : await request.text();

    capturedRequests.push({
      pathname: requestUrl.pathname,
      search: requestUrl.search,
      method: request.method,
      headers: new Headers(request.headers),
      body: requestBody,
    });

    if (requestUrl.pathname === "/v1/parts/search") {
      if (options.searchResponseBody != null) {
        return new Response(options.searchResponseBody, {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
    }

    if (requestUrl.pathname === "/v1/export/kicad") {
      if (options.archiveResponseBody != null) {
        return new Response(toArrayBuffer(options.archiveResponseBody), {
          status: 200,
          headers: { "content-type": archiveContentType },
        });
      }

      return handleFakeProxyRequest(
        createFakeProxyRequest(request, requestBody),
      );
    }

    return handleFakeProxyRequest(createFakeProxyRequest(request, requestBody));
  };

  await fakeServer.start();
  testServers.add(fakeServer);

  const server: TestServer = {
    async stop(_force?: boolean) {
      testServers.delete(fakeServer);
      await fakeServer.stop();
    },
  };

  return {
    fakeUlProxyUrl: fakeServer.url,
    server,
    capturedRequests,
  };
};

const toArrayBuffer = (archiveBytes: ArrayBuffer | Uint8Array) => {
  if (archiveBytes instanceof ArrayBuffer) return archiveBytes;

  return Uint8Array.from(archiveBytes).buffer;
};

const createFakeProxyRequest = (request: Request, requestBody: string) => {
  const headers = new Headers(request.headers);
  if (!headers.has("authorization")) {
    headers.set("authorization", "Bearer test-token");
  }

  return new Request(request.url, {
    method: request.method,
    headers,
    body: METHODS_WITHOUT_BODY.has(request.method) ? undefined : requestBody,
  });
};
