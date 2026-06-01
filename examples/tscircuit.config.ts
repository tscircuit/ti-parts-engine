import { createTiPartsEngine } from "@tscircuit/ti-parts-engine";

export default {
  platformConfig: {
    partsEngine: createTiPartsEngine({
      // local CLI/dev usage only
      partnerToken: process.env.PARTNER_TOKEN!,
    }),
  },
};
