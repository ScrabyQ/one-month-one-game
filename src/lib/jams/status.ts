import type { JamRound, JamStatus } from "../domain/types";

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
      throw new Error(`Enabled ${provider.type} provider for ${round.slug} needs a positive numeric JAM_ID`);
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

export function getJamStatus(round: JamRound, now = new Date()): JamStatus {
  const { start, end } = assertRound(round);
  if (now < start) return "upcoming";
  if (now < end) return "active";
  return "finished";
}

export function getFeaturedRound(rounds: readonly JamRound[], now = new Date()): JamRound {
  validateJamRounds(rounds);

  const active = rounds.filter((round) => getJamStatus(round, now) === "active");
  if (active.length > 1) {
    throw new Error(`More than one active jam round is configured: ${active.map((round) => round.slug).join(", ")}`);
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

function remainingLabel(totalMinutes: number): string {
  const minutes = Math.max(1, Math.ceil(totalMinutes));
  if (minutes >= 24 * 60) {
    const days = Math.ceil(minutes / (24 * 60));
    return `${days} ${plural(days, "день", "дня", "дней")}`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const result: string[] = [];
  if (hours > 0) result.push(`${hours} ${plural(hours, "час", "часа", "часов")}`);
  if (rest > 0) result.push(`${rest} ${plural(rest, "минута", "минуты", "минут")}`);
  return result.join(" ") || "меньше минуты";
}

export function getCountdownLabel(round: JamRound, now = new Date()): string {
  const status = getJamStatus(round, now);
  if (status === "finished") return "Джем завершён";

  const target = status === "upcoming" ? new Date(round.startsAt) : new Date(round.endsAt);
  const totalMinutes = (target.getTime() - now.getTime()) / 60_000;
  return `${status === "upcoming" ? "Начнётся через" : "До конца"} ${remainingLabel(totalMinutes)}`;
}

export function getStatusLabel(status: JamStatus): string {
  return {
    upcoming: "Скоро",
    active: "Идёт сейчас",
    finished: "Завершён",
  }[status];
}
