import { describe, expect, it } from "vitest";
import type { JamRound } from "../src/lib/domain/types";
import {
  getFeaturedRound,
  getJamStatus,
  validateJamRounds,
} from "../src/lib/jams/status";

function round(slug: string, startsAt: string, endsAt: string): JamRound {
  return {
    id: slug,
    slug,
    title: "Один месяц — одна игра",
    monthLabel: slug,
    theme: "Тест",
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
});
