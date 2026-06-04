import { afterEach } from "bun:test";
import { ULKiCadProxyServer } from "@tscircuit/fake-ul-kicad-proxy";
import JSZip from "jszip";

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

      const fakeResponse = await handleFakeProxyRequest(
        createFakeProxyRequest(request, requestBody),
      );
      return await normalizeFakeKicadArchiveResponse(fakeResponse);
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

const normalizeFakeKicadArchiveResponse = async (response: Response) => {
  const responseBytes = await response.arrayBuffer();
  const headers = new Headers(response.headers);

  if (
    !response.ok ||
    !headers.get("content-type")?.includes("application/zip")
  ) {
    return new Response(responseBytes, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const zip = await JSZip.loadAsync(responseBytes);

  await Promise.all(
    Object.entries(zip.files).map(async ([archivePath, zipEntry]) => {
      if (zipEntry.dir || !archivePath.endsWith(".kicad_mod")) return;

      zip.file(
        archivePath,
        normalizeFakeKicadModForConverter(await zipEntry.async("text")),
      );
    }),
  );

  return new Response(await zip.generateAsync({ type: "arraybuffer" }), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const normalizeFakeKicadModForConverter = (kicadModText: string) =>
  addDefaultFpTextEffects(addDefaultFootprintLayer(kicadModText));

const addDefaultFootprintLayer = (kicadModText: string) =>
  kicadModText.replace(
    /^(\(footprint[^\n]*\n)(?!\s*\(layer\s)/,
    '$1  (layer "F.Cu")\n',
  );

const addDefaultFpTextEffects = (kicadModText: string) =>
  kicadModText
    .split("\n")
    .map((line) => {
      if (
        !line.trimStart().startsWith("(fp_text ") ||
        line.includes("(effects")
      ) {
        return line;
      }

      return line.replace(
        /\)$/,
        " (effects (font (size 1 1) (thickness 0.15))))",
      );
    })
    .join("\n");
