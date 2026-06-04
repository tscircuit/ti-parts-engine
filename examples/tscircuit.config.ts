import {
  createTiFootprintLibrary,
  createTiPartsEngine,
} from "@tscircuit/ti-parts-engine";

export default {
  platformConfig: {
    partsEngine: createTiPartsEngine(),
    footprintLibraryMap: createTiFootprintLibrary(),
  },
};
