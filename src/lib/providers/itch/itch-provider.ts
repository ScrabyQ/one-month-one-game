import type { ProviderConfig } from "../../domain/types";
import {
  ProviderConfigurationError,
  ProviderResponseError,
} from "../errors";
import type { GameProvider, ProviderFetchOptions } from "../types";
import { normalizeItchEntries } from "./itch-normalizer";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

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

  getParticipationUrl(config: ProviderConfig): string | undefined {
    return config.type === "itch" && config.enabled ? config.jamUrl : undefined;
  }
}
