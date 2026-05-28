import React from "react";
import { expect, test } from "bun:test";
import { RootCircuit } from "tscircuit";

import { createTiPlatformPartsEngine } from "../index";
import { getTestServer } from "./fixtures/get-test-server";

test("RootCircuit gets no TI supplier part when exact search misses", async () => {
  const { url, server } = await getTestServer({
    searchResults: [],
  });
  const circuit = new RootCircuit({
    platform: {
      partsEngine: createTiPlatformPartsEngine({
        partnerToken: "secret-token",
        baseUrl: url,
      }),
    },
  });

  circuit.add(
    <board width="20mm" height="20mm">
      <chip name="U1" manufacturerPartNumber="NOT-A-REAL-TI-MPN" />
    </board>,
  );

  await circuit.renderUntilSettled();
  await server.stop(true);

  const sourceComponent = circuit
    .getCircuitJson()
    .find(
      (element) =>
        element.type === "source_component" &&
        element.manufacturer_part_number === "NOT-A-REAL-TI-MPN",
    );

  expect(sourceComponent).toMatchObject({
    supplier_part_numbers: {},
  });
});
