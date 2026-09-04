import { readFileSync } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { getTranslations } from "../src/lib/i18n";
import {
  formatArtworkMonth,
  getRoundArtworkDefinitions,
  type RoundArtwork,
} from "./lib/round-artwork";
import { publicPathToFilePath } from "./lib/paths";
import { assertAccent, escapeXml } from "./lib/svg";
import { getRoundMyIndieBanner } from "../src/lib/jams/presentation";

export const WIDTH = 1200;
export const HEIGHT = 400;
export const SAFE_AREA_WIDTH = 700;
export const SAFE_AREA_X = 250;
export const SAFE_AREA_RIGHT = SAFE_AREA_X + SAFE_AREA_WIDTH;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const FRAME_LEFT = 270;
export const FRAME_RIGHT = 930;
export const FRAME_TOP = 24;
export const FRAME_BOTTOM = 376;
export const MASCOT_LAYOUT = {
  x: 300,
  y: 296,
  width: 160,
  height: 74,
  opacity: 0.32,
} as const;

const MASCOT_DATA_URI = `data:image/png;base64,${readFileSync(
  publicPathToFilePath("/community/PrimitivesMascotWhite.png"),
).toString("base64")}`;

interface CriticalTextLayout {
  boxX: number;
  width: number;
  anchorX: number;
  y: number;
  anchor: "start" | "middle" | "end";
}

export const CRITICAL_TEXT_LAYOUT = {
  challengeLabel: {
    boxX: FRAME_LEFT + 20,
    width: 280,
    anchorX: FRAME_LEFT + 20,
    y: 56,
    anchor: "start",
  },
  roundLabel: {
    boxX: FRAME_RIGHT - 20 - 180,
    width: 180,
    anchorX: FRAME_RIGHT - 20,
    y: 56,
    anchor: "end",
  },
  titleLineOne: {
    boxX: 340,
    width: 520,
    anchorX: 600,
    y: 190,
    anchor: "middle",
  },
  titleLineTwo: {
    boxX: 370,
    width: 460,
    anchorX: 600,
    y: 254,
    anchor: "middle",
  },
  monthLabel: {
    boxX: 480,
    width: 240,
    anchorX: 600,
    y: 332,
    anchor: "middle",
  },
} satisfies Record<string, CriticalTextLayout>;

export interface MyIndieBannerDefinition extends RoundArtwork {
  outputPath: string;
}

export function getMyIndieBannerDefinitions(): MyIndieBannerDefinition[] {
  return getRoundArtworkDefinitions().map((artwork) => ({
    ...artwork,
    outputPath: getRoundMyIndieBanner(artwork.round, artwork.locale),
  }));
}

function textAttributes(layout: CriticalTextLayout): string {
  return `x="${layout.anchorX}" y="${layout.y}" text-anchor="${layout.anchor}" textLength="${layout.width}" lengthAdjust="spacingAndGlyphs"`;
}

export function createMyIndieBannerSvg(artwork: RoundArtwork): string {
  assertAccent(artwork.accent);
  const accent = escapeXml(artwork.accent);
  const translations = getTranslations(artwork.locale);
  const layout = CRITICAL_TEXT_LAYOUT;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
      <path d="M 42 0 L 0 0 0 42" fill="none" stroke="#f2efe5" stroke-opacity="0.07" stroke-width="1" />
    </pattern>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#11110f" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)" />

  <circle cx="84" cy="92" r="116" fill="${accent}" fill-opacity="0.035" />
  <circle cx="1128" cy="308" r="142" fill="${accent}" fill-opacity="0.035" />
  <g fill="none" stroke="#f2efe5" stroke-opacity="0.2" stroke-width="1.5">
    <rect x="62" y="96" width="16" height="16" transform="rotate(-12 70 104)" />
    <rect x="1118" y="76" width="16" height="16" transform="rotate(14 1126 84)" />
    <path d="M 1008 318 L 1022 294 L 1036 318 Z" />
    <circle cx="1140" cy="124" r="9" />
  </g>
  <g fill="none" stroke="${accent}" stroke-opacity="0.3" stroke-width="1.5">
    <circle cx="174" cy="128" r="7" />
    <rect x="1056" y="274" width="14" height="14" transform="rotate(-18 1063 281)" />
  </g>
  <image x="${MASCOT_LAYOUT.x}" y="${MASCOT_LAYOUT.y}" width="${MASCOT_LAYOUT.width}" height="${MASCOT_LAYOUT.height}" preserveAspectRatio="xMidYMid meet" opacity="${MASCOT_LAYOUT.opacity}" href="${MASCOT_DATA_URI}" />

  <text x="1190" y="366" fill="${accent}" fill-opacity="0.08" font-family="monospace" font-size="220" font-weight="800" letter-spacing="-18" text-anchor="end">${escapeXml(artwork.roundNumber)}</text>

  <path d="M ${FRAME_LEFT} 58 V ${FRAME_TOP} H ${FRAME_LEFT + 34} M ${FRAME_RIGHT} 58 V ${FRAME_TOP} H ${FRAME_RIGHT - 34} M ${FRAME_LEFT} 342 V ${FRAME_BOTTOM} H ${FRAME_LEFT + 34} M ${FRAME_RIGHT} 342 V ${FRAME_BOTTOM} H ${FRAME_RIGHT - 34}" fill="none" stroke="${accent}" stroke-opacity="0.65" stroke-width="2" />
  <path d="M ${FRAME_LEFT + 80} ${FRAME_TOP} H ${FRAME_RIGHT - 80} M ${FRAME_LEFT + 80} ${FRAME_BOTTOM} H ${FRAME_RIGHT - 80}" fill="none" stroke="#f2efe5" stroke-opacity="0.12" stroke-width="1" />

  <text ${textAttributes(layout.challengeLabel)} fill="#f2efe5" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="800" letter-spacing="2">${escapeXml(translations.myIndie.challengeLabel)}</text>
  <text ${textAttributes(layout.roundLabel)} fill="${accent}" font-family="monospace" font-size="14" font-weight="700" letter-spacing="2">${escapeXml(artwork.editionLabel)}</text>

  <text ${textAttributes(layout.titleLineOne)} fill="#f2efe5" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="900" letter-spacing="-1">${escapeXml(artwork.titleLineOne)}</text>
  <text ${textAttributes(layout.titleLineTwo)} fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="900" letter-spacing="-1">${escapeXml(artwork.titleLineTwo)}</text>

  <text ${textAttributes(layout.monthLabel)} fill="#9a988e" font-family="monospace" font-size="16" letter-spacing="3">${escapeXml(formatArtworkMonth(artwork))}</text>
  <path d="M 548 350 H 652" fill="none" stroke="${accent}" stroke-opacity="0.55" stroke-width="2" />
</svg>`;
}

function formatFileSize(bytes: number): string {
  return `${Math.ceil(bytes / 1024)} KB`;
}

async function generateBanner(banner: MyIndieBannerDefinition): Promise<void> {
  const outputPath = publicPathToFilePath(banner.outputPath);
  await mkdir(dirname(outputPath), { recursive: true });

  const png = await sharp(Buffer.from(createMyIndieBannerSvg(banner))).png().toBuffer();
  const metadata = await sharp(png).metadata();
  if (metadata.width !== WIDTH || metadata.height !== HEIGHT) {
    throw new Error(
      `MyIndie banner must be ${WIDTH}x${HEIGHT}: ${banner.outputPath} rendered as ${metadata.width ?? "?"}x${metadata.height ?? "?"}`,
    );
  }
  if (png.byteLength >= MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `MyIndie banner exceeds the 5 MB limit: ${banner.outputPath} is ${formatFileSize(png.byteLength)}`,
    );
  }

  await writeFile(outputPath, png);
  const fileSize = (await stat(outputPath)).size;
  if (fileSize >= MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `MyIndie banner exceeds the 5 MB limit after writing: ${outputPath} is ${formatFileSize(fileSize)}`,
    );
  }
  console.log(`${outputPath} (${WIDTH}x${HEIGHT}, ${formatFileSize(fileSize)})`);
}

function printHelp(): void {
  console.log(`Usage:
  npm run generate:myindie

Banners are generated from src/config/jams.ts and the localized dictionaries for
every supported locale. Each configured round produces one banner per locale.
`);
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  if (args.includes("--help")) {
    if (args.length !== 1) throw new Error("--help cannot be combined with other options");
    printHelp();
    return;
  }
  if (args.length > 0) {
    throw new Error("The MyIndie generator is config-driven and does not accept banner metadata options");
  }

  await Promise.all(getMyIndieBannerDefinitions().map(generateBanner));
}

const scriptPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
if (scriptPath === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
