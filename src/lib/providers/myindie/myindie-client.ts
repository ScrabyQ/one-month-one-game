import { ProviderResponseError } from "../errors";
import {
  MyIndieGamesResponseSchema,
  MyIndieJamsResponseSchema,
  type MyIndieGamesResponse,
  type MyIndieJamsResponse,
} from "./myindie-types";

export const MYINDIE_BASE_URL = "https://myindie.net";
export const MYINDIE_PAGE_SIZE = 100;

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

const defaultSleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function isRetryable(error: unknown): boolean {
  if (error instanceof ProviderResponseError) return error.retryable;
  return error instanceof TypeError || (error instanceof Error && error.name === "AbortError");
}

interface MyIndieClientOptions {
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
}

export class MyIndieClient {
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(options: MyIndieClientOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleep = options.sleep ?? defaultSleep;
  }

  async getPublishedJams(page: number): Promise<MyIndieJamsResponse> {
    return this.postJson(
      "/api/jams",
      {
        filters: { status: "published" },
        options: { count: MYINDIE_PAGE_SIZE, page },
      },
      MyIndieJamsResponseSchema,
    );
  }

  async getGamesByJamId(jamId: string, page: number): Promise<MyIndieGamesResponse> {
    return this.postJson(
      "/api/games",
      {
        filters: { jamId, isListed: null },
        options: {
          count: MYINDIE_PAGE_SIZE,
          page,
          order: { score: "DESC" },
        },
      },
      MyIndieGamesResponseSchema,
    );
  }

  private async postJson<T>(
    path: string,
    body: unknown,
    schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false; error: { message: string } } },
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await this.fetchImpl(`${MYINDIE_BASE_URL}${path}`, {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "user-agent": "one-month-one-game-sync/1.0",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new ProviderResponseError(
            `MyIndie API request failed: POST ${path} returned ${response.status}`,
            { retryable: response.status === 429 || response.status >= 500 },
          );
        }

        let payload: unknown;
        try {
          payload = await response.json();
        } catch (error) {
          throw new ProviderResponseError(
            `MyIndie API returned invalid JSON for POST ${path}`,
            { cause: error },
          );
        }

        const parsed = schema.safeParse(payload);
        if (!parsed.success) {
          throw new ProviderResponseError(
            `MyIndie API returned an invalid response for POST ${path}: ${parsed.error.message}`,
          );
        }

        return parsed.data;
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES && isRetryable(error)) {
          await this.sleep(500 * 2 ** attempt);
          continue;
        }

        if (error instanceof ProviderResponseError) throw error;
        throw new ProviderResponseError(
          `MyIndie API request failed: POST ${path}`,
          { retryable: isRetryable(error), cause: error },
        );
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new ProviderResponseError(`MyIndie API request failed: POST ${path}`, {
      cause: lastError,
    });
  }
}
