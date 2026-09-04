import { describe, expect, it } from "vitest";
import { jams } from "../src/config/jams";
import {
  createCardSvg,
  getOgCardDefinitions,
  HEIGHT,
  main,
  WIDTH,
} from "../scripts/generate-og-cards";

describe("localized OG card definitions", () => {
  it("creates a default and every configured round for each locale", () => {
    const cards = getOgCardDefinitions();

    expect(cards).toHaveLength((jams.length + 1) * 2);
    expect(cards.map((card) => card.outputPath)).toEqual([
      "/og/en/default.png",
      "/og/en/round-001.png",
      "/og/ru/default.png",
      "/og/ru/round-001.png",
    ]);
    expect(cards.find((card) => card.outputPath === "/og/en/round-001.png")).toMatchObject({
      monthLabel: "September 2026",
      accent: "#d8ff5c",
      editionLabel: "ROUND 001",
    });
    expect(cards.find((card) => card.outputPath === "/og/ru/round-001.png")).toMatchObject({
      monthLabel: "Сентябрь 2026",
      accent: "#d8ff5c",
      editionLabel: "РАУНД 001",
    });
    expect(cards.find((card) => card.outputPath === "/og/en/default.png")).toMatchObject({
      monthLabel: "MONTHLY CHALLENGE",
      editionLabel: "MONTHLY EDITION",
    });
    expect(cards.find((card) => card.outputPath === "/og/ru/default.png")).toMatchObject({
      monthLabel: "ЕЖЕМЕСЯЧНЫЙ ЧЕЛЛЕНДЖ",
      editionLabel: "ЕЖЕМЕСЯЧНЫЙ ВЫПУСК",
    });
  });

  it("renders fully localized copy in the fixed-size SVG source", () => {
    const cards = getOgCardDefinitions();
    const english = cards.find((card) => card.outputPath === "/og/en/round-001.png");
    const russian = cards.find((card) => card.outputPath === "/og/ru/round-001.png");

    expect(`${WIDTH}x${HEIGHT}`).toBe("1200x630");
    expect(english && createCardSvg(english)).toContain("ONE MONTH / ONE GAME");
    expect(english && createCardSvg(english)).toContain("SEPTEMBER 2026");
    expect(english && createCardSvg(english)).toContain("MAKE IT. FINISH IT. SHARE IT.");
    expect(russian && createCardSvg(russian)).toContain("ОДИН МЕСЯЦ / ОДНА ИГРА");
    expect(russian && createCardSvg(russian)).toContain("СЕНТЯБРЬ 2026");
    expect(russian && createCardSvg(russian)).toContain("СДЕЛАЙ. ЗАКОНЧИ. ПОКАЖИ.");
    expect(russian && createCardSvg(russian)).not.toContain("ONE MONTH / ONE GAME");
  });

  it("rejects legacy one-off metadata flags", async () => {
    await expect(main(["--round", "3"])).rejects.toThrow(/config-driven/);
  });
});
