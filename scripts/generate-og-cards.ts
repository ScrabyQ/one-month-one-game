import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { jams } from "../src/config/jams";
import { getJamContent, getTranslations, SUPPORTED_LOCALES } from "../src/lib/i18n";
import { formatRoundNumber } from "../src/lib/i18n/formatters";
import type { Locale } from "../src/lib/i18n/types";
import {
  DEFAULT_ROUND_ACCENT,
  getDefaultSocialImage,
  getRoundPresentation,
} from "../src/lib/jams/presentation";
import { validateJamRounds } from "../src/lib/jams/status";

export const WIDTH = 1200;
export const HEIGHT = 630;

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export interface OgCard {
  locale: Locale;
  outputPath: string;
  round?: number;
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

function publicPathToFilePath(publicPath: string): string {
  return resolve(projectRoot, "public", publicPath.replace(/^\/+/, ""));
}

function escapeXml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function assertAccent(accent: string): void {
  if (!/^#[\da-f]{6}$/i.test(accent)) {
    throw new Error(`Accent must use #RRGGBB format: ${accent}`);
  }
}

export function getOgCardDefinitions(): OgCard[] {
  validateJamRounds(jams);

  return SUPPORTED_LOCALES.flatMap((locale) => {
    const translations = getTranslations(locale);
    const baseCard = {
      locale,
      roundNumber: "OG",
      projectTitle: translations.og.projectTitle,
      editionLabel: translations.og.monthlyEditionLabel,
      monthLabel: translations.og.monthlyChallengeLabel,
      titleLineOne: translations.og.titleLineOne,
      titleLineTwo: translations.og.titleLineTwo,
      tagline: translations.og.tagline,
      giantLabel: translations.og.defaultGiantLabel,
      accent: DEFAULT_ROUND_ACCENT,
    } satisfies Omit<OgCard, "outputPath" | "round">;

    const defaultCard: OgCard = {
      ...baseCard,
      outputPath: getDefaultSocialImage(locale),
    };

    const roundCards = jams.map((round): OgCard => {
      const content = getJamContent(round, locale);
      const presentation = getRoundPresentation(round, locale);
      const roundNumber = formatRoundNumber(round.round);
      const roundLabel = translations.og.roundLabel(roundNumber);

      return {
        locale,
        outputPath: presentation.socialImage,
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
    });

    return [defaultCard, ...roundCards];
  });
}

export function createCardSvg(card: OgCard): string {
  assertAccent(card.accent);
  const accent = escapeXml(card.accent);
  const month = escapeXml(card.monthLabel.toLocaleUpperCase(card.locale === "ru" ? "ru-RU" : "en-US"));

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

  <text x="108" y="84" fill="#f2efe5" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800" letter-spacing="4">${escapeXml(card.projectTitle)}</text>
  <text x="1130" y="88" fill="${accent}" font-family="monospace" font-size="15" font-weight="700" letter-spacing="2" text-anchor="end">${escapeXml(card.editionLabel)}</text>

  <text x="68" y="402" fill="#f2efe5" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="900" letter-spacing="-2">${escapeXml(card.titleLineOne)}</text>
  <text x="68" y="492" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="900" letter-spacing="-2">${escapeXml(card.titleLineTwo)}</text>

  <text x="68" y="548" fill="#9a988e" font-family="monospace" font-size="18" letter-spacing="3">${month}</text>
  <text x="1134" y="566" fill="${accent}" font-family="monospace" font-size="18" letter-spacing="2" text-anchor="end">${escapeXml(card.tagline)}</text>
  <text x="1180" y="485" fill="${accent}" fill-opacity="0.08" font-family="monospace" font-size="270" font-weight="800" letter-spacing="-24" text-anchor="end">${escapeXml(card.giantLabel)}</text>
  <text x="1130" y="548" fill="#f2efe5" fill-opacity="0.35" font-family="monospace" font-size="16" letter-spacing="2" text-anchor="end">${escapeXml(card.roundNumber)}</text>
</svg>`;
}

async function generateCard(card: OgCard): Promise<void> {
  const outputPath = publicPathToFilePath(card.outputPath);
  await mkdir(dirname(outputPath), { recursive: true });
  await sharp(Buffer.from(createCardSvg(card))).png().toFile(outputPath);
  console.log(`${outputPath} (${WIDTH}x${HEIGHT})`);
}

function printHelp(): void {
  console.log(`Usage:
  npm run generate:og

Cards are generated from src/config/jams.ts and the localized dictionaries for
every supported locale. Each configured round produces one card per locale.
`);
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  if (args.includes("--help")) {
    if (args.length !== 1) throw new Error("--help cannot be combined with other options");
    printHelp();
    return;
  }
  if (args.length > 0) {
    throw new Error("The OG generator is config-driven and does not accept card metadata options");
  }

  await Promise.all(getOgCardDefinitions().map(generateCard));
}

const scriptPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (scriptPath === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
