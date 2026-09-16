import { jams } from "../src/config/jams";
import type { JamRound } from "../src/lib/domain/types";
import {
  getActiveRound,
  getFeaturedRound,
  getRegistrationOpenRound,
  validateJamRounds,
} from "../src/lib/jams/status";
import { syncRound } from "./lib/round-sync";

const recentRoundWindowMs = 90 * 24 * 60 * 60 * 1000;

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function roundsToSync(syncAll: boolean, now: Date): JamRound[] {
  if (syncAll) return [...jams];

  const active = getActiveRound(jams, now);
  const current = active ?? getFeaturedRound(jams, now);
  const registrationOpen = getRegistrationOpenRound(jams, now);
  const importantRoundIds = new Set(
    [current.id, registrationOpen?.id].filter((id): id is string => Boolean(id)),
  );
  const cutoff = now.getTime() - recentRoundWindowMs;
  return jams.filter((round) => {
    const endedAt = new Date(round.endsAt).getTime();
    return importantRoundIds.has(round.id) || endedAt >= cutoff;
  });
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
