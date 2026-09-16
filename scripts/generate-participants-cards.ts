import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { jams } from "../src/config/jams";
import type { GameSnapshot, JamRound, ProviderId } from "../src/lib/domain/types";
import { getTranslations, isLocale, SUPPORTED_LOCALES } from "../src/lib/i18n";
import { formatRoundNumber } from "../src/lib/i18n/formatters";
import type { Locale } from "../src/lib/i18n/types";
import { getRoundParticipantsImage } from "../src/lib/jams/presentation";
import { providerRegistry } from "../src/lib/providers/registry";
import { readRoundSnapshot, syncRound } from "./lib/round-sync";
import { formatArtworkMonth, getRoundArtwork } from "./lib/round-artwork";
import { publicPathToFilePath } from "./lib/paths";
import { assertAccent, escapeXml } from "./lib/svg";
import { validateJamRounds } from "../src/lib/jams/status";

export const WIDTH = 1200;
export const HEIGHT = 630;
export const MASCOT_LAYOUT = {
  x: 930,
  y: 465,
  width: 200,
  height: 92,
  opacity: 0.14,
} as const;
export const ROUND_NUMBER_LAYOUT = {
  x: 600,
  y: 580,
  fontSize: 108,
  opacity: 0.055,
  letterSpacing: -8,
} as const;

const MASCOT_DATA_URI = `data:image/png;base64,${readFileSync(
  publicPathToFilePath("/community/PrimitivesMascotWhite.png"),
).toString("base64")}`;

export interface ParticipantBreakdownItem {
  provider: ProviderId;
  label: string;
  participantsCount: number;
}

export interface ParticipantsCardDefinition {
  locale: Locale;
  outputPath: string;
  round: number;
  roundNumber: string;
  roundLabel: string;
  monthLabel: string;
  accent: string;
  registrationsCount: number;
  providers: readonly ParticipantBreakdownItem[];
  syncedAt: string;
}

export function mainNumberFontSize(registrationsCount: number): number {
  const digits = String(Math.max(0, Math.trunc(registrationsCount))).length;
  if (digits <= 2) return 230;
  if (digits === 3) return 195;
  if (digits === 4) return 165;
  return 140;
}

function participantStatsError(round: JamRound): Error {
  return new Error(
    `Participant statistics are unavailable for round ${formatRoundNumber(round.round)}; ` +
      "the snapshot has no stats.registrationsCount.",
  );
}

export function getParticipantsCardDefinition(
  round: JamRound,
  snapshot: GameSnapshot,
  locale: Locale,
): ParticipantsCardDefinition {
  const stats = snapshot.stats;
  if (!stats) throw participantStatsError(round);

  const artwork = getRoundArtwork(round, locale);
  const statsByProvider = new Map(stats.providers.map((provider) => [provider.provider, provider]));
  const providers = round.providers
    .filter((provider) => provider.enabled)
    .map((config) => {
      const providerStats = statsByProvider.get(config.type);
      if (!providerStats) {
        throw new Error(
          `Participant statistics for round ${formatRoundNumber(round.round)} are missing ` +
            `provider ${config.type}.`,
        );
      }

      return {
        provider: config.type,
        label: providerRegistry.getMeta(config.type).label,
        participantsCount: providerStats.participantsCount,
      };
    });

  return {
    locale,
    outputPath: getRoundParticipantsImage(round.round, locale),
    round: artwork.round,
    roundNumber: artwork.roundNumber,
    roundLabel: artwork.editionLabel,
    monthLabel: artwork.monthLabel,
    accent: artwork.accent,
    registrationsCount: stats.registrationsCount,
    providers,
    syncedAt: snapshot.syncedAt,
  };
}

export function getParticipantsCardDefinitions(
  round: JamRound,
  snapshot: GameSnapshot,
  locales: readonly Locale[] = SUPPORTED_LOCALES,
): ParticipantsCardDefinition[] {
  return locales.map((locale) => getParticipantsCardDefinition(round, snapshot, locale));
}

export function createParticipantsCardSvg(card: ParticipantsCardDefinition): string {
  assertAccent(card.accent);
  const accent = escapeXml(card.accent);
  const translations = getTranslations(card.locale);
  const month = escapeXml(formatArtworkMonth(card));
  const number = escapeXml(card.registrationsCount);
  const roundNumber = escapeXml(card.roundNumber);
  const providerBreakdown = card.providers
    .map((provider, index) => {
      const separator = index < card.providers.length - 1
        ? `<tspan fill="#9a988e" dx="18">·</tspan>`
        : "";
      return [
        `<tspan fill="#f2efe5">${escapeXml(provider.label)}</tspan>`,
        `<tspan fill="${accent}" dx="8">${escapeXml(provider.participantsCount)}</tspan>`,
        separator,
      ].join("");
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
      <path d="M 42 0 L 0 0 0 42" fill="none" stroke="#f2efe5" stroke-opacity="0.07" stroke-width="1" />
    </pattern>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#11110f" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)" />
  <rect x="34" y="34" width="1132" height="562" fill="none" stroke="${accent}" stroke-opacity="0.65" stroke-width="2" />
  <rect x="70" y="70" width="16" height="16" fill="${accent}" />

  <text x="108" y="84" fill="#f2efe5" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800" letter-spacing="4">${escapeXml(translations.myIndie.challengeLabel)}</text>
  <text x="1130" y="88" fill="${accent}" font-family="monospace" font-size="15" font-weight="700" letter-spacing="2" text-anchor="end">${escapeXml(card.roundLabel)}</text>

  <text x="${ROUND_NUMBER_LAYOUT.x}" y="${ROUND_NUMBER_LAYOUT.y}" fill="${accent}" fill-opacity="${ROUND_NUMBER_LAYOUT.opacity}" font-family="monospace" font-size="${ROUND_NUMBER_LAYOUT.fontSize}" font-weight="800" letter-spacing="${ROUND_NUMBER_LAYOUT.letterSpacing}" text-anchor="middle">${roundNumber}</text>
  <text x="600" y="185" text-anchor="middle" fill="#9a988e" font-family="monospace" font-size="18" font-weight="700" letter-spacing="3">${escapeXml(translations.participants.eyebrow)}</text>
  <text x="600" y="405" text-anchor="middle" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="${mainNumberFontSize(card.registrationsCount)}" font-weight="900" letter-spacing="-6">${number}</text>

  <text x="600" y="465" text-anchor="middle" font-family="monospace" font-size="19" font-weight="700" letter-spacing="1">${providerBreakdown}</text>
  <path d="M 310 505 H 890" fill="none" stroke="#f2efe5" stroke-opacity="0.12" stroke-width="1" />

  <text x="600" y="555" text-anchor="middle" fill="#9a988e" font-family="monospace" font-size="17" letter-spacing="3">${month}</text>

  <image x="${MASCOT_LAYOUT.x}" y="${MASCOT_LAYOUT.y}" width="${MASCOT_LAYOUT.width}" height="${MASCOT_LAYOUT.height}" preserveAspectRatio="xMidYMid meet" opacity="${MASCOT_LAYOUT.opacity}" href="${MASCOT_DATA_URI}" />
</svg>`;
}

export interface ParticipantsCliOptions {
  round: number;
  locale?: Locale;
  cached: boolean;
}

export function parseArgs(args: readonly string[]): ParticipantsCliOptions | undefined {
  if (args.includes("--help")) {
    if (args.length !== 1) throw new Error("--help cannot be combined with other options");
    return undefined;
  }

  let roundValue: string | undefined;
  let locale: Locale | undefined;
  let cached = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--round") {
      if (roundValue !== undefined) throw new Error("--round may be specified only once");
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--round requires a number");
      roundValue = value;
      index += 1;
      continue;
    }
    if (arg === "--locale") {
      if (locale !== undefined) throw new Error("--locale may be specified only once");
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--locale requires en or ru");
      if (!isLocale(value)) throw new Error(`Unknown locale: ${value}`);
      locale = value;
      index += 1;
      continue;
    }
    if (arg === "--cached") {
      if (cached) throw new Error("--cached may be specified only once");
      cached = true;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  if (roundValue === undefined) throw new Error("Missing required --round <number>");
  if (!/^\d+$/.test(roundValue)) {
    throw new Error(`Invalid round number: ${roundValue}`);
  }

  const round = Number(roundValue);
  if (!Number.isSafeInteger(round) || round < 1) {
    throw new Error(`Invalid round number: ${roundValue}`);
  }

  return { round, locale, cached };
}

function printHelp(): void {
  console.log(`Usage:
  npm run generate:participants -- --round <number> [--locale en|ru] [--cached]

Generates localized 1200x630 participant cards for one configured round. By
default the selected round is synchronized first; --cached uses its snapshot
without making network requests.
`);
}

async function generateCard(card: ParticipantsCardDefinition): Promise<void> {
  const outputPath = publicPathToFilePath(card.outputPath);
  await mkdir(dirname(outputPath), { recursive: true });
  const png = await sharp(Buffer.from(createParticipantsCardSvg(card))).png().toBuffer();
  const metadata = await sharp(png).metadata();
  if (metadata.width !== WIDTH || metadata.height !== HEIGHT) {
    throw new Error(
      `Participants card must be ${WIDTH}x${HEIGHT}: ${card.outputPath} rendered as ${metadata.width ?? "?"}x${metadata.height ?? "?"}`,
    );
  }
  await writeFile(outputPath, png);
}

function displayOutputPath(publicPath: string): string {
  return `public/${publicPath.replace(/^\/+/, "")}`;
}

export function resolveRound(roundNumber: number): JamRound {
  const round = jams.find((candidate) => candidate.round === roundNumber);
  if (!round) {
    const available = jams.map((candidate) => candidate.round).join(", ");
    throw new Error(`Unknown round ${formatRoundNumber(roundNumber)}. Available rounds: ${available || "none"}`);
  }
  return round;
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  const options = parseArgs(args);
  if (!options) {
    printHelp();
    return;
  }

  validateJamRounds(jams);
  const round = resolveRound(options.round);
  if (!options.cached) await syncRound(round);

  const snapshot = await readRoundSnapshot(round);
  if (!snapshot?.stats) {
    throw participantStatsError(round);
  }

  const locales: readonly Locale[] = options.locale ? [options.locale] : SUPPORTED_LOCALES;
  const cards = getParticipantsCardDefinitions(round, snapshot, locales);
  await Promise.all(cards.map(generateCard));

  console.log(`Round ${formatRoundNumber(round.round)}`);
  console.log(`Registrations: ${snapshot.stats.registrationsCount}`);
  for (const provider of cards[0]?.providers ?? []) {
    console.log(`${provider.label}: ${provider.participantsCount}`);
  }
  console.log(`Synced at: ${snapshot.syncedAt}`);
  console.log("Generated:");
  for (const card of cards) console.log(`  ${displayOutputPath(card.outputPath)}`);
}

const scriptPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (scriptPath === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
