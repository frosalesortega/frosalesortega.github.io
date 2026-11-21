/**
 * Loaders for src/data/*.yaml and publications.bib. Everything is optional-tolerant.
 */
import { parse } from 'yaml';
import siteRaw from '../data/site.yaml?raw';
import cvRaw from '../data/cv.yaml?raw';
import pubsRaw from '../data/publications.yaml?raw';
import bibRaw from '../data/publications.bib?raw';
import outreachRaw from '../data/outreach.yaml?raw';
import policyRaw from '../data/policy.yaml?raw';
import { loadPublications, type Publication } from './bibtex';

export interface Profile { id?: string; label: string; url: string }
export interface NavItem { label: string; path: string }
export interface SiteData {
  name: string;
  fullName?: string;
  postnominals?: string;
  role?: string;
  affiliation?: string;
  tagline?: string;
  shortAffiliation?: string;
  intro?: string;
  researchLede?: string;
  heroCredit?: string;
  researchStatement?: string;
  description?: string;
  email?: string;
  phone?: string;
  address: string[];
  profiles: Profile[];
  nav: NavItem[];
  otherRepos: { name: string; url: string; description?: string }[];
  [k: string]: unknown;
}

const y = <T>(raw: string, fallback: T): T => {
  try { return (parse(raw) as T) ?? fallback; } catch (e) { throw new Error('YAML parse error: ' + (e as Error).message); }
};

function normNav(items: any[] | undefined): NavItem[] {
  return (items ?? []).map((n) => ({ label: String(n.label), path: String(n.path ?? n.href ?? n.url ?? '/') }));
}

const rawSite = y<any>(siteRaw, {});
export const site: SiteData = {
  ...rawSite,
  name: rawSite.name ?? 'Site owner',
  address: rawSite.address ?? [],
  profiles: rawSite.profiles ?? [],
  nav: normNav(rawSite.nav),
  otherRepos: rawSite.otherRepos ?? [],
};

/* ---- CV ---- */
export interface CvItem { label?: string; title?: string; body?: string; url?: string; slug?: string }
export interface CvSection { id: string; title: string; intro?: string; items: CvItem[] }
export interface CvMetrics { total?: number; refereed?: number; firstAuthorRefereed?: number; citations?: string | number; hIndex?: number; source?: string; asOf?: string }
const rawCv = y<any>(cvRaw, {});
export const cv: { metrics?: CvMetrics; sections: CvSection[] } = {
  metrics: rawCv.metrics,
  sections: (rawCv.sections ?? []).map((s: any) => ({ id: String(s.id), title: String(s.title), intro: s.intro, items: s.items ?? [] })),
};

/* ---- publications ---- */
const rawPubCfg = y<any>(pubsRaw, {});
export const pubConfig = {
  selected: (rawPubCfg.selected ?? []) as string[],
  tags: (rawPubCfg.tags ?? {}) as Record<string, string[]>,
  students: (rawPubCfg.students ?? []) as string[],
};
export interface PubView extends Publication { selected: boolean; tags: string[] }
export const publications: PubView[] = loadPublications(bibRaw, pubConfig.students).map((p) => ({
  ...p,
  selected: pubConfig.selected.includes(p.key),
  tags: pubConfig.tags[p.key] ?? [],
}));
/** Counts shown on /publications/ and /cv/, computed from the .bib by entry type. */
export const pubCounts = {
  articles: publications.filter((p) => p.type === 'article').length,
  proceedings: publications.filter((p) => p.type !== 'article').length,
};
export const selectedPublications: PubView[] = pubConfig.selected
  .map((k) => publications.find((p) => p.key === k))
  .filter((p): p is PubView => !!p);
/** Profile URLs used by the publication-metrics sentence (/cv/ and /publications/). */
export const profileUrl = (id: string) => site.profiles.find((p) => p.id === id)?.url;
/** Safe HTML id / anchor for a BibTeX key (keys may contain & . etc.). */
export const pubId = (key: string) => 'pub-' + key.replace(/[^A-Za-z0-9._-]/g, '-');
export const pubByKey = (k: string | undefined) => (k ? publications.find((p) => p.key === k) : undefined);

/* ---- outreach ---- */
export interface OutreachItem { date?: string; title: string; venue?: string; url?: string; archiveUrl?: string; kind?: string }
export interface OutreachGroup { heading: string; items: OutreachItem[]; intro?: string }
const rawOut = y<any>(outreachRaw, {});
export const outreach: { intro?: string; groups: OutreachGroup[] } = {
  intro: rawOut.intro,
  groups: (rawOut.groups ?? []).map((g: any) => ({ heading: g.heading, intro: g.intro, items: g.items ?? [] })),
};

/* ---- science policy ---- */
const rawPol = y<any>(policyRaw, {});
export interface PolicyResource { title: string; description?: string; url: string; type?: string; date?: string }
export interface PolicyGalleryItem { file: string; caption?: string }
export interface PolicyThread { date?: string; title: string; url: string; archiveUrl?: string; note?: string }
export const policy = {
  intro: rawPol.intro as string | undefined,
  project: rawPol.project as { title: string; url: string; description?: string; longDescription?: string } | undefined,
  method: rawPol.method as string | undefined,
  gallery: (rawPol.gallery ?? []) as PolicyGalleryItem[],
  resources: (rawPol.resources ?? []) as PolicyResource[],
  threads: (rawPol.threads ?? []) as PolicyThread[],
  disclaimer: rawPol.disclaimer as string | undefined,
};
