import type { ImageMetadata } from 'astro';

// Every bundled image under src/assets. Eager and tolerant: with no matching files the map is simply empty.
const assets = import.meta.glob<{ default: ImageMetadata }>('/src/assets/**/*.{jpg,jpeg,png,webp}', { eager: true });
const byPath = new Map<string, ImageMetadata>(
  Object.entries(assets).map(([p, m]) => [p.replace(/^\/src\/assets\//, ''), m.default]),
);
const EXT = ['jpg', 'jpeg', 'png', 'webp'];

/** Resolve an `image:` value from frontmatter to a bundled asset (src/assets/...) if present. */
export function resolveAsset(ref: string | undefined): ImageMetadata | undefined {
  if (!ref || /^(https?:)?\/\//.test(ref)) return undefined;
  const clean = ref.replace(/^(\.{1,2}\/)+/, '').replace(/^\/+/, '').replace(/^src\/assets\//, '').replace(/^assets\//, '');
  return byPath.get(clean);
}

/** Find src/assets/<dir>/<stem>.(jpg|jpeg|png|webp); dir '' means src/assets itself. */
export function conventionAsset(dir: string, stem: string): ImageMetadata | undefined {
  for (const ext of EXT) {
    const hit = byPath.get(dir ? `${dir}/${stem}.${ext}` : `${stem}.${ext}`);
    if (hit) return hit;
  }
  return undefined;
}

export const heroImage = (): ImageMetadata | undefined => conventionAsset('', 'hero');
/** Frontmatter `image` wins over src/assets/projects/<slug>.jpg */
export const projectImage = (slug: string, fm?: string) => resolveAsset(fm) ?? conventionAsset('projects', slug);
/** Frontmatter `image` wins over src/assets/news/<file-stem>.jpg */
export const newsImage = (stem: string, fm?: string) => resolveAsset(fm) ?? conventionAsset('news', stem);

/** Files in src/assets/policy, as { file, asset } sorted by file name. */
export function policyImages(): { file: string; asset: ImageMetadata }[] {
  return [...byPath.entries()]
    .filter(([p]) => p.startsWith('policy/') && p.split('/').length === 2)
    .map(([p, asset]) => ({ file: p.slice('policy/'.length), asset }))
    .sort((a, b) => a.file.localeCompare(b.file));
}
