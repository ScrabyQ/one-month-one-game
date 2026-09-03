import { describe, expect, it } from "vitest";
import type { JamRound } from "../src/lib/domain/types";
import {
  formatJamDateRange,
  formatRemainingDuration,
  getCountdownPartsForDates,
  getFeaturedRound,
  getFinishedRounds,
  getJamStatus,
  getThemePresentation,
  validateJamRounds,
} from "../src/lib/jams/status";

function round(slug: string, startsAt: string, endsAt: string): JamRound {
  return {
    id: slug,
    slug,
    title: "Один месяц — одна игра",
    monthLabel: slug,
    theme: "Тест",
    themeState: "announced",
    startsAt,
    endsAt,
    providers: [],
  };
}

describe("jam status", () => {
  const current = round("current", "2026-09-01T00:00:00Z", "2026-10-01T00:00:00Z");

  it("handles upcoming, active, and finished boundaries", () => {
    expect(getJamStatus(current, new Date("2026-08-31T23:59:59Z"))).toBe("upcoming");
    expect(getJamStatus(current, new Date("2026-09-01T00:00:00Z"))).toBe("active");
    expect(getJamStatus(current, new Date("2026-09-30T23:59:59Z"))).toBe("active");
    expect(getJamStatus(current, new Date("2026-10-01T00:00:00Z"))).toBe("finished");
  });

  it("chooses the active round, otherwise the nearest upcoming or latest finished round", () => {
    const upcoming = round("upcoming", "2026-11-01T00:00:00Z", "2026-12-01T00:00:00Z");
    expect(getFeaturedRound([current, upcoming], new Date("2026-09-10T00:00:00Z")).slug).toBe("current");
    expect(getFeaturedRound([upcoming], new Date("2026-10-10T00:00:00Z")).slug).toBe("upcoming");
    expect(getFeaturedRound([current], new Date("2026-11-10T00:00:00Z")).slug).toBe("current");
  });

  it("rejects overlapping configured rounds", () => {
    const overlapping = round("overlapping", "2026-09-20T00:00:00Z", "2026-10-20T00:00:00Z");
    expect(() => validateJamRounds([current, overlapping])).toThrow(/overlap/);
  });

  it("formats dates and switches to a precise clock near the deadline", () => {
    expect(formatJamDateRange(current)).toBe("01.09 — 01.10");
    expect(formatRemainingDuration((4 * 60 * 60 + 32 * 60 + 18) * 1000)).toBe("04:32:18");
    expect(formatRemainingDuration(24 * 60 * 60 * 1000 - 1)).toBe("23:59:59");

    expect(
      getCountdownPartsForDates(
        "2026-09-01T00:00:00Z",
        "2026-09-30T23:59:59Z",
        new Date("2026-09-30T19:27:41Z"),
      ),
    ).toMatchObject({
      status: "active",
      label: "До конца",
      value: "04:32:18",
      refreshAfterMs: 1000,
    });
  });

  it("uses the same countdown model before start and after finish", () => {
    expect(
      getCountdownPartsForDates(
        "2026-09-10T00:00:00Z",
        "2026-10-01T00:00:00Z",
        new Date("2026-09-08T00:00:00Z"),
      ),
    ).toMatchObject({
      status: "upcoming",
      label: "До старта",
      value: "2 дня",
      refreshAfterMs: 30_000,
    });

    expect(
      getCountdownPartsForDates(
        "2026-09-01T00:00:00Z",
        "2026-09-10T00:00:00Z",
        new Date("2026-09-10T00:00:00Z"),
      ),
    ).toMatchObject({
      status: "finished",
      label: "Статус",
      value: "Раунд завершён",
    });
  });

  it("supports announced and pending theme presentations", () => {
    expect(getThemePresentation(current)).toEqual({ isAnnounced: true, text: "Тест" });

    const pending = {
      ...current,
      themeState: "pending" as const,
      themeAnnouncement: "Объявим в начале месяца",
    };
    expect(getThemePresentation(pending)).toEqual({
      isAnnounced: false,
      text: "Объявим в начале месяца",
    });
    expect(getThemePresentation({ ...pending, themeAnnouncement: undefined })).toEqual({
      isAnnounced: false,
      text: "Тема появится в начале месяца",
    });
  });

  it("returns only finished rounds for the archive", () => {
    const upcoming = round("upcoming", "2026-11-01T00:00:00Z", "2026-12-01T00:00:00Z");
    expect(getFinishedRounds([upcoming, current], new Date("2026-11-10T00:00:00Z")).map((item) => item.slug)).toEqual([
      "current",
    ]);
  });

  it("validates MyIndie configuration with an alias and participation URL", () => {
    const myIndieRound = {
      ...current,
      providers: [
        {
          type: "myindie" as const,
          enabled: true,
          jamAlias: "myindie-level-10",
          jamUrl: "https://myindie.net/jams/jam/myindie-level-10",
        },
      ],
    };

    expect(() => validateJamRounds([myIndieRound])).not.toThrow();
    expect(() =>
      validateJamRounds([
        {
          ...myIndieRound,
          providers: [{ ...myIndieRound.providers[0], jamAlias: "   " }],
        },
      ]),
    ).toThrow(/jam alias/);
  });
});
