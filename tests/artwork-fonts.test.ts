import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { createCardSvg, getOgCardDefinitions } from "../scripts/generate-og-cards";
import { renderArtworkPng } from "../scripts/lib/artwork-renderer";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

function secondRoundSvg(): string {
  const card = getOgCardDefinitions().find((card) =>
    card.round === 2 && card.locale === "ru",
  );
  if (!card) throw new Error("Expected the second round artwork");
  return createCardSvg(card);
}

describe("bundled artwork fonts", () => {
  it("preserves the original round-number glyphs", async () => {
    // This crop comes from the original round 002 PNG, before fonts were pinned.
    const reference = await sharp(fileURLToPath(new URL(
      "./fixtures/artwork-fonts/round-002-background.png", import.meta.url,
    ))).removeAlpha().raw().toBuffer();
    const actual = await sharp(renderArtworkPng(secondRoundSvg()))
      .extract({ left: 870, top: 285, width: 310, height: 210 })
      .removeAlpha().raw().toBuffer();

    let difference = 0;
    for (let index = 0; index < reference.length; index += 1) {
      difference += Math.abs(reference[index] - actual[index]);
    }

    // Allow antialiasing differences between the old renderer and resvg.
    // Cascadia substitution produces a difference above 3 in this same crop.
    expect(difference / reference.length).toBeLessThan(0.5);
  });

  it("renders identical pixels with conflicting host font settings", () => {
    const svg = secondRoundSvg();
    const expected = createHash("sha256").update(renderArtworkPng(svg)).digest("hex");
    const script = `
      import { createHash } from "node:crypto";
      import { renderArtworkPng } from "./scripts/lib/artwork-renderer.ts";
      process.stdout.write(createHash("sha256")
        .update(renderArtworkPng(${JSON.stringify(svg)})).digest("hex"));
    `;

    for (const config of ["missing-fontconfig-a.conf", "missing-fontconfig-b.conf"]) {
      const actual = execFileSync(process.execPath, [
        "--import", "tsx", "--input-type=module", "-e", script,
      ], {
        cwd: projectRoot,
        env: {
          ...process.env,
          FONTCONFIG_FILE: config,
          FONTCONFIG_PATH: "/missing-system-fonts",
          PANGOCAIRO_BACKEND: "fontconfig",
        },
        encoding: "utf8",
      });
      expect(actual).toBe(expected);
    }
  });

  it("rejects generic font families instead of allowing system substitution", () => {
    expect(() => renderArtworkPng(secondRoundSvg().replaceAll(
      'font-family="Montserrat"', 'font-family="monospace"',
    ))).toThrow(/must use a bundled font family: monospace/);
  });
});
