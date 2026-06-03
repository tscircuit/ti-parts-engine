import { normalizeBaseUrl } from "./normalizeBaseUrl.ts";
import { buildKicadExportPath, buildSearchPath } from "./paths.ts";
import { requestArchive } from "./requestArchive.ts";
import { requestJson } from "./requestJson.ts";
import { extractSearchResults } from "./search-response.ts";
import { DEFAULT_BASE_URL } from "./types.ts";
import type {
  UltraLibrarianBridgeClient,
  UltraLibrarianBridgeClientOptions,
} from "./types.ts";

export function createUltraLibrarianBridgeClient(
  options: UltraLibrarianBridgeClientOptions,
): UltraLibrarianBridgeClient {
  const partnerToken = requireNonEmptyString(
    "partnerToken",
    options.partnerToken,
  );
  const baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
  const fetchImpl = options.fetch ?? fetch;
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
  };
}

function requireNonEmptyString(name: string, value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    throw new Error(`${name} is required.`);
  }

  return trimmedValue;
}
