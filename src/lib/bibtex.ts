/**
 * Small dependency-free BibTeX parser tuned for BibTeX exports of the NASA-SciX/ADS library.
 * Runs at build time only.
 */
import { escapeHtml } from './html';

export interface BibEntry {
  type: string;
  key: string;
  fields: Record<string, string>;
}

export interface Publication {
  key: string;
  type: string;
  year: number;
  month: number; // 0 if unknown
  title: string;
  authorsHtml: string;
  authorsText: string;
  nAuthors: number; // number of named authors in the list (excludes an "et al." pseudo-author)
  authorsTruncated: boolean; // true when the .bib list ends with a literal "et al." (total count unknown)
  ownerPosition: number; // 1-based position among the named authors, 0 if not found
  firstAuthor: boolean;
  journal: string;
  inPress: boolean; // bibcode contains ".tmp." (ADS placeholder for an accepted/in-press paper)
  venue: string; // "Journal, 559, A114" (plain text)
  doi?: string;
  arxiv?: string;
  scix?: string; // NASA-SciX abstract page, built from the bibcode (the .bib adsurl field is ignored)
  note?: string;
  keywords: string[];
}

/* ---------- journal macros ---------- */
const JOURNALS: Record<string, string> = {
  mnras: 'Monthly Notices of the Royal Astronomical Society',
  apj: 'The Astrophysical Journal',
  apjl: 'The Astrophysical Journal Letters',
  apjs: 'The Astrophysical Journal Supplement Series',
  aap: 'Astronomy & Astrophysics',
  aaps: 'Astronomy & Astrophysics Supplement Series',
  aj: 'The Astronomical Journal',
  pasp: 'Publications of the Astronomical Society of the Pacific',
  pasj: 'Publications of the Astronomical Society of Japan',
  pasa: 'Publications of the Astronomical Society of Australia',
  na: 'New Astronomy',
  nar: 'New Astronomy Reviews',
  araa: 'Annual Review of Astronomy and Astrophysics',
  nat: 'Nature',
  nature: 'Nature',
  science: 'Science',
  natas: 'Nature Astronomy',
  rmxaa: 'Revista Mexicana de Astronomía y Astrofísica',
  rmxac: 'Revista Mexicana de Astronomía y Astrofísica Conference Series',
  apss: 'Astrophysics and Space Science',
  prd: 'Physical Review D',
  prl: 'Physical Review Letters',
  physrep: 'Physics Reports',
  jcap: 'Journal of Cosmology and Astroparticle Physics',
  ssr: 'Space Science Reviews',
  memsai: 'Memorie della Societa Astronomica Italiana',
  aapr: 'The Astronomy and Astrophysics Review',
  baas: 'Bulletin of the American Astronomical Society',
  iaucirc: 'IAU Circular',
  procspie: 'Society of Photo-Optical Instrumentation Engineers (SPIE) Conference Series',
  conf: 'Conference Series',
  jrasc: 'Journal of the Royal Astronomical Society of Canada',
  qjras: 'Quarterly Journal of the Royal Astronomical Society',
  ao: 'Applied Optics',
  azh: 'Astronomicheskii Zhurnal',
  actaa: 'Acta Astronomica',
  cjaa: 'Chinese Journal of Astronomy and Astrophysics',
  raa: 'Research in Astronomy and Astrophysics',
  ibvs: 'Information Bulletin on Variable Stars',
  apjsupp: 'The Astrophysical Journal Supplement Series',
};

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/* ---------- raw parsing ---------- */

function readBraced(s: string, i: number): [string, number] {
  // s[i] === '{' ; returns inner text and index after closing brace
  let depth = 0;
  let start = i + 1;
  for (; i < s.length; i++) {
    const c = s[i];
    if (c === '\\') { i++; continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return [s.slice(start, i), i + 1];
    }
  }
  return [s.slice(start), s.length];
}

function readQuoted(s: string, i: number): [string, number] {
  let depth = 0;
  const start = i + 1;
  for (i = start; i < s.length; i++) {
    const c = s[i];
    if (c === '\\') { i++; continue; }
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '"' && depth === 0) return [s.slice(start, i), i + 1];
  }
  return [s.slice(start), s.length];
}

export function parseBibtex(text: string): BibEntry[] {
  const entries: BibEntry[] = [];
  const strings: Record<string, string> = {};
  let i = 0;
  const n = text.length;
  while (i < n) {
    const at = text.indexOf('@', i);
    if (at < 0) break;
    const m = /^@\s*([A-Za-z]+)\s*([{(])/.exec(text.slice(at, at + 60));
    if (!m) { i = at + 1; continue; }
    const type = m[1].toLowerCase();
    const open = at + m[0].length - 1;
    const closeCh = m[2] === '{' ? '}' : ')';
    if (type === 'comment' || type === 'preamble') {
      if (m[2] === '{') { const [, e] = readBraced(text, open); i = e; } else i = open + 1;
      continue;
    }
    // find entry body end
    let pos = open + 1;
    // key
    const keyEnd = type === 'string' ? text.indexOf('=', pos) : text.indexOf(',', pos);
    if (keyEnd < 0) break;
    const key = text.slice(pos, keyEnd).trim();
    pos = keyEnd + (type === 'string' ? 0 : 1);
    const fields: Record<string, string> = {};
    while (pos < n) {
      while (pos < n && /[\s,]/.test(text[pos])) pos++;
      if (text[pos] === closeCh) { pos++; break; }
      const nameM = /^([A-Za-z][A-Za-z0-9_\-:.]*)\s*=\s*/.exec(text.slice(pos, pos + 80));
      if (!nameM) { pos++; continue; }
      const name = nameM[1].toLowerCase();
      pos += nameM[0].length;
      // value: concatenation of parts separated by '#'
      let value = '';
      for (;;) {
        while (pos < n && /\s/.test(text[pos])) pos++;
        const c = text[pos];
        if (c === '{') { const [v, e] = readBraced(text, pos); value += v; pos = e; }
        else if (c === '"') { const [v, e] = readQuoted(text, pos); value += v; pos = e; }
        else {
          const w = /^[^\s,#}\)]+/.exec(text.slice(pos, pos + 200));
          if (!w) break;
          const word = w[0];
          if (/^\d+$/.test(word)) value += word;
          else if (strings[word.toLowerCase()] !== undefined) value += strings[word.toLowerCase()];
          else value += '\\' + word; // keep macro such as \mnras or month abbreviations
          pos += word.length;
        }
        while (pos < n && /\s/.test(text[pos])) pos++;
        if (text[pos] === '#') { pos++; continue; }
        break;
      }
      fields[name] = value.trim();
      if (type === 'string') { strings[name] = value.trim(); break; }
    }
    if (type !== 'string') entries.push({ type, key, fields });
    i = pos;
  }
  return entries;
}

/* ---------- LaTeX -> Unicode ---------- */

const COMBINING: Record<string, string> = {
  "'": '́', '`': '̀', '^': '̂', '"': '̈', '~': '̃', '=': '̄', '.': '̇',
  c: '̧', v: '̌', u: '̆', H: '̋', k: '̨',
};
const SPECIAL: Record<string, string> = {
  o: 'ø', O: 'Ø', ss: 'ß', l: 'ł', L: 'Ł', ae: 'æ', AE: 'Æ', oe: 'œ', OE: 'Œ', aa: 'å', AA: 'Å', i: 'i', j: 'j',
};
const GREEK: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ',
  kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ',
  chi: 'χ', psi: 'ψ', omega: 'ω', Delta: 'Δ', Sigma: 'Σ', Omega: 'Ω', Lambda: 'Λ', Phi: 'Φ', Gamma: 'Γ',
};
const MATH_SYMBOLS: Record<string, string> = {
  sim: '~', approx: '≈', times: '×', odot: '⊙', pm: '±', leq: '≤', geq: '≥', le: '≤', ge: '≥', lesssim: '≲', gtrsim: '≳',
  star: '⋆', rightarrow: '→', to: '→', ldots: '…', cdot: '·', circ: '°', ell: 'ℓ', infty: '∞', propto: '∝', AA: 'Å',
};
const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', '−': '⁻', n: 'ⁿ', i: 'ⁱ' };
const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋', '−': '₋' };

function mapScript(s: string, table: Record<string, string>, marker: string): string {
  const out = [...s].map((c) => table[c]);
  if (out.every(Boolean)) return out.join('');
  // a single non-alphanumeric symbol (e.g. ⊙, ⋆) reads fine without a marker;
  // an unmappable subscript such as T_e is shown inline ("Te"), as in plain-text titles
  if (/^[^A-Za-z0-9]$/u.test(s) || marker === '_') return s;
  return marker + s;
}

function simplifyMath(m: string): string {
  let s = m;
  s = s.replace(/\\(?:mathrm|rm|textrm|mathit|mathbf|it|bf|text)\s*\{([^{}]*)\}/g, '$1');
  s = s.replace(/\\(?:rm|it|bf)\b\s*/g, '');
  s = s.replace(/\\([A-Za-z]+)/g, (_x, name: string) => GREEK[name] ?? MATH_SYMBOLS[name] ?? '');
  s = s.replace(/\\[,;:! ]/g, ' ');
  s = s.replace(/\^\s*\{([^{}]*)\}/g, (_x, a: string) => mapScript(a, SUP, '^'));
  s = s.replace(/\^\s*([^\s{])/g, (_x, a: string) => mapScript(a, SUP, '^'));
  s = s.replace(/_\s*\{([^{}]*)\}/g, (_x, a: string) => mapScript(a, SUB, '_'));
  s = s.replace(/_\s*([^\s{])/g, (_x, a: string) => mapScript(a, SUB, '_'));
  return s.replace(/[{}]/g, '');
}

export function latexToUnicode(input: string): string {
  let s = input;
  // math first (so that "\AA" etc. inside math are handled by math rules)
  s = s.replace(/\$([^$]*)\$/g, (_m, inner: string) => simplifyMath(inner));
  // accents: \'e  \'{e}  {\'e}  \'\i  \c{s}  \v{Z}  \c s
  s = s.replace(/\\(['`^"~=.])\s*\{?\s*(\\[ij]\b|[A-Za-z])\s*\}?/g, (_m, acc: string, ch: string) => {
    const base = ch.startsWith('\\') ? ch.slice(1) : ch;
    return (base + COMBINING[acc]).normalize('NFC');
  });
  s = s.replace(/\\([cvuHk])\s*(?:\{\s*([A-Za-z])\s*\}|\s([A-Za-z]))/g, (_m, acc: string, a?: string, b?: string) =>
    ((a ?? b ?? '') + COMBINING[acc]).normalize('NFC'));
  // special letters (\o, \ss, \AA ...), optionally {\o}
  s = s.replace(/\\(AE|ae|OE|oe|AA|aa|ss|[oOlL])(?![A-Za-z])\s?/g, (_m, name: string) => SPECIAL[name] ?? name);
  s = s.replace(/\\([ij])(?![A-Za-z])/g, '$1');
  // dashes, quotes, symbols
  s = s.replace(/\\textendash\b\s*|---?/g, (m) => (m === '---' ? '—' : '–'));
  s = s.replace(/``/g, '“').replace(/''/g, '”');
  s = s.replace(/\\([&%#_$])/g, '$1');
  s = s.replace(/\u2500/g, '–'); // box-drawing dash sometimes present in ADS titles
  s = s.replace(/~/g, ' ');
  // drop any remaining commands and braces
  s = s.replace(/\\[A-Za-z]+\s*/g, '');
  s = s.replace(/[{}]/g, '');
  return s.replace(/\s+/g, ' ').trim().normalize('NFC');
}

/* ---------- authors ---------- */

interface Author { display: string; last: string; isOwner: boolean }

function splitAuthors(raw: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  const words = raw.replace(/\s+/g, ' ');
  for (let i = 0; i < words.length; i++) {
    const c = words[i];
    if (c === '{') depth++;
    if (c === '}') depth--;
    if (depth === 0 && words.startsWith(' and ', i)) { out.push(cur.trim()); cur = ''; i += 4; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[\s-]+/g, ' ').trim();

/** The ADS export truncates long author lists with a literal "et al." pseudo-author. */
const isEtAl = (raw: string) => /^\{?\s*et\.?\s*al\.?\s*\}?$/i.test(raw.trim());

/** "Fabián" -> "F."; "F. Fabián" -> "F. F."; "Jean-Pierre" -> "J.-P."; lower-case particles are kept. */
export function initials(first: string): string {
  return first
    .replace(/\.(?=[^\s.-])/g, '. ') // "F.F." -> "F. F."
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => {
      if (/^[a-zà-ÿ]/.test(tok)) return tok; // particle such as "de", "van"
      return tok
        .split('-')
        .map((part) => (part ? part[0].toUpperCase() + '.' : ''))
        .join('-');
    })
    .join(' ');
}

function parseAuthor(raw: string): Author {
  // "Last, First" with the comma at brace depth 0; surnames are usually braced in ADS exports
  let depth = 0;
  let comma = -1;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === ',' && depth === 0) { comma = i; break; }
  }
  let last: string;
  let first = '';
  if (comma >= 0) {
    last = latexToUnicode(raw.slice(0, comma));
    first = latexToUnicode(raw.slice(comma + 1));
  } else {
    const plain = latexToUnicode(raw);
    const wasBraced = /^\{.*\}$/.test(raw.trim());
    const parts = plain.split(' ');
    if (wasBraced || parts.length === 1) { last = plain; }
    else { last = parts.pop() as string; first = parts.join(' '); }
  }
  const ini = initials(first);
  const display = (ini ? ini + ' ' : '') + last;
  const nl = norm(last);
  const nf = norm(first);
  // "Rosales-Ortega, F. Fabián" / "F. F." / "F." / "Fernando Fabián" and the early "Rosales, F." form
  const isOwner = nl === 'rosales ortega' || (nl === 'rosales' && /^f/.test(nf));
  return { display, last, isOwner };
}

function ordinal(n: number): string {
  const v = n % 100;
  const suf = v >= 11 && v <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suf}`;
}

const OWNER_SHORT = 'Rosales-Ortega';

export function formatAuthors(raw: string, students: Set<string> = new Set()): { html: string; text: string; n: number; truncated: boolean; ownerPos: number } {
  const parts = splitAuthors(raw);
  const truncated = parts.length > 0 && isEtAl(parts[parts.length - 1]);
  const list = parts.filter((p) => !isEtAl(p)).map(parseAuthor);
  const n = list.length;
  const ownerPos = list.findIndex((a) => a.isOwner) + 1;
  const fmt = (a: Author) => {
    const dagger = !a.isOwner && students.has(norm(a.last)) ? '<sup class="student-mark" title="Student under (co-)supervision">†</sup>' : '';
    return (a.isOwner ? `<strong>${escapeHtml(a.display)}</strong>` : escapeHtml(a.display)) + dagger;
  };
  let html: string;
  if (n <= 8) {
    html = list.map(fmt).join(', ') + (truncated ? ' et al.' : '');
  } else {
    html = list.slice(0, 3).map(fmt).join(', ') + ' et al.';
    // With a truncated list the total is unknown: only state the position if he is among the named authors.
    if (truncated) {
      if (ownerPos) html += ` <span class="authors-count">(${OWNER_SHORT} is ${ordinal(ownerPos)} author)</span>`;
    } else {
      html += ` <span class="authors-count">(${n} authors${ownerPos ? `; ${OWNER_SHORT} is ${ordinal(ownerPos)}` : ''})</span>`;
    }
  }
  return { html, text: list.map((a) => a.display).join(', ') + (truncated ? ' et al.' : ''), n, truncated, ownerPos };
}

/* ---------- entries -> publications ---------- */

function parseMonth(v: string | undefined): number {
  if (!v) return 0;
  const t = v.replace(/\\/g, '').trim().toLowerCase();
  if (/^\d+$/.test(t)) { const k = parseInt(t, 10); return k >= 1 && k <= 12 ? k : 0; }
  const idx = MONTH_NAMES.indexOf(t.slice(0, 3));
  return idx + 1;
}

function journalName(v: string | undefined): string {
  if (!v) return '';
  const t = v.trim();
  const mac = /^\\([A-Za-z]+)$/.exec(t);
  if (mac) return JOURNALS[mac[1].toLowerCase()] ?? mac[1];
  return latexToUnicode(t);
}

function looksLikeBibcode(key: string): boolean {
  return /^\d{4}[A-Za-z&.]{5}[A-Za-z0-9.]{4}[A-Za-z0-9.]{4}[A-Z.]$/.test(key) || /^\d{4}.{15}$/.test(key) && /^\d{4}[A-Za-z]/.test(key);
}

export function toPublication(e: BibEntry, students: Set<string> = new Set()): Publication | null {
  const f = e.fields;
  const year = parseInt((f.year ?? '').replace(/\D/g, ''), 10);
  if (!f.title || !year) return null;
  const a = formatAuthors(f.author ?? f.editor ?? '', students);
  const isProc = e.type === 'inproceedings' || e.type === 'proceedings' || e.type === 'incollection';
  const journal = journalName(f.journal ?? f.booktitle);
  const series = isProc && f.series ? latexToUnicode(f.series).replace(/^Society of Photo-Optical Instrumentation Engineers \(SPIE\) Conference Series$/, 'SPIE Conference Series') : '';
  const inPress = /\.tmp\./.test(e.key);
  const vol = f.volume && f.volume.toLowerCase() !== 'tmp' ? latexToUnicode(f.volume) : '';
  const pages = f.pages && f.pages.toLowerCase() !== 'tmp' ? latexToUnicode(f.pages) : '';
  const eid = f.eid ? latexToUnicode(f.eid) : '';
  const loc = pages || eid;
  const venue = [journal, series, vol, loc].filter(Boolean).join(', ');
  const scix = looksLikeBibcode(e.key) ? `https://scixplorer.org/abs/${encodeURIComponent(e.key)}/abstract` : undefined;
  let arxiv: string | undefined;
  const ep = f.eprint?.trim();
  if (ep) {
    const prefix = (f.archiveprefix ?? '').toLowerCase();
    if (!prefix || prefix === 'arxiv') arxiv = `https://arxiv.org/abs/${ep.replace(/^arxiv:/i, '')}`;
  }
  const doi = f.doi?.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  const keywords = (f.keywords ?? '').split(',').map((k) => latexToUnicode(k)).filter(Boolean);
  return {
    key: e.key,
    type: e.type,
    year,
    month: parseMonth(f.month),
    title: latexToUnicode(f.title),
    authorsHtml: a.html,
    authorsText: a.text,
    nAuthors: a.n,
    authorsTruncated: a.truncated,
    ownerPosition: a.ownerPos,
    firstAuthor: a.ownerPos === 1,
    journal,
    inPress,
    venue,
    doi: doi || undefined,
    arxiv,
    scix,
    note: f.note ? latexToUnicode(f.note) : inPress ? 'in press' : undefined,
    keywords,
  };
}

/** Parse a .bib text into publications sorted by year desc, then month desc. */
export function loadPublications(bibText: string, studentSurnames: string[] = []): Publication[] {
  const students = new Set(studentSurnames.map((x) => norm(latexToUnicode(x))));
  const pubs = parseBibtex(bibText).map((e) => toPublication(e, students)).filter((p): p is Publication => p !== null);
  return pubs.sort((x, y) => y.year - x.year || y.month - x.month || x.key.localeCompare(y.key));
}
