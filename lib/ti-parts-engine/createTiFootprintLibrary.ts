import type { FootprintLibraryResult } from "@tscircuit/props";
import { parseKicadModToCircuitJson } from "kicad-component-converter";

import { readFirstKicadModFromArchive } from "../kicad-archive/readFirstKicadModFromArchive.ts";
import { DEFAULT_KICAD_VERSION } from "../ultra-librarian-bridge-client/index.ts";
import { TiPartsEngine } from "./TiPartsEngine.ts";
import type { TiPartsEngineOptions } from "./types.ts";

type TiFootprintLoader = (mpn: string) => Promise<FootprintLibraryResult>;
type TiFootprintLibraryMap = {
  ti: TiFootprintLoader;
};

const createTiFootprintLoader = (
  options: TiPartsEngineOptions,
): TiFootprintLoader => {
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

export const createTiFootprintLibrary = (
  options: TiPartsEngineOptions,
): TiFootprintLibraryMap => ({
  ti: createTiFootprintLoader(options),
});
