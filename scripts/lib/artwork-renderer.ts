import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

export const ARTWORK_FONTS = {
  sans: "Arial",
  display: "Arial Black",
  mono: "Cascadia Code",
  background: "Montserrat",
} as const;

const fontFiles = [
  "Arial-Bold.ttf",
  "Arial-Black.ttf",
  "CascadiaCode-Regular.ttf",
  "CascadiaCode-Bold.ttf",
  "Montserrat-ExtraBold.ttf",
].map((name) => fileURLToPath(new URL(`../assets/fonts/${name}`, import.meta.url)));

// Fail on a missing bundled font instead of silently substituting a system font.
for (const path of fontFiles) readFileSync(path);

const fontFamilies = new Set<string>(Object.values(ARTWORK_FONTS));

export function renderArtworkPng(svg: string): Buffer {
  for (const [, family] of svg.matchAll(/font-family="([^"]+)"/gu)) {
    if (!fontFamilies.has(family)) {
      throw new Error(`Artwork must use a bundled font family: ${family}`);
    }
  }

  return new Resvg(svg, {
    font: {
      fontFiles,
      loadSystemFonts: false,
      defaultFontFamily: ARTWORK_FONTS.display,
    },
  }).render().asPng();
}
