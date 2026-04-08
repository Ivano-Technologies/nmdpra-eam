import * as Vega from "vega";
import { compile, type TopLevelSpec } from "vega-lite";

import type { VegaLiteSpec } from "./types";

export async function renderChartToSVG(spec: VegaLiteSpec): Promise<string> {
  const { spec: vegaSpec } = compile(spec as unknown as TopLevelSpec);
  const runtime = Vega.parse(vegaSpec);
  let canvas: unknown;
  try {
    const canvasMod = (await import("canvas")) as {
      createCanvas: (width: number, height: number) => unknown;
    };
    canvas = canvasMod.createCanvas(2, 2);
  } catch {
    // Fallback for environments where canvas native bindings are unavailable.
    canvas = undefined;
  }
  const view = new Vega.View(runtime, { renderer: "none" }).initialize(
    canvas as never
  );
  return view.toSVG();
}
