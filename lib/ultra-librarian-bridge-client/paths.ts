import { DEFAULT_KICAD_VERSION } from "./types";
import type { KicadExportRequest, SearchPartsRequest } from "./types";

export function buildSearchPath(request: SearchPartsRequest) {
  const query = requireNonEmptyString("query", request.query);
  const exactOnly = request.exactOnly ?? true;
  const limit = request.limit ?? 1;
  assertPositiveInteger("limit", limit);

  const params = new URLSearchParams({
    q: query,
    exact_only: String(exactOnly),
    limit: String(limit),
  });

  return `/v1/parts/search?${params.toString()}`;
}

export function buildKicadExportPath(request: KicadExportRequest) {
  const mpn = requireNonEmptyString("mpn", request.mpn);
  const version = request.version ?? DEFAULT_KICAD_VERSION;
  assertPositiveInteger("version", version);

  const params = new URLSearchParams({
    mpn,
    version: String(version),
  });

  return `/v1/export/kicad?${params.toString()}`;
}

function requireNonEmptyString(name: string, value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    throw new Error(`${name} is required.`);
  }

  return trimmedValue;
}

function assertPositiveInteger(name: string, value: number) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
}
