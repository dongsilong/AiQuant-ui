let configuredTimeZone = 'Asia/Shanghai';

/**
 * 使用后端下发的 IANA 时区配置格式化量化接口时间。
 * 不带时区的数据库时间按 UTC 解释；带 Z 或偏移量的时间按其绝对时间转换。
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

export function getQuantTimeZone() {
  return configuredTimeZone;
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
  if (/^\\d{10,13}$/.test(text)) {
    const numeric = Number(text);
    const date = new Date(text.length === 10 ? numeric * 1000 : numeric);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  const normalized = text.includes('T') ? text : text.replace(' ', 'T');
  const hasTimeZone = /(?:Z|[+-]\\d{2}:?\\d{2})$/i.test(normalized);
  const date = new Date(hasTimeZone ? normalized : `${normalized}Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formattedParts(value: unknown) {
  const date = parseQuantTime(value);
  if (!date) return undefined;
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
  return { year: result('year'), month: result('month'), day: result('day'), hour: result('hour'), minute: result('minute'), second: result('second') };
}

export function formatQuantTime(value: unknown): string {
  if (value == null || value === '') return '—';
  const parts = formattedParts(value);
  return parts ? `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}` : String(value);
}

export function formatQuantDate(value: unknown): string {
  if (value == null || value === '') return '—';
  const parts = formattedParts(value);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : String(value);
}
