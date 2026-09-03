import { describe, expect, it } from "vitest";
import fixture from "./fixtures/itch-entries.json";
import { normalizeItchEntries } from "../src/lib/providers/itch/itch-normalizer";
import { ProviderResponseError } from "../src/lib/providers/errors";

describe("normalizeItchEntries", () => {
  it("maps known itch fields into the provider-independent model", () => {
    const games = normalizeItchEntries(fixture);

    expect(games).toHaveLength(2);
    expect(games[0]).toMatchObject({
      id: "itch:901",
      provider: "itch",
      providerEntryId: "901",
      providerGameId: "1901",
      title: "Полуночный сигнал",
      url: "https://signal-maker.itch.io/midnight-signal",
      coverUrl: "https://img.itch.zone/example-cover.png",
      description: "Найди частоту, пока город спит.",
      submittedAt: "2026-09-02 12:30:00",
      tags: ["Puzzle", "Atmospheric"],
      platforms: ["web", "windows"],
      author: {
        name: "Signal Maker",
        url: "https://signal-maker.itch.io/",
      },
    });
  });

  it("keeps a game renderable when optional fields are missing", () => {
    const games = normalizeItchEntries(fixture);

    expect(games[1]).toEqual({
      id: "itch:902",
      provider: "itch",
      providerEntryId: "902",
      providerGameId: "1902",
      title: "Тихий протокол",
      author: { name: "Команда Quiet" },
      url: "https://quiet-team.itch.io/silent-protocol",
      submittedAt: "2026-09-01 08:00:00",
    });
  });

  it("rejects an invalid root response instead of silently clearing a snapshot", () => {
    expect(() => normalizeItchEntries({ entries: [] })).toThrow(ProviderResponseError);
  });
});
