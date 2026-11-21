import { beforeEach, describe, expect, it } from 'vitest';
import {
  formatQuantApiTime,
  formatQuantDate,
  formatQuantLocalTime,
  formatQuantTime,
  getQuantServerTimeZone,
  getQuantTimeZone,
  isQuantTimeField,
  setQuantServerTimeZone,
  setQuantTimeZone
} from '../quant-time';

describe('quant-time', () => {
  beforeEach(() => {
    setQuantTimeZone('Asia/Shanghai');
    setQuantServerTimeZone('Asia/Shanghai');
  });

  it('uses Beijing time by default', () => {
    expect(getQuantTimeZone()).toBe('Asia/Shanghai');
    expect(formatQuantTime('2026-11-20T14:15:16Z')).toBe('2026-11-20 22:15:16');
  });

  it('interprets legacy database datetime strings as UTC', () => {
    expect(formatQuantTime('2026-11-20 14:15:16')).toBe('2026-11-20 22:15:16');
  });

  it('converts timestamps with an explicit offset by their instant', () => {
    expect(formatQuantTime('2026-11-20T22:15:16+08:00')).toBe('2026-11-20 22:15:16');
  });

  it('supports millisecond and second Unix timestamps', () => {
    expect(formatQuantTime(1795184116000)).toBe('2026-11-20 22:15:16');
    expect(formatQuantTime('1795184116')).toBe('2026-11-20 22:15:16');
  });

  it('uses the configured timezone rather than the browser timezone', () => {
    setQuantTimeZone('America/New_York');
    expect(formatQuantTime('2026-11-20T14:15:16Z')).toBe('2026-11-20 09:15:16');
  });

  it('interprets server LocalDateTime using the reported JVM timezone', () => {
    setQuantServerTimeZone('America/New_York');
    expect(getQuantServerTimeZone()).toBe('America/New_York');
    expect(formatQuantLocalTime('2026-11-20 09:15:16')).toBe('2026-11-20 22:15:16');
  });

  it('uses the configured timezone to display server-local values', () => {
    setQuantTimeZone('America/New_York');
    expect(formatQuantLocalTime('2026-11-20 22:15:16')).toBe('2026-11-20 09:15:16');
  });

  it('formats API fields according to their documented source timezone', () => {
    setQuantServerTimeZone('America/New_York');
    expect(formatQuantApiTime('lastConnectTime', '2026-11-20 09:15:16')).toBe('2026-11-20 22:15:16');
    expect(formatQuantApiTime('createdAt', '2026-11-20T14:15:16Z')).toBe('2026-11-20 22:15:16');
    expect(formatQuantApiTime('effectiveTime', '2026-11-20T09:15:16-05:00')).toBe('2026-11-20 22:15:16');
  });

  it('recognizes quant timestamp fields for generic ledger rendering', () => {
    expect(isQuantTimeField('createdAt')).toBe(true);
    expect(isQuantTimeField('openedAt')).toBe(true);
    expect(isQuantTimeField('symbol')).toBe(false);
  });

  it('formats dates in the configured timezone including day rollover', () => {
    expect(formatQuantDate('2026-11-20T18:30:00Z')).toBe('2026-11-21');
  });

  it('shows a placeholder for missing values and preserves invalid input', () => {
    expect(formatQuantTime(null)).toBe('—');
    expect(formatQuantTime('not-a-time')).toBe('not-a-time');
  });

  it('ignores invalid timezone values from response headers', () => {
    setQuantTimeZone('Invalid/Timezone');
    setQuantServerTimeZone('Invalid/Timezone');
    expect(getQuantTimeZone()).toBe('Asia/Shanghai');
    expect(getQuantServerTimeZone()).toBe('Asia/Shanghai');
  });
});
