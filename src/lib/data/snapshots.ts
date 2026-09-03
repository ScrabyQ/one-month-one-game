import { GameSnapshotSchema } from "../domain/schemas";
import type { GameSnapshot, JamRound } from "../domain/types";

const generatedModules = import.meta.glob("../../data/generated/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

const demoModules = import.meta.glob("../../data/demo/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

function emptySnapshot(round: JamRound): GameSnapshot {
  return {
    roundId: round.id,
    syncedAt: "1970-01-01T00:00:00.000Z",
    games: [],
  };
}

export function getSnapshotForRound(round: JamRound): GameSnapshot {
  const isDemo = round.dataMode === "demo";
  const modules = isDemo ? demoModules : generatedModules;
  const key = `../../data/${isDemo ? "demo" : "generated"}/${round.slug}.json`;
  const rawSnapshot = modules[key];

  if (!rawSnapshot) return emptySnapshot(round);

  const parsed = GameSnapshotSchema.safeParse(rawSnapshot);
  if (!parsed.success) {
    throw new Error(`Invalid normalized snapshot for ${round.slug}: ${parsed.error.message}`);
  }
  if (parsed.data.roundId !== round.id) {
    throw new Error(
      `Snapshot ${round.slug} belongs to ${parsed.data.roundId}, not ${round.id}`,
    );
  }

  return parsed.data;
}
