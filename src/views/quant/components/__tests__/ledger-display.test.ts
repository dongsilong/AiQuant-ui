import { describe, expect, it } from 'vitest';
import { displayDecimal } from '../ledger-display';

describe('displayDecimal', () => {
  it('removes insignificant zeros and caps display precision at eight decimals', () => {
    expect(displayDecimal('23.0546822307066408')).toBe('23.05468223');
    expect(displayDecimal('23.050000000')).toBe('23.05');
  });

  it('rounds half up using decimal strings without converting through Number', () => {
    expect(displayDecimal('23.0546822397066408')).toBe('23.05468224');
    expect(displayDecimal('9007199254740993.123456789')).toBe('9007199254740993.12345679');
  });

  it('expands scientific notation and normalizes rounded negative zero', () => {
    expect(displayDecimal('2.30546822307066408e1')).toBe('23.05468223');
    expect(displayDecimal('-0.000000004')).toBe('0');
  });

  it('supports an explicit scale for fields with exchange-defined precision', () => {
    expect(displayDecimal('23.0546822307066408', 4)).toBe('23.0547');
  });
});
