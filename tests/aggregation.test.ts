import { describe, expect, it } from "vitest";
import type { GameEntry } from "../src/lib/domain/types";
import { aggregateGames } from "../src/lib/aggregation/aggregate-games";
import { aggregateProviderStats } from "../src/lib/aggregation/aggregate-stats";

function game(overrides: Partial<GameEntry>): GameEntry {
  return {
    id: "itch:base",
    provider: "itch",
    title: "Базовая игра",
    author: { name: "Автор" },
    url: "https://example.com/game",
    ...overrides,
  };
}

describe("aggregateGames", () => {
  it("combines lists, fills missing optional fields, removes duplicate IDs, and sorts deterministically", () => {
    const result = aggregateGames([
      [
        game({ id: "itch:old", title: "Старая", submittedAt: "2026-09-01 10:00:00" }),
        game({ id: "itch:duplicate", title: "Дубликат", submittedAt: "2026-09-01 09:00:00" }),
      ],
      [
        game({
          id: "itch:new",
          title: "Новая",
          submittedAt: "2026-09-02 10:00:00",
        }),
        game({
          id: "itch:duplicate",
          title: "Другая версия",
          submittedAt: "2026-09-03 10:00:00",
          coverUrl: "https://example.com/cover.png",
        }),
      ],
    ]);

    expect(result.map((entry) => entry.id)).toEqual([
      "itch:new",
      "itch:old",
      "itch:duplicate",
    ]);
    expect(result[2].title).toBe("Дубликат");
    expect(result[2].coverUrl).toBe("https://example.com/cover.png");
  });

  it("places entries without reliable dates after dated entries", () => {
    const result = aggregateGames([
      [
        game({ id: "itch:missing", title: "Альфа" }),
        game({ id: "itch:dated", title: "Бета", submittedAt: "2026-09-01 10:00:00" }),
      ],
    ]);

    expect(result.map((entry) => entry.id)).toEqual(["itch:dated", "itch:missing"]);
  });
});

describe("aggregateProviderStats", () => {
  it("sums registrations across providers without deduplicating people", () => {
    expect(
      aggregateProviderStats([
        { provider: "itch", participantsCount: 5, submissionsCount: 3 },
        { provider: "myindie", participantsCount: 7, submissionsCount: 4 },
      ]),
    ).toEqual({
      registrationsCount: 12,
      submissionsCount: 7,
      providers: [
        { provider: "itch", participantsCount: 5, submissionsCount: 3 },
        { provider: "myindie", participantsCount: 7, submissionsCount: 4 },
      ],
    });
  });

  it("supports providers that do not expose submissions counts", () => {
    expect(
      aggregateProviderStats([
        { provider: "itch", participantsCount: 5 },
        { provider: "future-provider", participantsCount: 2 },
      ]),
    ).toEqual({
      registrationsCount: 7,
      providers: [
        { provider: "itch", participantsCount: 5 },
        { provider: "future-provider", participantsCount: 2 },
      ],
    });
  });
});
