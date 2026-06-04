import type { PlatformConfig } from "@tscircuit/props";

import { createTiFootprintLibrary } from "./createTiFootprintLibrary.ts";
import { createTiPartsEngine } from "./createTiPartsEngine.ts";
import type { TiPartsEngineOptions } from "./types.ts";

export const createTiPlatformConfig = (
  options: TiPartsEngineOptions = {},
): Pick<PlatformConfig, "partsEngine" | "footprintLibraryMap"> => ({
  partsEngine: createTiPartsEngine(options),
  footprintLibraryMap: createTiFootprintLibrary(options),
});
