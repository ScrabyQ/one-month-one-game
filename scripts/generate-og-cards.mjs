// @ts-check

import { mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;
const DEFAULT_ACCENT = "#d8ff5c";
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** @typedef {{ fileName: string, round?: number, month: string, accent: string, tagline?: string }} OgCard */

const builtInCards = [
  {
    fileName: join("public", "og", "default.png"),
    round: undefined,
    month: "ЕЖЕМЕСЯЧНЫЙ ЧЕЛЛЕНДЖ",
    accent: DEFAULT_ACCENT,
  },
  {
    fileName: join("public", "og", "round-001.png"),
    round: 1,
    month: "АВГУСТ 2026",
    accent: "#ff8a75",
  },
  {
    fileName: join("public", "og", "round-002.png"),
    round: 2,
    month: "СЕНТЯБРЬ 2026",
    accent: DEFAULT_ACCENT,
  },
];

/** @param {unknown} value */
function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** @param {string} accent */
function assertAccent(accent) {
  if (!/^#[\da-f]{6}$/i.test(accent)) {
    throw new Error(`Accent must use #RRGGBB format: ${accent}`);
  }
}

/** @param {number} round */
function formatRoundNumber(round) {
  return String(round).padStart(3, "0");
}

/** @param {string} value */
function parsePositiveRound(value) {
  const round = Number(value);
  if (!Number.isInteger(round) || round <= 0) {
    throw new Error(`Round must be a positive integer: ${value}`);
  }
  return round;
}

/** @param {OgCard} card */
function createCardSvg(card) {
  const accent = escapeXml(card.accent);
  const roundNumber = card.round === undefined ? "OG" : formatRoundNumber(card.round);
  const roundLabel = card.round === undefined ? "MONTHLY EDITION" : `ROUND ${roundNumber}`;
  const month = escapeXml(card.month.toUpperCase());
  const tagline = escapeXml(card.tagline ?? "СДЕЛАЙ. ЗАКОНЧИ. ПОКАЖИ.");
  const giantLabel = escapeXml(card.round === undefined ? "ONE MONTH" : `ROUND ${roundNumber}`);

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

  <text x="108" y="84" fill="#f2efe5" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="800" letter-spacing="4">ONE MONTH / ONE GAME</text>
  <text x="1130" y="88" fill="${accent}" font-family="monospace" font-size="15" font-weight="700" letter-spacing="2" text-anchor="end">${escapeXml(roundLabel)}</text>

  <text x="68" y="402" fill="#f2efe5" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="900" letter-spacing="-2">ОДИН МЕСЯЦ —</text>
  <text x="68" y="492" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="900" letter-spacing="-2">ОДНА ИГРА</text>

  <text x="68" y="548" fill="#9a988e" font-family="monospace" font-size="18" letter-spacing="3">${month}</text>
  <text x="1134" y="566" fill="${accent}" font-family="monospace" font-size="18" letter-spacing="2" text-anchor="end">${tagline}</text>
  <text x="1180" y="485" fill="${accent}" fill-opacity="0.08" font-family="monospace" font-size="270" font-weight="800" letter-spacing="-24" text-anchor="end">${giantLabel}</text>
  <text x="1130" y="548" fill="#f2efe5" fill-opacity="0.35" font-family="monospace" font-size="16" letter-spacing="2" text-anchor="end">${escapeXml(roundNumber)}</text>
</svg>`;
}

/** @param {string[]} args @param {string} name */
function readOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

/** @param {string[]} args @param {string} name */
function hasOption(args, name) {
  return args.includes(name);
}

function printHelp() {
  console.log(`Usage:
  npm run generate:og
  npm run generate:og -- --round 3 --month "Октябрь 2026" --accent "#9ed8ff"

Without arguments the three standard cards are regenerated. With --round, a new
round card is written to public/og/round-NNN.png.

Options:
  --round <number>       Stable round number for a new card
  --month <text>         Month label shown on the card
  --accent <#RRGGBB>     Card accent color
  --tagline <text>       Optional bottom-right tagline
  --output <path>        Optional output path relative to the project root
  --help                 Show this help
`);
}

/** @param {string[]} args @returns {OgCard[]} */
function getCards(args) {
  if (hasOption(args, "--help")) {
    printHelp();
    return [];
  }

  const roundValue = readOption(args, "--round");
  if (roundValue === undefined) {
    if (args.length > 0) {
      throw new Error("Use --round, --month and --accent to generate a custom card");
    }
    return builtInCards;
  }

  const round = parsePositiveRound(roundValue);
  const month = readOption(args, "--month");
  const accent = readOption(args, "--accent");
  if (!month) throw new Error("--month is required for a custom card");
  if (!accent) throw new Error("--accent is required for a custom card");
  assertAccent(accent);

  const output = readOption(args, "--output");
  return [
    {
      fileName: output ?? join("public", "og", `round-${formatRoundNumber(round)}.png`),
      round,
      month,
      accent,
      tagline: readOption(args, "--tagline"),
    },
  ];
}

/** @param {OgCard} card */
async function generateCard(card) {
  assertAccent(card.accent);
  const outputPath = resolve(projectRoot, card.fileName);
  await mkdir(dirname(outputPath), { recursive: true });
  await sharp(Buffer.from(createCardSvg(card))).png().toFile(outputPath);
  console.log(`${outputPath} (${WIDTH}x${HEIGHT})`);
}

try {
  const cards = getCards(process.argv.slice(2));
  await Promise.all(cards.map(generateCard));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
