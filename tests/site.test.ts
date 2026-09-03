import { describe, expect, it } from "vitest";
import { getAbsoluteSiteUrl, withBase } from "../src/lib/site";

describe("withBase", () => {
  it("prefixes repository paths without double slashes", () => {
    expect(withBase("/archive/", "/OneMonthOneGame/")).toBe("/OneMonthOneGame/archive/");
    expect(withBase("/", "/OneMonthOneGame/")).toBe("/OneMonthOneGame/");
  });

  it("supports a root custom-domain deployment", () => {
    expect(withBase("/archive/", "/")).toBe("/archive/");
  });

  it("builds absolute project-page asset URLs", () => {
    expect(
      getAbsoluteSiteUrl(
        "/og/round-002.png",
        new URL("https://scrabyq.github.io"),
        "/OneMonthOneGame/",
      ),
    ).toBe("https://scrabyq.github.io/OneMonthOneGame/og/round-002.png");
  });

  it("builds absolute root asset URLs for a custom domain", () => {
    expect(
      getAbsoluteSiteUrl("/og/default.png", new URL("https://example.com"), "/"),
    ).toBe("https://example.com/og/default.png");
  });
});
