// Date helpers — ported 1:1 from the prototype. EVERY day boundary is a LOCAL
// 'YYYY-MM-DD' string, never a UTC timestamp, so streak/decay/rollover math is
// correct across timezones and DST. We anchor at local noon to dodge DST edges.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const pad2 = (n: number): string => String(n).padStart(2, '0');

export function noon(d: Date): Date {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
}

// Local date string for a Date (or now).
export function dstr(d: Date): string {
  const x = noon(d);
  return x.getFullYear() + '-' + pad2(x.getMonth() + 1) + '-' + pad2(x.getDate());
}

export function today(now: Date = new Date()): string {
  return dstr(now);
}

// A Date n days from `from` (a YYYY-MM-DD string) or from today, at local noon.
export function dOff(n: number, from?: string, now: Date = new Date()): Date {
  const d = noon(from ? new Date(from + 'T12:00:00') : now);
  d.setDate(d.getDate() + n);
  return d;
}

export function dstrOff(n: number, from?: string, now: Date = new Date()): string {
  return dstr(dOff(n, from, now));
}

export function parseD(s: string): Date {
  return new Date(s + 'T12:00:00');
}

export function dow(s: string): number {
  return parseD(s).getDay();
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseD(b).getTime() - parseD(a).getTime()) / 86400000);
}

// ISO-8601 week id 'YYYY-Www' (Monday-anchored), used to gate the weekly Streak-Freeze refill.
export function isoWeek(s: string): string {
  const d = parseD(s);
  const t = new Date(d);
  t.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const w1 = new Date(t.getFullYear(), 0, 4);
  const n = 1 + Math.round(((t.getTime() - w1.getTime()) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
  return t.getFullYear() + '-W' + pad2(n);
}

// Monday-anchored start of the local week containing `s`.
export function weekStart(s: string): string {
  return dstr(dOff(-((parseD(s).getDay() + 6) % 7), s));
}

export function prettyDate(s: string): string {
  const d = parseD(s);
  return MONTHS[d.getMonth()] + ' ' + d.getDate();
}
