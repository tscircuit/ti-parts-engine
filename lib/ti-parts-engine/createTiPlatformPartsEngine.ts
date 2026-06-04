import type { PartsEngine } from "@tscircuit/props";

import { createTiPartsEngine } from "./createTiPartsEngine.ts";
import type { TiPartsEngineOptions } from "./types.ts";

/**
 * @deprecated Prefer createTiPartsEngine() for new platform config code.
 */
export const createTiPlatformPartsEngine = (
  options: TiPartsEngineOptions = {},
): PartsEngine => createTiPartsEngine(options);
