import type { FootprintLibraryResult } from "@tscircuit/props";
import {
  KicadFootprintToCircuitJsonConverter,
  KicadSymbolToCircuitJsonConverter,
} from "kicad-to-circuit-json";

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
  const footprintConverter = new KicadFootprintToCircuitJsonConverter();
  footprintConverter.addFile("footprint.kicad_mod", kicadModText);
  footprintConverter.runUntilFinished();

  if (!kicadSymbolLibText) {
    return footprintConverter.getOutput();
  }

  const symbolConverter = new KicadSymbolToCircuitJsonConverter();
  symbolConverter.addFile("symbol.kicad_sym", kicadSymbolLibText);
  symbolConverter.runUntilFinished();

  return [...footprintConverter.getOutput(), ...symbolConverter.getOutput()];
}
