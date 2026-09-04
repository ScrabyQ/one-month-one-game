import type { GameEntry } from "../domain/types";
import { DEFAULT_LOCALE } from "../i18n";
import type { Locale } from "../i18n/types";

export const RECENT_SUBMISSION_THRESHOLD_MS = 72 * 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;
const PRESENTATION_TIME_ZONE = "Europe/Moscow";
const legacyTimestampPattern =
  /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/;
const datePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: PRESENTATION_TIME_ZONE,
});
function getDateFormatter(locale: Locale): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: PRESENTATION_TIME_ZONE,
  });
}

function getRelativeDayFormatter(locale: Locale): Intl.RelativeTimeFormat {
  return new Intl.RelativeTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    numeric: "always",
  });
}

function hasValidUtcComponents(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0,
): boolean {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hours, minutes, seconds, milliseconds);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hours &&
    date.getUTCMinutes() === minutes &&
    date.getUTCSeconds() === seconds &&
    date.getUTCMilliseconds() === milliseconds
  );
}

function parseLegacyTimestamp(value: string): number | undefined {
  const legacy = legacyTimestampPattern.exec(value);
  if (!legacy) return undefined;

  const [, year, month, day, hours, minutes, seconds, milliseconds] = legacy;
  const millisecondValue = milliseconds ? Number(milliseconds.padEnd(3, "0")) : 0;
  if (
    !hasValidUtcComponents(
      Number(year),
      Number(month),
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds),
      millisecondValue,
    )
  ) {
    return undefined;
  }

  const date = new Date(0);
  date.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
  date.setUTCHours(
    Number(hours),
    Number(minutes),
    Number(seconds),
    millisecondValue,
  );
  return date.getTime();
}

function hasValidIsoCalendarDate(value: string): boolean {
  const datePrefix = /^(\d{4})-(\d{2})-(\d{2})(?=$|[T ])/u.exec(value);
  if (!datePrefix) return true;

  return hasValidUtcComponents(
    Number(datePrefix[1]),
    Number(datePrefix[2]),
    Number(datePrefix[3]),
  );
}

export function getSubmittedAtTimestamp(value?: string): number | undefined {
  if (!value?.trim()) return undefined;

  const normalized = value.trim();
  const legacyTimestamp = parseLegacyTimestamp(normalized);
  if (legacyTimestamp !== undefined || legacyTimestampPattern.test(normalized)) {
    return legacyTimestamp;
  }
  if (!hasValidIsoCalendarDate(normalized)) return undefined;

  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function submissionValue(value: GameEntry | Pick<GameEntry, "submittedAt"> | string | undefined):
  string | undefined {
  return typeof value === "string" ? value : value?.submittedAt;
}

function calendarDayIndex(timestamp: number): number {
  const parts = datePartsFormatter.formatToParts(new Date(timestamp));
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<string, number>;
  return Date.UTC(values.year, values.month - 1, values.day) / DAY_MS;
}

export function formatSubmissionDate(
  value: string | undefined,
  locale: Locale = DEFAULT_LOCALE,
): string | undefined {
  const timestamp = getSubmittedAtTimestamp(value);
  if (timestamp === undefined) return undefined;

  return getDateFormatter(locale).format(new Date(timestamp)).replace(/\s+г\.$/, "");
}

export function isRecentSubmission(
  value: GameEntry | Pick<GameEntry, "submittedAt"> | string | undefined,
  now = new Date(),
): boolean {
  const timestamp = getSubmittedAtTimestamp(submissionValue(value));
  if (timestamp === undefined) return false;

  const age = now.getTime() - timestamp;
  return age >= 0 && age <= RECENT_SUBMISSION_THRESHOLD_MS;
}

export function formatSubmissionLabel(
  value: string | undefined,
  now = new Date(),
  locale: Locale = DEFAULT_LOCALE,
): string | undefined {
  const timestamp = getSubmittedAtTimestamp(value);
  if (timestamp === undefined) return undefined;

  if (isRecentSubmission(value, now)) {
    const calendarDays = Math.max(0, calendarDayIndex(now.getTime()) - calendarDayIndex(timestamp));
    if (calendarDays === 0) return locale === "ru" ? "сегодня" : "today";
    if (calendarDays === 1) return locale === "ru" ? "вчера" : "yesterday";
    return getRelativeDayFormatter(locale).format(-calendarDays, "day");
  }

  return formatSubmissionDate(value, locale);
}

export interface SubmissionPresentation {
  timestamp?: number;
  iso?: string;
  dateLabel?: string;
  label?: string;
  isRecent: boolean;
}

export function getSubmissionPresentation(
  value: string | undefined,
  now = new Date(),
  locale: Locale = DEFAULT_LOCALE,
): SubmissionPresentation {
  const timestamp = getSubmittedAtTimestamp(value);
  if (timestamp === undefined) return { isRecent: false };

  return {
    timestamp,
    iso: new Date(timestamp).toISOString(),
    dateLabel: formatSubmissionDate(value, locale),
    label: formatSubmissionLabel(value, now, locale),
    isRecent: isRecentSubmission(value, now),
  };
}

export function getLatestGame(games: readonly GameEntry[]): GameEntry | undefined {
  return games.reduce<GameEntry | undefined>((latest, game) => {
    const timestamp = getSubmittedAtTimestamp(game.submittedAt);
    if (timestamp === undefined) return latest;
    if (!latest) return game;

    const latestTimestamp = getSubmittedAtTimestamp(latest.submittedAt);
    if (latestTimestamp === undefined || timestamp > latestTimestamp) return game;
    if (timestamp < latestTimestamp) return latest;
    return game.id.localeCompare(latest.id) < 0 ? game : latest;
  }, undefined);
}

export function sortGamesBySubmission(games: readonly GameEntry[]): GameEntry[] {
  const titleCollator = new Intl.Collator("ru-RU", {
    numeric: true,
    sensitivity: "base",
  });

  return [...games].sort((left, right) => {
    const leftTime = getSubmittedAtTimestamp(left.submittedAt);
    const rightTime = getSubmittedAtTimestamp(right.submittedAt);

    if (leftTime !== undefined && rightTime !== undefined && leftTime !== rightTime) {
      return rightTime - leftTime;
    }
    if ((leftTime !== undefined) !== (rightTime !== undefined)) {
      return leftTime !== undefined ? -1 : 1;
    }

    return titleCollator.compare(left.title, right.title) || left.id.localeCompare(right.id);
  });
}
