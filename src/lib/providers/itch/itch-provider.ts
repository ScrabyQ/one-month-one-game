import type { ProviderConfig } from "../../domain/types";
import {
  ProviderConfigurationError,
  ProviderError,
  ProviderResponseError,
} from "../errors";
import type {
  GameProvider,
  ProviderFetchOptions,
  ProviderJamStats,
  ProviderRoundData,
} from "../types";
import { parseItchJamStats } from "./itch-jam-parser";
import { normalizeItchEntries } from "./itch-normalizer";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const PLACEHOLDER_JAM_SLUG = "REPLACE_WITH_REAL_JAM_SLUG";

const defaultSleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function isRetryable(error: unknown): boolean {
  if (error instanceof ProviderResponseError) return error.retryable;
  return error instanceof TypeError || (error instanceof Error && error.name === "AbortError");
}

export class ItchProvider implements GameProvider<ProviderConfig> {
  readonly id = "itch" as const;

  async fetchEntries(
    config: ProviderConfig,
    options: ProviderFetchOptions = {},
  ) {
    if (config.type !== "itch") {
      throw new ProviderConfigurationError(
        `itch provider received unsupported config type: ${config.type}`,
      );
    }

    if (!config.enabled || config.jamId === null) {
      throw new ProviderConfigurationError(
        "itch provider is disabled or has no numeric JAM_ID",
      );
    }

    const fetchImpl = options.fetchImpl ?? fetch;
    const sleep = options.sleep ?? defaultSleep;
    const endpoint = `https://itch.io/jam/${config.jamId}/entries.json`;
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetchImpl(endpoint, {
          headers: {
            accept: "application/json",
            "user-agent": "one-month-one-game-sync/1.0",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new ProviderResponseError(
            `itch.io returned HTTP ${response.status} for ${endpoint}`,
            { retryable: response.status === 429 || response.status >= 500 },
          );
        }

        let payload: unknown;
        try {
          payload = await response.json();
        } catch (error) {
          throw new ProviderResponseError("itch.io returned invalid JSON", {
            cause: error,
          });
        }

        return normalizeItchEntries(payload, console);
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES && isRetryable(error)) {
          await sleep(500 * 2 ** attempt);
          continue;
        }

        if (error instanceof Error) throw error;
        throw new ProviderResponseError("itch.io synchronization failed", {
          cause: error,
        });
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new ProviderResponseError("itch.io synchronization failed", {
      cause: lastError,
    });
  }

  async fetchJamStats(
    config: ProviderConfig,
    options: ProviderFetchOptions = {},
  ): Promise<ProviderJamStats> {
    this.assertEnabledConfig(config);

    const html = await this.fetchJamHtml(config.jamUrl, options);
    const parsed = parseItchJamStats(html);
    if (!parsed) {
      throw new ProviderResponseError(
        "could not parse itch.io participant count from the jam page",
      );
    }

    return {
      provider: "itch",
      ...parsed,
    };
  }

  async fetchRoundData(
    config: ProviderConfig,
    options: ProviderFetchOptions = {},
  ): Promise<ProviderRoundData> {
    const entries = await this.fetchEntries(config, options);

    try {
      const stats = await this.fetchJamStats(config, options);
      return {
        entries,
        stats: {
          ...stats,
          submissionsCount: entries.length,
        },
      };
    } catch (error) {
      if (error instanceof ProviderConfigurationError) throw error;

      return {
        entries,
        statsError: error instanceof ProviderError
          ? error
          : new ProviderResponseError("itch.io jam stats synchronization failed", {
              cause: error,
            }),
      };
    }
  }

  getParticipationUrl(config: ProviderConfig): string | undefined {
    if (config.type !== "itch" || !config.enabled) return undefined;
    if (config.jamUrl.includes(PLACEHOLDER_JAM_SLUG)) return undefined;
    return config.jamUrl;
  }

  private assertEnabledConfig(config: ProviderConfig): asserts config is Extract<ProviderConfig, { type: "itch" }> {
    if (config.type !== "itch") {
      throw new ProviderConfigurationError(
        `itch provider received unsupported config type: ${config.type}`,
      );
    }

    if (!config.enabled || config.jamId === null) {
      throw new ProviderConfigurationError(
        "itch provider is disabled or has no numeric JAM_ID",
      );
    }
  }

  private async fetchJamHtml(
    endpoint: string,
    options: ProviderFetchOptions,
  ): Promise<string> {
    const fetchImpl = options.fetchImpl ?? fetch;
    const sleep = options.sleep ?? defaultSleep;
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetchImpl(endpoint, {
          headers: {
            accept: "text/html",
            "user-agent": "one-month-one-game-sync/1.0",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new ProviderResponseError(
            `itch.io returned HTTP ${response.status} for ${endpoint}`,
            { retryable: response.status === 429 || response.status >= 500 },
          );
        }

        try {
          return await response.text();
        } catch (error) {
          throw new ProviderResponseError("itch.io returned an unreadable jam page", {
            cause: error,
          });
        }
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES && isRetryable(error)) {
          await sleep(500 * 2 ** attempt);
          continue;
        }

        if (error instanceof Error) throw error;
        throw new ProviderResponseError("itch.io jam page request failed", {
          cause: error,
        });
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new ProviderResponseError("itch.io jam page request failed", {
      cause: lastError,
    });
  }
}
