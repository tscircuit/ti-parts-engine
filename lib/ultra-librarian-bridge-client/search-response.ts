import type { JsonObject, JsonValue, SearchPartResult } from "./types";

export function extractSearchResults(payload: JsonValue) {
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

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSearchPartResult(value: JsonValue): value is SearchPartResult {
  return isJsonObject(value);
}
