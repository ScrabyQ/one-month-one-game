import { describe, expect, it } from "vitest";
import {
  getAbsoluteSiteUrl,
  getLocaleFromPath,
  getLocalizedPath,
  getLocalizedUrl,
  hasExplicitLocalePath,
  resolveBrowserLocale,
  resolveInitialLocale,
  withBase,
} from "../src/lib/site";

describe("withBase", () => {
  it("prefixes repository paths without double slashes", () => {
    expect(withBase("/archive/", "/OneMonthOneGame/")).toBe("/OneMonthOneGame/archive/");
    expect(withBase("/", "/OneMonthOneGame/")).toBe("/OneMonthOneGame/");
    expect(withBase("/OneMonthOneGame/archive/", "/OneMonthOneGame/")).toBe("/OneMonthOneGame/archive/");
  });

  it("supports a root custom-domain deployment", () => {
    expect(withBase("/archive/", "/")).toBe("/archive/");
  });

  it("builds absolute project-page asset URLs", () => {
    expect(
      getAbsoluteSiteUrl(
        "/og/en/round-002.png",
        new URL("https://scrabyq.github.io"),
        "/OneMonthOneGame/",
      ),
      ).toBe("https://scrabyq.github.io/OneMonthOneGame/og/en/round-002.png");
  });

  it("builds absolute root asset URLs for a custom domain", () => {
    expect(
      getAbsoluteSiteUrl("/og/ru/default.png", new URL("https://example.com"), "/"),
    ).toBe("https://example.com/og/ru/default.png");
  });
});

describe("localized paths and locale resolution", () => {
  it("switches equivalent routes with a project-pages base", () => {
    expect(getLocalizedPath("/archive/", "ru", "/OneMonthOneGame/")).toBe("/OneMonthOneGame/ru/archive/");
    expect(getLocalizedPath("/OneMonthOneGame/ru/archive/", "en", "/OneMonthOneGame/")).toBe("/OneMonthOneGame/archive/");
    expect(getLocalizedPath("/jam/2026-09/", "ru", "/OneMonthOneGame/")).toBe("/OneMonthOneGame/ru/jam/2026-09/");
    expect(getLocalizedPath("/OneMonthOneGame/ru/jam/2026-09/", "en", "/OneMonthOneGame/")).toBe("/OneMonthOneGame/jam/2026-09/");
    expect(getLocalizedPath("/archive/", "ru", "/")).toBe("/ru/archive/");
  });

  it("preserves query strings and hashes while switching locale", () => {
    expect(getLocalizedUrl(
      new URL("https://example.com/OneMonthOneGame/ru/?view=all#about"),
      "en",
      "/OneMonthOneGame/",
    )).toBe("/OneMonthOneGame/?view=all#about");
  });

  it("resolves explicit paths, stored choices, and browser languages", () => {
    expect(getLocaleFromPath("/OneMonthOneGame/ru/jam/2026-09/", "/OneMonthOneGame/")).toBe("ru");
    expect(hasExplicitLocalePath("/OneMonthOneGame/ru/", "/OneMonthOneGame/")).toBe(true);
    expect(resolveBrowserLocale(["ru-RU"], "en-US")).toBe("ru");
    expect(resolveBrowserLocale(["en-US"], "ru-RU")).toBe("en");
    expect(resolveBrowserLocale(["de-DE"], "fr-FR")).toBe("en");
    expect(resolveInitialLocale("/", "ru", ["en-US"], "en-US", "/")).toBe("ru");
    expect(resolveInitialLocale("/ru/", "en", ["en-US"], "en-US", "/")).toBe("ru");
  });
});
