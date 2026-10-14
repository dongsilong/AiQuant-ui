import { describe, expect, it } from 'vitest';
import { formatBeijingDate, parseBeijingDate } from './beijingTime';
import { parseTime } from './ruoyi';
import { formatTime, formatDate } from './index';

describe('Beijing time display independent from workstation zone', () => {
  it('converts UTC and offset timestamps to the same Beijing wall clock', () => {
    expect(formatBeijingDate('2026-10-14T12:00:00Z')).toBe('2026-10-14 20:00:00');
    expect(formatBeijingDate('2026-10-14T20:00:00+08:00')).toBe('2026-10-14 20:00:00');
  });

  it('does not accidentally shift zone-less backend LocalDateTime', () => {
    expect(formatBeijingDate('2026-10-14 20:00:00')).toBe('2026-10-14 20:00:00');
    expect(parseBeijingDate('2026-10-14 20:00:00').toISOString()).toBe('2026-10-14T12:00:00.000Z');
  });

  it('crosses Beijing midnight correctly', () => {
    expect(formatBeijingDate('2026-10-14T23:30:00Z')).toBe('2026-10-15 07:30:00');
    expect(parseTime('2026-10-14T23:30:00Z')).toBe('2026-10-15 07:30:00');
  });

  it('supports Binance epoch timestamps without changing instant', () => {
    const epoch = Date.parse('2026-10-14T12:00:00Z');
    expect(formatBeijingDate(epoch)).toBe('2026-10-14 20:00:00');
    expect(formatBeijingDate(Math.floor(epoch / 1000))).toBe('2026-10-14 20:00:00');
  });

  it('formats ISO and zone-less dates in shared grid and relative helpers', () => {
    expect(formatDate('2026-10-14T12:00:00Z')).toBe('2026-10-14 20:00:00');
    expect(formatDate('2026-10-14 20:00:00')).toBe('2026-10-14 20:00:00');
    expect(formatTime('2026-10-14T12:00:00Z', '{y}-{m}-{d} {h}:{i}:{s}')).toBe('2026-10-14 20:00:00');
    expect(formatTime('2026-10-14 20:00:00', '{y}-{m}-{d} {h}:{i}:{s}')).toBe('2026-10-14 20:00:00');
  });

  it('returns empty display for invalid input', () => {
    expect(formatBeijingDate('not-a-date')).toBe('');
  });
});
