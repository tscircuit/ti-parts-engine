export type CapturedHttpRequest = {
  pathname: string;
  search: string;
  method: string;
  headers: Headers;
  body: string;
};

type TestServerOptions = {
  searchResponseBody?: string;
  archiveResponseBody?: ArrayBuffer | Uint8Array;
  archiveContentType?: string;
};

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

export const getTestServer = async (options: TestServerOptions = {}) => {
  const capturedRequests: CapturedHttpRequest[] = [];
  const searchResponseBody =
    options.searchResponseBody ??
    JSON.stringify({ results: [{ mpn: "LM358" }] });
  const archiveResponseBody =
    options.archiveResponseBody ??
    new Uint8Array([122, 105, 112, 45, 98, 121, 116, 101, 115]);
  const archiveContentType = options.archiveContentType ?? "application/zip";

  const server = Bun.serve({
    port: 0,
    async fetch(request) {
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
        return new Response(searchResponseBody, {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (requestUrl.pathname === "/v1/export/kicad") {
        return new Response(toArrayBuffer(archiveResponseBody), {
          status: 200,
          headers: { "content-type": archiveContentType },
        });
      }

      return new Response("not-found", { status: 404 });
    },
  });

  return {
    url: `http://127.0.0.1:${server.port}`,
    server,
    capturedRequests,
  };
};

const toUint8Array = (archiveBytes: ArrayBuffer | Uint8Array) =>
  archiveBytes instanceof Uint8Array
    ? archiveBytes
    : new Uint8Array(archiveBytes);

const toArrayBuffer = (archiveBytes: ArrayBuffer | Uint8Array) => {
  if (archiveBytes instanceof ArrayBuffer) return archiveBytes;

  return Uint8Array.from(archiveBytes).buffer;
};
