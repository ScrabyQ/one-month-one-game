import { JamRoundPresentationSchema } from "../domain/schemas";
import type { JamRound } from "../domain/types";

export const DEFAULT_ROUND_ACCENT = "#d8ff5c";
export const DEFAULT_SOCIAL_IMAGE = "/og/default.png";

export interface ResolvedRoundPresentation {
  accent: string;
  socialImage: string;
}

export function getRoundPresentation(
  round: Pick<JamRound, "slug" | "presentation">,
): ResolvedRoundPresentation {
  const parsed = JamRoundPresentationSchema.safeParse(round.presentation ?? {});
  if (!parsed.success) {
    throw new Error(
      `Invalid presentation metadata for jam round ${round.slug}: ${parsed.error.message}`,
    );
  }

  return {
    accent: parsed.data.accent ?? DEFAULT_ROUND_ACCENT,
    socialImage: parsed.data.socialImage ?? DEFAULT_SOCIAL_IMAGE,
  };
}
