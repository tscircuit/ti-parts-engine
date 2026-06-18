import { TiPartsEngine } from "./TiPartsEngine.ts";
import type { TiPartsEngineOptions } from "./types.ts";

export const createTiPartsEngine = (
  options: TiPartsEngineOptions = {},
): TiPartsEngine => new TiPartsEngine(options);
