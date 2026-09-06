import { describe, expect, it } from "vitest";
import { ItchProvider } from "../src/lib/providers/itch/itch-provider";
import fixture from "./fixtures/itch-entries.json";

const enabledConfig = {
  type: "itch" as const,
  enabled: true as const,
  jamId: 123456,
  jamUrl: "https://itch.io/jam/example",
};

describe("ItchProvider", () => {
  it("does not expose a placeholder participation URL", () => {
    expect(
      new ItchProvider().getParticipationUrl({
        ...enabledConfig,
        jamUrl: "https://itch.io/jam/REPLACE_WITH_REAL_JAM_SLUG",
      }),
    ).toBeUndefined();
    expect(new ItchProvider().getParticipationUrl(enabledConfig)).toBe(enabledConfig.jamUrl);
  });

  it("retries a temporary server failure and returns normalized entries", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      if (calls === 1) return new Response("temporary outage", { status: 503 });
      return new Response(JSON.stringify(fixture), { status: 200 });
    };

    const entries = await new ItchProvider().fetchEntries(enabledConfig, {
      fetchImpl,
      sleep: async () => undefined,
    });

    expect(calls).toBe(2);
    expect(entries).toHaveLength(2);
    expect(entries[0].provider).toBe("itch");
  });

  it("does not retry a non-retryable 404 response", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      return new Response("not found", { status: 404 });
    };

    await expect(
      new ItchProvider().fetchEntries(enabledConfig, {
        fetchImpl,
        sleep: async () => undefined,
      }),
    ).rejects.toThrow("HTTP 404");
    expect(calls).toBe(1);
  });

  it("reads participant stats from the configured jam page", async () => {
    const fetchImpl: typeof fetch = async (input) => {
      expect(String(input)).toBe(enabledConfig.jamUrl);
      return new Response(`
        <div class="stats_container">
          <div class="stat_box">
            <div class="stat_value">1,234</div>
            <div class="stat_label">Joined</div>
          </div>
        </div>
      `, { status: 200 });
    };

    await expect(
      new ItchProvider().fetchJamStats(enabledConfig, { fetchImpl }),
    ).resolves.toEqual({
      provider: "itch",
      participantsCount: 1234,
    });
  });

  it("keeps entries when jam-page stats cannot be parsed", async () => {
    const fetchImpl: typeof fetch = async (input) => {
      if (String(input).endsWith("entries.json")) {
        return new Response(JSON.stringify(fixture), { status: 200 });
      }
      return new Response("<html><body>changed markup</body></html>", { status: 200 });
    };

    const result = await new ItchProvider().fetchRoundData(enabledConfig, { fetchImpl });

    expect(result.entries).toHaveLength(2);
    expect(result.stats).toBeUndefined();
    expect(result.statsError?.message).toContain("could not parse itch.io participant count");
  });

  it("reuses the entries result for the optional submissions count", async () => {
    const fetchImpl: typeof fetch = async (input) => {
      if (String(input).endsWith("entries.json")) {
        return new Response(JSON.stringify(fixture), { status: 200 });
      }
      return new Response(`
        <div class="stats_container">
          <div class="stat_box">
            <div class="stat_value">5</div>
            <div class="stat_label">Joined</div>
          </div>
        </div>
      `, { status: 200 });
    };

    await expect(
      new ItchProvider().fetchRoundData(enabledConfig, { fetchImpl }),
    ).resolves.toMatchObject({
      stats: {
        provider: "itch",
        participantsCount: 5,
        submissionsCount: 2,
      },
    });
  });
});
