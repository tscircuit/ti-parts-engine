import type {
  ExportFormatResult,
  GetExportFormatsResponse,
  JsonObject,
  JsonValue,
} from "./types.ts";

export function extractExportFormats(payload: JsonValue) {
  if (!isJsonObject(payload)) {
    return [];
  }

  for (const key of ["formats", "results", "items", "data"]) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value.filter(isExportFormatResult);
    }
  }

  return [];
}

export function extractExportFormatsUid(
  payload: JsonValue,
): GetExportFormatsResponse["uid"] {
  if (!isJsonObject(payload)) {
    return undefined;
  }

  return typeof payload.uid === "string" ? payload.uid : undefined;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isExportFormatResult(value: JsonValue): value is ExportFormatResult {
  return isJsonObject(value);
}
