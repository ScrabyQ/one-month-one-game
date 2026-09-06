import type {
  GameEntry,
  MyIndieProviderConfig,
  ProviderConfig,
} from "../../domain/types";
import {
  ProviderConfigurationError,
  ProviderResponseError,
} from "../errors";
import type {
  GameProvider,
  ProviderFetchOptions,
  ProviderJamStats,
  ProviderRoundData,
} from "../types";
import { MyIndieClient } from "./myindie-client";
import { mapMyIndieGame, mapMyIndieJam } from "./myindie-mapper";
import type { MyIndieJam, MyIndieJamDetails } from "./myindie-types";

const MAX_PAGINATION_PAGES = 10_000;

function assertConfig(config: ProviderConfig): MyIndieProviderConfig {
  if (config.type !== "myindie") {
    throw new ProviderConfigurationError(
      `myindie provider received unsupported config type: ${config.type}`,
    );
  }

  if (!config.enabled || !config.jamAlias.trim()) {
    throw new ProviderConfigurationError(
      "myindie provider is disabled or has no jam alias",
    );
  }

  return config;
}

function pageSignature(items: readonly { id: string }[]): string {
  return items.map((item) => item.id).join("\u001f");
}

function assertPaginationProgress(
  provider: string,
  endpoint: string,
  page: number,
  signature: string,
  seenSignatures: Set<string>,
): void {
  if (seenSignatures.has(signature)) {
    throw new ProviderResponseError(
      `MyIndie API returned a repeated ${endpoint} page at page ${page}`,
    );
  }
  seenSignatures.add(signature);

  if (page >= MAX_PAGINATION_PAGES) {
    throw new ProviderResponseError(
      `${provider} pagination exceeded ${MAX_PAGINATION_PAGES} pages for ${endpoint}`,
    );
  }
}

export class MyIndieProvider implements GameProvider<ProviderConfig> {
  readonly id = "myindie" as const;

  async fetchEntries(
    config: ProviderConfig,
    options: ProviderFetchOptions = {},
  ): Promise<GameEntry[]> {
    const validConfig = assertConfig(config);
    const client = this.createClient(options);
    const jam = await this.resolveJamWithClient(validConfig.jamAlias, client);
    return this.getSubmissionsWithClient(jam.id, client);
  }

  async fetchJamStats(
    config: ProviderConfig,
    options: ProviderFetchOptions = {},
  ): Promise<ProviderJamStats> {
    const validConfig = assertConfig(config);
    const jam = await this.resolveJamWithClient(
      validConfig.jamAlias,
      this.createClient(options),
    );
    return this.mapJamStats(jam);
  }

  async fetchRoundData(
    config: ProviderConfig,
    options: ProviderFetchOptions = {},
  ): Promise<ProviderRoundData> {
    const validConfig = assertConfig(config);
    const client = this.createClient(options);
    const jam = await this.resolveJamWithClient(validConfig.jamAlias, client);
    const entries = await this.getSubmissionsWithClient(jam.id, client);

    return {
      entries,
      stats: this.mapJamStats(jam),
    };
  }

  async resolveJam(alias: string, options: ProviderFetchOptions = {}): Promise<MyIndieJam> {
    return this.resolveJamWithClient(alias, this.createClient(options));
  }

  async getJam(
    alias: string,
    options: ProviderFetchOptions = {},
  ): Promise<MyIndieJamDetails> {
    return mapMyIndieJam(await this.resolveJam(alias, options));
  }

  async getSubmissions(
    jamId: string,
    options: ProviderFetchOptions = {},
  ): Promise<GameEntry[]> {
    if (!jamId.trim()) {
      throw new ProviderConfigurationError("myindie provider requires a jam UUID");
    }
    return this.getSubmissionsWithClient(jamId, this.createClient(options));
  }

  getParticipationUrl(config: ProviderConfig): string | undefined {
    if (config.type !== "myindie" || !config.enabled) return undefined;
    return config.jamUrl;
  }

  private createClient(options: ProviderFetchOptions): MyIndieClient {
    return new MyIndieClient({
      fetchImpl: options.fetchImpl,
      sleep: options.sleep,
    });
  }

  private mapJamStats(jam: MyIndieJam): ProviderJamStats {
    return {
      provider: "myindie",
      participantsCount: jam.regsCount,
      submissionsCount: jam.gamesCount,
    };
  }

  private async resolveJamWithClient(alias: string, client: MyIndieClient): Promise<MyIndieJam> {
    const configuredAlias = alias.trim();
    if (!configuredAlias) {
      throw new ProviderConfigurationError("myindie provider requires a jam alias");
    }

    const seenSignatures = new Set<string>();
    let page = 0;
    let viewed = 0;
    let totalCount = 0;

    while (true) {
      const response = await client.getPublishedJams(page);
      if (response.jams.length === 0) break;

      assertPaginationProgress(
        "MyIndie",
        "/api/jams",
        page,
        pageSignature(response.jams),
        seenSignatures,
      );

      const match = response.jams.find((jam) => jam.alias === configuredAlias);
      if (match) return match;

      viewed += response.jams.length;
      totalCount = Math.max(totalCount, response.count);
      if (viewed >= totalCount) break;
      page += 1;
    }

    throw new ProviderConfigurationError(
      `MyIndie jam "${alias}" was not found`,
    );
  }

  private async getSubmissionsWithClient(
    jamId: string,
    client: MyIndieClient,
  ): Promise<GameEntry[]> {
    const submissions: GameEntry[] = [];
    const seenSignatures = new Set<string>();
    let page = 0;
    let viewed = 0;
    let totalCount = 0;

    while (true) {
      const response = await client.getGamesByJamId(jamId, page);
      if (response.games.length === 0) break;

      assertPaginationProgress(
        "MyIndie",
        "/api/games",
        page,
        pageSignature(response.games),
        seenSignatures,
      );

      submissions.push(...response.games.map(mapMyIndieGame));
      viewed += response.games.length;
      totalCount = Math.max(totalCount, response.count);
      if (viewed >= totalCount) break;
      page += 1;
    }

    return submissions;
  }
}
