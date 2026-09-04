export function escapeXml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function assertAccent(accent: string): void {
  if (!/^#[\da-f]{6}$/i.test(accent)) {
    throw new Error(`Accent must use #RRGGBB format: ${accent}`);
  }
}
