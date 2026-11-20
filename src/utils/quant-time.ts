let configuredTimeZone = 'Asia/Shanghai';
let serverTimeZone = 'Asia/Shanghai';

/**
 * Use the configured display timezone for exchange timestamps and UTC database values.
 * Naive datetime strings passed to formatQuantTime are interpreted as UTC.
 */
export function setQuantTimeZone(value?: string) {
  if (!value || value === configuredTimeZone) return;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    configuredTimeZone = value;
  } catch {
    // Ignore an invalid response header and keep the last valid timezone.
  }
}

/**
 * Server-generated LocalDateTime values have no offset; interpret them in the JVM timezone.
 */
export function setQuantServerTimeZone(value?: string) {
  if (!value || value === serverTimeZone) return;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    serverTimeZone = value;
  } catch {
    // Ignore an invalid response header and keep the last valid timezone.
  }
}

export function getQuantTimeZone() {
  return configuredTimeZone;
}

export function getQuantServerTimeZone() {
  return serverTimeZone;
}

function parseQuantTime(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const timestamp = Math.abs(value) < 100_000_000_000 ? value * 1000 : value;
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  if (typeof value !== 'string' || !value.trim()) return undefined;

  const text = value.trim();
  if (/^\d{10,13}$/.test(text)) {
    const numeric = Number(text);
    const date = new Date(text.length === 10 ? numeric * 1000 : numeric);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  const normalized = text.includes('T') ? text : text.replace(' ', 'T');
  const hasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  const date = new Date(hasTimeZone ? normalized : normalized + 'Z');
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseQuantLocalTime(value: unknown): Date | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    return parseQuantTime(value);
  }

  const text = value.trim();
  const normalized = text.includes('T') ? text : text.replace(' ', 'T');
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized) || /^\d{10,13}$/.test(text)) {
    return parseQuantTime(value);
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?)?$/.exec(normalized);
  if (!match) return undefined;

  const [, year, month, day, hour = '00', minute = '00', second = '00', fraction = '0'] = match;
  const milliseconds = Number((fraction + '000').slice(0, 3));
  const wallTime = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), milliseconds);
  let timestamp = wallTime;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const zoneName = new Intl.DateTimeFormat('en-US', {
      timeZone: serverTimeZone,
      timeZoneName: 'longOffset'
    }).formatToParts(new Date(timestamp)).find(part => part.type === 'timeZoneName')?.value ?? 'GMT';
    const offset = /^GMT([+-])(\d{2}):(\d{2})$/.exec(zoneName);
    const offsetMillis = offset
      ? (offset[1] === '+' ? 1 : -1) * (Number(offset[2]) * 60 + Number(offset[3])) * 60_000
      : 0;
    const corrected = wallTime - offsetMillis;
    if (corrected === timestamp) break;
    timestamp = corrected;
  }

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: configuredTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const result = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? '';
  return {
    year: result('year'),
    month: result('month'),
    day: result('day'),
    hour: result('hour'),
    minute: result('minute'),
    second: result('second')
  };
}

function formatDateTime(value: unknown, parser: (value: unknown) => Date | undefined): string {
  if (value == null || value === '') return '—';
  const date = parser(value);
  if (!date) return String(value);
  const parts = formatParts(date);
  return parts.year + '-' + parts.month + '-' + parts.day + ' ' + parts.hour + ':' + parts.minute + ':' + parts.second;
}

/** Format a UTC/offset-aware timestamp or a naive UTC database datetime. */
export function formatQuantTime(value: unknown): string {
  return formatDateTime(value, parseQuantTime);
}

/** Format a naive LocalDateTime generated in the backend JVM timezone. */
export function formatQuantLocalTime(value: unknown): string {
  return formatDateTime(value, parseQuantLocalTime);
}

/** Format an absolute timestamp as a date in the configured display timezone. */
export function formatQuantDate(value: unknown): string {
  if (value == null || value === '') return '—';
  const date = parseQuantTime(value);
  if (!date) return String(value);
  const parts = formatParts(date);
  return parts.year + '-' + parts.month + '-' + parts.day;
}
