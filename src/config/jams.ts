import type { JamRound } from "../lib/domain/types";

export const challengeTitle = "Один месяц/игра";

export const jams: JamRound[] = [
  {
    id: "2026-09",
    round: 2,
    slug: "2026-09",
    title: challengeTitle,
    monthLabel: "Сентябрь 2026",
    theme: "Тема будет объявлена",
    themeState: "pending",
    themeAnnouncement: "Тема появится в начале месяца",
    description:
      "Небольшой постоянный челлендж для разработчиков игр. Сделай и закончи одну игру за месяц.",
    startsAt: "2026-09-01T00:00:00+03:00",
    endsAt: "2026-09-30T23:59:59+03:00",
    dataMode: "demo",
    providers: [
      {
        type: "itch",
        enabled: true,
        jamId: 405977,
        jamUrl: "https://itch.io/jam/evening-jam",
      },
      {
        type: "myindie",
        enabled: true,
        jamAlias: "myindie-level-10",
        jamUrl: "https://myindie.net/jams/jam/myindie-level-10"
     }
    ],
  },
  {
    id: "2026-08",
    round: 1,
    slug: "2026-08",
    title: challengeTitle,
    monthLabel: "Сентябрь 2026",
    theme: "Тема будет объявлена",
    themeState: "pending",
    themeAnnouncement: "Какая-то тема",
    description:
      "Небольшой постоянный челлендж для разработчиков игр. Сделай и закончи одну игру за месяц.",
    startsAt: "2026-08-01T00:00:00+03:00",
    endsAt: "2026-08-30T23:59:59+03:00",
    dataMode: "live",
    providers: [
      {
        type: "itch",
        enabled: true,
        jamId: 405977,
        jamUrl: "https://itch.io/jam/REPLACE_WITH_REAL_JAM_SLUG",
      },
    ],
  },
];
