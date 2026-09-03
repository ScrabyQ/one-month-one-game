function plural(value: number, one: string, few: string, many: string): string {
  const absolute = Math.abs(value) % 100;
  const last = absolute % 10;
  if (absolute >= 11 && absolute <= 19) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

export function formatGameCount(value: number): string {
  return `${value} ${plural(value, "игра", "игры", "игр")}`;
}

export function formatProviderCount(value: number): string {
  return `${value} ${plural(value, "площадка", "площадки", "площадок")}`;
}
