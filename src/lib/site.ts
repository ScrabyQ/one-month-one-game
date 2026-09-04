import { DEFAULT_LOCALE, isLocale } from "./i18n";
import type { Locale } from "./i18n/types";

export const LOCALE_STORAGE_KEY = "one-month-one-game:locale";

function normalizeBase(base: string): string {
  if (!base || base === "/") return "";
  return `/${base.replace(/^\/+|\/+$/g, "")}`;
}

function normalizePath(path: string): string {
  const pathname = path.split(/[?#]/, 1)[0] ?? "/";
  if (!pathname || pathname === "") return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function stripBase(pathname: string, base: string): string {
  const normalizedPath = normalizePath(pathname);
  const normalizedBase = normalizeBase(base);
  if (!normalizedBase) return normalizedPath;
  if (normalizedPath === normalizedBase) return "/";
  if (normalizedPath.startsWith(`${normalizedBase}/`)) {
    return normalizedPath.slice(normalizedBase.length) || "/";
  }
  return normalizedPath;
}

function stripLocalePrefix(pathname: string): { path: string; localePrefix?: Locale } {
  const match = /^\/(en|ru)(?=\/|$)/.exec(pathname);
  if (!match || !isLocale(match[1])) return { path: pathname };
  const path = pathname.slice(match[0].length) || "/";
  return { path: path.startsWith("/") ? path : `/${path}`, localePrefix: match[1] };
}

export function withBase(path: string, base = import.meta.env.BASE_URL): string {
  const normalizedBase = normalizeBase(base);
  const normalizedPath = `/${path.replace(/^\/+/, "")}`;
  if (normalizedBase && (normalizedPath === normalizedBase || normalizedPath.startsWith(`${normalizedBase}/`))) {
    return normalizedPath;
  }
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

export function getLocaleFromPath(
  pathname: string,
  base = import.meta.env.BASE_URL,
): Locale {
  const logicalPath = stripBase(pathname, base);
  const { localePrefix } = stripLocalePrefix(logicalPath);
  return localePrefix ?? DEFAULT_LOCALE;
}

export function hasExplicitLocalePath(
  pathname: string,
  base = import.meta.env.BASE_URL,
): boolean {
  const logicalPath = stripBase(pathname, base);
  return stripLocalePrefix(logicalPath).localePrefix !== undefined;
}

export function getLocalizedPath(
  pathname: string,
  locale: Locale,
  base = import.meta.env.BASE_URL,
): string {
  const logicalPath = stripBase(pathname, base);
  const { path } = stripLocalePrefix(logicalPath);
  const localizedPath = locale === DEFAULT_LOCALE
    ? path
    : `/${locale}${path === "/" ? "/" : path}`;
  return withBase(localizedPath, base);
}

export function getLocalizedUrl(
  currentUrl: URL,
  locale: Locale,
  base = import.meta.env.BASE_URL,
): string {
  return `${getLocalizedPath(currentUrl.pathname, locale, base)}${currentUrl.search}${currentUrl.hash}`;
}

export function resolveBrowserLocale(
  languages: readonly string[] = [],
  language?: string,
): Locale {
  for (const candidate of [...languages, language ?? ""]) {
    const baseLanguage = candidate.trim().toLowerCase().split("-", 1)[0];
    if (baseLanguage === "ru") return "ru";
    if (baseLanguage === "en") return "en";
  }
  return DEFAULT_LOCALE;
}

export function resolveInitialLocale(
  pathname: string,
  storedLocale: unknown,
  languages: readonly string[] = [],
  language?: string,
  base = import.meta.env.BASE_URL,
): Locale {
  if (hasExplicitLocalePath(pathname, base)) return getLocaleFromPath(pathname, base);
  if (isLocale(storedLocale)) return storedLocale;
  return resolveBrowserLocale(languages, language);
}
