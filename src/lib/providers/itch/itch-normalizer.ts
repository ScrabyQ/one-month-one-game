import {
  ItchEntriesResponseSchema,
  ItchEntrySchema,
} from "../../domain/schemas";
import type { GameEntry } from "../../domain/types";
import { ProviderResponseError } from "../errors";

export interface NormalizerLogger {
  warn(message: string): void;
}

const noopLogger: NormalizerLogger = { warn: () => undefined };

function nonEmpty(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sourceId(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return nonEmpty(value);
}

function httpUrl(value: unknown): string | undefined {
  const candidate = nonEmpty(value);
  if (!candidate) return undefined;

  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function optionalArray(values: string[] | undefined): string[] | undefined {
  const unique = [...new Set(values?.map((value) => value.trim()).filter(Boolean))];
  return unique.length > 0 ? unique : undefined;
}

export function normalizeItchEntries(
  payload: unknown,
  logger: NormalizerLogger = noopLogger,
): GameEntry[] {
  const response = ItchEntriesResponseSchema.safeParse(payload);
  if (!response.success) {
    throw new ProviderResponseError(
      `itch.io entries response has an invalid shape: ${response.error.message}`,
    );
  }

  const normalized: GameEntry[] = [];
  let skipped = 0;

  response.data.jam_games.forEach((rawEntry, index) => {
    const parsed = ItchEntrySchema.safeParse(rawEntry);
    if (!parsed.success) {
      skipped += 1;
      logger.warn(`itch.io entry ${index + 1} was skipped: invalid shape`);
      return;
    }

    const entry = parsed.data;
    const game = entry.game;
    const title = nonEmpty(game?.title);
    const url = httpUrl(game?.url);
    const entryId = sourceId(entry.id);
    const gameId = sourceId(game?.id);
    const stableId = entryId ?? gameId;

    if (!title || !url || !stableId) {
      skipped += 1;
      logger.warn(
        `itch.io entry ${index + 1} was skipped: missing title, game URL, or stable ID`,
      );
      return;
    }

    const authorUrl = httpUrl(game?.user?.url);
    const coverUrl = httpUrl(game?.cover);
    const description = nonEmpty(game?.short_text);
    const submittedAt = nonEmpty(entry.created_at);
    const tags = optionalArray(
      game?.tags?.flatMap((tag) => {
        const name = nonEmpty(tag.name);
        return name ? [name] : [];
      }),
    );
    const platforms = optionalArray(game?.platforms);

    const normalizedEntry: GameEntry = {
      id: entryId ? `itch:${entryId}` : `itch:game:${gameId}`,
      provider: "itch",
      title,
      author: {
        name: nonEmpty(game?.user?.name) ?? "Автор не указан",
        ...(authorUrl ? { url: authorUrl } : {}),
      },
      url,
      ...(entryId ? { providerEntryId: entryId } : {}),
      ...(gameId ? { providerGameId: gameId } : {}),
      ...(coverUrl ? { coverUrl } : {}),
      ...(description ? { description } : {}),
      ...(submittedAt ? { submittedAt } : {}),
      ...(tags ? { tags } : {}),
      ...(platforms ? { platforms } : {}),
    };

    normalized.push(normalizedEntry);
  });

  if (response.data.jam_games.length > 0 && normalized.length === 0) {
    throw new ProviderResponseError(
      "itch.io returned entries, but none could be normalized safely",
    );
  }

  if (skipped > 0) {
    logger.warn(`itch.io normalization skipped ${skipped} malformed entr${skipped === 1 ? "y" : "ies"}`);
  }

  return normalized;
}
