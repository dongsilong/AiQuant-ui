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
    expect(source).toContain('function toggleMaPeriod(value: number)');
    expect(template).toContain('el-dropdown');
    expect(source).toContain(':hide-on-click="false"');
    expect(template).toContain('toggleMaPeriod');
    expect(template).toContain('indicator-dropdown-caret');
    expect(template).toContain('maPeriods');
  });
});

describe('terminal EMA controls', () => {
  it('selects EMA6, EMA12 and EMA20 through an independent dropdown', () => {
    const source = readFileSync(fileURLToPath(new URL('../index.vue', import.meta.url)), 'utf8');
    const template = compiledTemplate();
    expect(source).toContain('const emaPeriodOptions = [6, 12, 20];');
    expect(source).toContain('calcParams: [...emaPeriods.value]');
    expect(source).toContain("!['MA', 'EMA'].includes(item.value)");
    expect(source).toContain('function toggleEmaPeriod(value: number)');
    expect(template).toContain('emaPeriodOptions');
    expect(template).toContain('toggleEmaPeriod');
    expect(template).toContain('emaPeriods');
  });
});

describe('terminal indicator button sizing', () => {
  it('uses one shared width for MA, EMA and other indicator buttons', () => {
    const source = readFileSync(fileURLToPath(new URL('../index.vue', import.meta.url)), 'utf8');
    expect(source.match(/class="indicator-button"/g)).toHaveLength(3);
    expect(source).toContain('.indicator-control :deep(.indicator-button)');
    expect(source).toContain('width: 48px;');
    expect(source).toContain('padding-right: 4px;');
    expect(source).toContain('padding-left: 4px;');
  });
});
