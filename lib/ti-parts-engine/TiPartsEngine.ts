import { createUltraLibrarianBridgeClient } from "../ultra-librarian-bridge-client";
import type {
  DownloadKicadArchiveResponse,
  SearchPartsResponse,
} from "../ultra-librarian-bridge-client";
import type {
  DownloadKicadArchiveParams,
  FindTiPartParams,
  SearchPartsParams,
  TiPartsEngineOptions,
  TiSupplierPartNumbers,
} from "./types";

export class TiPartsEngine {
  private readonly options: TiPartsEngineOptions;

  constructor(options: TiPartsEngineOptions) {
    this.options = options;
    this.searchParts = this.searchParts.bind(this);
    this.downloadKicadArchive = this.downloadKicadArchive.bind(this);
    this.findPart = this.findPart.bind(this);
  }

  async findPart({
    sourceComponent,
  }: FindTiPartParams): Promise<TiSupplierPartNumbers> {
    const manufacturerPartNumber =
      sourceComponent.manufacturer_part_number?.trim();

    if (!manufacturerPartNumber) {
      return {};
    }

    const searchResponse = await this.searchParts({
      query: manufacturerPartNumber,
      exactOnly: true,
      limit: 1,
    });
    const matchingPart = searchResponse.results[0];
    const resolvedPartNumber =
      matchingPart?.mpn ??
      matchingPart?.manufacturer_part_number ??
      matchingPart?.part_number ??
      matchingPart?.gpn ??
      manufacturerPartNumber;

    return {
      ti: [resolvedPartNumber],
    };
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
