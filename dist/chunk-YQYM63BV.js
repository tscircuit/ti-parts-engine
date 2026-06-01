// lib/kicad-archive/getKicadArchiveEntryKind.ts
function getKicadArchiveEntryKind(archivePath) {
  const lowerCasePath = archivePath.toLowerCase();
  if (lowerCasePath.endsWith(".kicad_sym")) {
    return "symbol";
  }
  if (lowerCasePath.endsWith(".kicad_mod")) {
    return "footprint";
  }
  return null;
}

// lib/kicad-archive/readFirstKicadModFromArchive.ts
import JSZip from "jszip";
async function readFirstKicadModFromArchive(archiveBuffer) {
  const zipFile = await JSZip.loadAsync(archiveBuffer);
  for (const zipEntry of Object.values(zipFile.files)) {
    if (zipEntry.dir) continue;
    const archivePath = getSafeArchivePath(zipEntry);
    if (getKicadArchiveEntryKind(archivePath) !== "footprint") continue;
    return await zipEntry.async("text");
  }
  throw new Error("No .kicad_mod file found in KiCad archive.");
}
function getSafeArchivePath(zipEntry) {
  const unsafeOriginalName = zipEntry.unsafeOriginalName;
  if (unsafeOriginalName) {
    assertSafeArchivePath(unsafeOriginalName);
  }
  assertSafeArchivePath(zipEntry.name);
  return zipEntry.name;
}
function assertSafeArchivePath(archivePath) {
  if (archivePath.includes("\\") || /^[a-zA-Z]:/.test(archivePath) || archivePath.startsWith("/")) {
    throw new Error(`Unsafe KiCad archive path: ${archivePath}`);
  }
  const normalizedArchiveSegments = archivePath.split("/").filter((segment) => segment.length > 0 && segment !== ".");
  if (normalizedArchiveSegments.some((segment) => segment === "..") || archivePath.endsWith("/..")) {
    throw new Error(`Unsafe KiCad archive path: ${archivePath}`);
  }
}

// lib/ultra-librarian-bridge-client/types.ts
var DEFAULT_BASE_URL = "https://situations-build-tommy-integrate.trycloudflare.com";
var DEFAULT_KICAD_VERSION = 6;

// lib/ultra-librarian-bridge-client/normalizeBaseUrl.ts
function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

// lib/ultra-librarian-bridge-client/paths.ts
function buildSearchPath(request) {
  const query = requireNonEmptyString("query", request.query);
  const exactOnly = request.exactOnly ?? true;
  const limit = request.limit ?? 1;
  assertPositiveInteger("limit", limit);
  const params = new URLSearchParams({
    q: query,
    exact_only: String(exactOnly),
    limit: String(limit)
  });
  return `/v1/parts/search?${params.toString()}`;
}
function buildKicadExportPath(request) {
  const mpn = requireNonEmptyString("mpn", request.mpn);
  const version = request.version ?? DEFAULT_KICAD_VERSION;
  assertPositiveInteger("version", version);
  const params = new URLSearchParams({
    mpn,
    version: String(version)
  });
  return `/v1/export/kicad?${params.toString()}`;
}
function requireNonEmptyString(name, value) {
  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    throw new Error(`${name} is required.`);
  }
  return trimmedValue;
}
function assertPositiveInteger(name, value) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

// lib/ultra-librarian-bridge-client/requestArchive.ts
async function requestArchive(options) {
  const url = buildRequestUrl(options.baseUrl, options.path);
  logRequest(options.logger, url);
  const response = await options.fetchImpl(url, {
    headers: createBridgeHeaders(options.partnerToken, "application/zip"),
    redirect: "follow"
  });
  if (!response.ok) {
    throw new Error(
      `KiCad export failed with ${response.status} ${response.statusText}: ${await readErrorBody(response)}`
    );
  }
  const contentType = response.headers.get("content-type") ?? "unknown";
  if (!contentType.includes("application/zip") && !contentType.includes("application/octet-stream")) {
    throw new Error(`Expected application/zip but received ${contentType}.`);
  }
  return {
    archiveBuffer: await response.arrayBuffer(),
    contentType
  };
}
function createBridgeHeaders(partnerToken, accept) {
  return {
    Authorization: `Bearer ${partnerToken}`,
    Accept: accept
  };
}
function buildRequestUrl(baseUrl, path) {
  return `${normalizeBaseUrl(baseUrl)}${path}`;
}
function logRequest(logger, url) {
  if (!logger) return;
  const requestUrl = new URL(url);
  logger.log(`GET ${requestUrl.pathname}${requestUrl.search}`);
}
async function readErrorBody(response) {
  const bodyText = (await response.text()).trim();
  return bodyText.length > 0 ? bodyText : "<empty response body>";
}

// lib/ultra-librarian-bridge-client/requestJson.ts
async function requestJson(options) {
  const url = buildRequestUrl2(options.baseUrl, options.path);
  logRequest2(options.logger, url);
  const response = await options.fetchImpl(url, {
    headers: createBridgeHeaders2(options.partnerToken, "application/json")
  });
  if (!response.ok) {
    throw new Error(
      `Search request failed with ${response.status} ${response.statusText}: ${await readErrorBody2(response)}`
    );
  }
  return asJsonValue(await response.json());
}
function createBridgeHeaders2(partnerToken, accept) {
  return {
    Authorization: `Bearer ${partnerToken}`,
    Accept: accept
  };
}
function buildRequestUrl2(baseUrl, path) {
  return `${normalizeBaseUrl(baseUrl)}${path}`;
}
function logRequest2(logger, url) {
  if (!logger) return;
  const requestUrl = new URL(url);
  logger.log(`GET ${requestUrl.pathname}${requestUrl.search}`);
}
async function readErrorBody2(response) {
  const bodyText = (await response.text()).trim();
  return bodyText.length > 0 ? bodyText : "<empty response body>";
}
function asJsonValue(value) {
  return value;
}

// lib/ultra-librarian-bridge-client/search-response.ts
function extractSearchResults(payload) {
  if (Array.isArray(payload)) {
    return payload.filter(isSearchPartResult);
  }
  if (!isJsonObject(payload)) {
    return [];
  }
  for (const key of ["results", "items", "parts", "data"]) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value.filter(isSearchPartResult);
    }
  }
  return [];
}
function isJsonObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isSearchPartResult(value) {
  return isJsonObject(value);
}

// lib/ultra-librarian-bridge-client/createUltraLibrarianBridgeClient.ts
function createUltraLibrarianBridgeClient(options) {
  const partnerToken = requireNonEmptyString2(
    "partnerToken",
    options.partnerToken
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
        logger
      });
      return {
        rawPayload,
        results: extractSearchResults(rawPayload)
      };
    },
    async downloadKicadArchive(request) {
      const path = buildKicadExportPath(request);
      return await requestArchive({
        fetchImpl,
        baseUrl,
        path,
        partnerToken,
        logger
      });
    }
  };
}
function requireNonEmptyString2(name, value) {
  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    throw new Error(`${name} is required.`);
  }
  return trimmedValue;
}

// lib/ti-parts-engine/TiPartsEngine.ts
var TiPartsEngine = class {
  options;
  constructor(options) {
    this.options = options;
    this.searchParts = this.searchParts.bind(this);
    this.downloadKicadArchive = this.downloadKicadArchive.bind(this);
    this.findPart = this.findPart.bind(this);
  }
  async findPart({ sourceComponent }) {
    const manufacturerPartNumber = getManufacturerPartNumber(sourceComponent);
    if (!manufacturerPartNumber) {
      return {};
    }
    const searchResponse = await this.searchParts({
      query: manufacturerPartNumber,
      exactOnly: true,
      limit: 1
    });
    const matchingPart = searchResponse.results[0];
    if (!matchingPart) {
      return {};
    }
    const resolvedPartNumber = matchingPart?.mpn ?? matchingPart?.manufacturer_part_number ?? matchingPart?.part_number ?? matchingPart?.gpn ?? manufacturerPartNumber;
    return {
      ti: [resolvedPartNumber]
    };
  }
  async searchParts(request) {
    return await this.createClient().searchParts(request);
  }
  async downloadKicadArchive(request) {
    return await this.createClient().downloadKicadArchive(request);
  }
  createClient() {
    return createUltraLibrarianBridgeClient(this.options);
  }
};
function getManufacturerPartNumber(sourceComponent) {
  if (!isRecord(sourceComponent)) {
    return null;
  }
  const value = sourceComponent.manufacturer_part_number;
  return typeof value === "string" && value.trim() ? value : null;
}
function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

// lib/ti-parts-engine/createTiFootprintLibrary.ts
import { parseKicadModToCircuitJson } from "kicad-component-converter";
var createTiFootprintLoader = (options) => {
  const engine = new TiPartsEngine(options);
  return async (mpn) => {
    const archive = await engine.downloadKicadArchive({
      mpn,
      version: DEFAULT_KICAD_VERSION
    });
    const kicadModText = await readFirstKicadModFromArchive(
      archive.archiveBuffer
    );
    const footprintCircuitJson = await parseKicadModToCircuitJson(kicadModText);
    return {
      footprintCircuitJson
    };
  };
};
var createTiFootprintLibrary = (options) => ({
  ti: createTiFootprintLoader(options)
});

export {
  getKicadArchiveEntryKind,
  readFirstKicadModFromArchive,
  DEFAULT_BASE_URL,
  DEFAULT_KICAD_VERSION,
  TiPartsEngine,
  createTiFootprintLibrary
};
//# sourceMappingURL=chunk-YQYM63BV.js.map