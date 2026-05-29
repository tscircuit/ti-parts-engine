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
    "KiCADv6/footprints.pretty/MSP430_Test.kicad_mod",
    `(footprint "MSP430_Test"
  (layer "F.Cu")
  (attr smd)
  (fp_text reference "REF**" (at 0 -1.5 0) (layer "F.SilkS")
    (effects (font (size 1 1) (thickness 0.15))))
  (fp_text value "MSP430_Test" (at 0 1.5 0) (layer "F.Fab")
    (effects (font (size 1 1) (thickness 0.15))))
  (pad "1" smd rect (at -0.65 0 0) (size 0.5 1.1) (layers "F.Cu" "F.Paste" "F.Mask"))
  (pad "2" smd rect (at 0.65 0 0) (size 0.5 1.1) (layers "F.Cu" "F.Paste" "F.Mask"))
)`,
  );

  return Buffer.from(await archive.generateAsync({ type: "uint8array" }));
};

test("ti parts engine searches and downloads KiCad archives through the bridge API", async () => {
  const archiveBuffer = Buffer.from("zip-bytes");
  const { url, server, capturedRequests } = await getTestServer({
    archiveResponseBody: archiveBuffer,
  });

  try {
    const tiPartsEngine = new TiPartsEngine({
      partnerToken: "secret-token",
      baseUrl: url,
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

test("ti footprint library downloads a KiCad archive and converts the first .kicad_mod in memory", async () => {
  const archiveBuffer = await createTestKicadArchive();
  const { url, server, capturedRequests } = await getTestServer({
    archiveResponseBody: archiveBuffer,
  });

  try {
    const loadTiFootprint = createTiFootprintLibrary({
      partnerToken: "secret-token",
      baseUrl: url,
    });

    const result = await loadTiFootprint("MSP430");

    expect(result.footprintCircuitJson.length).toBeGreaterThan(0);
    expect(
      result.footprintCircuitJson.some(
        (element) => element.type === "pcb_smtpad",
      ),
    ).toBe(true);
    expect(capturedRequests).toHaveLength(1);

    const archiveRequest = getCapturedRequest(capturedRequests, 0);
    expect(archiveRequest.pathname).toBe("/v1/export/kicad");
    expect(archiveRequest.search).toBe(
      `?mpn=MSP430&version=${DEFAULT_KICAD_VERSION}`,
    );
  } finally {
    await server.stop(true);
  }
});
