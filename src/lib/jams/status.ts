import type { JamRound, JamStatus } from "../domain/types";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, getJamContent } from "../i18n";
import { getRoundPresentation } from "./presentation";

const DAY_MS = 24 * 60 * 60 * 1000;

function roundDate(value: string, field: string, slug: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${field} date for jam round ${slug}: ${value}`);
  }
  return date;
}

function assertRound(round: JamRound): { start: Date; end: Date } {
  const start = roundDate(round.startsAt, "startsAt", round.slug);
  const end = roundDate(round.endsAt, "endsAt", round.slug);
  if (end <= start) {
    throw new Error(`Jam round ${round.slug} must end after it starts`);
  }
  if (!Number.isInteger(round.round) || round.round <= 0) {
    throw new Error(
      `Jam round ${round.slug || "<unknown>"} needs a positive integer round number`,
    );
  }
  if (!round.id || !round.slug || !round.content) {
    throw new Error(`Jam round ${round.slug || "<unknown>"} is missing required metadata`);
  }
  for (const locale of SUPPORTED_LOCALES) {
    const content = getJamContent(round, locale);
    if (!content.title || !content.monthLabel || !content.theme) {
      throw new Error(`Jam round ${round.slug} is missing required ${locale} content`);
    }
  }
  if (round.themeState !== "announced" && round.themeState !== "pending") {
    throw new Error(`Jam round ${round.slug} has an invalid theme state`);
  }
  getRoundPresentation(round, DEFAULT_LOCALE);
  for (const provider of round.providers) {
    if (provider.type === "itch" || provider.type === "myindie") {
      try {
        const providerUrl = new URL(provider.jamUrl);
        if (providerUrl.protocol !== "http:" && providerUrl.protocol !== "https:") {
          throw new Error("provider URL must use HTTP(S)");
        }
      } catch {
        throw new Error(`Invalid participation URL for jam round ${round.slug}`);
      }

      if (provider.type === "itch" && provider.enabled && (!Number.isInteger(provider.jamId) || provider.jamId <= 0)) {
        throw new Error(
          `Enabled ${provider.type} provider for ${round.slug} needs a positive numeric JAM_ID`,
        );
      }

      if (provider.type === "myindie" && provider.enabled && !provider.jamAlias.trim()) {
        throw new Error(
          `Enabled ${provider.type} provider for ${round.slug} needs a non-empty jam alias`,
        );
      }
    }
  }
  return { start, end };
}

export function validateJamRounds(rounds: readonly JamRound[]): void {
  if (rounds.length === 0) throw new Error("At least one jam round must be configured");

  const ids = new Set<string>();
  const slugs = new Set<string>();
  const roundNumbers = new Set<number>();
  const intervals = rounds.map((round) => {
    if (ids.has(round.id)) throw new Error(`Duplicate jam round id: ${round.id}`);
    if (slugs.has(round.slug)) throw new Error(`Duplicate jam round slug: ${round.slug}`);
    ids.add(round.id);
    slugs.add(round.slug);
    const dates = assertRound(round);
    if (roundNumbers.has(round.round)) {
      throw new Error(`Round ${round.round} is configured more than once`);
    }
    roundNumbers.add(round.round);
    return { round, ...dates };
  });

  for (let leftIndex = 0; leftIndex < intervals.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < intervals.length; rightIndex += 1) {
      const left = intervals[leftIndex];
      const right = intervals[rightIndex];
      if (left.start < right.end && right.start < left.end) {
        throw new Error(
          `Jam rounds ${left.round.slug} and ${right.round.slug} overlap; configure non-overlapping dates`,
        );
      }
    }
  }
}

function getJamStatusForDates(start: Date, end: Date, now: Date): JamStatus {
  if (now < start) return "upcoming";
  if (now < end) return "active";
  return "finished";
}

export function getJamStatus(round: JamRound, now = new Date()): JamStatus {
  const { start, end } = assertRound(round);
  return getJamStatusForDates(start, end, now);
}

export function getFeaturedRound(rounds: readonly JamRound[], now = new Date()): JamRound {
  validateJamRounds(rounds);

  const active = rounds.filter((round) => getJamStatus(round, now) === "active");
  if (active.length > 1) {
    throw new Error(
      `More than one active jam round is configured: ${active.map((round) => round.slug).join(", ")}`,
    );
  }
  if (active[0]) return active[0];

  const upcoming = rounds
    .filter((round) => getJamStatus(round, now) === "upcoming")
    .sort((left, right) => +new Date(left.startsAt) - +new Date(right.startsAt));
  if (upcoming[0]) return upcoming[0];

  return [...rounds].sort(
    (left, right) => +new Date(right.endsAt) - +new Date(left.endsAt),
  )[0];
}

export interface CountdownParts {
  status: JamStatus;
  targetAt: string;
  remainingMs: number;
  refreshAfterMs: number;
}

function assertDateRange(startsAt: string, endsAt: string): { start: Date; end: Date } {
  const start = roundDate(startsAt, "startsAt", "countdown");
  const end = roundDate(endsAt, "endsAt", "countdown");
  if (end <= start) throw new Error("Countdown end date must be after its start date");
  return { start, end };
}

export function getCountdownPartsForDates(
  startsAt: string,
  endsAt: string,
  now = new Date(),
): CountdownParts {
  const { start, end } = assertDateRange(startsAt, endsAt);
  const status = getJamStatusForDates(start, end, now);

  if (status === "finished") {
    return {
      status,
      targetAt: endsAt,
      remainingMs: 0,
      refreshAfterMs: 30_000,
    };
  }

  const target = status === "upcoming" ? start : end;
  const remainingMs = target.getTime() - now.getTime();
  return {
    status,
    targetAt: status === "upcoming" ? startsAt : endsAt,
    remainingMs,
    refreshAfterMs: remainingMs < DAY_MS ? 1000 : 30_000,
  };
}

export function getCountdownParts(round: JamRound, now = new Date()): CountdownParts {
  assertRound(round);
  return getCountdownPartsForDates(round.startsAt, round.endsAt, now);
}

export function getFinishedRounds(rounds: readonly JamRound[], now = new Date()): JamRound[] {
  return [...rounds]
    .filter((round) => getJamStatus(round, now) === "finished")
    .sort((left, right) => +new Date(right.startsAt) - +new Date(left.startsAt));
}
