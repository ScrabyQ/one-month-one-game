import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { jams } from "../src/config/jams";
import type { GameSnapshot, JamRound } from "../src/lib/domain/types";
import { getRoundParticipantsImage } from "../src/lib/jams/presentation";
import {
  createParticipantsCardSvg,
  getParticipantsCardDefinition,
  HEIGHT,
  main,
  mainNumberFontSize,
  parseArgs,
  WIDTH,
  ROUND_NUMBER_LAYOUT,
} from "../scripts/generate-participants-cards";

function getFirstRound(): JamRound {
  const round = jams[0];
  if (!round) throw new Error("Expected a configured jam round");
  return round;
}

function createSnapshot(round: JamRound, registrationsCount = 16): GameSnapshot {
  return {
    roundId: round.id,
    syncedAt: "2026-09-10T12:34:56.000Z",
    stats: {
      registrationsCount,
      providers: [
        { provider: "myindie", participantsCount: 9 },
        { provider: "itch", participantsCount: 7 },
      ],
    },
    games: [
      {
        id: "only-one-game",
        provider: "itch",
        title: "A game that must not determine the total",
        author: { name: "Author" },
        url: "https://itch.io/game/only-one-game",
      },
    ],
  };
}

describe("participants card definitions and SVG", () => {
  it("resolves the configured round and path by round number", () => {
    expect(getRoundParticipantsImage(1, "en")).toBe("/participants/en/round-001.png");
    expect(getRoundParticipantsImage(1, "ru")).toBe("/participants/ru/round-001.png");

    const round = { ...getFirstRound(), presentation: { accent: "#ff8a75" } };
    const card = getParticipantsCardDefinition(round, createSnapshot(round), "en");

    expect(card.outputPath).toBe("/participants/en/round-001.png");
    expect(card.registrationsCount).toBe(16);
    expect(card.providers.map((provider) => provider.label)).toEqual(["itch.io", "MyIndie.net"]);
    expect(card.providers.map((provider) => provider.participantsCount)).toEqual([7, 9]);
    expect(card.accent).toBe("#ff8a75");
  });

  it("renders localized copy, month labels, and a non-default round accent", async () => {
    const round = { ...getFirstRound(), presentation: { accent: "#ff8a75" } };
    const snapshot = createSnapshot(round);
    const english = getParticipantsCardDefinition(round, snapshot, "en");
    const russian = getParticipantsCardDefinition(round, snapshot, "ru");

    expect(`${WIDTH}x${HEIGHT}`).toBe("1200x630");
    const englishSvg = createParticipantsCardSvg(english);
    const russianSvg = createParticipantsCardSvg(russian);

    expect(englishSvg).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"');
    expect(englishSvg).toContain("ROUND PARTICIPANTS");
    expect(englishSvg).not.toContain("REGISTRATIONS ACROSS PLATFORMS");
    expect(englishSvg).toContain("ROUND 001");
    expect(englishSvg).toContain("SEPTEMBER 2026");
    expect(englishSvg).not.toContain("DATA:");
    expect(englishSvg).toContain("itch.io");
    expect(englishSvg).toContain("MyIndie.net");
    expect(englishSvg).toContain("#ff8a75");
    expect(englishSvg).not.toContain("data-participant-marker");
    expect(englishSvg).not.toContain(">+5</text>");
    expect(englishSvg).toContain(
      `<text x="${ROUND_NUMBER_LAYOUT.x}" y="${ROUND_NUMBER_LAYOUT.y}" fill="#ff8a75" fill-opacity="${ROUND_NUMBER_LAYOUT.opacity}" font-family="monospace" font-size="${ROUND_NUMBER_LAYOUT.fontSize}"`,
    );
    expect(englishSvg.indexOf(`font-size="${ROUND_NUMBER_LAYOUT.fontSize}"`)).toBeLessThan(
      englishSvg.indexOf("SEPTEMBER 2026"),
    );

    expect(russianSvg).toContain("УЧАСТНИКИ РАУНДА");
    expect(russianSvg).not.toContain("РЕГИСТРАЦИИ НА ПЛОЩАДКАХ");
    expect(russianSvg).toContain("РАУНД 001");
    expect(russianSvg).toContain("СЕНТЯБРЬ 2026");
    expect(russianSvg).not.toContain("ДАННЫЕ:");
    expect(englishSvg).toContain('text x="600" y="405" text-anchor="middle"');
    expect(englishSvg).toContain('path d="M 310 505 H 890"');

    const metadata = await sharp(Buffer.from(englishSvg)).metadata();
    expect(metadata.width).toBe(WIDTH);
    expect(metadata.height).toBe(HEIGHT);
  });

  it("uses fixed main-number sizes", () => {
    expect(mainNumberFontSize(0)).toBe(230);
    expect(mainNumberFontSize(99)).toBe(230);
    expect(mainNumberFontSize(100)).toBe(195);
    expect(mainNumberFontSize(999)).toBe(195);
    expect(mainNumberFontSize(1000)).toBe(165);
    expect(mainNumberFontSize(9999)).toBe(165);
    expect(mainNumberFontSize(10000)).toBe(140);
  });

  it("rejects snapshots without participant statistics", () => {
    const round = getFirstRound();
    const snapshot: GameSnapshot = {
      roundId: round.id,
      syncedAt: "2026-09-10T12:34:56.000Z",
      games: [],
    };

    expect(() => getParticipantsCardDefinition(round, snapshot, "en"))
      .toThrow(/statistics are unavailable/);
  });
});

describe("participants CLI validation", () => {
  it("accepts a zero-padded round, one locale, and cached mode", () => {
    expect(parseArgs(["--round", "001", "--locale", "ru", "--cached"])).toEqual({
      round: 1,
      locale: "ru",
      cached: true,
    });
  });

  it("rejects missing, repeated, and unknown arguments", () => {
    expect(() => parseArgs([])).toThrow(/Missing required --round/);
    expect(() => parseArgs(["--round", "1", "--round", "2"])).toThrow(/only once/);
    expect(() => parseArgs(["--round", "1", "--locale", "de"])).toThrow(/Unknown locale/);
    expect(() => parseArgs(["--round", "1", "--cached", "--cached"])).toThrow(/only once/);
    expect(() => parseArgs(["--round", "1", "--help"])).toThrow(/cannot be combined/);
    expect(() => parseArgs(["--round", "1", "--unknown"])).toThrow(/Unknown option/);
  });

  it("rejects unknown configured rounds before reading a snapshot", async () => {
    await expect(main(["--round", "999", "--cached"])).rejects.toThrow(/Unknown round/);
  });

});
