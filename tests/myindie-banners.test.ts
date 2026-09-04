import { describe, expect, it } from "vitest";
import { jams } from "../src/config/jams";
import { SUPPORTED_LOCALES } from "../src/lib/i18n";
import { getRoundMyIndieBanner } from "../src/lib/jams/presentation";
import { getRoundArtwork } from "../scripts/lib/round-artwork";
import {
  CRITICAL_TEXT_LAYOUT,
  createMyIndieBannerSvg,
  FRAME_LEFT,
  FRAME_RIGHT,
  getMyIndieBannerDefinitions,
  HEIGHT,
  MASCOT_LAYOUT,
  SAFE_AREA_RIGHT,
  SAFE_AREA_WIDTH,
  SAFE_AREA_X,
  main,
  WIDTH,
} from "../scripts/generate-myindie-banners";

describe("localized MyIndie banner definitions", () => {
  it("uses the fixed canvas and centered safe area", () => {
    expect(WIDTH).toBe(1200);
    expect(HEIGHT).toBe(400);
    expect(SAFE_AREA_WIDTH).toBe(700);
    expect(SAFE_AREA_X).toBe(250);
    expect(SAFE_AREA_RIGHT).toBe(950);

    const banner = getMyIndieBannerDefinitions()[0];
    expect(banner && createMyIndieBannerSvg(banner)).toContain(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400">',
    );
  });

  it("creates one banner for every configured round and supported locale", () => {
    const banners = getMyIndieBannerDefinitions();

    expect(banners).toHaveLength(jams.length * SUPPORTED_LOCALES.length);
    expect(banners.map((banner) => banner.outputPath)).toEqual(
      SUPPORTED_LOCALES.flatMap((locale) =>
        jams.map((round) => getRoundMyIndieBanner(round.round, locale)),
      ),
    );
    expect(banners.some((banner) => banner.outputPath.endsWith("/default.png"))).toBe(false);
  });

  it("keeps EN and RU copy localized", () => {
    const banners = getMyIndieBannerDefinitions();
    const english = banners.find((banner) => banner.outputPath === "/myindie/en/round-001.png");
    const russian = banners.find((banner) => banner.outputPath === "/myindie/ru/round-001.png");

    expect(english).toMatchObject({
      projectTitle: "ONE MONTH / ONE GAME",
      editionLabel: "ROUND 001",
      monthLabel: "September 2026",
      titleLineOne: "ONE MONTH —",
      titleLineTwo: "ONE GAME",
    });
    expect(russian).toMatchObject({
      projectTitle: "ОДИН МЕСЯЦ / ОДНА ИГРА",
      editionLabel: "РАУНД 001",
      monthLabel: "Сентябрь 2026",
      titleLineOne: "ОДИН МЕСЯЦ —",
      titleLineTwo: "ОДНА ИГРА",
    });

    const englishSvg = english && createMyIndieBannerSvg(english);
    const russianSvg = russian && createMyIndieBannerSvg(russian);
    expect(englishSvg).toContain("SEPTEMBER 2026");
    expect(englishSvg).toContain("GAMEDEV CHALLENGE");
    expect(englishSvg).not.toContain("ONE MONTH / ONE GAME");
    expect(englishSvg).toContain("ONE MONTH —");
    expect(englishSvg).toContain("ONE GAME");
    expect(russianSvg).toContain("СЕНТЯБРЬ 2026");
    expect(russianSvg).toContain("ГЕЙМДЕВ ЧЕЛЛЕНДЖ");
    expect(russianSvg).toContain("ОДИН МЕСЯЦ —");
    expect(russianSvg).toContain("ОДНА ИГРА");
    expect(russianSvg).not.toContain("ОДИН МЕСЯЦ / ОДНА ИГРА");
    expect(russianSvg).not.toContain("ONE MONTH / ONE GAME");
  });

  it("uses the accent resolved from round presentation", () => {
    const [firstRound] = jams;
    if (!firstRound) throw new Error("Expected a configured jam round");

    const artwork = getRoundArtwork(
      { ...firstRound, presentation: { accent: "#ff8a75" } },
      "en",
    );

    expect(artwork.accent).toBe("#ff8a75");
    expect(createMyIndieBannerSvg(artwork)).toContain("#ff8a75");
  });

  it("keeps every critical text slot inside the safe area", () => {
    for (const layout of Object.values(CRITICAL_TEXT_LAYOUT)) {
      expect(layout.boxX).toBeGreaterThanOrEqual(SAFE_AREA_X);
      expect(layout.boxX + layout.width).toBeLessThanOrEqual(SAFE_AREA_RIGHT);
    }

    expect(CRITICAL_TEXT_LAYOUT.challengeLabel.anchorX).toBe(FRAME_LEFT + 20);
    expect(CRITICAL_TEXT_LAYOUT.roundLabel.anchorX).toBe(FRAME_RIGHT - 20);
  });

  it("keeps geometric accents free of long lines and the mascot inside the safe area", () => {
    const banner = getMyIndieBannerDefinitions()[0];
    const svg = banner && createMyIndieBannerSvg(banner);

    expect(svg).toContain('<rect x="62" y="96" width="16" height="16"');
    expect(svg).toContain('<path d="M 1008 318 L 1022 294 L 1036 318 Z"');
    expect(svg).toContain('<image x="300" y="296" width="160" height="74"');
    expect(svg).toContain('href="data:image/png;base64,');
    expect(MASCOT_LAYOUT.x).toBeGreaterThanOrEqual(SAFE_AREA_X);
    expect(MASCOT_LAYOUT.x + MASCOT_LAYOUT.width).toBeLessThanOrEqual(SAFE_AREA_RIGHT);
    expect(MASCOT_LAYOUT.y).toBeGreaterThanOrEqual(0);
    expect(MASCOT_LAYOUT.y + MASCOT_LAYOUT.height).toBeLessThanOrEqual(HEIGHT);
    expect(MASCOT_LAYOUT.x + MASCOT_LAYOUT.width).toBeLessThan(
      CRITICAL_TEXT_LAYOUT.monthLabel.boxX,
    );
    expect(svg).not.toContain("M 34 84 H 178");
    expect(svg).not.toContain("M 0 330 L 168 162");
  });

  it("rejects legacy one-off metadata flags", async () => {
    await expect(main(["--round", "3"])).rejects.toThrow(/config-driven/);
    await expect(main(["--title", "custom"])).rejects.toThrow(/config-driven/);
  });
});
