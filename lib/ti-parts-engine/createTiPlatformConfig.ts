import type { PlatformConfig } from "@tscircuit/props";

import { createTiFootprintLibrary } from "./createTiFootprintLibrary";
import { createTiPlatformPartsEngine } from "./createTiPlatformPartsEngine";
import type { TiPartsEngineOptions } from "./types";

export const createTiPlatformConfig = (
  options: TiPartsEngineOptions,
): Pick<PlatformConfig, "partsEngine" | "footprintLibraryMap"> => ({
  partsEngine: createTiPlatformPartsEngine(options),
  footprintLibraryMap: {
    ti: createTiFootprintLibrary(options),
  },
});
