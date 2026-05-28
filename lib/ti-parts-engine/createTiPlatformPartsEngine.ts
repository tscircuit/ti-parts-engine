import type { PartsEngine } from "@tscircuit/props";

import { TiPartsEngine } from "./TiPartsEngine";
import type { TiPartsEngineOptions } from "./types";

export const createTiPlatformPartsEngine = (
  options: TiPartsEngineOptions,
): PartsEngine => {
  const tiPartsEngine = new TiPartsEngine(options);

  return {
    findPart: async ({ sourceComponent, footprinterString }) =>
      await tiPartsEngine.findPart({
        sourceComponent: {
          manufacturer_part_number:
            getManufacturerPartNumber(sourceComponent) ?? undefined,
          name: getSourceComponentName(sourceComponent) ?? undefined,
        },
        footprinterString,
      }),
  };
};

function getManufacturerPartNumber(sourceComponent: unknown) {
  if (!isRecord(sourceComponent)) {
    return null;
  }

  const value = sourceComponent.manufacturer_part_number;
  return typeof value === "string" && value.trim() ? value : null;
}

function getSourceComponentName(sourceComponent: unknown) {
  if (!isRecord(sourceComponent)) {
    return null;
  }

  const value = sourceComponent.name;
  return typeof value === "string" && value.trim() ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
