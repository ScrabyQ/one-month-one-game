import { z } from "zod";

export const httpUrlSchema = z
  .url()
  .refine((value) => /^https?:\/\//i.test(value), {
    message: "Expected an HTTP(S) URL",
  });

const sourceIdSchema = z.union([z.string(), z.number()]);

const itchUserSchema = z.object({
  name: z.string().optional(),
  url: z.string().optional(),
});

const itchTagSchema = z.object({
  name: z.string().optional(),
});

export const ItchEntrySchema = z.object({
  id: sourceIdSchema.optional(),
  url: z.string().optional(),
  created_at: z.string().optional(),
  game: z
    .object({
      id: sourceIdSchema.optional(),
      title: z.string().optional(),
      url: z.string().optional(),
      short_text: z.string().optional(),
      cover: z.string().optional(),
      user: itchUserSchema.optional(),
      tags: z.array(itchTagSchema).optional(),
      platforms: z.array(z.string()).optional(),
    })
    .optional(),
});

export const ItchEntriesResponseSchema = z.object({
  jam_games: z.array(z.unknown()),
});

const normalizedAuthorSchema = z.object({
  name: z.string().min(1),
  id: z.string().min(1).optional(),
  alias: z.string().min(1).optional(),
  url: httpUrlSchema.optional(),
});

export const GameEntrySchema = z.object({
  id: z.string().min(1),
  provider: z.string().min(1),
  providerEntryId: z.string().min(1).optional(),
  providerGameId: z.string().min(1).optional(),
  title: z.string().min(1),
  author: normalizedAuthorSchema,
  url: httpUrlSchema,
  slug: z.string().min(1).optional(),
  score: z.number().nullable().optional(),
  coverUrl: httpUrlSchema.optional(),
  description: z.string().min(1).optional(),
  submittedAt: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).optional(),
  platforms: z.array(z.string().min(1)).optional(),
});

export const ProviderRoundStatsSchema = z.object({
  provider: z.string().min(1),
  participantsCount: z.number().int().nonnegative(),
  submissionsCount: z.number().int().nonnegative().optional(),
});

export const RoundStatsSchema = z.object({
  registrationsCount: z.number().int().nonnegative(),
  submissionsCount: z.number().int().nonnegative().optional(),
  providers: z.array(ProviderRoundStatsSchema),
});

export const GameSnapshotSchema = z.object({
  roundId: z.string().min(1),
  syncedAt: z.string().min(1),
  stats: RoundStatsSchema.optional(),
  games: z.array(GameEntrySchema),
});

export const JamRoundPresentationSchema = z.object({
  accent: z
    .string()
    .regex(/^#[\da-f]{6}$/i, "Accent must use #RRGGBB format")
    .optional(),
});

export type ItchEntriesResponse = z.infer<typeof ItchEntriesResponseSchema>;
