import type { GameEntry } from "../domain/types";

const titleCollator = new Intl.Collator("ru-RU", {
  numeric: true,
  sensitivity: "base",
});

function timestamp(game: GameEntry): number {
  if (!game.submittedAt) return Number.NaN;
  const parsed = Date.parse(game.submittedAt);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function sortGames(games: readonly GameEntry[]): GameEntry[] {
  return [...games].sort((left, right) => {
    const leftTime = timestamp(left);
    const rightTime = timestamp(right);

    if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
      return rightTime - leftTime;
    }
    if (Number.isFinite(leftTime) !== Number.isFinite(rightTime)) {
      return Number.isFinite(leftTime) ? -1 : 1;
    }

    return titleCollator.compare(left.title, right.title) || left.id.localeCompare(right.id);
  });
}

export function deduplicateGames(games: readonly GameEntry[]): GameEntry[] {
  const byId = new Map<string, GameEntry>();

  for (const game of games) {
    const existing = byId.get(game.id);
    if (!existing) {
      byId.set(game.id, game);
      continue;
    }

    // Keep the first canonical record, while allowing a later provider payload
    // to fill an optional field that was absent in the first occurrence.
    byId.set(game.id, {
      ...existing,
      slug: existing.slug ?? game.slug,
      score: existing.score ?? game.score,
      coverUrl: existing.coverUrl ?? game.coverUrl,
      description: existing.description ?? game.description,
      submittedAt: existing.submittedAt ?? game.submittedAt,
      tags: existing.tags ?? game.tags,
      platforms: existing.platforms ?? game.platforms,
      author: {
        ...existing.author,
        id: existing.author.id ?? game.author.id,
        alias: existing.author.alias ?? game.author.alias,
        url: existing.author.url ?? game.author.url,
      },
    });
  }

  return [...byId.values()];
}

export function aggregateGames(gameLists: readonly (readonly GameEntry[])[]): GameEntry[] {
  return sortGames(deduplicateGames(gameLists.flatMap((games) => [...games])));
}
