import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it, vi } from 'vitest';

// Isolate the actual API function from the browser-only request interceptor/router.
const source = readFileSync(fileURLToPath(new URL('../index.ts', import.meta.url)), 'utf8');
const ast = ts.createSourceFile('api.ts', source, ts.ScriptTarget.Latest, true);
const declaration = ast.statements.find(
  node =>
    ts.isVariableStatement(node) &&
    node.declarationList.declarations.some(item => item.name.getText(ast) === 'listRealtimeKlines')
)!;
const code = ts.transpile(declaration.getText(ast).replace(/^export\s+/, ''), { target: ts.ScriptTarget.ES2022 });
const request = vi.fn();
const listRealtimeKlines = new Function('request', `${code}; return listRealtimeKlines;`)(request);

describe('terminal K-line environment', () => {
  it('includes the selected environment in the REST request', () => {
    listRealtimeKlines('BRUSDT', '15m', 1000, 'TESTNET');
    expect(request).toHaveBeenLastCalledWith({
      url: '/quant/market/klines',
      method: 'get',
      params: { symbol: 'BRUSDT', interval: '15m', limit: 1000, runMode: 'TESTNET' }
    });
  });

  it('keeps LIVE as the default for existing callers', () => {
    listRealtimeKlines('BTCUSDT', '1m');
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        params: { symbol: 'BTCUSDT', interval: '1m', limit: 100, runMode: 'LIVE' }
      })
    );
  });
});
