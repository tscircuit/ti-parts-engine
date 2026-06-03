import { expect, test } from "bun:test";
import JSZip from "jszip";

import { DEFAULT_KICAD_VERSION, TiPartsEngine } from "../index";
import { getFakeUlKicadProxyTestServer } from "./fixtures/get-fake-ul-kicad-proxy-server";

const toByteArray = (bytes: ArrayBuffer | Uint8Array) =>
  bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

test("ti parts engine integrates with the fake UL KiCad proxy GitHub dependency", async () => {
  const { url } = await getFakeUlKicadProxyTestServer();
  const tiPartsEngine = new TiPartsEngine({
    partnerToken: "secret-token",
    baseUrl: url,
  });

  const searchResponse = await tiPartsEngine.searchParts({
    query: "LM358",
    exactOnly: true,
    limit: 1,
  });
  const archiveResponse = await tiPartsEngine.downloadKicadArchive({
    mpn: "LM358",
  });

  expect(searchResponse.results).toHaveLength(1);
  expect(searchResponse.results[0]).toMatchObject({
    mpn: "LM358",
    footprint_available: true,
    symbol_available: true,
  });
  expect(archiveResponse.contentType).toBe("application/zip");

  const archive = await JSZip.loadAsync(
    toByteArray(archiveResponse.archiveBuffer),
  );
  const archivePaths = Object.keys(archive.files);

  expect(archivePaths).toContain(`KiCADv${DEFAULT_KICAD_VERSION}/README.txt`);
  expect(archivePaths).toContain(
    `KiCADv${DEFAULT_KICAD_VERSION}/footprints.pretty/FAKE_GENERATED_8PIN_PLACEHOLDER.kicad_mod`,
  );

  const readme = await archive
    .file(`KiCADv${DEFAULT_KICAD_VERSION}/README.txt`)
    ?.async("text");

  expect(readme).toContain("fake-ul-kicad-proxy");
  expect(readme).toContain("Requested MPN: LM358");
});
