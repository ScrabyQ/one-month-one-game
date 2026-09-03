import { describe, expect, it } from "vitest";
import { formatRoundNumber } from "../src/lib/i18n/ru";

describe("round number formatting", () => {
  it("pads round numbers to three digits", () => {
    expect(formatRoundNumber(1)).toBe("001");
    expect(formatRoundNumber(9)).toBe("009");
    expect(formatRoundNumber(10)).toBe("010");
    expect(formatRoundNumber(100)).toBe("100");
  });
});
