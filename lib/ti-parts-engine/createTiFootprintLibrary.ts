import type { FootprintLibraryResult } from "@tscircuit/props";
import { parseKicadModToCircuitJson } from "kicad-component-converter";

import { readFirstKicadModFromArchive } from "../kicad-archive";
import { DEFAULT_KICAD_VERSION } from "../ultra-librarian-bridge-client";
import { TiPartsEngine } from "./TiPartsEngine";
import type { TiPartsEngineOptions } from "./types";

export const createTiFootprintLibrary = (options: TiPartsEngineOptions) => {
  const engine = new TiPartsEngine(options);

  return async (mpn: string): Promise<FootprintLibraryResult> => {
    const archive = await engine.downloadKicadArchive({
      mpn,
      version: DEFAULT_KICAD_VERSION,
    });
    const kicadModText = await readFirstKicadModFromArchive(
      archive.archiveBuffer,
    );
    const footprintCircuitJson = await parseKicadModToCircuitJson(kicadModText);

    return {
      footprintCircuitJson,
    };
  };
};
