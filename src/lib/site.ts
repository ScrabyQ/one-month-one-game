export function withBase(path: string, base = import.meta.env.BASE_URL): string {
  const normalizedBase = base === "/" ? "" : `/${base.replace(/^\/+|\/+$/g, "")}`;
  const normalizedPath = `/${path.replace(/^\/+/, "")}`;
  return normalizedPath === "/"
    ? `${normalizedBase || ""}/`
    : `${normalizedBase}${normalizedPath}`;
}

export function getAbsoluteSiteUrl(
  path: string,
  site: URL | undefined,
  base = import.meta.env.BASE_URL,
): string | undefined {
  if (!site) return undefined;
  return new URL(withBase(path, base), site).toString();
}
