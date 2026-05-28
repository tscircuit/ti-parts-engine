import { TiPartsEngine } from "./TiPartsEngine";
import type { TiPartsEngineOptions } from "./types";

export const createTiPlatformPartsEngine = (options: TiPartsEngineOptions) =>
  new TiPartsEngine(options);
