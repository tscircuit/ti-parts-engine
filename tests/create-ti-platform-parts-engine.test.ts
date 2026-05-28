import { expect, test } from "bun:test";
import type { PartsEngine } from "@tscircuit/props";

import { createTiPlatformPartsEngine } from "../index";

test("createTiPlatformPartsEngine returns a platform-compatible parts engine", () => {
  const partsEngine: PartsEngine = createTiPlatformPartsEngine({
    partnerToken: "secret-token",
  });

  expect(typeof partsEngine.findPart).toBe("function");
});
