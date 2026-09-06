import { describe, expect, it } from "vitest";
import { parseItchJamStats } from "../src/lib/providers/itch/itch-jam-parser";

function page(value: string, label = "Joined"): string {
  return `
    <main>
      <p>Someone said Joined in the description.</p>
      <div class="stats_container">
        <div class="stat_box">
          <div class="stat_value">${value}</div>
          <div class="stat_label">${label}</div>
        </div>
      </div>
    </main>
  `;
}

describe("parseItchJamStats", () => {
  it.each([
    ["1", 1],
    ["123", 123],
    ["100+", 100],
    ["1,234", 1234],
    ["1 234", 1234],
    ["1\u00a0234", 1234],
  ])("parses %s Joined participants", (value, expected) => {
    expect(parseItchJamStats(page(value))).toEqual({
      participantsCount: expected,
    });
  });

  it("uses the labeled stats block instead of unrelated page text", () => {
    expect(parseItchJamStats(page("7", "Participants"))).toEqual({
      participantsCount: 7,
    });
  });

  it.each([
    "<html><body><div class=\"stats_container\"></div></body></html>",
    "<div class=\"stats_container\"><div class=\"stat_box\"><div class=\"stat_value\">unknown</div><div class=\"stat_label\">Joined</div></div></div>",
    "<div class=\"stats_container\"><div class=\"stat_box\"><div class=\"stat_value\">12</div></div></div>",
    "<div class=\"stats_container\"><div class=\"stat_box\"><div class=\"stat_value\">12</div><div class=\"stat_label\">Entries</div></div></div>",
  ])("returns null when the participant stat is unavailable: %s", (html) => {
    expect(parseItchJamStats(html)).toBeNull();
  });

  it("handles malformed HTML without throwing", () => {
    expect(parseItchJamStats("<div class='stats_container'><div class='stat_box'>")).toBeNull();
  });
});
