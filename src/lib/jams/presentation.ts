import { JamRoundPresentationSchema } from "../domain/schemas";
import type { JamRound } from "../domain/types";
import { formatRoundNumber } from "../i18n/formatters";
import type { Locale } from "../i18n/types";

export const DEFAULT_ROUND_ACCENT = "#d8ff5c";

export interface ResolvedRoundPresentation {
  accent: string;
  socialImage: string;
}

export function getDefaultSocialImage(locale: Locale): string {
  return `/og/${locale}/default.png`;
}

export function getRoundSocialImage(roundNumber: number, locale: Locale): string {
  return `/og/${locale}/round-${formatRoundNumber(roundNumber)}.png`;
}

export function getRoundMyIndieBanner(roundNumber: number, locale: Locale): string {
  return `/myindie/${locale}/round-${formatRoundNumber(roundNumber)}.png`;
}

export function getRoundPresentation(
  round: Pick<JamRound, "slug" | "round" | "presentation">,
  locale: Locale,
): ResolvedRoundPresentation {
  const parsed = JamRoundPresentationSchema.safeParse(round.presentation ?? {});
  if (!parsed.success) {
    throw new Error(
      `Invalid presentation metadata for jam round ${round.slug}: ${parsed.error.message}`,
    );
  }

  return {
    accent: parsed.data.accent ?? DEFAULT_ROUND_ACCENT,
    socialImage: getRoundSocialImage(round.round, locale),
  };
}
