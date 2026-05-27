import { describe, expect, mock, test } from "bun:test";

import {
  buildKicadExportPath,
  buildSearchPath,
  createBridgeHeaders,
  createUltraLibrarianBridgeClient,
  describeSearchResult,
  extractSearchResults,
  normalizeBaseUrl,
} from "../lib/ultra-librarian-bridge-client";

describe("ultra-librarian-bridge-client", () => {
  test("buildSearchPath matches the pilot endpoint contract", () => {
    expect(buildSearchPath({ query: "LM358", exactOnly: true, limit: 1 })).toBe(
      "/v1/parts/search?q=LM358&exact_only=true&limit=1",
    );
  });

  test("buildKicadExportPath matches the pilot endpoint contract", () => {
    expect(buildKicadExportPath({ mpn: "LM358", version: 6 })).toBe(
      "/v1/export/kicad?mpn=LM358&version=6",
    );
  });

  test("normalizeBaseUrl removes trailing slashes", () => {
    expect(normalizeBaseUrl("https://example.com///")).toBe(
      "https://example.com",
    );
  });

  test("createBridgeHeaders uses bearer auth without mutating token", () => {
    expect(createBridgeHeaders("secret-token", "application/json")).toEqual({
      Authorization: "Bearer secret-token",
      Accept: "application/json",
    });
  });

  test("extractSearchResults handles common wrapped payloads", () => {
    expect(extractSearchResults({ results: [{ mpn: "LM358" }] })).toEqual([
      { mpn: "LM358" },
    ]);
    expect(extractSearchResults({ parts: [{ mpn: "LM358" }] })).toEqual([
      { mpn: "LM358" },
    ]);
    expect(extractSearchResults([{ mpn: "LM358" }])).toEqual([
      { mpn: "LM358" },
    ]);
  });

  test("describeSearchResult picks a human-readable identifier", () => {
    expect(describeSearchResult({ manufacturer_part_number: "LM358DR" })).toBe(
      "LM358DR",
    );
    expect(describeSearchResult({ foo: "bar" })).toBe(
      "result present but no recognized identifier field",
    );
  });

  test("searchParts uses the expected request URL and auth header", async () => {
    const fetchMock = mock(async (input: string | URL, init?: RequestInit) => {
      expect(String(input)).toBe(
        "https://example.com/v1/parts/search?q=LM358&exact_only=true&limit=1",
      );

      const headers = new Headers(init?.headers);
      expect(headers.get("authorization")).toBe("Bearer secret-token");
      expect(headers.get("accept")).toBe("application/json");

      return new Response(JSON.stringify({ results: [{ mpn: "LM358" }] }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    });

    const client = createUltraLibrarianBridgeClient({
      partnerToken: "secret-token",
      baseUrl: "https://example.com/",
      fetch: fetchMock,
    });

    const response = await client.searchParts({ query: "LM358" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.results).toEqual([{ mpn: "LM358" }]);
  });

  test("downloadKicadArchive returns the response buffer", async () => {
    const archiveBuffer = Buffer.from("zip-bytes");
    const fetchMock = mock(async (_input: string | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("authorization")).toBe("Bearer secret-token");
      expect(headers.get("accept")).toBe("application/zip");

      return new Response(archiveBuffer, {
        status: 200,
        headers: {
          "content-type": "application/zip",
        },
      });
    });

    const client = createUltraLibrarianBridgeClient({
      partnerToken: "secret-token",
      fetch: fetchMock,
    });

    const response = await client.downloadKicadArchive({ mpn: "LM358" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.contentType).toBe("application/zip");
    expect(Buffer.compare(response.archiveBuffer, archiveBuffer)).toBe(0);
  });
});
