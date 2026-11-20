import { beforeEach, describe, expect, it } from 'vitest';
import { formatQuantDate, formatQuantTime, getQuantTimeZone, setQuantTimeZone } from '../quant-time';

describe('quant-time', () => {
  beforeEach(() => setQuantTimeZone('Asia/Shanghai'));

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

  it('formats dates in the configured timezone including day rollover', () => {
    expect(formatQuantDate('2026-11-20T18:30:00Z')).toBe('2026-11-21');
  });

  it('shows a placeholder for missing values and preserves invalid input', () => {
    expect(formatQuantTime(null)).toBe('—');
    expect(formatQuantTime('not-a-time')).toBe('not-a-time');
  });

  it('ignores an invalid timezone from a response header', () => {
    setQuantTimeZone('Invalid/Timezone');
    expect(getQuantTimeZone()).toBe('Asia/Shanghai');
  });
});
