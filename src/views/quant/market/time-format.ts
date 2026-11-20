/**
 * Format a UTC timestamp as Beijing time, independent of the browser's local timezone.
 * Legacy SQL DATETIME strings from the dispatch API are interpreted as UTC as well.
 */
export const formatUtcTimeInBeijing = (value: string | null | undefined): string => {
  if (!value) return '—';

  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const timestamp = /(?:Z|[+-]\\d{2}:?\\d{2})$/i.test(normalized) ? normalized : `${normalized}Z`;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return value;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? '';

  return `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}:${part('second')}`;
};
