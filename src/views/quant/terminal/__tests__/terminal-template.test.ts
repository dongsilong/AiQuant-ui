import { compileTemplate, parse as parseSfc } from '@vue/compiler-sfc';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

function compiledTemplate() {
  const source = readFileSync(fileURLToPath(new URL('../index.vue', import.meta.url)), 'utf8');
  const { descriptor } = parseSfc(source);
  const result = compileTemplate({
    source: descriptor.template?.content || '',
    filename: 'src/views/quant/terminal/index.vue',
    id: 'terminal-template'
  });
  expect(result.errors).toEqual([]);
  return result.code;
}

describe('strategy instance symbol link', () => {
  it('routes a symbol click through the existing K-line switch handler', () => {
    expect(compiledTemplate()).toContain('selectRowSymbol(item)');
  });

  it('routes a realtime slope symbol click through the K-line switch handler', () => {
    expect(compiledTemplate()).toContain('selectRowSymbol({ symbol: scope.row.symbol })');
  });
});

describe('terminal MA controls', () => {
  it('selects MA5, MA7, MA15, MA30 and MA60 through a multi-select dropdown', () => {
    const source = readFileSync(fileURLToPath(new URL('../index.vue', import.meta.url)), 'utf8');
    const template = compiledTemplate();
    expect(source).toContain('const maPeriodOptions = [5, 7, 15, 30, 60];');
    expect(source).toContain('calcParams: [...maPeriods.value]');
    expect(source).toContain('function handleMaPeriodsChange(values: number[])');
    expect(template).toContain('maPeriods');
    expect(template).toContain('handleMaPeriodsChange');
  });
});
