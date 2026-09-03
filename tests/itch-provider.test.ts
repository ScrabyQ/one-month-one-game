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
});
