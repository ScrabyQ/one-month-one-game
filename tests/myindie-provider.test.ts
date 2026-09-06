import { describe, expect, it } from "vitest";
import { providerRegistry } from "../src/lib/providers/registry";
import { ProviderConfigurationError, ProviderResponseError } from "../src/lib/providers/errors";
import { MyIndieProvider } from "../src/lib/providers/myindie/myindie-provider";
import { MYINDIE_PAGE_SIZE } from "../src/lib/providers/myindie/myindie-client";
import {
  anotherJam,
  makeGame,
  publishedGame,
  publishedJam,
} from "./fixtures/myindie-api";

const enabledConfig = {
  type: "myindie" as const,
  enabled: true,
  jamAlias: publishedJam.alias,
  jamUrl: "https://myindie.net/jams/jam/myindie-level-10",
};

interface RequestRecord {
  path: string;
  body: Record<string, unknown>;
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function createFetch(
  handler: (request: RequestRecord) => Response,
): { fetchImpl: typeof fetch; requests: RequestRecord[] } {
  const requests: RequestRecord[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    const request = {
      path: new URL(url).pathname,
      body: JSON.parse(String(init?.body)) as Record<string, unknown>,
    };
    requests.push(request);
    return handler(request);
  };

  return { fetchImpl, requests };
}

function requestPage(request: RequestRecord): number {
  const options = request.body.options as { page: number };
  return options.page;
}

describe("MyIndieProvider", () => {
  it("is registered and exposes its configured participation URL", () => {
    const provider = providerRegistry.get("myindie");

    expect(provider.id).toBe("myindie");
    expect(providerRegistry.getMeta("myindie")).toEqual({
      label: "MyIndie.net",
      badgeLabel: "MYINDIE",
    });
    expect(provider.getParticipationUrl?.(enabledConfig)).toBe(enabledConfig.jamUrl);
    expect(
      provider.getParticipationUrl?.({ ...enabledConfig, enabled: false }),
    ).toBeUndefined();
  });

  it("resolves a jam from the first page and maps its metadata", async () => {
    const { fetchImpl, requests } = createFetch((request) => {
      if (request.path === "/api/jams") {
        return jsonResponse({ jams: [publishedJam], count: 1 });
      }
      return jsonResponse({ games: [], count: 0 });
    });

    const jam = await new MyIndieProvider().getJam(publishedJam.alias, { fetchImpl });

    expect(jam).toEqual({
      id: publishedJam.id,
      alias: publishedJam.alias,
      title: publishedJam.title,
      theme: publishedJam.theme,
      startsAt: "2023-11-14T22:13:20.000Z",
      endsAt: "2023-11-15T22:13:20.000Z",
      participantsCount: publishedJam.regsCount,
      submissionsCount: publishedJam.gamesCount,
      url: "https://myindie.net/jams/jam/myindie-level-10",
      bannerUrl: "https://myindie.net/jams/jam-uuid-1/tumb_banner.png",
    });
    expect(requests).toHaveLength(1);
    expect(requests[0].body).toEqual({
      filters: { status: "published" },
      options: { count: MYINDIE_PAGE_SIZE, page: 0 },
    });
  });

  it("maps jam registration stats from /api/jams", async () => {
    const { fetchImpl, requests } = createFetch((request) => {
      expect(request.path).toBe("/api/jams");
      return jsonResponse({ jams: [publishedJam], count: 1 });
    });

    await expect(
      new MyIndieProvider().fetchJamStats(enabledConfig, { fetchImpl }),
    ).resolves.toEqual({
      provider: "myindie",
      participantsCount: publishedJam.regsCount,
      submissionsCount: publishedJam.gamesCount,
    });
    expect(requests).toHaveLength(1);
  });

  it("resolves the jam once when fetching both entries and stats", async () => {
    const { fetchImpl, requests } = createFetch((request) => {
      if (request.path === "/api/jams") {
        return jsonResponse({ jams: [publishedJam], count: 1 });
      }
      return jsonResponse({ games: [], count: 0 });
    });

    const result = await new MyIndieProvider().fetchRoundData(enabledConfig, { fetchImpl });

    expect(result.entries).toEqual([]);
    expect(result.stats).toEqual({
      provider: "myindie",
      participantsCount: publishedJam.regsCount,
      submissionsCount: publishedJam.gamesCount,
    });
    expect(requests.filter((request) => request.path === "/api/jams")).toHaveLength(1);
    expect(requests.filter((request) => request.path === "/api/games")).toHaveLength(1);
  });

  it("continues jam alias resolution onto later pages", async () => {
    const { fetchImpl, requests } = createFetch((request) => {
      if (request.path === "/api/jams") {
        return requestPage(request) === 0
          ? jsonResponse({ jams: [anotherJam], count: 2 })
          : jsonResponse({ jams: [publishedJam], count: 2 });
      }
      return jsonResponse({ games: [], count: 0 });
    });

    const entries = await new MyIndieProvider().fetchEntries(enabledConfig, {
      fetchImpl,
    });

    expect(entries).toEqual([]);
    expect(requests.filter((request) => request.path === "/api/jams").map(requestPage)).toEqual([
      0,
      1,
    ]);
  });

  it("returns a clear error when the alias is absent after all pages", async () => {
    const { fetchImpl, requests } = createFetch((request) => {
      if (request.path === "/api/jams") {
        return requestPage(request) === 0
          ? jsonResponse({ jams: [anotherJam], count: 2 })
          : jsonResponse({ jams: [{ ...anotherJam, id: "jam-uuid-3" }], count: 2 });
      }
      return jsonResponse({ games: [], count: 0 });
    });

    await expect(
      new MyIndieProvider().fetchEntries(enabledConfig, { fetchImpl }),
    ).rejects.toThrow(`MyIndie jam "${enabledConfig.jamAlias}" was not found`);
    expect(requests.filter((request) => request.path === "/api/jams")).toHaveLength(2);
  });

  it("loads and maps all games across multiple pages", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => makeGame(index));
    const secondPage = Array.from({ length: 5 }, (_, index) => makeGame(index + 100));
    const { fetchImpl, requests } = createFetch((request) => {
      if (request.path === "/api/jams") {
        return jsonResponse({ jams: [publishedJam], count: 1 });
      }
      return requestPage(request) === 0
        ? jsonResponse({ games: firstPage, count: 105 })
        : jsonResponse({ games: secondPage, count: 105 });
    });

    const entries = await new MyIndieProvider().fetchEntries(enabledConfig, {
      fetchImpl,
    });

    expect(entries).toHaveLength(105);
    expect(entries[0]).toMatchObject({
      id: "myindie:game-uuid-0",
      provider: "myindie",
      providerGameId: "game-uuid-0",
      title: "Game 0",
      slug: "game-0",
      url: "https://myindie.net/games/game/game-0",
      coverUrl: "https://myindie.net/games/game-uuid-0/tumb_banner.png",
      score: 0,
      submittedAt: publishedGame.createdAt,
      author: {
        id: "owner-uuid-0",
        name: "Author 0",
        alias: "author-0",
      },
      tags: ["dnd", "dice"],
    });
    expect(requests.filter((request) => request.path === "/api/games").map(requestPage)).toEqual([
      0,
      1,
    ]);
    expect(requests.find((request) => request.path === "/api/games")?.body).toEqual({
      filters: { jamId: publishedJam.id, isListed: null },
      options: {
        count: MYINDIE_PAGE_SIZE,
        page: 0,
        order: { score: "DESC" },
      },
    });
  });

  it("maps a nullable score and keeps optional fields absent when the API omits them", async () => {
    const game = {
      ...publishedGame,
      score: null,
      bannerPath: null,
      tags: undefined,
      ownerId: undefined,
      ownerAlias: undefined,
    };
    const { fetchImpl } = createFetch((request) => {
      if (request.path === "/api/jams") {
        return jsonResponse({ jams: [publishedJam], count: 1 });
      }
      return jsonResponse({ games: [game], count: 1 });
    });

    const [entry] = await new MyIndieProvider().fetchEntries(enabledConfig, {
      fetchImpl,
    });

    expect(entry).toMatchObject({
      score: null,
      author: { name: "Grifka" },
      slug: "grifaki-2",
      submittedAt: publishedGame.createdAt,
    });
    expect(entry.coverUrl).toBeUndefined();
    expect(entry.author.id).toBeUndefined();
    expect(entry.author.alias).toBeUndefined();
    expect(entry.tags).toBeUndefined();
  });

  it("returns an empty list when a jam has no games", async () => {
    const { fetchImpl } = createFetch((request) => {
      if (request.path === "/api/jams") {
        return jsonResponse({ jams: [publishedJam], count: 1 });
      }
      return jsonResponse({ games: [], count: 0 });
    });

    await expect(
      new MyIndieProvider().fetchEntries(enabledConfig, { fetchImpl }),
    ).resolves.toEqual([]);
  });

  it("reports HTTP failures with the MyIndie endpoint", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      return new Response("temporary outage", { status: 500 });
    };

    await expect(
      new MyIndieProvider().fetchEntries(enabledConfig, {
        fetchImpl,
        sleep: async () => undefined,
      }),
    ).rejects.toThrow("MyIndie API request failed: POST /api/jams returned 500");
    expect(calls).toBe(3);
  });

  it("reports invalid response shapes instead of failing while reading fields", async () => {
    const { fetchImpl } = createFetch(() => jsonResponse({ jams: "not-an-array", count: 1 }));

    await expect(
      new MyIndieProvider().getJam(publishedJam.alias, { fetchImpl }),
    ).rejects.toBeInstanceOf(ProviderResponseError);
  });

  it("stops safely on a repeated pagination page", async () => {
    const { fetchImpl } = createFetch((request) => {
      if (request.path === "/api/jams") {
        return jsonResponse({ jams: [anotherJam], count: 1000 });
      }
      return jsonResponse({ games: [], count: 0 });
    });

    await expect(
      new MyIndieProvider().fetchEntries(enabledConfig, { fetchImpl }),
    ).rejects.toThrow("repeated /api/jams page");
  });

  it("rejects disabled or incomplete configuration", async () => {
    await expect(
      new MyIndieProvider().fetchEntries(
        { ...enabledConfig, enabled: false },
        { fetchImpl: async () => jsonResponse({}) },
      ),
    ).rejects.toBeInstanceOf(ProviderConfigurationError);

    await expect(
      new MyIndieProvider().fetchEntries(
        { ...enabledConfig, jamAlias: "   " },
        { fetchImpl: async () => jsonResponse({}) },
      ),
    ).rejects.toBeInstanceOf(ProviderConfigurationError);
  });
});
