import type { MyIndieGame } from "../../src/lib/providers/myindie/myindie-types";

export const publishedJam = {
  id: "jam-uuid-1",
  title: "MyIndie Level 10",
  theme: "Враг — это ты",
  alias: "myindie-level-10",
  stage: "finished",
  startTime: 1_700_000_000,
  finishTime: 1_700_086_400,
  status: "published",
  regsCount: 709,
  gamesCount: 140,
  bannerUrl: "/jams/jam-uuid-1/tumb_banner.png",
  createdAt: "Sat Jun 13 2026 17:13:39 GMT+0000 (Coordinated Universal Time)",
};

export const anotherJam = {
  ...publishedJam,
  id: "jam-uuid-2",
  title: "Another Jam",
  alias: "another-jam",
};

export function makeGame(index: number, overrides: Partial<MyIndieGame> = {}): MyIndieGame {
  return {
    id: `game-uuid-${index}`,
    name: `Game ${index}`,
    alias: `game-${index}`,
    status: "published",
    isListed: true,
    ownerId: `owner-uuid-${index}`,
    ownerUsername: `Author ${index}`,
    ownerAlias: `author-${index}`,
    score: index,
    bannerPath: `/games/game-uuid-${index}/tumb_banner.png`,
    likesCount: 1,
    viewsCount: 2,
    downloadsCount: 3,
    webPlaysCount: 4,
    commentsCount: 5,
    hasWebVersion: false,
    langs: ["RU"],
    tags: ["dnd", "dice"],
    version: "1.0.0",
    createdAt: "Sat Apr 25 2026 12:24:47 GMT+0000 (Coordinated Universal Time)",
    jam: {
      id: publishedJam.id,
      alias: publishedJam.alias,
      title: publishedJam.title,
    },
    ...overrides,
  };
}

export const publishedGame = makeGame(1, {
  name: "Grifaki-2",
  alias: "grifaki-2",
  ownerId: "owner-uuid-1",
  ownerUsername: "Grifka",
  ownerAlias: "grifka",
  score: null,
});
