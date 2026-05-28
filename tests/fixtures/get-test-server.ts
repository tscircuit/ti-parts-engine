export type CapturedHttpRequest = {
  pathname: string;
  search: string;
  method: string;
  headers: Headers;
  body: string;
};

type TestServerOptions = {
  searchResults?: Array<Record<string, unknown>>;
  searchResponseBody?: string;
  archiveResponseBody?: Buffer;
  archiveContentType?: string;
};

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

export const getTestServer = async (options: TestServerOptions = {}) => {
  const capturedRequests: CapturedHttpRequest[] = [];
  const searchResponseBody =
    options.searchResponseBody ??
    JSON.stringify({ results: options.searchResults ?? [{ mpn: "LM358" }] });
  const archiveResponseBody =
    options.archiveResponseBody ?? Buffer.from("zip-bytes");
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
        return new Response(new Uint8Array(archiveResponseBody), {
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
