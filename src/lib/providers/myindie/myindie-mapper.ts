import type { GameEntry } from "../../domain/types";
import { ProviderResponseError } from "../errors";
import { MYINDIE_BASE_URL } from "./myindie-client";
import type { MyIndieGame, MyIndieJam, MyIndieJamDetails } from "./myindie-types";

function nonEmpty(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function uniqueStrings(values: string[] | undefined): string[] | undefined {
  const unique = [...new Set(values?.map((value) => value.trim()).filter(Boolean))];
  return unique.length > 0 ? unique : undefined;
}

function absoluteMyIndiePath(path: string | undefined | null): string | null {
  return nonEmpty(path) ? `${MYINDIE_BASE_URL}${path}` : null;
}

function dateFromUnixSeconds(value: number, field: string): string {
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) {
    throw new ProviderResponseError(`MyIndie returned an invalid ${field} timestamp`);
  }
  return date.toISOString();
}

export function mapMyIndieJam(jam: MyIndieJam): MyIndieJamDetails {
  return {
    id: jam.id,
    alias: jam.alias,
    title: jam.title,
    theme: jam.theme ?? null,
    startsAt: dateFromUnixSeconds(jam.startTime, "startTime"),
    endsAt: dateFromUnixSeconds(jam.finishTime, "finishTime"),
    participantsCount: jam.regsCount,
    submissionsCount: jam.gamesCount,
    url: `${MYINDIE_BASE_URL}/jams/jam/${jam.alias}`,
    bannerUrl: absoluteMyIndiePath(jam.bannerUrl),
  };
}

export function mapMyIndieGame(game: MyIndieGame): GameEntry {
  const alias = game.alias.trim();
  const createdAt = nonEmpty(game.createdAt);
  const tags = uniqueStrings(game.tags);
  const ownerId = nonEmpty(game.ownerId);
  const ownerAlias = nonEmpty(game.ownerAlias);

  return {
    id: `myindie:${game.id}`,
    provider: "myindie",
    providerGameId: game.id,
    title: game.name.trim(),
    slug: alias,
    author: {
      name: nonEmpty(game.ownerUsername) ?? "Автор не указан",
      ...(ownerId ? { id: ownerId } : {}),
      ...(ownerAlias ? { alias: ownerAlias } : {}),
    },
    url: `${MYINDIE_BASE_URL}/games/game/${alias}`,
    ...(game.bannerPath ? { coverUrl: absoluteMyIndiePath(game.bannerPath) ?? undefined } : {}),
    ...(game.score !== undefined ? { score: game.score } : {}),
    ...(createdAt ? { submittedAt: createdAt } : {}),
    ...(tags ? { tags } : {}),
  };
}
