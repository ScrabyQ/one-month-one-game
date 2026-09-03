import { describe, expect, it } from "vitest";
import type { GameEntry } from "../src/lib/domain/types";
import {
  formatSubmissionDate,
  formatSubmissionLabel,
  getLatestGame,
  getSubmittedAtTimestamp,
  getSubmissionPresentation,
  isRecentSubmission,
  RECENT_SUBMISSION_THRESHOLD_MS,
} from "../src/lib/games/presentation";

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

describe("game submission presentation", () => {
  it("parses ISO, legacy UTC, provider date strings, and rejects unsafe values", () => {
    expect(getSubmittedAtTimestamp("2026-09-02T12:30:00Z")).toBe(
      Date.parse("2026-09-02T12:30:00Z"),
    );
    expect(getSubmittedAtTimestamp("2019-11-14 14:38:26")).toBe(
      Date.parse("2019-11-14T14:38:26Z"),
    );
    expect(
      getSubmittedAtTimestamp("Sat Jul 04 2026 20:07:57 GMT+0000 (Coordinated Universal Time)"),
    ).toBe(Date.parse("2026-07-04T20:07:57Z"));
    expect(getSubmittedAtTimestamp(undefined)).toBeUndefined();
    expect(getSubmittedAtTimestamp("   ")).toBeUndefined();
    expect(getSubmittedAtTimestamp("not-a-date")).toBeUndefined();
    expect(getSubmittedAtTimestamp("2026-02-30 12:00:00")).toBeUndefined();
    expect(getSubmittedAtTimestamp("2026-02-30T12:00:00Z")).toBeUndefined();
  });

  it("formats valid dates and returns relative labels for a recent submission", () => {
    const now = new Date("2026-09-03T20:00:00+03:00");

    expect(formatSubmissionDate("2019-11-14 14:38:26")).toContain("14 ноября 2019");
    expect(formatSubmissionLabel("2026-09-03T09:15:00+03:00", now)).toBe("сегодня");
    expect(formatSubmissionLabel("2026-09-02T09:15:00+03:00", now)).toBe("вчера");
    expect(getSubmissionPresentation("not-a-date", now)).toEqual({ isRecent: false });
  });

  it("chooses the latest dated game and ignores missing or invalid dates", () => {
    const latest = getLatestGame([
      game({ id: "itch:missing", title: "Без даты" }),
      game({ id: "itch:old", title: "Старая", submittedAt: "2026-09-01 10:00:00" }),
      game({ id: "itch:latest", title: "Новая", submittedAt: "2026-09-03T12:00:00Z" }),
      game({ id: "itch:invalid", title: "Неверная", submittedAt: "invalid" }),
    ]);

    expect(latest?.id).toBe("itch:latest");
    expect(getLatestGame([game({ id: "itch:missing" })])).toBeUndefined();
  });

  it("treats the 72-hour boundary as recent and rejects future dates", () => {
    const now = new Date("2026-09-03T20:00:00Z");
    const atBoundary = new Date(now.getTime() - RECENT_SUBMISSION_THRESHOLD_MS).toISOString();
    const justOld = new Date(now.getTime() - RECENT_SUBMISSION_THRESHOLD_MS - 1).toISOString();
    const future = new Date(now.getTime() + 1).toISOString();

    expect(isRecentSubmission(atBoundary, now)).toBe(true);
    expect(isRecentSubmission(justOld, now)).toBe(false);
    expect(isRecentSubmission(future, now)).toBe(false);
    expect(isRecentSubmission(undefined, now)).toBe(false);
  });
});
