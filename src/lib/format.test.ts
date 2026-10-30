import { describe, expect, it } from "vitest";
import { formatDecimal, formatDelta, formatDuration } from "./format";

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

  it("formate les durées", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(870)).toBe("14 h 30");
  });
});
