import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { getTranslations, SUPPORTED_LOCALES } from "../src/lib/i18n";
import { DEFAULT_ROUND_ACCENT, getDefaultSocialImage, getRoundSocialImage } from "../src/lib/jams/presentation";
import {
  formatArtworkMonth,
  getRoundArtworkDefinitions,
  type RoundArtwork,
} from "./lib/round-artwork";
import { publicPathToFilePath } from "./lib/paths";
import { assertAccent, escapeXml } from "./lib/svg";

export const WIDTH = 1200;
export const HEIGHT = 630;

export interface OgCard extends Omit<RoundArtwork, "round"> {
  outputPath: string;
  round?: number;
}

export function getOgCardDefinitions(): OgCard[] {
  const roundArtwork = getRoundArtworkDefinitions();

  return SUPPORTED_LOCALES.flatMap((locale) => {
    const translations = getTranslations(locale);
    const defaultCard: OgCard = {
      locale,
      outputPath: getDefaultSocialImage(locale),
      roundNumber: "OG",
      projectTitle: translations.og.projectTitle,
      editionLabel: translations.og.monthlyEditionLabel,
      monthLabel: translations.og.monthlyChallengeLabel,
      titleLineOne: translations.og.titleLineOne,
      titleLineTwo: translations.og.titleLineTwo,
      tagline: translations.og.tagline,
      giantLabel: translations.og.defaultGiantLabel,
      accent: DEFAULT_ROUND_ACCENT,
    };

    const roundCards = roundArtwork
      .filter((artwork) => artwork.locale === locale)
      .map((artwork): OgCard => ({
        ...artwork,
        outputPath: getRoundSocialImage(artwork.round, artwork.locale),
      }));

    return [defaultCard, ...roundCards];
  });
}

export function createCardSvg(card: OgCard): string {
  assertAccent(card.accent);
  const accent = escapeXml(card.accent);
  const challengeLabel = escapeXml(getTranslations(card.locale).myIndie.challengeLabel);
  const month = escapeXml(formatArtworkMonth(card));

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

  <text x="108" y="84" fill="#f2efe5" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800" letter-spacing="4">${challengeLabel}</text>
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
