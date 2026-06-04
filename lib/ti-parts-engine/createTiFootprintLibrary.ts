import type { FootprintLibraryResult } from "@tscircuit/props";
import { KicadToCircuitJsonConverter } from "kicad-to-circuit-json";

import { readFirstKicadLibraryFilesFromArchive } from "../kicad-archive/readFirstKicadLibraryFilesFromArchive.ts";
import { DEFAULT_KICAD_VERSION } from "../ultra-librarian-bridge-client/index.ts";
import { TiPartsEngine } from "./TiPartsEngine.ts";
import type { TiPartsEngineOptions } from "./types.ts";

type TiFootprintLoader = (mpn: string) => Promise<FootprintLibraryResult>;
type TiFootprintLibraryMap = {
  ti: TiFootprintLoader;
};

const createTiFootprintLoader = (
  options: TiPartsEngineOptions = {},
): TiFootprintLoader => {
  const engine = new TiPartsEngine(options);

  return async (mpn: string): Promise<FootprintLibraryResult> => {
    const archive = await engine.downloadKicadArchive({
      mpn,
      version: DEFAULT_KICAD_VERSION,
    });
    const { kicadModText, kicadSymbolLibText } =
      await readFirstKicadLibraryFilesFromArchive(archive.archiveBuffer);
    const footprintCircuitJson = convertKicadFilesToCircuitJson({
      kicadModText,
      kicadSymbolLibText,
    });

    return {
      footprintCircuitJson,
    };
  };
};

export const createTiFootprintLibrary = (
  options: TiPartsEngineOptions = {},
): TiFootprintLibraryMap => ({
  ti: createTiFootprintLoader(options),
});

function convertKicadFilesToCircuitJson({
  kicadModText,
  kicadSymbolLibText,
}: {
  kicadModText: string;
  kicadSymbolLibText?: string;
}) {
  const converter = new KicadToCircuitJsonConverter();
  if (kicadSymbolLibText) {
    converter.addFile("symbol.kicad_sym", kicadSymbolLibText);
  }
  converter.addFile(
    "footprint.kicad_pcb",
    createKicadPcbForFootprint(kicadModText),
  );
  converter.runUntilFinished();

  return converter.getOutput();
}

function createKicadPcbForFootprint(kicadModText: string) {
  return `(kicad_pcb
  (version 20221018)
  (generator ti-parts-engine)
  (general (thickness 1.6))
  (paper "A4")
  (layers
    (0 "F.Cu" signal)
    (31 "B.Cu" signal)
    (32 "B.Adhes" user)
    (33 "F.Adhes" user)
    (34 "B.Paste" user)
    (35 "F.Paste" user)
    (36 "B.SilkS" user)
    (37 "F.SilkS" user)
    (38 "B.Mask" user)
    (39 "F.Mask" user)
    (44 "Edge.Cuts" user)
    (45 "Margin" user)
    (46 "B.CrtYd" user)
    (47 "F.CrtYd" user)
    (48 "B.Fab" user)
    (49 "F.Fab" user)
  )
${ensureKicadFootprintIdentity(kicadModText)}
)`;
}

function ensureKicadFootprintIdentity(kicadModText: string) {
  if (/\((?:tstamp|uuid)\s+/.test(kicadModText)) {
    return kicadModText;
  }

  const tstamp = '  (tstamp "00000000-0000-4000-8000-000000000001")\n';
  const firstNewlineIndex = kicadModText.indexOf("\n");
  if (firstNewlineIndex >= 0) {
    return `${kicadModText.slice(0, firstNewlineIndex + 1)}${tstamp}${kicadModText.slice(firstNewlineIndex + 1)}`;
  }

  return kicadModText.replace(/^(\s*\(footprint\s+"[^"]+")/, `$1\n${tstamp}`);
}
