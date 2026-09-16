import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { aggregateGames } from "../../src/lib/aggregation/aggregate-games";
import { mergeProviderStats } from "../../src/lib/aggregation/aggregate-stats";
import { GameSnapshotSchema } from "../../src/lib/domain/schemas";
import type { GameEntry, GameSnapshot, JamRound } from "../../src/lib/domain/types";
import {
  ProviderConfigurationError,
  ProviderError,
  ProviderResponseError,
} from "../../src/lib/providers/errors";
import { providerRegistry } from "../../src/lib/providers/registry";
import type {
  GameProvider,
  ProviderJamStats,
  ProviderRoundData,
} from "../../src/lib/providers/types";

const projectRoot = resolve(join(fileURLToPath(new URL(".", import.meta.url)), "../.."));
const generatedDirectory = join(projectRoot, "src", "data", "generated");

export function getRoundSnapshotPath(round: JamRound): string {
  return join(generatedDirectory, `${round.slug}.json`);
}

export function emptySnapshot(round: JamRound): GameSnapshot {
  return {
    roundId: round.id,
    syncedAt: "1970-01-01T00:00:00.000Z",
    games: [],
  };
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readRoundSnapshot(round: JamRound): Promise<GameSnapshot | undefined> {
  const path = getRoundSnapshotPath(round);
  if (!(await fileExists(path))) return undefined;

  try {
    const raw = JSON.parse(await readFile(path, "utf8")) as unknown;
    const parsed = GameSnapshotSchema.safeParse(raw);
    if (!parsed.success || parsed.data.roundId !== round.id) {
      console.warn(`[sync] Ignoring invalid cached snapshot for ${round.slug}`);
      return undefined;
    }
    return parsed.data;
  } catch (error) {
    console.warn(
      `[sync] Could not read cached snapshot for ${round.slug}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return undefined;
  }
}

export async function writeRoundSnapshot(round: JamRound, snapshot: GameSnapshot): Promise<void> {
  await mkdir(generatedDirectory, { recursive: true });
  const path = getRoundSnapshotPath(round);
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await rename(temporaryPath, path);
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function fetchProviderRoundData(
  provider: GameProvider,
  config: JamRound["providers"][number],
): Promise<ProviderRoundData> {
  if (provider.fetchRoundData) {
    return provider.fetchRoundData(config);
  }

  const entries = await provider.fetchEntries(config);
  if (!provider.fetchJamStats) return { entries };

  try {
    return {
      entries,
      stats: await provider.fetchJamStats(config),
    };
  } catch (error) {
    if (error instanceof ProviderConfigurationError) throw error;

    return {
      entries,
      statsError: error instanceof ProviderError
        ? error
        : new ProviderResponseError("provider jam stats synchronization failed", {
            cause: error,
          }),
    };
  }
}

export async function syncRound(round: JamRound): Promise<void> {
  const existing = await readRoundSnapshot(round);

  if (round.dataMode === "demo") {
    console.log(`[sync] ${round.slug}: demo mode, provider fetch skipped`);
    if (!existing) await writeRoundSnapshot(round, emptySnapshot(round));
    return;
  }

  const enabledProviders = round.providers.filter((provider) => provider.enabled);
  if (enabledProviders.length === 0) {
    console.log(`[sync] ${round.slug}: no enabled providers, keeping empty/cache snapshot`);
    if (!existing) await writeRoundSnapshot(round, emptySnapshot(round));
    return;
  }

  const providerGames: GameEntry[][] = [];
  const providerStats: ProviderJamStats[] = [];

  for (const config of enabledProviders) {
    let provider;
    try {
      provider = providerRegistry.get(config.type);
    } catch (error) {
      throw new ProviderConfigurationError(
        `No adapter is registered for provider ${config.type}: ${messageFor(error)}`,
      );
    }

    try {
      console.log(`[sync] ${round.slug}: fetching ${config.type}`);
      const providerData = await fetchProviderRoundData(provider, config);
      providerGames.push(providerData.entries);

      if (providerData.stats) {
        providerStats.push(providerData.stats);
        console.log(
          `[sync] ${round.slug}: ${config.type} stats: ${providerData.stats.participantsCount} registrations`,
        );
      } else if (provider.fetchJamStats || provider.fetchRoundData) {
        const cachedStats = existing?.stats?.providers.find(
          (stats) => stats.provider === config.type,
        );
        const reason = providerData.statsError
          ? ` (${messageFor(providerData.statsError)})`
          : "";
        if (cachedStats) {
          console.warn(
            `[sync] ${round.slug}: ${config.type} stats unavailable${reason}, keeping cached value`,
          );
        } else {
          console.warn(
            `[sync] ${round.slug}: ${config.type} stats unavailable${reason}, no cached value`,
          );
        }
      }
    } catch (error) {
      if (error instanceof ProviderConfigurationError) throw error;
      const prefix = error instanceof ProviderError ? "provider error" : "unexpected error";
      console.warn(`[sync] ${round.slug}: ${config.type} ${prefix}: ${messageFor(error)}`);
      console.warn(
        `[sync] ${round.slug}: keeping ${existing?.games.length ?? 0} games from the latest available snapshot`,
      );
      if (!existing) await writeRoundSnapshot(round, emptySnapshot(round));
      return;
    }
  }

  const stats = mergeProviderStats(
    enabledProviders.map((provider) => provider.type),
    providerStats,
    existing?.stats?.providers,
  );

  const snapshot: GameSnapshot = {
    roundId: round.id,
    syncedAt: new Date().toISOString(),
    ...(stats ? { stats } : {}),
    games: aggregateGames(providerGames),
  };
  await writeRoundSnapshot(round, snapshot);
  if (stats) {
    console.log(`[sync] ${round.slug}: total registrations: ${stats.registrationsCount}`);
  } else {
    console.warn(`[sync] ${round.slug}: total registration stats unavailable`);
  }
  console.log(`[sync] ${round.slug}: wrote ${snapshot.games.length} normalized games`);
}
