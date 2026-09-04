import { jams } from "../../src/config/jams";
import { getJamContent, getTranslations, SUPPORTED_LOCALES } from "../../src/lib/i18n";
import { formatRoundNumber } from "../../src/lib/i18n/formatters";
import type { Locale } from "../../src/lib/i18n/types";
import { getRoundPresentation } from "../../src/lib/jams/presentation";
import { validateJamRounds } from "../../src/lib/jams/status";
import type { JamRound } from "../../src/lib/domain/types";

export interface RoundArtwork {
  locale: Locale;
  round: number;
  roundNumber: string;
  projectTitle: string;
  editionLabel: string;
  monthLabel: string;
  titleLineOne: string;
  titleLineTwo: string;
  tagline: string;
  giantLabel: string;
  accent: string;
}

export function getRoundArtwork(round: JamRound, locale: Locale): RoundArtwork {
  const translations = getTranslations(locale);
  const content = getJamContent(round, locale);
  const presentation = getRoundPresentation(round, locale);
  const roundNumber = formatRoundNumber(round.round);
  const roundLabel = translations.og.roundLabel(roundNumber);

  return {
    locale,
    round: round.round,
    roundNumber,
    projectTitle: translations.og.projectTitle,
    editionLabel: roundLabel,
    monthLabel: content.monthLabel,
    titleLineOne: translations.og.titleLineOne,
    titleLineTwo: translations.og.titleLineTwo,
    tagline: translations.og.tagline,
    giantLabel: roundLabel,
    accent: presentation.accent,
  };
}

export function getRoundArtworkDefinitions(rounds: readonly JamRound[] = jams): RoundArtwork[] {
  validateJamRounds(rounds);
  return SUPPORTED_LOCALES.flatMap((locale) =>
    rounds.map((round) => getRoundArtwork(round, locale)),
  );
}

export function formatArtworkMonth(
  artwork: Pick<RoundArtwork, "locale" | "monthLabel">,
): string {
  return artwork.monthLabel.toLocaleUpperCase(artwork.locale === "ru" ? "ru-RU" : "en-US");
}
