import { parse } from "node-html-parser";

export interface ItchJamStats {
  participantsCount: number;
  submissionsCount?: number;
}

function normalizedText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function parseCount(value: string): number | undefined {
  const normalized = value
    .replace(/[\s,\u00a0]/g, "")
    .replace(/\+$/, "");

  if (!/^\d+$/.test(normalized)) return undefined;

  const count = Number(normalized);
  return Number.isSafeInteger(count) && count >= 0 ? count : undefined;
}

export function parseItchJamStats(html: string): ItchJamStats | null {
  if (!html.trim()) return null;

  try {
    const document = parse(html);
    const statBoxes = document.querySelectorAll(".stats_container .stat_box");

    for (const statBox of statBoxes) {
      const label = statBox.querySelector(".stat_label")?.textContent ?? "";
      if (!new Set(["joined", "participant", "participants"]).has(normalizedText(label))) {
        continue;
      }

      const value = statBox.querySelector(".stat_value")?.textContent ?? "";
      const participantsCount = parseCount(value);
      if (participantsCount === undefined) return null;

      return { participantsCount };
    }
  } catch {
    return null;
  }

  return null;
}
