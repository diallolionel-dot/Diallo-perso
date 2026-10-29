import { describe, expect, it } from "vitest";
import { formatDecimal, formatDelta } from "./format";

describe("formatage français", () => {
  it("utilise la virgule décimale", () => {
    expect(formatDecimal(90)).toBe("90,0");
    expect(formatDecimal(72.5, 1)).toBe("72,5");
  });

  it("signe les variations", () => {
    expect(formatDelta(0.1)).toBe("+0,1");
    expect(formatDelta(-0.5)).toBe("−0,5");
    expect(formatDelta(0)).toBe("0,0");
  });
});
