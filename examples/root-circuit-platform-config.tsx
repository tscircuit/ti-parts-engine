import React from "react";
import { RootCircuit } from "tscircuit";
import { createTiPartsEngine } from "@tscircuit/ti-parts-engine";

const circuit = new RootCircuit({
  platform: {
    partsEngine: createTiPartsEngine(),
  },
});

circuit.add(
  <board width="20mm" height="20mm">
    <chip
      name="U1"
      manufacturerPartNumber="LM358"
      footprint="dip8"
      pinLabels={{
        pin1: "OUT1",
        pin2: "IN1_NEG",
        pin3: "IN1_POS",
        pin4: "VEE",
        pin5: "IN2_POS",
        pin6: "IN2_NEG",
        pin7: "OUT2",
        pin8: "VCC",
      }}
    />
  </board>,
);

await circuit.renderUntilSettled();

console.log(JSON.stringify(circuit.getCircuitJson(), null, 2));
