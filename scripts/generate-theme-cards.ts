import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { jams } from "../src/config/jams";
import type { JamRound } from "../src/lib/domain/types";
import { getJamContent, getTranslations, isLocale, SUPPORTED_LOCALES } from "../src/lib/i18n";
import { formatRoundNumber } from "../src/lib/i18n/formatters";
import type { Locale } from "../src/lib/i18n/types";
import { getRoundThemeImage } from "../src/lib/jams/presentation";
import { validateJamRounds } from "../src/lib/jams/status";
import { formatArtworkMonth, getRoundArtwork } from "./lib/round-artwork";
import { publicPathToFilePath } from "./lib/paths";
import { assertAccent, escapeXml } from "./lib/svg";
import { ARTWORK_FONTS, renderArtworkPng } from "./lib/artwork-renderer";

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
export const THEME_TEXT_LAYOUT = {
  centerX: 600,
  centerY: 330,
  maxWidth: 930,
  maxHeight: 238,
  maxFontSize: 112,
  minFontSize: 32,
  maxLines: 4,
  lineHeightRatio: 1.08,
} as const;

const MASCOT_DATA_URI = `data:image/png;base64,${readFileSync(
  publicPathToFilePath("/community/PrimitivesMascotWhite.png"),
).toString("base64")}`;

export interface ThemeCardDefinition {
  locale: Locale;
  outputPath: string;
  round: number;
  roundNumber: string;
  roundLabel: string;
  monthLabel: string;
  accent: string;
  themeText: string;
  isAnnounced: boolean;
}

export interface ThemeTextFit {
  fontSize: number;
  lines: readonly string[];
  lineHeight: number;
  firstBaseline: number;
}

function estimatedTextWidth(text: string, fontSize: number): number {
  let emWidth = 0;
  for (const character of Array.from(text)) {
    if (/\s/u.test(character)) {
      emWidth += 0.32;
    } else if (/[ilI1|.,:;!'’`]/u.test(character)) {
      emWidth += 0.3;
    } else if (/[MW@%&ЖШЩФЮ]/u.test(character)) {
      emWidth += 0.88;
    } else if (/[()[\]{}]/u.test(character)) {
      emWidth += 0.38;
    } else {
      emWidth += 0.62;
    }
  }
  return emWidth * fontSize;
}

function splitLongWord(word: string, fontSize: number): string[] {
  const chunks: string[] = [];
  let chunk = "";
  for (const character of Array.from(word)) {
    const candidate = chunk + character;
    if (chunk && estimatedTextWidth(candidate, fontSize) > THEME_TEXT_LAYOUT.maxWidth) {
      chunks.push(chunk);
      chunk = character;
    } else {
      chunk = candidate;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

function wrapThemeText(text: string, fontSize: number): string[] {
  const words = text.trim().replace(/\s+/gu, " ").split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const pieces = estimatedTextWidth(word, fontSize) > THEME_TEXT_LAYOUT.maxWidth
      ? splitLongWord(word, fontSize)
      : [word];

    for (const piece of pieces) {
      const candidate = line ? `${line} ${piece}` : piece;
      if (line && estimatedTextWidth(candidate, fontSize) > THEME_TEXT_LAYOUT.maxWidth) {
        lines.push(line);
        line = piece;
      } else {
        line = candidate;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function fitThemeText(text: string): ThemeTextFit {
  if (!text.trim()) throw new Error("Theme card text cannot be empty");

  for (
    let fontSize = THEME_TEXT_LAYOUT.maxFontSize;
    fontSize >= THEME_TEXT_LAYOUT.minFontSize;
    fontSize -= 2
  ) {
    const lines = wrapThemeText(text, fontSize);
    const lineHeight = Math.round(fontSize * THEME_TEXT_LAYOUT.lineHeightRatio);
    if (
      lines.length <= THEME_TEXT_LAYOUT.maxLines &&
      lines.length * lineHeight <= THEME_TEXT_LAYOUT.maxHeight
    ) {
      const firstBaseline = Math.round(
        THEME_TEXT_LAYOUT.centerY - ((lines.length - 1) * lineHeight) / 2 + fontSize * 0.34,
      );
      return { fontSize, lines, lineHeight, firstBaseline };
    }
  }

  throw new Error(
    `Theme card text is too long to fit in ${THEME_TEXT_LAYOUT.maxLines} lines; shorten the text.`,
  );
}

function missingThemeTextError(round: JamRound, locale: Locale): Error {
  return new Error(
    round.themeState === "pending"
      ? `Theme announcement is missing for round ${formatRoundNumber(round.round)} (${locale}).`
      : `Theme is missing for round ${formatRoundNumber(round.round)} (${locale}).`,
  );
}

export function getThemeCardDefinition(round: JamRound, locale: Locale): ThemeCardDefinition {
  const content = getJamContent(round, locale);
  const isAnnounced = round.themeState === "announced";
  const themeText = isAnnounced ? content.theme : content.themeAnnouncement;
  if (!themeText?.trim()) throw missingThemeTextError(round, locale);

  const artwork = getRoundArtwork(round, locale);
  return {
    locale,
    outputPath: getRoundThemeImage(round.round, locale),
    round: artwork.round,
    roundNumber: artwork.roundNumber,
    roundLabel: artwork.editionLabel,
    monthLabel: artwork.monthLabel,
    accent: artwork.accent,
    themeText,
    isAnnounced,
  };
}

export function getThemeCardDefinitions(
  round: JamRound,
  locales: readonly Locale[] = SUPPORTED_LOCALES,
): ThemeCardDefinition[] {
  return locales.map((locale) => getThemeCardDefinition(round, locale));
}

export function createThemeCardSvg(card: ThemeCardDefinition): string {
  assertAccent(card.accent);
  const accent = escapeXml(card.accent);
  const translations = getTranslations(card.locale);
  const month = escapeXml(formatArtworkMonth(card));
  const textFit = fitThemeText(card.themeText);
  const themeColor = card.isAnnounced ? accent : "#f2efe5";
  const eyebrow = card.isAnnounced
    ? translations.themeCard.eyebrow
    : translations.themeCard.announcementEyebrow;
  const lines = textFit.lines
    .map((line, index) => {
      const baseline = textFit.firstBaseline + index * textFit.lineHeight;
      return `<tspan x="${THEME_TEXT_LAYOUT.centerX}" y="${baseline}">${escapeXml(line)}</tspan>`;
    })
    .join("");
  const roundNumber = escapeXml(card.roundNumber);

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

  <text x="108" y="84" fill="#f2efe5" font-family="${ARTWORK_FONTS.sans}" font-size="18" font-weight="700" letter-spacing="4">${escapeXml(translations.myIndie.challengeLabel)}</text>
  <text x="1130" y="88" fill="${accent}" font-family="${ARTWORK_FONTS.mono}" font-size="15" font-weight="700" letter-spacing="2" text-anchor="end">${escapeXml(card.roundLabel)}</text>

  <text x="${ROUND_NUMBER_LAYOUT.x}" y="${ROUND_NUMBER_LAYOUT.y}" fill="${accent}" fill-opacity="${ROUND_NUMBER_LAYOUT.opacity}" font-family="${ARTWORK_FONTS.background}" font-size="${ROUND_NUMBER_LAYOUT.fontSize}" font-weight="800" letter-spacing="${ROUND_NUMBER_LAYOUT.letterSpacing}" text-anchor="middle">${roundNumber}</text>
  <text x="600" y="185" text-anchor="middle" fill="#9a988e" font-family="${ARTWORK_FONTS.mono}" font-size="18" font-weight="700" letter-spacing="3">${escapeXml(eyebrow)}</text>
  <text x="${THEME_TEXT_LAYOUT.centerX}" text-anchor="middle" fill="${themeColor}" font-family="${ARTWORK_FONTS.display}" font-size="${textFit.fontSize}" font-weight="900" letter-spacing="-1">${lines}</text>

  <path d="M 310 505 H 890" fill="none" stroke="#f2efe5" stroke-opacity="0.12" stroke-width="1" />
  <text x="600" y="555" text-anchor="middle" fill="#9a988e" font-family="${ARTWORK_FONTS.mono}" font-size="17" letter-spacing="3">${month}</text>

  <image x="${MASCOT_LAYOUT.x}" y="${MASCOT_LAYOUT.y}" width="${MASCOT_LAYOUT.width}" height="${MASCOT_LAYOUT.height}" preserveAspectRatio="xMidYMid meet" opacity="${MASCOT_LAYOUT.opacity}" href="${MASCOT_DATA_URI}" />
</svg>`;
}

export async function renderThemeCardPng(card: ThemeCardDefinition): Promise<Buffer> {
  const png = renderArtworkPng(createThemeCardSvg(card));
  const metadata = await sharp(png).metadata();
  if (metadata.width !== WIDTH || metadata.height !== HEIGHT) {
    throw new Error(
      `Theme card must be ${WIDTH}x${HEIGHT}: ${card.outputPath} rendered as ${metadata.width ?? "?"}x${metadata.height ?? "?"}`,
    );
  }
  return png;
}

export interface ThemeCliOptions {
  round: number;
  locale?: Locale;
}

export function parseArgs(args: readonly string[]): ThemeCliOptions | undefined {
  if (args.includes("--help")) {
    if (args.length !== 1) throw new Error("--help cannot be combined with other options");
    return undefined;
  }

  let roundValue: string | undefined;
  let locale: Locale | undefined;

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
    throw new Error(`Unknown option: ${arg}`);
  }

  if (roundValue === undefined) throw new Error("Missing required --round <number>");
  if (!/^\d+$/.test(roundValue)) throw new Error(`Invalid round number: ${roundValue}`);

  const round = Number(roundValue);
  if (!Number.isSafeInteger(round) || round < 1) {
    throw new Error(`Invalid round number: ${roundValue}`);
  }

  return { round, locale };
}

function printHelp(): void {
  console.log(`Usage:
  npm run generate:theme -- --round <number> [--locale en|ru]

Generates localized 1200x630 theme cards for one configured round. By default
both English and Russian cards are generated. Pending rounds use their localized
theme announcement.
`);
}

async function generateCard(card: ThemeCardDefinition): Promise<void> {
  const outputPath = publicPathToFilePath(card.outputPath);
  await mkdir(dirname(outputPath), { recursive: true });
  const png = await renderThemeCardPng(card);
  await writeFile(outputPath, png);
}

function displayOutputPath(publicPath: string): string {
  return `public/${publicPath.replace(/^\/+/, "")}`;
}

export function resolveThemeRound(roundNumber: number): JamRound {
  const round = jams.find((candidate) => candidate.round === roundNumber);
  if (!round) {
    const available = jams.map((candidate) => candidate.round).join(", ");
    throw new Error(
      `Unknown round ${formatRoundNumber(roundNumber)}. Available rounds: ${available || "none"}`,
    );
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
  const round = resolveThemeRound(options.round);
  const locales: readonly Locale[] = options.locale ? [options.locale] : SUPPORTED_LOCALES;
  const cards = getThemeCardDefinitions(round, locales);
  await Promise.all(cards.map(generateCard));

  console.log(`Round ${formatRoundNumber(round.round)}`);
  for (const card of cards) {
    console.log(`${card.isAnnounced ? "Theme" : "Announcement"}: ${card.themeText}`);
    console.log(`  ${displayOutputPath(card.outputPath)}`);
  }
}

const scriptPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (scriptPath === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
