const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

/** "4 Mar 2026" (UTC, so no timezone drift). */
export function formatDate(d: Date | string): string {
  const x = toDate(d);
  return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`;
}

/** Format according to precision: "2026", "May 2026" or "29 May 2026". */
export function formatDatePrecise(d: Date | string, precision: 'day' | 'month' | 'year' = 'day'): string {
  const x = toDate(d);
  if (precision === 'year') return String(x.getUTCFullYear());
  if (precision === 'month') return `${MONTHS_LONG[x.getUTCMonth()]} ${x.getUTCFullYear()}`;
  return formatDate(x);
}

/** "2026-03-04" for <time datetime>. */
export function isoDate(d: Date | string): string {
  return toDate(d).toISOString().slice(0, 10);
}

export function yearOf(d: Date | string): number {
  return toDate(d).getUTCFullYear();
}

export function longMonthYear(d: Date = new Date()): string {
  return `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Build date in the form "16 Nov 2026" */
export function buildDate(): string {
  return formatDate(new Date());
}

/** Dates in YAML lists are plain strings: "2025-11-07", "2025-08" or "2025". Show them as "7 Nov 2025", "Aug 2025", "2025". */
export function formatLooseDate(v: string | undefined): string {
  if (!v) return '';
  const s = String(v).trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  m = /^(\d{4})-(\d{2})$/.exec(s);
  if (m) return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  return s;
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
/** Spanish long form: "9 de septiembre de 2021" (also "septiembre de 2021", "2021"). */
export function formatLooseDateEs(v: string | undefined): string {
  if (!v) return '';
  const s = String(v).trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return `${Number(m[3])} de ${MESES[Number(m[2]) - 1]} de ${m[1]}`;
  m = /^(\d{4})-(\d{2})$/.exec(s);
  if (m) return `${MESES[Number(m[2]) - 1]} de ${m[1]}`;
  return s;
}
