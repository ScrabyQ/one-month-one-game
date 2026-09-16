import { describe, expect, it } from "vitest";
import { jams } from "../src/config/jams";
import type { JamRound } from "../src/lib/domain/types";
import {
  formatCountdownDisplay,
  formatJamStartDate,
  formatJamDateRange,
  formatRemainingDuration,
  getThemePresentation,
} from "../src/lib/i18n";
import {
  getActiveRound,
  getCountdownPartsForDates,
  getFeaturedRound,
  getFinishedRounds,
  getJamStatus,
  getRegistrationOpenRound,
  isRegistrationOpen,
  validateJamRounds,
} from "../src/lib/jams/status";

function round(
  slug: string,
  startsAt: string,
  endsAt: string,
  roundNumber = 1,
): JamRound {
  return {
    id: slug,
    round: roundNumber,
    slug,
    content: {
      en: { title: "One Month — One Game", monthLabel: slug, theme: "Test" },
      ru: { title: "Один месяц — одна игра", monthLabel: slug, theme: "Тест" },
    },
    themeState: "announced",
    startsAt,
    endsAt,
    providers: [],
  };
}

describe("jam status", () => {
  const current = round("current", "2026-09-01T00:00:00Z", "2026-10-01T00:00:00Z", 1);

  it("handles upcoming, active, and finished boundaries", () => {
    expect(getJamStatus(current, new Date("2026-08-31T23:59:59Z"))).toBe("upcoming");
    expect(getJamStatus(current, new Date("2026-09-01T00:00:00Z"))).toBe("active");
    expect(getJamStatus(current, new Date("2026-09-30T23:59:59Z"))).toBe("active");
    expect(getJamStatus(current, new Date("2026-10-01T00:00:00Z"))).toBe("finished");
  });

  it("opens registration only within the configured window", () => {
    const next = {
      ...current,
      startsAt: "2026-10-01T00:00:00Z",
      endsAt: "2026-10-31T23:59:59Z",
      registrationStartsAt: "2026-09-15T00:00:00Z",
    };

    expect(isRegistrationOpen(next, new Date("2026-09-14T23:59:59Z"))).toBe(false);
    expect(isRegistrationOpen(next, new Date("2026-09-15T00:00:00Z"))).toBe(true);
    expect(isRegistrationOpen(next, new Date("2026-09-30T23:59:59Z"))).toBe(true);
    expect(isRegistrationOpen(next, new Date("2026-10-01T00:00:00Z"))).toBe(false);
    expect(isRegistrationOpen(current, new Date("2026-09-15T00:00:00Z"))).toBe(false);
  });

  it("selects active and registration-open rounds independently", () => {
    const next = round("next", "2026-10-01T00:00:00Z", "2026-10-31T23:59:59Z", 2);
    const registrationOpen = {
      ...next,
      registrationStartsAt: "2026-09-15T00:00:00Z",
    };

    expect(getActiveRound([current, registrationOpen], new Date("2026-09-15T00:00:00Z"))).toMatchObject({
      slug: "current",
    });
    expect(getRegistrationOpenRound([current, registrationOpen], new Date("2026-09-15T00:00:00Z"))).toMatchObject({
      slug: "next",
    });

    const third = round("third", "2026-11-01T00:00:00Z", "2026-11-30T23:59:59Z", 3);
    const thirdRegistrationOpen = {
      ...third,
      registrationStartsAt: "2026-10-15T00:00:00Z",
    };
    expect(getActiveRound([current, registrationOpen, thirdRegistrationOpen], new Date("2026-10-15T00:00:00Z"))).toMatchObject({
      slug: "next",
    });
    expect(getRegistrationOpenRound([current, registrationOpen, thirdRegistrationOpen], new Date("2026-10-15T00:00:00Z"))).toMatchObject({
      slug: "third",
    });

    const laterRound = {
      ...round("later", "2026-12-01T00:00:00Z", "2026-12-31T23:59:59Z", 4),
      registrationStartsAt: "2026-09-01T00:00:00Z",
    };
    expect(getRegistrationOpenRound([thirdRegistrationOpen, laterRound], new Date("2026-10-15T00:00:00Z"))).toMatchObject({
      slug: "third",
    });
    expect(getRegistrationOpenRound([current], new Date("2026-09-15T00:00:00Z"))).toBeUndefined();
  });

  it("chooses the active round, otherwise the nearest upcoming or latest finished round", () => {
    const upcoming = round("upcoming", "2026-11-01T00:00:00Z", "2026-12-01T00:00:00Z", 2);
    expect(getFeaturedRound([current, upcoming], new Date("2026-09-10T00:00:00Z")).slug).toBe("current");
    expect(getFeaturedRound([upcoming], new Date("2026-10-10T00:00:00Z")).slug).toBe("upcoming");
    expect(getFeaturedRound([current], new Date("2026-11-10T00:00:00Z")).slug).toBe("current");
  });

  it("rejects overlapping configured rounds", () => {
    const overlapping = round("overlapping", "2026-09-20T00:00:00Z", "2026-10-20T00:00:00Z", 2);
    expect(() => validateJamRounds([current, overlapping])).toThrow(/overlap/);
  });

  it("requires positive integer round numbers and rejects duplicates", () => {
    expect(() => validateJamRounds([{ ...current, round: 0 }])).toThrow(/positive integer/);
    expect(() => validateJamRounds([{ ...current, round: 1.5 }])).toThrow(/positive integer/);

    const duplicate = round("duplicate", "2026-11-01T00:00:00Z", "2026-12-01T00:00:00Z", 1);
    expect(() => validateJamRounds([current, duplicate])).toThrow(/configured more than once/);
    expect(() => validateJamRounds([{ ...current, registrationStartsAt: "not-a-date" }])).toThrow(
      /Invalid registrationStartsAt date/,
    );
  });

  it("keeps provider configuration scoped to each configured round", () => {
    expect(() => validateJamRounds(jams)).not.toThrow();

    const firstRound = jams.find((round) => round.id === "2026-09");
    const secondRound = jams.find((round) => round.id === "2026-10");
    const firstItch = firstRound?.providers.find((provider) => provider.type === "itch");
    const secondItch = secondRound?.providers.find((provider) => provider.type === "itch");
    const firstMyIndie = firstRound?.providers.find((provider) => provider.type === "myindie");
    const secondMyIndie = secondRound?.providers.find((provider) => provider.type === "myindie");

    expect(firstItch).toMatchObject({ jamId: 419729 });
    expect(secondItch).toMatchObject({ jamId: 420051 });
    expect(firstMyIndie).toMatchObject({ jamAlias: "odin-mesyac-odna-igra", enabled: true });
    expect(secondMyIndie).toMatchObject({
      jamAlias: "REPLACE_WITH_ROUND_002_JAM_ALIAS",
      enabled: false,
    });
  });

  it("keeps configured round numbers on featured and archive rounds", () => {
    const configuredRounds = [
      round("2026-08", "2026-08-01T00:00:00Z", "2026-08-31T23:59:59Z", 1),
      round("2026-09", "2026-09-01T00:00:00Z", "2026-09-30T23:59:59Z", 2),
    ];
    const featured = getFeaturedRound(configuredRounds, new Date("2026-09-10T00:00:00+03:00"));
    const archived = getFinishedRounds(configuredRounds, new Date("2026-09-10T00:00:00+03:00"));

    expect(featured).toMatchObject({ slug: "2026-09", round: 2 });
    expect(archived).toEqual([
      expect.objectContaining({ slug: "2026-08", round: 1 }),
    ]);
  });

  it("formats dates and switches to a precise clock near the deadline", () => {
    expect(formatJamDateRange("ru", current)).toBe("01.09 — 01.10");
    expect(formatJamDateRange("en", current)).toBe("09/01 — 10/01");
    expect(formatJamDateRange("en", {
      ...current,
      startsAt: "2026-10-01T00:00:00+03:00",
      endsAt: "2026-10-31T23:59:59+03:00",
    })).toBe("10/01 — 10/31");
    expect(formatJamStartDate("en", "2026-10-01T00:00:00+03:00")).toBe("October 1");
    expect(formatJamStartDate("ru", "2026-10-01T00:00:00+03:00")).toBe("1 октября");
    expect(formatRemainingDuration("ru", (4 * 60 * 60 + 32 * 60 + 18) * 1000)).toBe("04:32:18");
    expect(formatRemainingDuration("en", 24 * 60 * 60 * 1000 - 1)).toBe("23:59:59");

    expect(
      getCountdownPartsForDates(
        "2026-09-01T00:00:00Z",
        "2026-09-30T23:59:59Z",
        new Date("2026-09-30T19:27:41Z"),
      ),
    ).toMatchObject({
      status: "active",
      refreshAfterMs: 1000,
    });
    expect(formatCountdownDisplay("ru", getCountdownPartsForDates(
      "2026-09-01T00:00:00Z",
      "2026-09-30T23:59:59Z",
      new Date("2026-09-30T19:27:41Z"),
    ))).toEqual({ label: "До конца", value: "04:32:18" });
    expect(formatCountdownDisplay("en", getCountdownPartsForDates(
      "2026-09-01T00:00:00Z",
      "2026-09-30T23:59:59Z",
      new Date("2026-09-30T19:27:41Z"),
    ))).toEqual({ label: "Until end", value: "04:32:18" });
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
      refreshAfterMs: 30_000,
    });
    expect(formatCountdownDisplay("ru", getCountdownPartsForDates(
      "2026-09-10T00:00:00Z",
      "2026-10-01T00:00:00Z",
      new Date("2026-09-08T00:00:00Z"),
    ))).toEqual({ label: "До старта", value: "2 дня" });

    expect(
      getCountdownPartsForDates(
        "2026-09-01T00:00:00Z",
        "2026-09-10T00:00:00Z",
        new Date("2026-09-10T00:00:00Z"),
      ),
    ).toMatchObject({
      status: "finished",
    });
    expect(formatCountdownDisplay("ru", getCountdownPartsForDates(
      "2026-09-01T00:00:00Z",
      "2026-09-10T00:00:00Z",
      new Date("2026-09-10T00:00:00Z"),
    ))).toEqual({ label: "Статус", value: "Раунд завершён" });
  });

  it("supports announced and pending theme presentations", () => {
    expect(getThemePresentation(current, "ru")).toEqual({ isAnnounced: true, text: "Тест" });

    const pending = {
      ...current,
      themeState: "pending" as const,
      content: {
        ...current.content,
        ru: { ...current.content.ru, themeAnnouncement: "Объявим в начале месяца" },
      },
    };
    expect(getThemePresentation(pending, "ru")).toEqual({
      isAnnounced: false,
      text: "Объявим в начале месяца",
    });
    expect(getThemePresentation({
      ...pending,
      content: { ...pending.content, ru: { ...pending.content.ru, themeAnnouncement: undefined } },
    }, "ru")).toEqual({
      isAnnounced: false,
      text: "Тема появится в начале месяца",
    });
  });

  it("returns only finished rounds for the archive", () => {
    const upcoming = round("upcoming", "2026-11-01T00:00:00Z", "2026-12-01T00:00:00Z", 2);
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
