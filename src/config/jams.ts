import type { JamRound } from "../lib/domain/types";

export const challengeTitle = "Один месяц — одна игра";

export const jams: JamRound[] = [
  {
    id: "2026-09",
    slug: "2026-09",
    title: challengeTitle,
    monthLabel: "Сентябрь 2026",
    theme: "Тема будет объявлена",
    description:
      "Небольшой постоянный челлендж для разработчиков игр. Сделай и закончи одну игру за месяц.",
    startsAt: "2026-09-01T00:00:00+03:00",
    endsAt: "2026-09-30T23:59:59+03:00",
    dataMode: "demo",
    providers: [
      {
        type: "itch",
        enabled: false,
        jamId: null,
        jamUrl: "https://itch.io/jam/REPLACE_WITH_REAL_JAM_SLUG",
      },
    ],
  },
];
