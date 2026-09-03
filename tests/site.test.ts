import { describe, expect, it } from "vitest";
import { withBase } from "../src/lib/site";

describe("withBase", () => {
  it("prefixes repository paths without double slashes", () => {
    expect(withBase("/archive/", "/OneMonthOneGame/")).toBe("/OneMonthOneGame/archive/");
    expect(withBase("/", "/OneMonthOneGame/")).toBe("/OneMonthOneGame/");
  });

  it("supports a root custom-domain deployment", () => {
    expect(withBase("/archive/", "/")).toBe("/archive/");
  });
});
