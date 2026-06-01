import type { PlatformConfig } from "@tscircuit/props";

import { createTiFootprintLibrary } from "./createTiFootprintLibrary";
import { createTiPartsEngine } from "./createTiPartsEngine";
import type { TiPartsEngineOptions } from "./types";

export const createTiPlatformConfig = (
  options: TiPartsEngineOptions,
): Pick<PlatformConfig, "partsEngine" | "footprintLibraryMap"> => ({
  partsEngine: createTiPartsEngine(options),
  footprintLibraryMap: createTiFootprintLibrary(options),
});
