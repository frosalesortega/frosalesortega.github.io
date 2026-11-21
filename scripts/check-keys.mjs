#!/usr/bin/env node
// Fail if any publication key referenced elsewhere is absent from src/data/publications.bib.
// Checks: publications.yaml (selected, tags), projects (bibkeys), software (paper), news (related, when it looks like a bibcode).
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const bib = readFileSync('src/data/publications.bib', 'utf8');
const keys = new Set([...bib.matchAll(/^@\w+\s*\{\s*([^,\s]+)\s*,/gm)].map((m) => m[1]));
const problems = [];
const need = (where, key) => { if (!keys.has(key)) problems.push(`${where}: key "${key}" is not in publications.bib`); };

const cfg = parse(readFileSync('src/data/publications.yaml', 'utf8')) ?? {};
(cfg.selected ?? []).forEach((k) => need('publications.yaml selected', k));
Object.keys(cfg.tags ?? {}).forEach((k) => need('publications.yaml tags', k));

const frontmatter = (file) => {
  const m = /^---\n([\s\S]*?)\n---/.exec(readFileSync(file, 'utf8'));
  return m ? parse(m[1]) ?? {} : {};
};
const mdFiles = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => join(dir, f)) : []);
const slugs = new Set(mdFiles('src/content/projects').map((f) => f.replace(/^.*\//, '').replace(/\.md$/, '')));
const acronyms = new Set(mdFiles('src/content/projects').map((f) => frontmatter(f).acronym));

for (const f of mdFiles('src/content/projects')) (frontmatter(f).bibkeys ?? []).forEach((k) => need(f + ' bibkeys', k));
for (const f of mdFiles('src/content/software')) { const p = frontmatter(f).paper; if (p) need(f + ' paper', p); }
for (const f of mdFiles('src/content/news')) {
  const r = frontmatter(f).related;
  if (r && !slugs.has(r) && !acronyms.has(r)) need(f + ' related', r); // a project slug/acronym is also valid
}

if (problems.length) { console.error('check-keys: FAILED\n  ' + problems.join('\n  ')); process.exit(1); }
console.log(`check-keys: OK (${keys.size} bib entries; all selected/tag/bibkeys/paper/related keys resolve)`);
