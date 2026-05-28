import { TiPartsEngine } from "./TiPartsEngine";
export {
  DEFAULT_BASE_URL,
  DEFAULT_KICAD_VERSION,
} from "../ultra-librarian-bridge-client";

export { TiPartsEngine };
export type {
  DownloadKicadArchiveParams,
  SearchPartsParams,
  TiPartsEngineOptions,
} from "./types";

export const createTiPartsEngine = (
  options: ConstructorParameters<typeof TiPartsEngine>[0],
) => new TiPartsEngine(options);
