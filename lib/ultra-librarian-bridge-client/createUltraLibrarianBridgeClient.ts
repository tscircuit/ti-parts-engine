import { normalizeBaseUrl } from "./normalizeBaseUrl.ts";
import {
  buildExportFormatsPath,
  buildKicadExportPath,
  buildSearchPath,
} from "./paths.ts";
import { createDefaultBridgeFetch } from "./createDefaultBridgeFetch.ts";
import { requestArchive } from "./requestArchive.ts";
import { requestJson } from "./requestJson.ts";
import {
  extractExportFormats,
  extractExportFormatsUid,
} from "./export-formats-response.ts";
import { extractSearchResults } from "./search-response.ts";
import { DEFAULT_BASE_URL } from "./types.ts";
import type {
  StepExportRequest,
  UltraLibrarianBridgeClient,
  UltraLibrarianBridgeClientOptions,
} from "./types.ts";

export function createUltraLibrarianBridgeClient(
  options: UltraLibrarianBridgeClientOptions = {},
): UltraLibrarianBridgeClient {
  const partnerToken = normalizeOptionalString(options.partnerToken);
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
  const fetchImpl = options.fetch ?? createDefaultBridgeFetch();
  const logger = options.logger;

  return {
    baseUrl,
    async searchParts(request) {
      const path = buildSearchPath(request);
      const rawPayload = await requestJson({
        fetchImpl,
        baseUrl,
        path,
        partnerToken,
        logger,
      });

      return {
        rawPayload,
        results: extractSearchResults(rawPayload),
      };
    },
    async getExportFormats(request) {
      const path = buildExportFormatsPath(request);
      const rawPayload = await requestJson({
        fetchImpl,
        baseUrl,
        path,
        partnerToken,
        logger,
      });

      return {
        rawPayload,
        uid: extractExportFormatsUid(rawPayload),
        formats: extractExportFormats(rawPayload),
      };
    },
    async downloadKicadArchive(request) {
      const path = buildKicadExportPath(request);
      return await requestArchive({
        fetchImpl,
        baseUrl,
        path,
        partnerToken,
        logger,
      });
    },
    async downloadStepArchive(request) {
      return await requestArchive({
        fetchImpl,
        baseUrl,
        path: "/v1/export",
        method: "POST",
        body: JSON.stringify(buildStepExportPayload(request)),
        requestContentType: "application/json",
        partnerToken,
        logger,
        errorLabel: "STEP export",
      });
    },
  };
}

function normalizeOptionalString(value: string | undefined) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function buildStepExportPayload(request: StepExportRequest) {
  const uid = normalizeOptionalString(request.uid);
  const mpn = normalizeOptionalString(request.mpn);

  if (!uid && !mpn) {
    throw new Error("uid or mpn is required.");
  }

  return {
    ...(uid ? { uid } : {}),
    ...(mpn ? { mpn } : {}),
    format: "step",
  };
}
