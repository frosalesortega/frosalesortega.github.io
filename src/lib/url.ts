/**
 * Single source of truth for internal URLs.
 * Every internal link and asset URL in the site goes through `href()`.
 * It prefixes import.meta.env.BASE_URL ("/" or "/~frosales/") without double slashes.
 */
const RAW_BASE = import.meta.env.BASE_URL || '/';
export const BASE = (RAW_BASE.startsWith('/') ? RAW_BASE : '/' + RAW_BASE).replace(/\/*$/, '/');

export function isExternal(u: string): boolean {
  return /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(u);
}

/** href('/about/') -> '/about/' or '/~frosales/about/'. External, mailto:, #hash and relative URLs pass through. */
export function href(path: string = '/'): string {
  if (!path) return BASE;
  if (isExternal(path) || path.startsWith('#')) return path;
  if (!path.startsWith('/')) return path;
  return BASE + path.replace(/^\/+/, '');
}

/** True if `path` (site-relative, e.g. '/about/') is the same as, or a parent of, `current` (Astro.url.pathname). */
export function isCurrent(path: string, current: string): boolean {
  const target = href(path);
  if (target === BASE) return current === BASE;
  return current === target || current.startsWith(target);
}

/** Absolute URL for canonical / Open Graph (uses the configured `site` and base). */
export function absoluteUrl(path: string, site: URL | undefined): string {
  const origin = (site?.origin ?? 'https://frosalesortega.github.io').replace(/\/$/, '');
  return origin + href(path);
}
