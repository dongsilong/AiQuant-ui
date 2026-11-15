import { parse } from '@vue/compiler-sfc';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';

// Execute actual page handlers with isolated dependencies; no account or exchange requests.
function executeFunction(name: string, context: Record<string, any>) {
  const source = readFileSync(fileURLToPath(new URL('../index.vue', import.meta.url)), 'utf8');
  const script = parse(source).descriptor.scriptSetup!.content;
  const ast = ts.createSourceFile('terminal.ts', script, ts.ScriptTarget.Latest, true);
  const handler = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name)!;
  const code = ts.transpile(handler.getText(ast), { target: ts.ScriptTarget.ES2022 });
  return new Function('context', `with (context) { ${code}; return ${name}; }`)(context);
}

function setup() {
  const context = {
    symbol: { value: 'BTCUSDT' },
    interval: { value: '15m' },
    dataGeneration: 1,
    symbolRequest: 0,
    selectedMarketRunMode: vi.fn(() => 'TESTNET'),
    listRealtimeKlines: vi.fn(async () => ({ data: [{ openTime: 'new' }] })),
    listSymbol: vi.fn(async () => ({ data: { rows: [{ id: '1', symbol: 'BRUSDT' }] } })),
    symbolOptions: { value: [] as any[] },
    symbolInfo: { value: undefined as any },
    klines: { value: [] as any[] },
    price: { value: undefined },
    ElMessage: { error: vi.fn() },
    queryError: (error: any, fallback: string) => error?.message || fallback,
    renderChart: vi.fn(),
    renderOverlays: vi.fn(),
    connect: vi.fn()
  };
  const select = executeFunction('selectRowSymbol', context);
  return { context, select };
}

function deferred() {
  let resolve!: (value: any) => void;
  const promise = new Promise<any>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

function setupMarketLoad(pending: Promise<any>, initialKlines = [{ openTime: 'old' }]) {
  const context = {
    symbol: { value: 'BTCUSDT' },
    interval: { value: '15m' },
    dataGeneration: 1,
    symbolRequest: 0,
    selectedMarketRunMode: vi.fn(() => 'TESTNET'),
    listRealtimeKlines: vi.fn(() => pending),
    listSymbol: vi.fn(async () => ({ data: { rows: [] } })),
    chartLoading: { value: true },
    symbolInfo: { value: undefined as any },
    symbolOptions: { value: [] as any[] },
    klines: { value: initialKlines as any[] },
    cacheQuantSymbolTickSize: vi.fn(),
    ensureQuantSymbolTickSizes: vi.fn(async () => undefined),
    renderChart: vi.fn(),
    renderOverlays: vi.fn(),
    ElMessage: { error: vi.fn() },
    chartDataSymbol: 'BTCUSDT',
    chartDataInterval: '15m'
  };
  return { context, load: executeFunction('loadMarketData', context) };
}

function setupSlopePanel() {
  const context = {
    slopeLoadController: undefined as AbortController | undefined,
    slopeLoadGeneration: 0,
    slopePanelVisible: { value: false },
    slopeStrategyId: { value: undefined as string | undefined },
    strategyId: { value: 'filter-strategy' },
    strategies: { value: [{ id: 'first-strategy' }] },
    closeSlopeStream: vi.fn(),
    slopeRows: { value: [{ symbol: 'OLDUSDT' }] },
    slopeLoadError: { value: 'old error' },
    slopeSymbolErrors: { value: ['OLDUSDT'] },
    slopeLoading: { value: true },
    listStrategySymbols: vi.fn(async () => ({ data: [] })),
    connectSlopeStream: vi.fn()
  };
  return { context, open: executeFunction('openSlopePanel', context) };
}

function setupAccountRefresh(loading = false, activeTab = 'positions') {
  const context = {
    loading: { value: loading },
    accountRefreshPending: false,
    refreshRequest: 0,
    credentialId: { value: 'account' },
    dataRequestController: { signal: new AbortController().signal },
    dataGeneration: 1,
    loadAccountData: vi.fn(async () => true),
    loadMarketData: vi.fn(),
    connectAccountStream: vi.fn(),
    activeTab: { value: activeTab },
    loadOpenOrders: vi.fn(),
    loadTrades: vi.fn()
  };
  return { context, refresh: executeFunction('refreshAccountData', context) };
}

describe('terminal symbol switching', () => {
  it('does not let an older full-refresh market response overwrite a newer symbol selection', async () => {
    const first = deferred();
    const { context, load } = setupMarketLoad(first.promise);
    const pending = load('account', 1, new AbortController().signal);
    context.symbolRequest++;
    context.symbol.value = 'ETHUSDT';
    first.resolve({ data: [{ openTime: 'stale' }] });
    await expect(pending).resolves.toBe(false);
    expect(context.klines.value).toEqual([{ openTime: 'old' }]);
    expect(context.renderChart).not.toHaveBeenCalled();
    expect(context.chartLoading.value).toBe(true);
  });

  it('clears old candles when the current market refresh fails', async () => {
    const { context, load } = setupMarketLoad(Promise.reject(new Error('K-line request failed')));
    await expect(load('account', 1, new AbortController().signal)).resolves.toBe(true);
    expect(context.klines.value).toEqual([]);
    expect(context.ElMessage.error).toHaveBeenCalledWith(expect.stringContaining('K-line request failed'));
    expect(context.renderChart).toHaveBeenCalledOnce();
  });

  it('does not reuse the strategy filter or first strategy as the explicit slope strategy', async () => {
    const { context, open } = setupSlopePanel();
    await open();
    expect(context.slopePanelVisible.value).toBe(true);
    expect(context.slopeStrategyId.value).toBeUndefined();
    expect(context.listStrategySymbols).not.toHaveBeenCalled();
  });

  it('refreshes account data without restarting market data or the account stream', async () => {
    const { context, refresh } = setupAccountRefresh(false, 'orders');
    await refresh();
    expect(context.loadAccountData).toHaveBeenCalledWith('account', 1, context.dataRequestController.signal, true);
    expect(context.loadOpenOrders).toHaveBeenCalledWith(true);
    expect(context.loadTrades).not.toHaveBeenCalled();
    expect(context.loadMarketData).not.toHaveBeenCalled();
    expect(context.connectAccountStream).not.toHaveBeenCalled();
    expect(context.loading.value).toBe(false);
  });

  it('queues an account refresh behind an active full refresh', async () => {
    const { context, refresh } = setupAccountRefresh(true);
    await refresh();
    expect(context.accountRefreshPending).toBe(true);
    expect(context.loadAccountData).not.toHaveBeenCalled();
    expect(context.loading.value).toBe(true);
  });

  it('queries the same environment as realtime subscriptions', async () => {
    const { context, select } = setup();
    await select({ symbol: 'BRUSDT' });
    expect(context.listRealtimeKlines).toHaveBeenCalledWith('BRUSDT', '15m', 1000, 'TESTNET');
    expect(context.symbol.value).toBe('BRUSDT');
    expect(context.renderChart).toHaveBeenCalledOnce();
  });

  it('does not let an older slow click override the latest selection', async () => {
    const { context, select } = setup();
    const first = deferred();
    context.listRealtimeKlines.mockImplementationOnce(() => first.promise);
    const pending = select({ symbol: 'BRUSDT' });
    await select({ symbol: 'ENAUSDT' });
    first.resolve({ data: [{ openTime: 'old' }] });
    await pending;
    expect(context.symbol.value).toBe('ENAUSDT');
    expect(context.klines.value).toEqual([{ openTime: 'new' }]);
  });

  it('retains the current chart and shows the cause when K-lines fail', async () => {
    const { context, select } = setup();
    context.listRealtimeKlines.mockRejectedValueOnce(new Error('系统接口请求超时'));
    await select({ symbol: 'BRUSDT' });
    expect(context.symbol.value).toBe('BTCUSDT');
    expect(context.renderChart).not.toHaveBeenCalled();
    expect(context.ElMessage.error).toHaveBeenCalledWith(expect.stringContaining('系统接口请求超时'));
  });

  it('does not require symbol metadata to display valid K-lines', async () => {
    const { context, select } = setup();
    context.listSymbol.mockRejectedValueOnce(new Error('metadata unavailable'));
    await select({ symbol: 'BRUSDT' });
    expect(context.symbol.value).toBe('BRUSDT');
    expect(context.renderChart).toHaveBeenCalledOnce();
  });

  it('discards an in-flight result when the account environment changes', async () => {
    const { context, select } = setup();
    const first = deferred();
    context.listRealtimeKlines.mockImplementationOnce(() => first.promise);
    const pending = select({ symbol: 'BRUSDT' });
    context.selectedMarketRunMode.mockReturnValue('LIVE');
    first.resolve({ data: [] });
    await pending;
    expect(context.symbol.value).toBe('BTCUSDT');
    expect(context.renderChart).not.toHaveBeenCalled();
  });

  it('cancels a pending switch when the user reselects the current symbol', async () => {
    const { context, select } = setup();
    const first = deferred();
    context.listRealtimeKlines.mockImplementationOnce(() => first.promise);
    const pending = select({ symbol: 'BRUSDT' });
    await select({ symbol: 'BTCUSDT' });
    first.resolve({ data: [] });
    await pending;
    expect(context.symbol.value).toBe('BTCUSDT');
    expect(context.renderChart).not.toHaveBeenCalled();
  });

  it('discards a result superseded by a page refresh', async () => {
    const { context, select } = setup();
    const first = deferred();
    context.listRealtimeKlines.mockImplementationOnce(() => first.promise);
    const pending = select({ symbol: 'BRUSDT' });
    context.dataGeneration++;
    first.resolve({ data: [] });
    await pending;
    expect(context.symbol.value).toBe('BTCUSDT');
  });
});
