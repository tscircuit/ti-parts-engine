import type { PartsEngine } from "@tscircuit/props";

import { TiPartsEngine } from "./TiPartsEngine";
import type { TiPartsEngineOptions } from "./types";

export const createTiPartsEngine = (
  options: TiPartsEngineOptions,
): PartsEngine => new TiPartsEngine(options);
