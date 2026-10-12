import type { OrderSnapshot, PositionSnapshot, ProtectionOrderSnapshot, TradeRecord } from '@/api/quant/types';

type RawFields = Record<string, unknown>;
function numeric(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}
export function positionMetrics(item: PositionSnapshot, liveMark?: number | string) {
  const freshMark = numeric(liveMark);
  const mark = freshMark && freshMark > 0 ? freshMark : numeric(item.markPrice);
  const validMark = mark && mark > 0 ? mark : undefined;
  const quantity = numeric(item.quantity);
  const entry = numeric(item.entryPrice);
  const calculated =
    validMark !== undefined && entry !== undefined && entry > 0 && quantity !== undefined
      ? (quantity < 0 || item.side === 'SHORT' ? entry - validMark : validMark - entry) * Math.abs(quantity)
      : undefined;
  const pnl = freshMark && freshMark > 0 ? calculated : (numeric(item.unrealizedPnl) ?? calculated);
  const notional = validMark !== undefined && quantity !== undefined ? Math.abs(quantity * validMark) : undefined;
  const margin =
    freshMark && freshMark > 0 && item.leverage && item.leverage > 0 && notional !== undefined
      ? notional / item.leverage
      : numeric(item.margin);
  return {
    ...item,
    markPrice: validMark,
    unrealizedPnl: pnl,
    notional,
    returnRate: margin !== undefined && margin > 0 && pnl !== undefined ? (pnl / margin) * 100 : undefined
  };
}

export function mergeAccountPosition(previous: PositionSnapshot | undefined, raw: RawFields): PositionSnapshot {
  const row: PositionSnapshot = previous
    ? { ...previous }
    : {
        symbol: String(raw.s),
        side: String(raw.ps || 'BOTH'),
        quantity: '',
        entryPrice: '',
        markPrice: '',
        unrealizedPnl: '',
        liquidationPrice: '',
        margin: ''
      };
  // ACCOUNT_UPDATE does not contain mark price, leverage or position initial margin. iw is isolated wallet.
  if (numeric(raw.pa) !== undefined) {
    row.quantity = String(raw.pa);
    if (previous && row.quantity !== previous.quantity) row.margin = '';
  }
  if (numeric(raw.ep) !== undefined) row.entryPrice = String(raw.ep);
  if (numeric(raw.up) !== undefined) row.unrealizedPnl = String(raw.up);
  return row;
}

export function updateOrders(rows: OrderSnapshot[], raw: RawFields): OrderSnapshot[] {
  const id = numeric(raw.i);
  if (!raw.s || id === undefined || !raw.X) return rows;
  const remaining = rows.filter(row => row.symbol !== raw.s || row.orderId !== id);
  if (['FILLED', 'CANCELED', 'EXPIRED', 'EXPIRED_IN_MATCH', 'REJECTED'].includes(String(raw.X))) return remaining;
  const previous = rows.find(row => row.symbol === raw.s && row.orderId === id);
  return [
    {
      ...previous,
      symbol: String(raw.s),
      orderId: id,
      clientOrderId: String(raw.c ?? previous?.clientOrderId ?? ''),
      side: String(raw.S ?? previous?.side ?? ''),
      type: String(raw.o ?? previous?.type ?? ''),
      status: String(raw.X),
      price: String(raw.p ?? previous?.price ?? ''),
      originalQuantity: String(raw.q ?? previous?.originalQuantity ?? ''),
      executedQuantity: String(raw.z ?? previous?.executedQuantity ?? ''),
      updateTime: numeric(raw.T) !== undefined ? new Date(Number(raw.T)).toISOString() : (previous?.updateTime ?? '')
    },
    ...remaining
  ];
}

export function accountTrade(
  raw: RawFields,
  credentialId: string | number,
  formatTime: (time: number) => string
): TradeRecord | undefined {
  const quantity = numeric(raw.l),
    price = numeric(raw.L),
    tradeId = numeric(raw.t),
    orderId = numeric(raw.i),
    time = numeric(raw.T);
  if (
    raw.x !== 'TRADE' ||
    !raw.s ||
    !raw.S ||
    quantity === undefined ||
    quantity <= 0 ||
    price === undefined ||
    price <= 0 ||
    tradeId === undefined ||
    tradeId < 0 ||
    orderId === undefined ||
    time === undefined
  )
    return undefined;
  return {
    id: `${raw.s}:${tradeId}`,
    credentialId,
    customerName: '',
    userId: '',
    symbol: String(raw.s),
    side: String(raw.S),
    quantity: String(raw.l),
    price: String(raw.L),
    commission: String(raw.n ?? '0'),
    realizedPnl: String(raw.rp ?? '0'),
    tradeTime: formatTime(time),
    exchangeTradeId: tradeId,
    exchangeOrderId: orderId
  };
}

export function mergeTrades(current: TradeRecord[], incoming: TradeRecord[]): TradeRecord[] {
  const rows = new Map<string, TradeRecord>();
  for (const row of [...current, ...incoming]) rows.set(`${row.symbol}:${row.exchangeTradeId}`, row);
  return [...rows.values()]
    .toSorted((a, b) => b.tradeTime.localeCompare(a.tradeTime) || b.exchangeTradeId - a.exchangeTradeId)
    .slice(0, 100);
}

// A snapshot queried before a newer account update may enrich metadata, but cannot revive a closed position.
export function mergePositionSnapshots(
  current: PositionSnapshot[],
  snapshot: PositionSnapshot[],
  changed: boolean
): PositionSnapshot[] {
  if (!changed) return snapshot;
  return current.map(row => {
    const match = snapshot.find(item => item.symbol === row.symbol && item.side === row.side);
    return match
      ? {
          ...match,
          ...row,
          markPrice: match.markPrice,
          margin: match.quantity === row.quantity ? match.margin : row.margin,
          leverage: match.leverage,
          liquidationPrice: match.liquidationPrice
        }
      : row;
  });
}

export function liveTradePage(rows: TradeRecord[], trade: TradeRecord, page: number, size: number): TradeRecord[] {
  return page === 1 ? mergeTrades(rows, [trade]).slice(0, size) : rows;
}

export function protectionPrices(position: PositionSnapshot, orders: ProtectionOrderSnapshot[]) {
  const closingSide = position.side === 'SHORT' || Number(position.quantity) < 0 ? 'BUY' : 'SELL';
  const matching = orders.filter(
    order =>
      order.symbol === position.symbol &&
      order.positionSide === position.side &&
      order.side === closingSide &&
      ['NEW', 'WORKING', 'ACCEPTED'].includes(order.status) &&
      (position.side !== 'BOTH' || order.reduceOnly === true || order.closePosition === true) &&
      Number(order.triggerPrice) > 0
  );
  const prices = (types: string[]) => [
    ...new Set(matching.filter(order => types.includes(order.type)).map(order => order.triggerPrice))
  ];
  return { takeProfit: prices(['TAKE_PROFIT', 'TAKE_PROFIT_MARKET']), stopLoss: prices(['STOP', 'STOP_MARKET']) };
}

export function updateProtectionOrders(
  rows: ProtectionOrderSnapshot[],
  raw: RawFields,
  time: number
): ProtectionOrderSnapshot[] {
  const id = numeric(raw.aid);
  if (!raw.s || id === undefined || !raw.X) return rows;
  const remaining = rows.filter(row => row.symbol !== raw.s || row.algoId !== id);
  if (['CANCELED', 'CANCELLED', 'EXPIRED', 'REJECTED', 'FINISHED', 'TRIGGERED'].includes(String(raw.X)))
    return remaining;
  const previous = rows.find(row => row.symbol === raw.s && row.algoId === id);
  return [
    {
      ...previous,
      symbol: String(raw.s),
      algoId: id,
      clientAlgoId: String(raw.caid ?? previous?.clientAlgoId ?? ''),
      status: String(raw.X),
      side: String(raw.S ?? previous?.side ?? ''),
      positionSide: String(raw.ps ?? previous?.positionSide ?? 'BOTH'),
      type: String(raw.o ?? previous?.type ?? ''),
      quantity: String(raw.q ?? previous?.quantity ?? ''),
      triggerPrice: String(raw.tp ?? previous?.triggerPrice ?? ''),
      updateTime: new Date(time).toISOString(),
      reduceOnly: typeof raw.R === 'boolean' ? raw.R : previous?.reduceOnly,
      closePosition: typeof raw.cp === 'boolean' ? raw.cp : previous?.closePosition
    },
    ...remaining
  ];
}
