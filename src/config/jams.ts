import type { JamRound } from "../lib/domain/types";

export const jams: JamRound[] = [
  {
    id: "2026-09",
    round: 2,
    slug: "2026-09",
    content: {
      en: {
        title: "One Month — One Game",
        monthLabel: "September 2026",
        theme: "The theme will be announced",
        themeAnnouncement: "The theme will appear at the start of the month",
        description:
          "A small ongoing challenge for game developers. Make and finish one game in a month.",
      },
      ru: {
        title: "Один месяц — одна игра",
        monthLabel: "Сентябрь 2026",
        theme: "Тема будет объявлена",
        themeAnnouncement: "Тема появится в начале месяца",
        description:
          "Небольшой постоянный челлендж для разработчиков игр. Сделай и закончи одну игру за месяц.",
      },
    },
    themeState: "pending",
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
    presentation: {
      accent: "#d8ff5c",
    },
  },
  {
    id: "2026-08",
    round: 1,
    slug: "2026-08",
    content: {
      en: {
        title: "One Month — One Game",
        monthLabel: "August 2026",
        theme: "The theme will be announced",
        themeAnnouncement: "A theme will appear here",
        description:
          "A small ongoing challenge for game developers. Make and finish one game in a month.",
      },
      ru: {
        title: "Один месяц — одна игра",
        monthLabel: "Август 2026",
        theme: "Тема будет объявлена",
        themeAnnouncement: "Какая-то тема",
        description:
          "Небольшой постоянный челлендж для разработчиков игр. Сделай и закончи одну игру за месяц.",
      },
    },
    themeState: "pending",
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
    presentation: {
      accent: "#ff8a75",
    },
  },
];
