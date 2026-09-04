import { describe, expect, it } from "vitest";
import type { JamRound } from "../src/lib/domain/types";
import {
  DEFAULT_ROUND_ACCENT,
  getDefaultSocialImage,
  getRoundMyIndieBanner,
  getRoundPresentation,
} from "../src/lib/jams/presentation";
import { validateJamRounds } from "../src/lib/jams/status";

function round(overrides: Partial<JamRound> = {}): JamRound {
  return {
    id: "2026-09",
    round: 2,
    slug: "2026-09",
    content: {
      en: { title: "One Month — One Game", monthLabel: "September 2026", theme: "Test" },
      ru: { title: "Один месяц — одна игра", monthLabel: "Сентябрь 2026", theme: "Тест" },
    },
    themeState: "announced",
    startsAt: "2026-09-01T00:00:00Z",
    endsAt: "2026-10-01T00:00:00Z",
    providers: [],
    ...overrides,
  };
}

describe("round presentation", () => {
  it("provides safe defaults for optional metadata", () => {
    expect(getRoundPresentation(round(), "en")).toEqual({
      accent: DEFAULT_ROUND_ACCENT,
      socialImage: "/og/en/round-002.png",
    });
    expect(getRoundPresentation(round(), "ru").socialImage).toBe("/og/ru/round-002.png");
    expect(getDefaultSocialImage("en")).toBe("/og/en/default.png");
    expect(getDefaultSocialImage("ru")).toBe("/og/ru/default.png");
    expect(getRoundMyIndieBanner(2, "ru")).toBe("/myindie/ru/round-002.png");
  });

  it("keeps the configured accent while resolving a locale-specific image", () => {
    expect(
      getRoundPresentation(
        round({
          presentation: { accent: "#ff8a75" },
        }),
        "ru",
      ),
    ).toEqual({ accent: "#ff8a75", socialImage: "/og/ru/round-002.png" });
  });

  it("rejects accents outside the controlled #RRGGBB format", () => {
    expect(() => validateJamRounds([round({ presentation: { accent: "#fff" } })])).toThrow(
      /Accent must use #RRGGBB/,
    );
    expect(() => validateJamRounds([round({ presentation: { accent: "lime" } })])).toThrow(
      /Accent must use #RRGGBB/,
    );
  });
});
