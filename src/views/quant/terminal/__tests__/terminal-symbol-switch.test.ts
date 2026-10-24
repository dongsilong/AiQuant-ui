import { parse } from '@vue/compiler-sfc';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';

// Execute the actual handler with isolated page dependencies; no account or exchange requests.
function setup() {
  const source = readFileSync(fileURLToPath(new URL('../index.vue', import.meta.url)), 'utf8');
  const script = parse(source).descriptor.scriptSetup!.content;
  const ast = ts.createSourceFile('terminal.ts', script, ts.ScriptTarget.Latest, true);
  const handler = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'selectRowSymbol')!;
  const code = ts.transpile(handler.getText(ast), { target: ts.ScriptTarget.ES2022 });
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
  const select = new Function('context', `with (context) { ${code}; return selectRowSymbol; }`)(context);
  return { context, select };
}

function deferred() {
  let resolve!: (value: any) => void;
  const promise = new Promise<any>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('terminal symbol switching', () => {
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
