/**
 * UI-only Beijing time conversion. Binance event instants stay as UTC epoch values.
 * Zone-less backend LocalDateTime strings are defined as Beijing wall time.
 */
const BEIJING_ZONE = 'Asia/Shanghai';

export function parseBeijingDate(input: string | number | Date): Date {
  if (input instanceof Date) return new Date(input.getTime());
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return new Date(NaN);
    return new Date(Math.abs(input) < 100000000000 ? input * 1000 : input);
  }
  const text = String(input).trim();
  if (/^\d{10}$/.test(text)) return new Date(Number(text) * 1000);
  if (/^\d{13}$/.test(text)) return new Date(Number(text));
  const normalized = text.replace(' ', 'T');
  // yyyy-MM-dd[ HH:mm:ss[.SSS]] without zone represents Beijing wall clock.
  if (/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?$/.test(normalized)) {
    const complete = normalized.includes('T') ? normalized : normalized + 'T00:00:00';
    // Date.parse requires seconds on some engines for offset-qualified inputs.
    const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(complete)
      ? complete + ':00' : complete;
    const result = new Date(withSeconds + '+08:00');
    // Invalid wall clocks must not silently normalize (e.g. February 30).
    if (!Number.isNaN(result.getTime())) {
      const check = new Intl.DateTimeFormat('en-CA', {
        timeZone: BEIJING_ZONE, year: 'numeric', month: '2-digit',
        day: '2-digit', hour: '2-digit', minute: '2-digit',
        second: '2-digit', hourCycle: 'h23'
      }).formatToParts(result);
      const parts = Object.fromEntries(check.map(part => [part.type, part.value]));
      const expected = withSeconds.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
      if (expected && (parts.year !== expected[1] || parts.month !== expected[2]
        || parts.day !== expected[3] || parts.hour !== expected[4]
        || parts.minute !== expected[5] || parts.second !== expected[6])) {
        return new Date(NaN);
      }
    }
    return result;
  }
  return new Date(normalized);
}

export function beijingParts(input: string | number | Date) {
  const date = parseBeijingDate(input);
  if (Number.isNaN(date.getTime())) return null;
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: BEIJING_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]));
  const y = Number(parts.year);
  const m = Number(parts.month);
  const d = Number(parts.day);
  return {
    y, m, d,
    h: Number(parts.hour),
    i: Number(parts.minute),
    s: Number(parts.second),
    a: new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  };
}

export function formatBeijingDate(input: string | number | Date): string {
  const p = beijingParts(input);
  if (!p) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p.y}-${pad(p.m)}-${pad(p.d)} ${pad(p.h)}:${pad(p.i)}:${pad(p.s)}`;
}
