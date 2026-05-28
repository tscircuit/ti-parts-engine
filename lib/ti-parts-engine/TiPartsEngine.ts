import { createUltraLibrarianBridgeClient } from "../ultra-librarian-bridge-client";
import type {
  DownloadKicadArchiveResponse,
  SearchPartsResponse,
} from "../ultra-librarian-bridge-client";
import type {
  DownloadKicadArchiveParams,
  SearchPartsParams,
  TiPartsEngineOptions,
} from "./types";

export class TiPartsEngine {
  private readonly options: TiPartsEngineOptions;

  constructor(options: TiPartsEngineOptions) {
    this.options = options;
    this.searchParts = this.searchParts.bind(this);
    this.downloadKicadArchive = this.downloadKicadArchive.bind(this);
  }

  async searchParts(request: SearchPartsParams): Promise<SearchPartsResponse> {
    return await this.createClient().searchParts(request);
  }

  async downloadKicadArchive(
    request: DownloadKicadArchiveParams,
  ): Promise<DownloadKicadArchiveResponse> {
    return await this.createClient().downloadKicadArchive(request);
  }

  private createClient() {
    return createUltraLibrarianBridgeClient(this.options);
  }
}
