import { describe, expect, it } from "vitest";
import {
  formatGameCount,
  formatProviderCount,
  formatRemainingDuration,
  formatRoundNumber,
  formatStatusLabel,
  getTranslations,
  SUPPORTED_LOCALES,
} from "../src/lib/i18n";

describe("round number formatting", () => {
  it("pads round numbers to three digits", () => {
    expect(formatRoundNumber(1)).toBe("001");
    expect(formatRoundNumber(9)).toBe("009");
    expect(formatRoundNumber(10)).toBe("010");
    expect(formatRoundNumber(100)).toBe("100");
  });
});

describe("translation dictionaries", () => {
  it("contain the same required localized OG keys", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const { og } = getTranslations(locale);
      expect(og.projectTitle).toBeTruthy();
      expect(og.monthlyChallengeLabel).toBeTruthy();
      expect(og.monthlyEditionLabel).toBeTruthy();
      expect(og.titleLineOne).toBeTruthy();
      expect(og.titleLineTwo).toBeTruthy();
      expect(og.tagline).toBeTruthy();
      expect(og.defaultGiantLabel).toBeTruthy();
      expect(og.roundLabel("002")).toBeTruthy();
      expect(og.defaultImageAlt).toBeTruthy();
      expect(og.roundImageAlt("002", "September 2026")).toBeTruthy();
    }
  });
});

describe("localized formatters", () => {
  it("formats English and Russian counts", () => {
    expect(formatGameCount("en", 1)).toBe("1 game");
    expect(formatGameCount("en", 2)).toBe("2 games");
    expect(formatGameCount("ru", 1)).toBe("1 игра");
    expect(formatGameCount("ru", 2)).toBe("2 игры");
    expect(formatGameCount("ru", 5)).toBe("5 игр");
    expect(formatProviderCount("en", 2)).toBe("2 platforms");
    expect(formatProviderCount("ru", 5)).toBe("5 площадок");
  });

  it("formats countdown durations and status labels in both locales", () => {
    expect(formatRemainingDuration("en", 2 * 24 * 60 * 60 * 1000)).toBe("2 days");
    expect(formatRemainingDuration("ru", 1 * 24 * 60 * 60 * 1000)).toBe("1 день");
    expect(formatRemainingDuration("ru", 2 * 24 * 60 * 60 * 1000)).toBe("2 дня");
    expect(formatRemainingDuration("ru", 5 * 24 * 60 * 60 * 1000)).toBe("5 дней");
    expect(formatStatusLabel("en", "upcoming")).toBe("Coming soon");
    expect(formatStatusLabel("en", "active")).toBe("Live now");
    expect(formatStatusLabel("en", "finished")).toBe("Finished");
    expect(formatStatusLabel("ru", "upcoming")).toBe("Скоро");
    expect(formatStatusLabel("ru", "active")).toBe("Идёт сейчас");
    expect(formatStatusLabel("ru", "finished")).toBe("Завершён");
  });
});
