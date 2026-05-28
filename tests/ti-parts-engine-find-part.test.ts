import { expect, test } from "bun:test";

import { TiPartsEngine } from "../index";
import { getTestServer } from "./fixtures/get-test-server";

test("ti parts engine can be used as a platform parts engine", async () => {
  const { url, server, capturedRequests } = await getTestServer();

  try {
    const tiPartsEngine = new TiPartsEngine({
      partnerToken: "secret-token",
      baseUrl: url,
    });

    const supplierPartNumbers = await tiPartsEngine.findPart({
      sourceComponent: {
        manufacturer_part_number: "LM358",
        name: "U1",
      },
      footprinterString: "dip8",
    });

    expect(supplierPartNumbers).toEqual({ ti: ["LM358"] });
    expect(capturedRequests).toHaveLength(1);
    expect(capturedRequests[0]?.pathname).toBe("/v1/parts/search");
    expect(capturedRequests[0]?.search).toBe(
      "?q=LM358&exact_only=true&limit=1",
    );
  } finally {
    await server.stop(true);
  }
});
