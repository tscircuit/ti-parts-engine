import { expect, test } from "bun:test";
import JSZip from "jszip";

import {
  createTiFootprintLibrary,
  DEFAULT_KICAD_VERSION,
  TiPartsEngine,
} from "../index";
import type { CapturedHttpRequest } from "./fixtures/get-test-server";
import { getTestServer } from "./fixtures/get-test-server";

const getCapturedRequest = (
  capturedRequests: CapturedHttpRequest[],
  requestIndex: number,
) => {
  const capturedRequest = capturedRequests[requestIndex];
  if (!capturedRequest) {
    throw new Error(`Expected request ${requestIndex + 1} to be captured`);
  }
  return capturedRequest;
};

const createTestKicadArchive = async () => {
  const archive = new JSZip();
  archive.file(
    "KiCADv6/LM358_Test.kicad_sym",
    `(kicad_symbol_lib
  (version 20211014)
  (generator ti-parts-engine-test)
  (symbol "LM358_Test"
    (property "Reference" "U" (at 0 0 0)
      (effects (font (size 1.27 1.27))))
    (property "Value" "LM358" (at 0 -2.54 0)
      (effects (font (size 1.27 1.27))))
    (symbol "LM358_Test_0_1"
      (pin input line (at -5.08 0 0) (length 2.54)
        (name "IN+" (effects (font (size 1.27 1.27))))
        (number "1" (effects (font (size 1.27 1.27)))))
    )
  )
)`,
  );
  archive.file(
    "KiCADv6/footprints.pretty/LM358_Test.kicad_mod",
    `(footprint "LM358_Test"
  (layer "F.Cu")
  (attr smd)
  (fp_text reference "REF**" (at 0 -1.5 0) (layer "F.SilkS")
    (effects (font (size 1 1) (thickness 0.15))))
  (fp_text value "LM358_Test" (at 0 1.5 0) (layer "F.Fab")
    (effects (font (size 1 1) (thickness 0.15))))
  (pad "1" smd rect (at -0.65 0 0) (size 0.5 1.1) (layers "F.Cu" "F.Paste" "F.Mask"))
  (pad "2" smd rect (at 0.65 0 0) (size 0.5 1.1) (layers "F.Cu" "F.Paste" "F.Mask"))
)`,
  );

  return await archive.generateAsync({ type: "uint8array" });
};

const toByteArray = (bytes: ArrayBuffer | Uint8Array) =>
  bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

test("ti parts engine searches and downloads KiCad archives through the bridge API", async () => {
  const archiveBuffer = new Uint8Array([
    122, 105, 112, 45, 98, 121, 116, 101, 115,
  ]);
  const { fakeUlProxyUrl, server, capturedRequests } = await getTestServer({
    archiveResponseBody: archiveBuffer,
  });

  try {
    const tiPartsEngine = new TiPartsEngine({
      partnerToken: "secret-token",
      baseUrl: fakeUlProxyUrl,
    });

    const searchResponse = await tiPartsEngine.searchParts({ query: "LM358" });
    const archiveResponse = await tiPartsEngine.downloadKicadArchive({
      mpn: "LM358",
    });

    expect(searchResponse.results).toHaveLength(1);
    expect(searchResponse.results[0]).toMatchObject({ mpn: "LM358" });
    expect(archiveResponse.contentType).toBe("application/zip");
    expect(Array.from(toByteArray(archiveResponse.archiveBuffer))).toEqual(
      Array.from(archiveBuffer),
    );
    expect(capturedRequests).toHaveLength(2);

    const searchRequest = getCapturedRequest(capturedRequests, 0);
    expect(searchRequest.pathname).toBe("/v1/parts/search");
    expect(searchRequest.search).toBe("?q=LM358&exact_only=true&limit=1");
    expect(searchRequest.method).toBe("GET");
    expect(searchRequest.headers.get("authorization")).toBe(
      "Bearer secret-token",
    );
    expect(searchRequest.headers.get("accept")).toBe("application/json");

    const archiveRequest = getCapturedRequest(capturedRequests, 1);
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
    await server.stop(true);
  }
});

test("ti parts engine can search and download KiCad archives without a partner token", async () => {
  const { fakeUlProxyUrl, server, capturedRequests } = await getTestServer();

  try {
    const tiPartsEngine = new TiPartsEngine({
      baseUrl: fakeUlProxyUrl,
    });

    await tiPartsEngine.searchParts({ query: "LM358" });
    await tiPartsEngine.downloadKicadArchive({
      mpn: "LM358",
    });

    expect(capturedRequests).toHaveLength(2);
    expect(
      getCapturedRequest(capturedRequests, 0).headers.get("authorization"),
    ).toBeNull();
    expect(
      getCapturedRequest(capturedRequests, 1).headers.get("authorization"),
    ).toBeNull();
  } finally {
    await server.stop(true);
  }
});

test("ti parts engine returns ArrayBuffer archive bytes for browser-safe consumers", async () => {
  const archiveBuffer = await createTestKicadArchive();
  const { fakeUlProxyUrl, server } = await getTestServer({
    archiveResponseBody: archiveBuffer,
  });

  try {
    const tiPartsEngine = new TiPartsEngine({
      partnerToken: "secret-token",
      baseUrl: fakeUlProxyUrl,
    });

    const archiveResponse = await tiPartsEngine.downloadKicadArchive({
      mpn: "LM358",
    });

    expect(archiveResponse.archiveBuffer).toBeInstanceOf(ArrayBuffer);
  } finally {
    await server.stop(true);
  }
});

test("ti footprint library downloads a KiCad archive and converts footprint and symbol files in memory", async () => {
  const archiveBuffer = await createTestKicadArchive();
  const { fakeUlProxyUrl, server, capturedRequests } = await getTestServer({
    archiveResponseBody: archiveBuffer,
  });

  try {
    const loadTiFootprint = createTiFootprintLibrary({
      partnerToken: "secret-token",
      baseUrl: fakeUlProxyUrl,
    }).ti;

    if (!loadTiFootprint) {
      throw new Error("Expected TI footprint loader to be defined");
    }

    const result = await loadTiFootprint("LM358");

    expect(result.footprintCircuitJson.length).toBeGreaterThan(0);
    expect(
      result.footprintCircuitJson.some(
        (element: { type?: string }) => element.type === "pcb_smtpad",
      ),
    ).toBe(true);
    expect(
      result.footprintCircuitJson.some(
        (element: { type?: string }) => element.type === "schematic_component",
      ),
    ).toBe(true);
    expect(
      result.footprintCircuitJson.some(
        (element: { type?: string }) => element.type === "schematic_port",
      ),
    ).toBe(true);
    expect(capturedRequests).toHaveLength(1);

    const archiveRequest = getCapturedRequest(capturedRequests, 0);
    expect(archiveRequest.pathname).toBe("/v1/export/kicad");
    expect(archiveRequest.search).toBe(
      `?mpn=LM358&version=${DEFAULT_KICAD_VERSION}`,
    );
  } finally {
    await server.stop(true);
  }
});
