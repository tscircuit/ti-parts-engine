import { expect, test } from "bun:test";

import {
  DEFAULT_KICAD_VERSION,
  createTiFootprintLibrary,
} from "../footprint-library";

test("footprint-library entrypoint exposes the TI footprint loader", () => {
  expect(DEFAULT_KICAD_VERSION).toBe(6);

  const footprintLibraryMap = createTiFootprintLibrary({
    partnerToken: "secret-token",
  });

  expect(typeof footprintLibraryMap.ti).toBe("function");
});
