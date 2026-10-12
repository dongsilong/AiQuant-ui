import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

export interface TradeDecisionLog {
  id: string;
  accountName?: string;
  strategyName?: string;
  strategyId?: string;
  strategyInstanceId?: string;
  credentialId?: string;
  symbol?: string;
  operation?: string;
  direction?: string;
  runMode?: string;
  status?: string;
  amount?: string;
  quantity?: string;
  price?: string;
  priceKind?: 'REFERENCE' | 'ACTUAL';
  margin?: string;
  reason?: string;
  reasonCode?: string;
  angle?: string;
  threshold?: string;
  klineTime?: string;
  eventTime?: string;
  tradeTime?: string;
  lastTime?: string;
  repeatCount?: number;
  orderId?: string;
  clientOrderId?: string;
  idempotencyKey?: string;
}

export interface TradeDecisionQuery extends PageQuery {
  credentialId?: string;
  strategyName?: string;
  strategyInstanceId?: string;
  symbol?: string;
  runMode?: string;
  operation?: string;
  status?: string;
  reason?: string;
  from?: string;
  to?: string;
}

export const listTradeDecisionLogs = (params: TradeDecisionQuery): AxiosPromise<PageResult<TradeDecisionLog>> =>
  request({ url: '/quant/trade-decision-log/list', method: 'get', params });
export const getTradeDecisionLog = (id: string): AxiosPromise<TradeDecisionLog> =>
  request({ url: `/quant/trade-decision-log/${id}`, method: 'get' });
