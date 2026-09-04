import type { JamRound, LocalizedJamContent } from "../domain/types";
import { en } from "./en";
import { ru } from "./ru";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale, type Translations } from "./types";

const dictionaries: Record<Locale, Translations> = { en, ru };

export const OG_LOCALE_CODES: Record<Locale, string> = {
  en: "en_US",
  ru: "ru_RU",
};

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ru: "Russian",
};

export { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./types";
export type { Locale, Translations } from "./types";
export * from "./formatters";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function getTranslations(locale: Locale): Translations {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export function getJamContent(round: Pick<JamRound, "id" | "content">, locale: Locale): LocalizedJamContent {
  const content = round.content[locale];
  if (!content) {
    throw new Error(`Jam round ${round.id} is missing ${locale} content`);
  }
  return content;
}

export function getThemePresentation(
  round: Pick<JamRound, "id" | "content" | "themeState">,
  locale: Locale,
): { isAnnounced: boolean; text: string } {
  const content = getJamContent(round, locale);
  if (round.themeState === "announced") {
    return { isAnnounced: true, text: content.theme };
  }
  return {
    isAnnounced: false,
    text: content.themeAnnouncement ?? getTranslations(locale).theme.pendingFallback,
  };
}

export function getArchiveTheme(
  round: Pick<JamRound, "id" | "content" | "themeState">,
  locale: Locale,
): string {
  return getThemePresentation(round, locale).text;
}
