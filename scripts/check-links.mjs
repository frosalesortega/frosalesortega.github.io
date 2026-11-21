#!/usr/bin/env node
// Crawl a built site directory and verify every internal href/src/srcset/url() resolves to a file.
// Usage: node scripts/check-links.mjs <dir> [base]   (base defaults to "/")
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const dir = process.argv[2] || 'dist';
let base = process.argv[3] || '/';
if (!base.endsWith('/')) base += '/';
if (!existsSync(dir)) { console.error(`Directory not found: ${dir}`); process.exit(2); }

const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(dir);
const problems = [];
let checked = 0;

function resolves(urlPath) {
  // urlPath is absolute (starts with base). Map to a file in dir.
  const rel = decodeURIComponent(urlPath.slice(base.length));
  const target = join(dir, rel);
  if (rel === '' || rel.endsWith('/')) return existsSync(join(target, 'index.html'));
  if (existsSync(target) && statSync(target).isFile()) return true;
  return existsSync(join(target, 'index.html')); // directory URL without trailing slash
}

function check(file, raw, kind) {
  let u = raw.trim().replace(/&amp;/g, '&');
  if (!u || u.startsWith('#') || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(u) || u.startsWith('data:')) return;
  checked++;
  u = u.split('#')[0].split('?')[0];
  if (!u) return;
  if (!u.startsWith('/')) { problems.push(`${file}: relative ${kind} "${raw}" (expected absolute, base-prefixed)`); return; }
  if (!u.startsWith(base)) { problems.push(`${file}: ${kind} "${raw}" does not start with base "${base}"`); return; }
  if (!resolves(u)) problems.push(`${file}: ${kind} "${raw}" does not resolve to a file`);
}

// fragment targets: collect ids per html file
const idsByPage = new Map();
for (const f of files.filter((f) => extname(f) === '.html')) {
  const html = readFileSync(f, 'utf8');
  idsByPage.set(f, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
}

for (const f of files) {
  const ext = extname(f);
  if (!['.html', '.css', '.xml', '.txt'].includes(ext)) continue;
  const text = readFileSync(f, 'utf8');
  if (ext === '.html') {
    for (const m of text.matchAll(/\s(href|src|poster|action)="([^"]*)"/g)) check(f, m[2], m[1]);
    for (const m of text.matchAll(/\ssrcset="([^"]*)"/g)) m[1].split(',').forEach((s) => check(f, s.trim().split(/\s+/)[0], 'srcset'));
    // fragment links to other pages
    for (const m of text.matchAll(/\shref="([^"#]*)#([^"]+)"/g)) {
      const [, p, id] = m;
      if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(p)) continue;
      const target = p ? join(dir, decodeURIComponent(p.replace(base, '')), 'index.html') : f;
      const ids = idsByPage.get(target);
      if (ids && !ids.has(decodeURIComponent(id))) problems.push(`${f}: fragment "#${id}" not found in ${p || 'same page'}`);
    }
  } else if (ext === '.css') {
    for (const m of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
      const u = m[1];
      if (u.startsWith('/')) check(f, u, 'css url()');
      else if (!/^(data:|https?:|#)/.test(u)) problems.push(`${f}: relative css url "${u}"`);
    }
  } else if (ext === '.xml' || ext === '.txt') {
    for (const m of text.matchAll(/https?:\/\/[^\s<"]+/g)) {
      const path = new URL(m[0]).pathname;
      if (path.startsWith('/') && !path.startsWith(base) && !/w3\.org|sitemaps\.org|google\.com\/schemas/.test(m[0])) problems.push(`${f}: absolute URL "${m[0]}" outside base "${base}"`);
    }
  }
}

if (problems.length) {
  console.error(`FAIL ${dir} (base ${base}): ${problems.length} problem(s)`);
  [...new Set(problems)].slice(0, 80).forEach((p) => console.error('  ' + p));
  process.exit(1);
}
console.log(`OK ${dir} (base ${base}): ${files.filter((f) => f.endsWith('.html')).length} pages, ${checked} internal references verified`);
