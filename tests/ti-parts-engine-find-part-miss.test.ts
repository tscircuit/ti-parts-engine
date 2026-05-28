import { expect, test } from "bun:test";

import { TiPartsEngine } from "../index";
import { getTestServer } from "./fixtures/get-test-server";

test("ti parts engine returns no supplier part when exact search misses", async () => {
  const { url, server } = await getTestServer({
    searchResponseBody: JSON.stringify({ results: [] }),
  });

  try {
    const tiPartsEngine = new TiPartsEngine({
      partnerToken: "secret-token",
      baseUrl: url,
    });

    const supplierPartNumbers = await tiPartsEngine.findPart({
      sourceComponent: {
        manufacturer_part_number: "NOT-A-REAL-TI-MPN",
        name: "U1",
      },
    });

    expect(supplierPartNumbers).toEqual({});
  } finally {
    await server.stop(true);
  }
});
