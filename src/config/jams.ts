import type { JamRound } from "../lib/domain/types";

export const jams: JamRound[] = [
  {
    id: "2026-09",
    round: 1,
    slug: "2026-09",
    content: {
      en: {
        title: "One Month — One Game",
        monthLabel: "September 2026",
        theme: "Small creatures",
        themeAnnouncement: "The theme will appear at the start of the month",
        description:
          "A small ongoing challenge for game developers. Make and finish one game in a month.",
      },
      ru: {
        title: "Один месяц — одна игра",
        monthLabel: "Сентябрь 2026",
        theme: "Маленькие существа",
        themeAnnouncement: "Тема появится в начале месяца",
        description:
          "Небольшой постоянный челлендж для разработчиков игр. Сделай и закончи одну игру за месяц.",
      },
    },
    themeState: "announced",
    startsAt: "2026-09-05T00:00:00+03:00",
    endsAt: "2026-09-30T23:59:59+03:00",
    dataMode: "live",
    providers: [
      {
        type: "itch",
        enabled: true,
        jamId: 419729,
        jamUrl: "https://itch.io/jam/test",
      },
    //   {
    //     type: "myindie",
    //     enabled: true,
    //     jamAlias: "test",
    //     jamUrl: "https://myindie.net/jams/jam/test"
    //  }
    ],
    presentation: {
      accent: "#d8ff5c",
    },
  }
];
