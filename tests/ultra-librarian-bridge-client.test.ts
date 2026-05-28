import { expect, test } from "bun:test";

import { DEFAULT_KICAD_VERSION, TiPartsEngine } from "../index";
import { FakeUltraLibrarianBridgeServer } from "./fixtures/FakeUltraLibrarianBridgeServer";

const getCapturedRequest = (
  fakeBridgeServer: FakeUltraLibrarianBridgeServer,
  requestIndex: number,
) => {
  const capturedRequest = fakeBridgeServer.capturedRequests[requestIndex];
  if (!capturedRequest) {
    throw new Error(`Expected request ${requestIndex + 1} to be captured`);
  }
  return capturedRequest;
};

test("ti parts engine uses the package entrypoint against the bridge API", async () => {
  const archiveBuffer = Buffer.from("zip-bytes");
  const fakeBridgeServer = new FakeUltraLibrarianBridgeServer({
    archiveResponseBody: archiveBuffer,
  });
  fakeBridgeServer.start();

  try {
    const tiPartsEngine = new TiPartsEngine({
      partnerToken: "secret-token",
      baseUrl: fakeBridgeServer.origin,
    });

    const searchResponse = await tiPartsEngine.searchParts({ query: "LM358" });
    const archiveResponse = await tiPartsEngine.downloadKicadArchive({
      mpn: "LM358",
    });

    expect(searchResponse.results).toEqual([{ mpn: "LM358" }]);
    expect(archiveResponse.contentType).toBe("application/zip");
    expect(Buffer.compare(archiveResponse.archiveBuffer, archiveBuffer)).toBe(
      0,
    );
    expect(fakeBridgeServer.capturedRequests).toHaveLength(2);

    const searchRequest = getCapturedRequest(fakeBridgeServer, 0);
    expect(searchRequest.pathname).toBe("/v1/parts/search");
    expect(searchRequest.search).toBe("?q=LM358&exact_only=true&limit=1");
    expect(searchRequest.method).toBe("GET");
    expect(searchRequest.headers.get("authorization")).toBe(
      "Bearer secret-token",
    );
    expect(searchRequest.headers.get("accept")).toBe("application/json");

    const archiveRequest = getCapturedRequest(fakeBridgeServer, 1);
    expect(archiveRequest.pathname).toBe("/v1/export/kicad");
    expect(archiveRequest.search).toBe(
      `?mpn=LM358&version=${DEFAULT_KICAD_VERSION}`,
    );
    expect(archiveRequest.method).toBe("GET");
    expect(archiveRequest.headers.get("authorization")).toBe(
      "Bearer secret-token",
    );
    expect(archiveRequest.headers.get("accept")).toBe("application/zip");
  } finally {
    await fakeBridgeServer.stop();
  }
});
