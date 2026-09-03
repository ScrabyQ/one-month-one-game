import type { JamRound, JamStatus } from "../domain/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const SECOND_MS = 1000;

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
  if (!round.id || !round.slug || !round.title || !round.monthLabel || !round.theme) {
    throw new Error(`Jam round ${round.slug || "<unknown>"} is missing required metadata`);
  }
  if (round.themeState !== "announced" && round.themeState !== "pending") {
    throw new Error(`Jam round ${round.slug} has an invalid theme state`);
  }
  for (const provider of round.providers) {
    try {
      const providerUrl = new URL(provider.jamUrl);
      if (providerUrl.protocol !== "http:" && providerUrl.protocol !== "https:") {
        throw new Error("provider URL must use HTTP(S)");
      }
    } catch {
      throw new Error(`Invalid participation URL for jam round ${round.slug}`);
    }
    if (provider.enabled && (!Number.isInteger(provider.jamId) || provider.jamId <= 0)) {
      throw new Error(
        `Enabled ${provider.type} provider for ${round.slug} needs a positive numeric JAM_ID`,
      );
    }
  }
  return { start, end };
}

export function validateJamRounds(rounds: readonly JamRound[]): void {
  if (rounds.length === 0) throw new Error("At least one jam round must be configured");

  const ids = new Set<string>();
  const slugs = new Set<string>();
  const intervals = rounds.map((round) => {
    if (ids.has(round.id)) throw new Error(`Duplicate jam round id: ${round.id}`);
    if (slugs.has(round.slug)) throw new Error(`Duplicate jam round slug: ${round.slug}`);
    ids.add(round.id);
    slugs.add(round.slug);
    const dates = assertRound(round);
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

function plural(value: number, one: string, few: string, many: string): string {
  const absolute = Math.abs(value) % 100;
  const last = absolute % 10;
  if (absolute >= 11 && absolute <= 19) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

export interface CountdownParts {
  status: JamStatus;
  label: string;
  value: string;
  targetAt: string;
  refreshAfterMs: number;
}

function assertDateRange(startsAt: string, endsAt: string): { start: Date; end: Date } {
  const start = roundDate(startsAt, "startsAt", "countdown");
  const end = roundDate(endsAt, "endsAt", "countdown");
  if (end <= start) throw new Error("Countdown end date must be after its start date");
  return { start, end };
}

export function formatRemainingDuration(totalMilliseconds: number): string {
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
  return `${days} ${plural(days, "день", "дня", "дней")}`;
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
      label: "Статус",
      value: "Раунд завершён",
      targetAt: endsAt,
      refreshAfterMs: 30_000,
    };
  }

  const target = status === "upcoming" ? start : end;
  const remainingMs = target.getTime() - now.getTime();
  return {
    status,
    label: status === "upcoming" ? "До старта" : "До конца",
    value: formatRemainingDuration(remainingMs),
    targetAt: status === "upcoming" ? startsAt : endsAt,
    refreshAfterMs: remainingMs < DAY_MS ? 1000 : 30_000,
  };
}

export function getCountdownParts(round: JamRound, now = new Date()): CountdownParts {
  assertRound(round);
  return getCountdownPartsForDates(round.startsAt, round.endsAt, now);
}

export function getCountdownLabel(round: JamRound, now = new Date()): string {
  const parts = getCountdownParts(round, now);
  return parts.status === "finished" ? parts.value : `${parts.label} ${parts.value}`;
}

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
});

export function formatJamDate(value: string): string {
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (isoDate) return `${isoDate[3]}.${isoDate[2]}`;
  return dateFormatter.format(roundDate(value, "date", "format"));
}

export function formatJamDateRange(round: JamRound): string {
  assertRound(round);
  return `${formatJamDate(round.startsAt)} — ${formatJamDate(round.endsAt)}`;
}

export function getThemePresentation(round: JamRound): {
  isAnnounced: boolean;
  text: string;
} {
  if (round.themeState === "announced") {
    return { isAnnounced: true, text: round.theme };
  }
  return {
    isAnnounced: false,
    text: round.themeAnnouncement ?? "Тема появится в начале месяца",
  };
}

export function getArchiveTheme(round: JamRound): string {
  return getThemePresentation(round).text;
}

export function getFinishedRounds(rounds: readonly JamRound[], now = new Date()): JamRound[] {
  return [...rounds]
    .filter((round) => getJamStatus(round, now) === "finished")
    .sort((left, right) => +new Date(right.startsAt) - +new Date(left.startsAt));
}

export function getStatusLabel(status: JamStatus): string {
  return {
    upcoming: "Скоро",
    active: "Идёт сейчас",
    finished: "Завершён",
  }[status];
}
