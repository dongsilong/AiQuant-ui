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
    expect(source).toContain('options: [5, 7, 15, 30, 60]');
    expect(source).toContain('defaultPeriods: [5, 7, 15]');
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
    expect(source).toContain('options: [6, 12, 20]');
    expect(source).toContain('defaultPeriods: [6, 12]');
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

describe('terminal indicator incremental updates', () => {
  it('rebuilds only the indicator whose settings changed', () => {
    const source = readFileSync(fileURLToPath(new URL('../index.vue', import.meta.url)), 'utf8');
    expect(source).toContain("chart.value.removeIndicator({ name });");
    expect(source).toContain("renderIndicator('MA');");
    expect(source).toContain("renderIndicator('EMA');");
    expect(source).toContain('renderIndicator(value);');
    expect(source).toContain("renderIndicator('MA');\n}\n\nfunction toggleEmaPeriod");
    expect(source).toContain("renderIndicator('EMA');\n}\n\nfunction toggleIndicator");
    const maToggle = source.slice(source.indexOf('function toggleMaPeriod'), source.indexOf('function toggleEmaPeriod'));
    const emaToggle = source.slice(source.indexOf('function toggleEmaPeriod'), source.indexOf('function toggleIndicator'));
    const otherToggle = source.slice(source.indexOf('function toggleIndicator'), source.indexOf('// ==================== 数据加载与处理逻辑'));
    expect(maToggle).toContain("renderIndicator('MA')");
    expect(emaToggle).toContain("renderIndicator('EMA')");
    expect(otherToggle).toContain('renderIndicator(value)');
    expect(maToggle + emaToggle + otherToggle).not.toContain('renderIndicators()');
  });
});

describe('terminal price-line overlay updates', () => {
  it('updates overlays by stable identity instead of recreating every line', () => {
    const source = readFileSync(fileURLToPath(new URL('../index.vue', import.meta.url)), 'utf8');
    expect(source).toContain('const overlayIds = new Map<string, string>();');
    expect(source).toContain('chart.value.overrideOverlay({ id, ...overlay });');
    expect(source).toContain('chart.value.removeOverlay({ id });');
    expect(source).toContain('`position:${item.symbol}:${item.side}:entry`');
    expect(source).toContain('`order:${item.symbol}:${item.orderId}`');
  });
});

describe('terminal EMA default initialization', () => {
  it('creates the default EMA directly when the chart is initialized', () => {
    const source = readFileSync(fileURLToPath(new URL('../index.vue', import.meta.url)), 'utf8');
    const initialization = source.slice(source.indexOf('function renderIndicators'), source.indexOf('function renderOverlays'));
    expect(initialization).toContain("name: 'EMA'");
    expect(initialization).toContain('calcParams: [...emaPeriods.value]');
    expect(initialization).toContain("paneId: 'candle_pane'");
    expect(initialization).not.toContain("renderIndicator('EMA')");
  });
});

describe('terminal indicator initialization configuration', () => {
  it('supports independent enabled flags for MA, EMA and BOLL', () => {
    const source = readFileSync(fileURLToPath(new URL('../index.vue', import.meta.url)), 'utf8');
    expect(source).toContain('ma: {\n    enabled: true');
    expect(source).toContain('ema: {\n    enabled: true');
    expect(source).toContain('const maEnabled = ref(indicatorConfig.ma.enabled)');
    expect(source).toContain('const emaEnabled = ref(indicatorConfig.ema.enabled)');
    expect(source).toContain('maEnabled.value && maPeriods.value.length');
    expect(source).toContain('emaEnabled.value && emaPeriods.value.length');
    expect(source).toContain('maEnabled.value = maPeriods.value.length > 0');
    expect(source).toContain('emaEnabled.value = emaPeriods.value.length > 0');
  });

  it('uses configured default periods and BOLL parameters on initial and incremental rendering', () => {
    const source = readFileSync(fileURLToPath(new URL('../index.vue', import.meta.url)), 'utf8');
    expect(source).toContain("enabled: true,\n    calcParams: [20, 2]");
    expect(source).toContain("ref<string[]>(indicatorConfig.boll.enabled ? ['BOLL'] : [])");
    expect(source.match(/calcParams: \[\.\.\.indicatorConfig\.boll\.calcParams\]/g)).toHaveLength(2);
    expect(source).toContain('ref<number[]>([...indicatorConfig.ma.defaultPeriods])');
    expect(source).toContain('ref<number[]>([...indicatorConfig.ema.defaultPeriods])');
  });
});
