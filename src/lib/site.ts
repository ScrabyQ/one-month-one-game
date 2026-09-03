export function withBase(path: string, base = import.meta.env.BASE_URL): string {
  const normalizedBase = base === "/" ? "" : `/${base.replace(/^\/+|\/+$/g, "")}`;
  const normalizedPath = `/${path.replace(/^\/+/, "")}`;
  return normalizedPath === "/"
    ? `${normalizedBase || ""}/`
    : `${normalizedBase}${normalizedPath}`;
}
