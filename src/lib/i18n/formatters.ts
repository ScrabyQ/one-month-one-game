import type { JamRound, JamStatus } from "../domain/types";
import type { CountdownParts } from "../jams/status";
import { getTranslations } from "./index";
import type { Locale } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const SECOND_MS = 1000;

function plural(value: number, forms: { one: string; few: string; many: string }): string {
  const absolute = Math.abs(value) % 100;
  const last = absolute % 10;
  if (absolute >= 11 && absolute <= 19) return forms.many;
  if (last === 1) return forms.one;
  if (last >= 2 && last <= 4) return forms.few;
  return forms.many;
}

export function formatRoundNumber(value: number): string {
  return String(value).padStart(3, "0");
}

export function formatGameCount(locale: Locale, value: number): string {
  const forms = locale === "ru"
    ? { one: "игра", few: "игры", many: "игр" }
    : { one: "game", few: "games", many: "games" };
  return `${value} ${plural(value, forms)}`;
}

export function formatProviderCount(locale: Locale, value: number): string {
  const forms = locale === "ru"
    ? { one: "площадка", few: "площадки", many: "площадок" }
    : { one: "platform", few: "platforms", many: "platforms" };
  return `${value} ${plural(value, forms)}`;
}

export function formatRegistrationCount(locale: Locale, value: number): string {
  return `${value} ${plural(value, getTranslations(locale).stats.participants)}`;
}

export function formatRemainingDuration(locale: Locale, totalMilliseconds: number): string {
  const milliseconds = Math.max(0, totalMilliseconds);
  if (milliseconds < DAY_MS) {
    const totalSeconds = Math.min(
      DAY_MS / SECOND_MS - 1,
      Math.ceil(milliseconds / SECOND_MS),
    );
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }

  const days = Math.max(1, Math.ceil(milliseconds / DAY_MS));
  return `${days} ${plural(days, getTranslations(locale).countdown.days)}`;
}

function parseDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }
  return date;
}

export function formatJamDate(locale: Locale, value: string): string {
  const date = parseDate(value);
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function formatJamDateRange(locale: Locale, round: Pick<JamRound, "startsAt" | "endsAt">): string {
  return `${formatJamDate(locale, round.startsAt)} — ${formatJamDate(locale, round.endsAt)}`;
}

export function formatStatusLabel(locale: Locale, status: JamStatus): string {
  return getTranslations(locale).status[status];
}

export interface CountdownDisplay {
  label: string;
  value: string;
}

export function formatCountdownDisplay(locale: Locale, parts: CountdownParts): CountdownDisplay {
  const translations = getTranslations(locale);
  if (parts.status === "finished") {
    return {
      label: translations.countdown.status,
      value: translations.countdown.roundFinished,
    };
  }

  return {
    label: parts.status === "upcoming"
      ? translations.countdown.untilStart
      : translations.countdown.untilEnd,
    value: formatRemainingDuration(locale, parts.remainingMs),
  };
}
