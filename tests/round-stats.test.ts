import { describe, expect, it } from "vitest";
import { aggregateProviderStats, mergeProviderStats } from "../src/lib/aggregation/aggregate-stats";
import { GameSnapshotSchema } from "../src/lib/domain/schemas";

describe("round stats snapshots", () => {
  it("accepts a snapshot with provider-level stats", () => {
    const result = GameSnapshotSchema.safeParse({
      roundId: "2026-09",
      syncedAt: "2026-09-06T00:00:00.000Z",
      stats: {
        registrationsCount: 12,
        submissionsCount: 7,
        providers: [
          { provider: "itch", participantsCount: 5, submissionsCount: 3 },
          { provider: "myindie", participantsCount: 7, submissionsCount: 4 },
        ],
      },
      games: [],
    });

    expect(result.success).toBe(true);
  });

  it("keeps legacy snapshots without stats valid", () => {
    const result = GameSnapshotSchema.safeParse({
      roundId: "2026-09",
      syncedAt: "2026-09-06T00:00:00.000Z",
      games: [],
    });

    expect(result.success).toBe(true);
  });

  it("uses cached provider stats when a fresh provider result is missing", () => {
    const cached = aggregateProviderStats([
      { provider: "itch", participantsCount: 4, submissionsCount: 2 },
      { provider: "myindie", participantsCount: 6, submissionsCount: 5 },
    ]);

    expect(
      mergeProviderStats(
        ["itch", "myindie"],
        [{ provider: "myindie", participantsCount: 7, submissionsCount: 6 }],
        cached.providers,
      ),
    ).toEqual({
      registrationsCount: 11,
      submissionsCount: 8,
      providers: [
        { provider: "itch", participantsCount: 4, submissionsCount: 2 },
        { provider: "myindie", participantsCount: 7, submissionsCount: 6 },
      ],
    });
  });

  it("does not manufacture a zero total when no provider stats exist", () => {
    expect(mergeProviderStats(["itch", "myindie"], [], [])).toBeUndefined();
    expect(mergeProviderStats(["itch"], [], [])).toBeUndefined();
  });
});
