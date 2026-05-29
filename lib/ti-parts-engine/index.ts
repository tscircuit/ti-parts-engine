import { TiPartsEngine } from "./TiPartsEngine";
export { createTiPlatformPartsEngine } from "./createTiPlatformPartsEngine";
export {
  DEFAULT_BASE_URL,
  DEFAULT_KICAD_VERSION,
} from "../ultra-librarian-bridge-client";

export { TiPartsEngine };
export type {
  DownloadKicadArchiveParams,
  FindTiPartParams,
  SearchPartsParams,
  TiPartsEngineSourceComponent,
  TiPartsEngineOptions,
  TiSupplierPartNumbers,
} from "./types";

export const createTiPartsEngine = (
  options: ConstructorParameters<typeof TiPartsEngine>[0],
) => new TiPartsEngine(options);
