import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { jams } from "../src/config/jams";
import type { JamRound } from "../src/lib/domain/types";
import { getRoundThemeImage } from "../src/lib/jams/presentation";
import {
  createThemeCardSvg,
  fitThemeText,
  getThemeCardDefinition,
  HEIGHT,
  main,
  parseArgs,
  renderThemeCardPng,
  THEME_TEXT_LAYOUT,
  WIDTH,
} from "../scripts/generate-theme-cards";

function getSecondRound(): JamRound {
  const round = jams.find((candidate) => candidate.round === 2);
  if (!round) throw new Error("Expected round 2 to be configured");
  return round;
}

function pendingRound(round: JamRound): JamRound {
  return {
    ...round,
    themeState: "pending",
    content: {
      ...round.content,
      en: { ...round.content.en, themeAnnouncement: "The theme will be announced before the round starts" },
      ru: { ...round.content.ru, themeAnnouncement: "Тему объявят перед началом раунда" },
    },
  };
}

describe("theme card definitions and rendering", () => {
  it("uses the round theme, localized output paths, and participant-card framing", async () => {
    const round = getSecondRound();
    const english = getThemeCardDefinition(round, "en");
    const russian = getThemeCardDefinition(round, "ru");

    expect(getRoundThemeImage(2, "en")).toBe("/themes/en/round-002.png");
    expect(getRoundThemeImage(2, "ru")).toBe("/themes/ru/round-002.png");
    expect(english.outputPath).toBe("/themes/en/round-002.png");
    expect(english.themeText).toBe("It’s a Classic");
    expect(english.isAnnounced).toBe(true);
    expect(russian.themeText).toBe("Это классика!");

    const englishSvg = createThemeCardSvg(english);
    const russianSvg = createThemeCardSvg(russian);
    expect(englishSvg).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"');
    expect(englishSvg).toContain("ROUND THEME");
    expect(englishSvg).toContain("ROUND 002");
    expect(englishSvg).toContain("OCTOBER 2026");
    expect(englishSvg).toContain("It’s a Classic");
    expect(englishSvg).toContain("href=\"data:image/png;base64,");
    expect(russianSvg).toContain("ТЕМА РАУНДА");
    expect(russianSvg).toContain("Это классика!");
    expect(russianSvg).toContain("ОКТЯБРЬ 2026");

    const png = await renderThemeCardPng(english);
    const metadata = await sharp(png).metadata();
    expect(metadata.format).toBe("png");
    expect(metadata.width).toBe(WIDTH);
    expect(metadata.height).toBe(HEIGHT);
  });

  it("uses the localized announcement while a round theme is pending", () => {
    const round = pendingRound(getSecondRound());
    const english = getThemeCardDefinition(round, "en");
    const russian = getThemeCardDefinition(round, "ru");

    expect(english.isAnnounced).toBe(false);
    expect(english.themeText).toBe("The theme will be announced before the round starts");
    expect(createThemeCardSvg(english)).toContain("THEME ANNOUNCEMENT");
    expect(russian.themeText).toBe("Тему объявят перед началом раунда");
    expect(createThemeCardSvg(russian)).toContain("АНОНС ТЕМЫ");
  });

  it("fails clearly when a pending round has no announcement for the requested locale", () => {
    const round = pendingRound(getSecondRound());
    const missingRussianAnnouncement: JamRound = {
      ...round,
      content: {
        ...round.content,
        ru: { ...round.content.ru, themeAnnouncement: "  " },
      },
    };

    expect(() => getThemeCardDefinition(missingRussianAnnouncement, "ru"))
      .toThrow(/Theme announcement is missing for round 002 \(ru\)/);
  });

  it("wraps long theme text and reduces the type size to fit", () => {
    const round = getSecondRound();
    const card = {
      ...getThemeCardDefinition(round, "en"),
      themeText: "A very long theme about tiny worlds, strange machines, forgotten places, and unexpected adventures",
    };
    const fit = fitThemeText(card.themeText);
    const svg = createThemeCardSvg(card);

    expect(fit.lines.length).toBeGreaterThan(1);
    expect(fit.fontSize).toBeLessThan(THEME_TEXT_LAYOUT.maxFontSize);
    expect(fit.lines.length).toBeLessThanOrEqual(THEME_TEXT_LAYOUT.maxLines);
    expect(svg.match(/<tspan /gu)).toHaveLength(fit.lines.length);
    expect(svg).toContain(`font-size="${fit.fontSize}"`);
  });

  it("rejects theme text that cannot fit in the card", () => {
    expect(() => fitThemeText("word ".repeat(500))).toThrow(/too long to fit/);
  });
});

describe("theme card CLI validation", () => {
  it("accepts a zero-padded round with an optional locale", () => {
    expect(parseArgs(["--round", "002", "--locale", "ru"])).toEqual({ round: 2, locale: "ru" });
    expect(parseArgs(["--round", "2"])).toEqual({ round: 2, locale: undefined });
  });

  it("rejects missing, repeated, and unknown arguments", () => {
    expect(() => parseArgs([])).toThrow(/Missing required --round/);
    expect(() => parseArgs(["--round", "1", "--round", "2"])).toThrow(/only once/);
    expect(() => parseArgs(["--round", "1", "--locale", "de"])).toThrow(/Unknown locale/);
    expect(() => parseArgs(["--round", "1", "--locale", "ru", "--locale", "en"])).toThrow(/only once/);
    expect(() => parseArgs(["--round", "1", "--help"])).toThrow(/cannot be combined/);
    expect(() => parseArgs(["--round", "1", "--unknown"])).toThrow(/Unknown option/);
  });

  it("rejects unknown configured rounds", async () => {
    await expect(main(["--round", "999"])).rejects.toThrow(/Unknown round/);
  });
});
