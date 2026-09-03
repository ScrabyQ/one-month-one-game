import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { jams } from "../src/config/jams";
import { aggregateGames } from "../src/lib/aggregation/aggregate-games";
import { GameSnapshotSchema } from "../src/lib/domain/schemas";
import type { GameEntry, GameSnapshot, JamRound } from "../src/lib/domain/types";
import { getFeaturedRound, validateJamRounds } from "../src/lib/jams/status";
import {
  ProviderConfigurationError,
  ProviderError,
} from "../src/lib/providers/errors";
import { providerRegistry } from "../src/lib/providers/registry";

const projectRoot = resolve(join(fileURLToPath(new URL(".", import.meta.url)), ".."));
const generatedDirectory = join(projectRoot, "src", "data", "generated");
const recentRoundWindowMs = 90 * 24 * 60 * 60 * 1000;

function snapshotPath(round: JamRound): string {
  return join(generatedDirectory, `${round.slug}.json`);
}

function emptySnapshot(round: JamRound): GameSnapshot {
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

async function readExistingSnapshot(round: JamRound): Promise<GameSnapshot | undefined> {
  const path = snapshotPath(round);
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

async function writeSnapshot(round: JamRound, snapshot: GameSnapshot): Promise<void> {
  await mkdir(generatedDirectory, { recursive: true });
  const path = snapshotPath(round);
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await rename(temporaryPath, path);
}

function roundsToSync(syncAll: boolean, now: Date): JamRound[] {
  if (syncAll) return [...jams];

  const featured = getFeaturedRound(jams, now);
  const cutoff = now.getTime() - recentRoundWindowMs;
  return jams.filter((round) => {
    const endedAt = new Date(round.endsAt).getTime();
    return round.slug === featured.slug || endedAt >= cutoff;
  });
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function syncRound(round: JamRound): Promise<void> {
  const existing = await readExistingSnapshot(round);

  if (round.dataMode === "demo") {
    console.log(`[sync] ${round.slug}: demo mode, provider fetch skipped`);
    if (!existing) await writeSnapshot(round, emptySnapshot(round));
    return;
  }

  const enabledProviders = round.providers.filter((provider) => provider.enabled);
  if (enabledProviders.length === 0) {
    console.log(`[sync] ${round.slug}: no enabled providers, keeping empty/cache snapshot`);
    if (!existing) await writeSnapshot(round, emptySnapshot(round));
    return;
  }

  const providerGames: GameEntry[][] = [];

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
      providerGames.push(await provider.fetchEntries(config));
    } catch (error) {
      if (error instanceof ProviderConfigurationError) throw error;
      const prefix = error instanceof ProviderError ? "provider error" : "unexpected error";
      console.warn(`[sync] ${round.slug}: ${config.type} ${prefix}: ${messageFor(error)}`);
      console.warn(
        `[sync] ${round.slug}: keeping ${existing?.games.length ?? 0} games from the latest available snapshot`,
      );
      if (!existing) await writeSnapshot(round, emptySnapshot(round));
      return;
    }
  }

  const snapshot: GameSnapshot = {
    roundId: round.id,
    syncedAt: new Date().toISOString(),
    games: aggregateGames(providerGames),
  };
  await writeSnapshot(round, snapshot);
  console.log(`[sync] ${round.slug}: wrote ${snapshot.games.length} normalized games`);
}

async function main(): Promise<void> {
  const syncAll = process.argv.includes("--all");
  validateJamRounds(jams);
  const targets = roundsToSync(syncAll, new Date());
  console.log(`[sync] ${syncAll ? "full" : "default"} sync: ${targets.map((round) => round.slug).join(", ")}`);

  for (const round of targets) await syncRound(round);
  console.log("[sync] complete");
}

main().catch((error) => {
  console.error(`[sync] failed: ${messageFor(error)}`);
  process.exitCode = 1;
});
