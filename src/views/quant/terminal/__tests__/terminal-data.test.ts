import { describe, expect, it } from 'vitest';
import {
  accountTrade,
  exactCloseQuantity,
  exactIntegerId,
  liveTradePage,
  mergeAccountPosition,
  mergePositionSnapshots,
  mergeTrades,
  parseBinanceAccountEvent,
  positionMetrics,
  protectionPrices,
  updateOrders,
  updateProtectionOrders
} from '../terminal-data';
const position = {
  symbol: 'PUMPUSDT',
  side: 'LONG',
  quantity: '100',
  entryPrice: '2',
  markPrice: '2.01',
  unrealizedPnl: '1',
  liquidationPrice: '1',
  margin: '20.1',
  leverage: 10
};
const fill = {
  s: 'PUMPUSDT',
  S: 'BUY',
  x: 'TRADE',
  X: 'PARTIALLY_FILLED',
  i: 123,
  t: 456,
  l: '2',
  L: '3',
  rp: '0',
  n: '0.01',
  T: 1000
};
describe('exact close order quantity', () => {
  it('preserves all fractional digits instead of rounding through JavaScript number', () => {
    expect(exactCloseQuantity('-0.000000001234567890123456')).toBe('0.000000001234567890123456');
    expect(exactCloseQuantity('123456789012345678.001')).toBe('123456789012345678.001');
  });
  it('rejects malformed and empty/zero quantities', () => {
    for (const text of ['0', '-0.0000', '', 'NaN', 'Infinity', '1e9']) {
      expect(exactCloseQuantity(text)).toBeUndefined();
    }
  });
});

describe('Binance 64-bit ID precision', () => {
  it('preserves unsafe order, trade and algo numeric JSON tokens before parsing', () => {
    const raw = parseBinanceAccountEvent('{"e":"ORDER_TRADE_UPDATE","o":{"s":"BTCUSDT","i":9007199254740993,"t":9007199254740995,"aid":9007199254740997,"X":"NEW"}}');
    const order = raw.o as Record<string, unknown>;
    expect(order.i).toBe('9007199254740993');
    expect(order.t).toBe('9007199254740995');
    expect(order.aid).toBe('9007199254740997');
    expect(updateOrders([], { ...order, q: '1', z: '0', p: '1' })[0]?.orderId).toBe('9007199254740993');
  });
  it('fails closed on unsafe JavaScript numeric IDs that are already rounded', () => {
    expect(exactIntegerId(Number('9007199254740993'))).toBeUndefined();
    expect(exactIntegerId('9007199254740993')).toBe('9007199254740993');
    expect(exactIntegerId(-1)).toBeUndefined();
  });
  it('deduplicates distinct high-ID fills without collision', () => {
    const raw = parseBinanceAccountEvent('{"e":"ORDER_TRADE_UPDATE","o":{"s":"BTCUSDT","S":"BUY","x":"TRADE","i":9007199254740993,"t":9007199254740995,"l":"1","L":"2","T":1000}}');
    const first = accountTrade(raw.o as Record<string, unknown>, 'credential', () => '2026-10-14 00:00:00')!;
    expect(first.exchangeTradeId).toBe('9007199254740995');
    const next = { ...first, id: 'BTCUSDT:9007199254740997', exchangeTradeId: '9007199254740997' };
    expect(mergeTrades([first], [next])).toHaveLength(2);
  });
});

describe('terminal account data', () => {
  it('does not calculate a loss from a missing mark', () => {
    const result = positionMetrics({ ...position, markPrice: '0', unrealizedPnl: '0', margin: '' });
    expect(result.unrealizedPnl).toBe(0);
    expect(result.markPrice).toBeUndefined();
    expect(result.returnRate).toBeUndefined();
  });
  it('keeps server PnL until an actual mark arrives', () => {
    expect(positionMetrics({ ...position, unrealizedPnl: '0.9' }).unrealizedPnl).toBe(0.9);
    expect(positionMetrics(position, 2.02).unrealizedPnl).toBeCloseTo(2);
  });
  it('values a negative BOTH position as short', () => {
    const result = positionMetrics({ ...position, side: 'BOTH', quantity: '-100' }, 1.98);
    expect(result.unrealizedPnl).toBeCloseTo(2);
    expect(result.returnRate).toBeCloseTo((2 / 19.8) * 100);
  });
  it('preserves snapshot fields absent from ACCOUNT_UPDATE and ignores isolated wallet', () => {
    const result = mergeAccountPosition(position, {
      s: 'PUMPUSDT',
      ps: 'LONG',
      pa: '100',
      ep: '2',
      up: '0',
      iw: '999'
    });
    expect(result.markPrice).toBe('2.01');
    expect(result.margin).toBe('20.1');
    expect(result.leverage).toBe(10);
    expect(result.liquidationPrice).toBe('1');
    expect(result.unrealizedPnl).toBe('0');
  });
  it('leaves new position metadata unknown until snapshot hydration', () => {
    const result = mergeAccountPosition(undefined, {
      s: 'PUMPUSDT',
      ps: 'LONG',
      pa: '100',
      ep: '2',
      up: '0',
      iw: '999'
    });
    expect(result.margin).toBe('');
    expect(positionMetrics(result).returnRate).toBeUndefined();
  });
  it('uses last fill quantity and price and deduplicates replay', () => {
    const trade = accountTrade(fill, 'account', () => '2026-10-09 12:00:00')!;
    expect(trade.quantity).toBe('2');
    expect(trade.price).toBe('3');
    expect(mergeTrades([trade], [trade])).toHaveLength(1);
  });
  it('ignores non-trade order updates', () => {
    expect(accountTrade({ ...fill, x: 'NEW' }, 'account', String)).toBeUndefined();
  });
  it('keeps partial orders but removes filled and expired-in-match orders', () => {
    const rows = updateOrders([], { ...fill, q: '5', z: '2', p: '3' });
    expect(rows).toHaveLength(1);
    expect(updateOrders(rows, { ...fill, X: 'FILLED' })).toHaveLength(0);
    expect(updateOrders(rows, { ...fill, X: 'EXPIRED_IN_MATCH' })).toHaveLength(0);
  });
  it('clears initial margin when position size changes until hydration', () => {
    const result = mergeAccountPosition(position, { pa: '50', up: '0.5' });
    expect(result.margin).toBe('');
    expect(positionMetrics(result).returnRate).toBeUndefined();
  });
  it('does not restore a position closed while a snapshot was queried', () => {
    expect(mergePositionSnapshots([], [position], true)).toEqual([]);
  });
  it('preserves newer quantities and PnL while enriching metadata', () => {
    const current = { ...position, quantity: '50', unrealizedPnl: '0.5', margin: '', markPrice: '' };
    const result = mergePositionSnapshots([current], [position], true)[0]!;
    expect(result.quantity).toBe('50');
    expect(result.unrealizedPnl).toBe('0.5');
    expect(result.markPrice).toBe('2.01');
    expect(result.margin).toBe('');
  });
  it('accepts a full authoritative snapshot if no newer events arrived', () => {
    expect(mergePositionSnapshots([], [position], false)).toEqual([position]);
  });
});

const protection = {
  symbol: 'PUMPUSDT',
  algoId: '123',
  clientAlgoId: 'protect',
  status: 'NEW',
  side: 'SELL',
  positionSide: 'LONG',
  type: 'STOP_MARKET',
  quantity: '100',
  triggerPrice: '1.8',
  updateTime: '',
  reduceOnly: false,
  closePosition: false
};
describe('terminal protection and pagination', () => {
  it('matches active protection by symbol, position side and closing side', () => {
    const prices = protectionPrices(position, [
      protection,
      { ...protection, algoId: '124', type: 'TAKE_PROFIT_MARKET', triggerPrice: '2.2' },
      { ...protection, symbol: 'BTCUSDT', triggerPrice: '999' },
      { ...protection, side: 'BUY', triggerPrice: '99' }
    ]);
    expect(prices.stopLoss).toEqual(['1.8']);
    expect(prices.takeProfit).toEqual(['2.2']);
  });
  it('does not label an entry order as BOTH-position protection', () => {
    expect(protectionPrices({ ...position, side: 'BOTH' }, [{ ...protection, positionSide: 'BOTH' }]).stopLoss).toEqual(
      []
    );
    expect(
      protectionPrices({ ...position, side: 'BOTH' }, [{ ...protection, positionSide: 'BOTH', reduceOnly: true }])
        .stopLoss
    ).toEqual(['1.8']);
  });
  it('shows multiple protection levels and excludes finished orders', () => {
    expect(
      protectionPrices(position, [
        protection,
        { ...protection, algoId: '124', triggerPrice: '1.9' },
        { ...protection, status: 'FINISHED', triggerPrice: '9' }
      ]).stopLoss
    ).toEqual(['1.8', '1.9']);
  });
  it('consumes algo updates independently of normal order IDs', () => {
    const raw = {
      s: 'PUMPUSDT',
      aid: 123,
      caid: 'protect',
      X: 'NEW',
      S: 'SELL',
      ps: 'LONG',
      o: 'STOP_MARKET',
      q: '100',
      tp: '1.8',
      R: true,
      cp: false
    };
    const rows = updateProtectionOrders([], raw, 1000);
    expect(rows[0]?.triggerPrice).toBe('1.8');
    expect(updateProtectionOrders(rows, { ...raw, X: 'FINISHED' }, 1001)).toEqual([]);
    expect(updateProtectionOrders(rows, { ...raw, X: 'CANCELED' }, 1001)).toEqual([]);
  });
  it('limits live fills to the first page and leaves older pages unchanged', () => {
    const trade = accountTrade(fill, 'account', () => '2026-10-09 12:00:00')!;
    const older = { ...trade, exchangeTradeId: '1', tradeTime: '2026-10-08 12:00:00' };
    expect(liveTradePage([older], trade, 1, 1)).toEqual([trade]);
    expect(liveTradePage([older], trade, 2, 1)).toEqual([older]);
  });
});
