import { describe, expect, it } from 'vitest';
import { formatUtcTimeInBeijing } from '../time-format';

describe('formatUtcTimeInBeijing', () => {
  it('formats UTC ISO timestamps as Beijing time', () => {
    expect(formatUtcTimeInBeijing('2026-11-20T14:15:16Z')).toBe('2026-11-20 22:15:16');
  });

  it('treats legacy SQL datetime strings as UTC', () => {
    expect(formatUtcTimeInBeijing('2026-11-20 14:15:16')).toBe('2026-11-20 22:15:16');
  });

  it('handles day rollover in the Beijing timezone', () => {
    expect(formatUtcTimeInBeijing('2026-11-20T18:30:00Z')).toBe('2026-11-21 02:30:00');
  });

  it('shows a placeholder for missing time and preserves invalid input for diagnosis', () => {
    expect(formatUtcTimeInBeijing(null)).toBe('—');
    expect(formatUtcTimeInBeijing('not-a-time')).toBe('not-a-time');
  });
});
