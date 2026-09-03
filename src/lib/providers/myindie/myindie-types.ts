import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);

export const MyIndieJamSchema = z.object({
  id: nonEmptyString,
  title: nonEmptyString,
  theme: z.string().trim().min(1).nullable().optional(),
  alias: nonEmptyString,
  stage: z.string().trim().optional(),
  startTime: z.number(),
  finishTime: z.number(),
  status: z.string().trim().optional(),
  regsCount: z.number().int().nonnegative(),
  gamesCount: z.number().int().nonnegative(),
  bannerUrl: z.string().trim().nullable().optional(),
  createdAt: z.string().trim().optional(),
});

export const MyIndieJamsResponseSchema = z.object({
  jams: z.array(MyIndieJamSchema),
  count: z.number().int().nonnegative(),
});

export const MyIndieGameSchema = z.object({
  id: nonEmptyString,
  name: nonEmptyString,
  alias: nonEmptyString,
  status: z.string().trim().optional(),
  isListed: z.boolean().nullable().optional(),
  ownerId: nonEmptyString.optional(),
  ownerUsername: nonEmptyString.optional(),
  ownerAlias: nonEmptyString.optional(),
  score: z.number().nullable().optional(),
  bannerPath: z.string().trim().nullable().optional(),
  likesCount: z.number().nonnegative().optional(),
  viewsCount: z.number().nonnegative().optional(),
  downloadsCount: z.number().nonnegative().optional(),
  webPlaysCount: z.number().nonnegative().optional(),
  commentsCount: z.number().nonnegative().optional(),
  hasWebVersion: z.boolean().optional(),
  langs: z.array(nonEmptyString).optional(),
  tags: z.array(nonEmptyString).optional(),
  version: z.string().trim().optional(),
  createdAt: z.string().trim().optional(),
  jam: z
    .object({
      id: nonEmptyString,
      alias: nonEmptyString,
      title: nonEmptyString,
    })
    .optional(),
});

export const MyIndieGamesResponseSchema = z.object({
  games: z.array(MyIndieGameSchema),
  count: z.number().int().nonnegative(),
});

export type MyIndieJam = z.infer<typeof MyIndieJamSchema>;
export type MyIndieJamsResponse = z.infer<typeof MyIndieJamsResponseSchema>;
export type MyIndieGame = z.infer<typeof MyIndieGameSchema>;
export type MyIndieGamesResponse = z.infer<typeof MyIndieGamesResponseSchema>;

export interface MyIndieJamDetails {
  id: string;
  alias: string;
  title: string;
  theme: string | null;
  startsAt: string;
  endsAt: string;
  participantsCount: number;
  submissionsCount: number;
  url: string;
  bannerUrl: string | null;
}
