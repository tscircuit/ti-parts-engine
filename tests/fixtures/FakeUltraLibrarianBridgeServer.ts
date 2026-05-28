export type CapturedHttpRequest = {
  pathname: string;
  search: string;
  method: string;
  headers: Headers;
  body: string;
};

type FakeUltraLibrarianBridgeServerOptions = {
  searchResponseBody?: string;
  archiveResponseBody?: Buffer;
  archiveContentType?: string;
};

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

export class FakeUltraLibrarianBridgeServer {
  private readonly searchResponseBody: string;
  private readonly archiveResponseBody: Buffer;
  private readonly archiveContentType: string;
  private readonly capturedRequestsInternal: CapturedHttpRequest[] = [];
  private server: Bun.Server<undefined> | null = null;

  public origin = "";

  constructor(options: FakeUltraLibrarianBridgeServerOptions = {}) {
    this.searchResponseBody =
      options.searchResponseBody ??
      JSON.stringify({ results: [{ mpn: "LM358" }] });
    this.archiveResponseBody =
      options.archiveResponseBody ?? Buffer.from("zip-bytes");
    this.archiveContentType = options.archiveContentType ?? "application/zip";
    this.handleRequest = this.handleRequest.bind(this);
  }

  public get capturedRequests(): readonly CapturedHttpRequest[] {
    return this.capturedRequestsInternal;
  }

  public start(): void {
    if (this.server) {
      throw new Error("FakeUltraLibrarianBridgeServer is already started");
    }

    this.server = Bun.serve({
      port: 0,
      fetch: this.handleRequest,
    });
    this.origin = `http://127.0.0.1:${this.server.port}`;
  }

  public async stop(): Promise<void> {
    if (!this.server) return;
    const startedServer = this.server;
    this.server = null;
    await startedServer.stop(true);
  }

  private async handleRequest(request: Request): Promise<Response> {
    const requestUrl = new URL(request.url);
    const requestBody = METHODS_WITHOUT_BODY.has(request.method)
      ? ""
      : await request.text();

    this.capturedRequestsInternal.push({
      pathname: requestUrl.pathname,
      search: requestUrl.search,
      method: request.method,
      headers: new Headers(request.headers),
      body: requestBody,
    });

    if (requestUrl.pathname === "/v1/parts/search") {
      return new Response(this.searchResponseBody, {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (requestUrl.pathname === "/v1/export/kicad") {
      return new Response(new Uint8Array(this.archiveResponseBody), {
        status: 200,
        headers: { "content-type": this.archiveContentType },
      });
    }

    return new Response("not-found", { status: 404 });
  }
}
