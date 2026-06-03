import type { PartsEngine } from "@tscircuit/props";

import { createUltraLibrarianBridgeClient } from "../ultra-librarian-bridge-client/index.ts";
import type {
  DownloadKicadArchiveResponse,
  SearchPartsResponse,
} from "../ultra-librarian-bridge-client/index.ts";
import type {
  DownloadKicadArchiveParams,
  SearchPartsParams,
  TiPartsEngineOptions,
} from "./types.ts";

type FindPartParams = Parameters<PartsEngine["findPart"]>[0];
type FindPartResult = Awaited<ReturnType<PartsEngine["findPart"]>>;

export class TiPartsEngine implements PartsEngine {
  private readonly options: TiPartsEngineOptions;

  constructor(options: TiPartsEngineOptions) {
    this.options = options;
    this.searchParts = this.searchParts.bind(this);
    this.downloadKicadArchive = this.downloadKicadArchive.bind(this);
    this.findPart = this.findPart.bind(this);
  }

  async findPart({ sourceComponent }: FindPartParams): Promise<FindPartResult> {
    const manufacturerPartNumber = getManufacturerPartNumber(sourceComponent);

    if (!manufacturerPartNumber) {
      return {};
    }

    const searchResponse = await this.searchParts({
      query: manufacturerPartNumber,
      exactOnly: true,
      limit: 1,
    });
    const matchingPart = searchResponse.results[0];
    if (!matchingPart) {
      return {};
    }

    const resolvedPartNumber =
      matchingPart?.mpn ??
      matchingPart?.manufacturer_part_number ??
      matchingPart?.part_number ??
      matchingPart?.gpn ??
      manufacturerPartNumber;

    return {
      ti: [resolvedPartNumber],
    } as FindPartResult;
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

function getManufacturerPartNumber(sourceComponent: unknown) {
  if (!isRecord(sourceComponent)) {
    return null;
  }

  const value = sourceComponent.manufacturer_part_number;
  return typeof value === "string" && value.trim() ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
