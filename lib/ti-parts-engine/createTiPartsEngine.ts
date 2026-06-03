import type { PartsEngine } from "@tscircuit/props";

import { TiPartsEngine } from "./TiPartsEngine.ts";
import type { TiPartsEngineOptions } from "./types.ts";

export const createTiPartsEngine = (
  options: TiPartsEngineOptions,
): PartsEngine => new TiPartsEngine(options);
