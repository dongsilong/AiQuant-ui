<template>
  <div class="p-2 app-container quant-terminal-page">
    <el-card shadow="never" class="terminal-card">
      <div class="terminal-overview">
        <div class="account-control">
          <span class="overview-label">交易账户</span>
          <el-select v-model="credentialId" placeholder="选择账户" @change="refresh" size="small">
            <el-option v-for="item in credentials" :key="item.id" :label="item.accountName" :value="item.id" />
          </el-select>
        </div>
        <el-button class="overview-refresh" link type="primary" :loading="loading" @click="refresh">刷新</el-button>
      </div>
      <div class="chart-layout">
        <el-card shadow="never" class="chart-main">
          <div class="chart-toolbar">
            <div class="toolbar-control symbol-control">
              <span class="toolbar-label">交 易 对</span>
              <el-select
                v-model="symbol"
                class="chart-symbol-select"
                filterable
                remote
                size="small"
                reserve-keyword
                placeholder="搜索交易对"
                :remote-method="searchSymbols"
                :loading="symbolLoading"
                @change="handleSymbolChange"
              >
                <el-option v-for="item in symbolOptions" :key="item.id" :label="item.symbol" :value="item.symbol">
                  <span class="symbol-option" :class="{ favorite: item.favorite }">
                    {{ item.favorite ? '★ ' : '' }}{{ item.symbol }}
                  </span>
                </el-option>
              </el-select>
            </div>
            <div class="toolbar-control period-control">
              <span class="toolbar-label">周期</span>
              <el-radio-group v-model="currentInterval" size="small" @change="loadKline">
                <el-radio-button
                  v-for="dict in quant_kline_period"
                  :key="dict.value"
                  :value="dict.value"
                  :label="dict.label"
                  class="control-group-item"
                />
              </el-radio-group>
            </div>
            <div class="toolbar-control indicator-control">
              <span class="toolbar-label">指标</span>
              <el-button
                v-for="tool in indicatorOptions"
                :key="tool.value"
                size="small"
                :type="indicators.includes(tool.value) ? 'primary' : ''"
                @click="toggleIndicator(tool.value)"
              >
                {{ tool.label }}
              </el-button>
            </div>
            <div class="chart-countdown">
              剩余
              <strong>{{ candleCountdown }}</strong>
            </div>
          </div>
          <div class="kline-chart-wrap">
            <div ref="chartRef" v-loading="loading" class="kline-chart" />
          </div>
        </el-card>
        <div class="chart-side">
          <el-card shadow="never" class="side-card account-card">
            <template #header><b>账户资金</b></template>
            <div v-if="account" class="fund">
              <strong>{{ format(account.marginBalance) }} USDT</strong>
              <span>账户权益</span>
              <dl>
                <dt>钱包余额</dt>
                <dd>{{ format(account.walletBalance) }}</dd>
                <dt>可用余额</dt>
                <dd>{{ format(account.availableBalance) }}</dd>
                <dt>未实现盈亏</dt>
                <dd>{{ format(account.unrealizedPnl) }}</dd>
              </dl>
            </div>
            <el-empty v-else description="暂无账户数据" />
          </el-card>
          <el-card shadow="never" class="side-card strategy-side-card">
            <template #header>
              <div class="section-head">
                <b>策略实例</b>
                <span>可直接启停</span>
              </div>
            </template>
            <el-select
              v-model="strategyId"
              class="strategy-select"
              clearable
              placeholder="筛选策略"
              @change="handleStrategyChange"
            >
              <el-option v-for="item in strategies" :key="item.id" :label="item.strategyName" :value="item.id" />
            </el-select>
            <div v-if="instances.length" class="strategy-grid">
              <div v-for="item in instances" :key="item.id" class="strategy">
                <div>
                  <b>{{ item.strategyName || '策略实例' }}</b>
                  <p>{{ item.accountName || '-' }} · {{ item.symbol || symbol }}</p>
                  <small>{{ item.status || 'UNKNOWN' }} · {{ item.lastSignalAt || '暂无信号' }}</small>
                </div>
                <el-button
                  size="small"
                  :type="item.status === 'RUNNING' || item.status === '1' ? 'danger' : 'primary'"
                  @click="toggleStrategy(item)"
                >
                  {{ item.status === 'RUNNING' || item.status === '1' ? '停止' : '启动' }}
                </el-button>
              </div>
            </div>
            <el-empty v-else description="暂无可运行策略" />
          </el-card>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-tabs v-model="activeTab" @tab-change="handleDataTab">
        <el-tab-pane label="当前持仓" name="positions">
          <el-table
            :data="positionRows"
            :empty-text="accountSnapshotAvailable ? '暂无持仓' : '账户数据暂不可用'"
            border
            @row-dblclick="selectRowSymbol"
          >
            <el-table-column prop="symbol" label="交易对" min-width="100" />
            <el-table-column label="方向" width="100" align="center">
              <template #default="scope">{{ directionLabel(scope.row) }}</template>
            </el-table-column>
            <el-table-column label="数量 / 名义价值" min-width="150">
              <template #default="scope">
                {{ format(scope.row.quantity) }} / {{ formatFixed(scope.row.notional, 2) }} U
              </template>
            </el-table-column>
            <el-table-column label="开仓均价" min-width="100">
              <template #default="scope">{{ format(scope.row.entryPrice) }}</template>
            </el-table-column>
            <el-table-column label="标记价" min-width="100">
              <template #default="scope">{{ format(scope.row.markPrice) }}</template>
            </el-table-column>
            <el-table-column label="未实现盈亏" min-width="100">
              <template #default="scope">{{ formatFixed(scope.row.unrealizedPnl, 3) }}</template>
            </el-table-column>
            <el-table-column label="回报率" min-width="100">
              <template #default="scope">
                {{ scope.row.returnRate === undefined ? '-' : `${formatFixed(scope.row.returnRate, 2)}%` }}
              </template>
            </el-table-column>
            <el-table-column label="强平价" min-width="100">
              <template #default="scope">{{ format(scope.row.liquidationPrice) }}</template>
            </el-table-column>
            <el-table-column label="交易所止盈 / 止损" min-width="220" show-overflow-tooltip>
              <template #default="scope">
                {{ protectionDisplay(scope.row, 'takeProfit') }} / {{ protectionDisplay(scope.row, 'stopLoss') }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" align="center">
              <template #default="scope">
                <el-button link type="danger" @click="close(scope.row)">平仓</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="当前委托" name="orders">
          <el-alert
            v-if="ordersError || protectionError"
            :title="[ordersError, protectionError].filter(Boolean).join('；')"
            type="error"
            :closable="false"
            show-icon
          />
          <el-table
            :data="orderRows"
            :empty-text="protectionLoading ? '条件单加载中' : ordersError || protectionError || '暂无普通或条件委托'"
            border
            @row-dblclick="selectRowSymbol"
          >
            <el-table-column prop="symbol" label="交易对" />
            <el-table-column prop="side" label="方向" />
            <el-table-column prop="type" label="类型" />
            <el-table-column prop="source" label="来源" />
            <el-table-column label="价格 / 触发价">
              <template #default="scope">{{ format(scope.row.price) }}</template>
            </el-table-column>
            <el-table-column label="数量">
              <template #default="scope">{{ format(scope.row.originalQuantity) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" />
            <el-table-column label="操作" width="110">
              <template #default="scope">
                <el-button v-if="scope.row.kind === 'normal'" link type="danger" @click="cancel(scope.row)">
                  撤单
                </el-button>
                <span v-else>条件单只读</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="成交记录" name="trades">
          <el-alert v-if="tradesError" :title="tradesError" type="error" :closable="false" show-icon />
          <el-button v-if="tradesError" link type="primary" @click="loadTrades">重试</el-button>
          <el-button v-if="tradePending" link type="primary" @click="loadTrades">有新成交，刷新列表</el-button>
          <el-table v-loading="tradeLoading" :data="trades" :empty-text="tradesError || '暂无成交'" border>
            <el-table-column prop="symbol" label="交易对" />
            <el-table-column prop="side" label="方向" />
            <el-table-column label="数量">
              <template #default="scope">{{ format(scope.row.quantity) }}</template>
            </el-table-column>
            <el-table-column label="价格">
              <template #default="scope">{{ format(scope.row.price) }}</template>
            </el-table-column>
            <el-table-column label="已实现盈亏">
              <template #default="scope">{{ format(scope.row.realizedPnl) }}</template>
            </el-table-column>
            <el-table-column prop="tradeTime" label="成交时间" />
          </el-table>
          <pagination
            v-show="tradeTotal > 0"
            v-model:page="tradeQuery.pageNum"
            v-model:limit="tradeQuery.pageSize"
            :total="tradeTotal"
            @pagination="loadTrades"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
    <el-button class="slope-floating-button" type="primary" circle @click="openSlopePanel" aria-label="打开实时斜率">
      斜率
    </el-button>
    <el-drawer v-model="slopePanelVisible" title="实时斜率" direction="rtl" size="620px" @closed="closeSlopePanel">
      <el-select
        v-model="slopeStrategyId"
        class="slope-strategy-select"
        placeholder="选择策略"
        @change="openSlopePanel"
      >
        <el-option v-for="item in strategies" :key="item.id" :label="item.strategyName" :value="item.id" />
      </el-select>
      <el-skeleton v-if="slopeLoading && !slopeRows.length" :rows="5" animated />
      <el-table
        v-else-if="slopeRows.length"
        :data="slopeRows"
        :row-class-name="slopeRowClassName"
        border
        stripe
        class="slope-table"
      >
        <el-table-column prop="symbol" label="交易对" width="120" />
        <el-table-column prop="interval" label="周期" width="72" />
        <el-table-column label="参考开盘价" min-width="110">
          <template #default="scope">{{ format(scope.row.referencePrice) }}</template>
        </el-table-column>
        <el-table-column label="当前价" min-width="110">
          <template #default="scope">{{ format(scope.row.currentPrice) }}</template>
        </el-table-column>
        <!--<el-table-column label="斜率" min-width="95"><template #default="scope">{{ scope.row.slopePercent === undefined ? '-' : `${scope.row.slopePercent.toFixed(5)}%` }}</template></el-table-column>-->
        <el-table-column label="角度" min-width="82">
          <template #default="scope">
            {{ scope.row.degrees === undefined ? '-' : `${scope.row.degrees.toFixed(2)}°` }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="82">
          <template #default="scope">
            {{ statusText(scope.row.status) }}
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="当前策略暂无交易对" />
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus';
import { type Chart, dispose, init, type KLineData } from 'klinecharts';
import type {
  AccountSnapshot,
  CancelOrderForm,
  ClosePositionForm,
  CredentialVO,
  KlineSnapshot,
  OrderSnapshot,
  PositionSnapshot,
  ProtectionOrderSnapshot,
  PriceSnapshot,
  SymbolVO,
  StrategyInstanceVO,
  StrategySymbolBinding,
  StrategyVO,
  TradeRecord
} from '@/api/quant/types';
import {
  listCredential,
  listStrategies,
  getAccountSnapshot,
  listPositions,
  listOrders,
  listProtectionOrders,
  listTrades,
  listRealtimeKlines,
  listSymbol,
  getSymbol,
  listStrategyInstances,
  listStrategySymbols,
  startStrategy,
  stopStrategy,
  cancelOrder,
  closePosition
} from '@/api/quant';
import { getToken, removeToken } from '@/utils/auth';
import { useDict } from '@/utils/dict';
import { parseTime } from '@/utils/ruoyi';
import {
  accountTrade,
  liveTradePage,
  protectionPrices,
  updateProtectionOrders,
  mergeAccountPosition,
  mergePositionSnapshots,
  mergeTrades,
  positionMetrics,
  updateOrders
} from './terminal-data';
const { quant_kline_period, quant_indicator } = toRefs<any>(useDict('quant_kline_period', 'quant_indicator'));
const symbol = ref('BTCUSDT'),
  interval = ref('15m'),
  strategyId = ref<string | number>(),
  credentialId = ref<string | number>(),
  indicators = ref<string[]>(['MA']),
  activeTab = ref('positions'),
  loading = ref(false),
  streamStatus = ref('CONNECTING'),
  accountSnapshotAvailable = ref(false),
  now = ref(Date.now());
const currentInterval = interval;
const credentials = ref<CredentialVO[]>([]),
  strategies = ref<StrategyVO[]>([]),
  account = ref<AccountSnapshot>(),
  positions = ref<PositionSnapshot[]>([]),
  orders = ref<OrderSnapshot[]>([]),
  trades = ref<TradeRecord[]>([]),
  instances = ref<StrategyInstanceVO[]>([]),
  klines = ref<KlineSnapshot[]>([]),
  price = ref<PriceSnapshot>(),
  symbolInfo = ref<SymbolVO>(),
  symbolOptions = ref<SymbolVO[]>([]),
  symbolLoading = ref(false);
const indicatorOptions = computed(() => quant_indicator.value || []);
type SlopeRow = {
  symbol: string;
  interval: string;
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  currentPrice?: number;
  referencePrice?: number;
  slopePercent?: number;
  degrees?: number;
  entryAngleDegrees?: number;
  klines: KlineSnapshot[];
};
const statusMap: Record<string, string> = {
  CONNECTING: '连接中',
  CONNECTED: '已连接',
  DISCONNECTED: '已断开',
  ERROR: '异常'
};
const statusText = (status: string) => statusMap[status] ?? '未知';
const slopePanelVisible = ref(false);
const slopeLoading = ref(false);
const slopeStrategyId = ref<string | number>();
const slopeRows = ref<SlopeRow[]>([]);
type SseConnection = { close: () => void };
let slopeStream: SseConnection | undefined;
let slopeStreamRetry: ReturnType<typeof setTimeout> | undefined;
const protectionOrders = ref<ProtectionOrderSnapshot[]>([]);
const protectionError = ref('');
const protectionLoaded = ref(false);
const protectionLoading = ref(false);
const tradeQuery = reactive<PageQuery>({ pageNum: 1, pageSize: 5 });
const tradeTotal = ref(0);
const tradeLoading = ref(false);
const tradePending = ref(false);
const liveTrades = ref<TradeRecord[]>([]);
let tradeRequest = 0;
let protectionRequest = 0;
let protectionRevision = 0;
const protectionChanges = new Map<string, { revision: number; row?: ProtectionOrderSnapshot }>();
const lastProtectionEvents = new Map<string, number>();
const orderRows = computed(() => [
  ...orders.value.map(row => ({ ...row, kind: 'normal', source: '普通订单' })),
  ...protectionOrders.value.map(row => ({
    symbol: row.symbol,
    side: row.side,
    type: row.type,
    status: row.status,
    orderId: row.algoId,
    clientOrderId: row.clientAlgoId,
    price: row.triggerPrice,
    originalQuantity: row.closePosition ? '全部持仓' : row.quantity,
    executedQuantity: row.executedQuantity || '0',
    updateTime: row.updateTime,
    kind: 'algo',
    source: '条件单'
  }))
]);
const protectionDisplay = (row: unknown, kind: 'takeProfit' | 'stopLoss') => {
  if (protectionError.value) return '查询失败';
  if (!protectionLoaded.value) return '加载中';
  const prices = protectionPrices(row as PositionSnapshot, protectionOrders.value);
  return prices[kind].map(format).join('、') || '未挂载';
};
const positionRows = computed(() =>
  positions.value.map(item =>
    positionMetrics(
      item,
      item.symbol === symbol.value && streamStatus.value === 'CONNECTED' ? price.value?.markPrice : undefined
    )
  )
);
const ordersError = ref('');
const tradesError = ref('');
let dataGeneration = 0;
let accountRevision = 0;
let hydrationTimer: ReturnType<typeof setTimeout> | undefined;
let hydrationRunning = false;
let hydrationPending = false;
const queryError = (error: any, fallback: string) =>
  typeof error === 'string' ? error : error?.msg || error?.message || fallback;

// Hydrate fields absent from ACCOUNT_UPDATE after a position changes; coalesce bursts without REST polling.
function scheduleAccountHydration() {
  hydrationPending = true;
  if (hydrationRunning || hydrationTimer) return;
  hydrationTimer = setTimeout(async () => {
    hydrationTimer = undefined;
    const id = credentialId.value;
    if (!id) return;
    const generation = dataGeneration;
    const revision = accountRevision;
    hydrationPending = false;
    hydrationRunning = true;
    try {
      const [a, p] = await Promise.allSettled([getAccountSnapshot(id), listPositions(id)]);
      if (generation !== dataGeneration) return;
      if (a.status === 'fulfilled' && revision === accountRevision) account.value = a.value.data;
      if (p.status === 'fulfilled') {
        positions.value = mergePositionSnapshots(positions.value, p.value.data || [], revision !== accountRevision);
        accountSnapshotAvailable.value = true;
        renderOverlays();
      }
    } finally {
      hydrationRunning = false;
      if (hydrationPending) scheduleAccountHydration();
    }
  }, 250);
}
async function loadTrades() {
  const id = credentialId.value;
  if (!id) return;
  const generation = dataGeneration;
  const requestId = ++tradeRequest;
  const query = { ...tradeQuery };
  tradeLoading.value = true;
  try {
    const result = await listTrades(id, undefined, query);
    if (generation !== dataGeneration || requestId !== tradeRequest) return;
    const rows = result.data?.rows || [];
    trades.value = query.pageNum === 1 ? mergeTrades(rows, liveTrades.value).slice(0, query.pageSize) : rows;
    tradeTotal.value = result.data?.total || 0;
    tradePending.value = false;
    tradesError.value = '';
  } catch (error) {
    if (generation === dataGeneration && requestId === tradeRequest) {
      trades.value = [];
      tradesError.value = queryError(error, '成交记录加载失败');
    }
  } finally {
    if (requestId === tradeRequest) tradeLoading.value = false;
  }
}
async function loadProtectionOrders() {
  const id = credentialId.value;
  if (!id) return;
  const generation = dataGeneration;
  const requestId = ++protectionRequest;
  const revision = protectionRevision;
  protectionLoading.value = true;
  try {
    const response = await listProtectionOrders(id);
    if (generation !== dataGeneration || requestId !== protectionRequest) return;
    const snapshot = new Map((response.data || []).map(row => [`${row.symbol}:${row.algoId}`, row]));
    // Replay only updates received during this query, including cancellation tombstones.
    for (const [key, change] of protectionChanges) {
      if (change.revision <= revision) continue;
      if (change.row) snapshot.set(key, change.row);
      else snapshot.delete(key);
    }
    protectionOrders.value = [...snapshot.values()];
    protectionError.value = '';
    protectionLoaded.value = true;
  } catch (error) {
    if (generation === dataGeneration && requestId === protectionRequest) {
      protectionError.value = queryError(error, '条件单查询失败');
      protectionLoaded.value = false;
      protectionOrders.value = [];
    }
  } finally {
    if (requestId === protectionRequest) protectionLoading.value = false;
  }
}
async function loadOpenOrders() {
  const id = credentialId.value;
  if (!id) return;
  const generation = dataGeneration;
  const revision = accountRevision;
  try {
    const result = await listOrders(id);
    if (generation !== dataGeneration) return;
    if (revision === accountRevision) orders.value = result.data || [];
    ordersError.value = '';
  } catch (error) {
    if (generation === dataGeneration) ordersError.value = queryError(error, '委托加载失败');
  }
}
function handleDataTab(tab: string | number) {
  if (tab === 'trades') void loadTrades();
  if (tab === 'orders') {
    void loadOpenOrders();
    void loadProtectionOrders();
  }
}
const directionLabel = (item: { side?: string; quantity?: string | number }) => {
  const short = item.side === 'SHORT' || (item.side === 'BOTH' && Number(item.quantity) < 0);
  return short ? '开空' : '开多';
};
const chartRef = ref<HTMLElement>(),
  chart = shallowRef<Chart>();
let stream: SseConnection | undefined,
  retry: ReturnType<typeof setTimeout> | undefined,
  accountStream: SseConnection | undefined,
  accountRetry: ReturnType<typeof setTimeout> | undefined,
  resize: ResizeObserver | undefined;
let updateChartBar: ((data: KLineData) => void) | undefined;
let overlayIds: string[] = [];
const lastAccountEvents = new Map<string, number>();
const lastOrderEvents = new Map<string, number>();
const statusType = computed(() =>
  streamStatus.value === 'CONNECTED' ? 'success' : streamStatus.value === 'ERROR' ? 'danger' : 'warning'
);
const streamStatusLabel = computed(
  () =>
    ({ CONNECTING: '连接中', CONNECTED: '已连接', ERROR: '连接异常', DISCONNECTED: '已断开' })[streamStatus.value] ||
    streamStatus.value
);
const indicatorNames = computed<Record<string, string>>(() =>
  Object.fromEntries(indicatorOptions.value.map((item: any) => [item.value, item.label]))
);
const priceChangeClass = computed(() => (price.value?.lastTradePrice ? 'price-positive' : 'price-muted'));
const priceChangeText = computed(() => (price.value?.lastTradePrice ? '实时' : '暂无行情'));
const candleCountdown = computed(() => {
  const match = /^(\d+)([smhdwM])$/.exec(interval.value);
  if (!match) return '--:--';
  const unitSeconds: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400, w: 604800, M: 2592000 };
  const total = Number(match[1]) * unitSeconds[match[2]];
  const remain = Math.max(0, total - (Math.floor(now.value / 1000) % total));
  return `${String(Math.floor(remain / 60)).padStart(2, '0')}:${String(remain % 60).padStart(2, '0')}`;
});
const format = (v: any) => {
  if (v === undefined || v === null || v === '') return '-';
  const text = String(v);
  const normal = /e/i.test(text)
    ? Number(v).toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 })
    : text;
  return normal.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
};
const formatFixed = (v: any, digits: number) => {
  if (v === undefined || v === null || v === '') return '-';
  const number = Number(v);
  return Number.isFinite(number) ? number.toFixed(digits) : format(v);
};
const idempotency = () => `terminal:${Date.now()}:${Math.random().toString(36).slice(2)}`;
const toChart = (rows: KlineSnapshot[]): KLineData[] =>
  rows.map(x => ({
    timestamp: new Date(x.openTime).getTime(),
    open: +x.open,
    high: +x.high,
    low: +x.low,
    close: +x.close,
    volume: +x.volume
  }));
const period = () => {
  const m = /^(\d+)([smhdwM])$/.exec(interval.value);
  const map: any = { s: 'second', m: 'minute', h: 'hour', d: 'day', w: 'week', M: 'month' };
  return { type: map[m?.[2]] || 'minute', span: +(m?.[1] || 15) };
};
function renderChart() {
  if (!chart.value) return;
  chart.value.resetData();
  chart.value.setDataLoader({
    getBars: ({ type, callback }) => callback(type === 'init' ? toChart(klines.value) : [], false),
    subscribeBar: ({ callback }) => {
      updateChartBar = callback;
    },
    unsubscribeBar: () => {
      updateChartBar = undefined;
    }
  });
  chart.value.setSymbol({
    ticker: symbol.value,
    pricePrecision: symbolInfo.value?.pricePrecision ?? 8,
    volumePrecision: symbolInfo.value?.quantityPrecision ?? 8
  });
  chart.value.setPeriod(period());
  chart.value.setMaxOffsetLeftDistance(0);
  chart.value.setMaxOffsetRightDistance(0);
  chart.value.setLeftMinVisibleBarCount(30);
  chart.value.setLocale('zh-CN');
  renderIndicators();
}
function renderOverlays() {
  if (!chart.value) return;
  for (const id of overlayIds) chart.value.removeOverlay({ id });
  overlayIds = [];
  const currentPositions = positionRows.value.filter(item => item.symbol === symbol.value);
  const currentOrders = orders.value.filter(item => item.symbol === symbol.value && Number(item.price) > 0);
  const lines = [
    ...currentPositions.flatMap(item => [
      { value: Number(item.entryPrice), color: '#409eff' },
      { value: Number(item.liquidationPrice), color: '#f56c6c' },
      { value: Number(item.takeProfitPrice), color: '#67c23a' },
      { value: Number(item.stopLossPrice), color: '#e6a23c' }
    ]),
    ...currentOrders.map(item => ({ value: Number(item.price), color: '#909399' }))
  ].filter(item => Number.isFinite(item.value) && item.value > 0);
  for (const line of lines) {
    const id = chart.value.createOverlay({
      name: 'priceLine',
      points: [{ value: line.value }],
      styles: { line: { color: line.color } }
    });
    if (typeof id === 'string') overlayIds.push(id);
  }
}
function renderIndicators() {
  if (!chart.value) return;
  chart.value.removeIndicator();
  for (const name of indicators.value) {
    const mainIndicator = ['MA', 'EMA', 'BOLL'].includes(name);
    chart.value.createIndicator(
      {
        name,
        ...(mainIndicator ? { paneId: 'candle_pane' } : {}),
        shortName: indicatorNames.value[name] || name
      },
      mainIndicator
    );
  }
}
function toggleIndicator(value: string) {
  indicators.value = indicators.value.includes(value)
    ? indicators.value.filter(item => item !== value)
    : [...indicators.value, value];
  renderIndicators();
}
async function loadKline(value: string) {
  interval.value = value;
  await refresh();
}
async function searchSymbols(keyword: string) {
  symbolLoading.value = true;
  try {
    const response = await listSymbol({
      pageNum: 1,
      pageSize: 50,
      quoteAsset: 'USDT',
      ...(keyword ? { symbol: keyword } : { favorite: true })
    });
    const merged = new Map(symbolOptions.value.map(item => [String(item.id), item]));
    for (const item of response.data?.rows || []) merged.set(String(item.id), item);
    symbolOptions.value = [...merged.values()];
  } finally {
    symbolLoading.value = false;
  }
}
async function handleSymbolChange() {
  await refresh();
}
function applyEvent(e: any) {
  if (e.type === 'CONNECTING') streamStatus.value = 'CONNECTING';
  else if (e.type === 'CONNECTED') streamStatus.value = 'CONNECTED';
  else if (e.type === 'ERROR') {
    streamStatus.value = 'ERROR';
    ElMessage.error(e.message || '行情订阅失败');
  } else if (e.type === 'DISCONNECTED') {
    streamStatus.value = 'DISCONNECTED';
    price.value = undefined;
  } else if (e.type === 'TRADE' && e.price)
    price.value = { ...(price.value as PriceSnapshot), lastTradePrice: e.price, observedAt: e.eventTime };
  else if (e.type === 'MARK' && e.price) {
    price.value = { ...(price.value as PriceSnapshot), markPrice: e.price, observedAt: e.eventTime };
    renderOverlays();
  } else if (e.type === 'KLINE' && e.kline) {
    const i = klines.value.findIndex(x => x.openTime === e.kline.openTime);
    if (i < 0) klines.value = [...klines.value, e.kline].slice(-1000);
    else klines.value[i] = e.kline;
    const updatedBar = toChart([e.kline])[0];
    if (updatedBar) updateChartBar?.(updatedBar);
  }
}

function openSse(
  url: string,
  eventName: string,
  onMessage: (data: string) => void,
  onError: (error: unknown) => void,
  onUnauthorized: () => void
): SseConnection {
  const controller = new AbortController();
  void (async () => {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getToken() || ''}`,
          clientid: import.meta.env.VITE_APP_CLIENT_ID
        },
        signal: controller.signal
      });
      if (response.status === 401 || response.status === 403) {
        onUnauthorized();
        return;
      }
      if (!response.ok || !response.body) throw new Error(`SSE 请求失败: ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let event = '';
      let data = '';
      const dispatch = () => {
        if (event === eventName && data) onMessage(data);
        event = '';
        data = '';
      };
      while (!controller.signal.aborted) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line) {
            dispatch();
          } else if (line.startsWith('event:')) {
            event = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            data += `${line.slice(5).trim()}\n`;
          }
        }
      }
      if (!controller.signal.aborted) onError(new Error('SSE 连接已关闭'));
    } catch (error) {
      if (!controller.signal.aborted) onError(error);
    }
  })();
  return { close: () => controller.abort() };
}

function handleSseUnauthorized() {
  streamStatus.value = 'ERROR';
  accountSnapshotAvailable.value = false;
  removeToken();
  if (retry) clearTimeout(retry);
  if (accountRetry) clearTimeout(accountRetry);
  if (slopeStreamRetry) clearTimeout(slopeStreamRetry);
  ElMessage.error('登录状态已失效，请重新登录');
}

function connect() {
  stream?.close();
  if (retry) clearTimeout(retry);
  streamStatus.value = 'CONNECTING';
  const q = new URLSearchParams({
    symbol: symbol.value,
    interval: interval.value
  });
  stream = openSse(
    `${import.meta.env.VITE_APP_BASE_API}/quant/market/stream?${q}`,
    'quant.market',
    data => {
      try {
        applyEvent(JSON.parse(data));
      } catch {
        streamStatus.value = 'ERROR';
      }
    },
    () => {
      streamStatus.value = 'DISCONNECTED';
      stream?.close();
      retry = setTimeout(connect, 3000);
    },
    handleSseUnauthorized
  );
}
function applyRawAccountEvent(rawJson: string | undefined) {
  if (!rawJson) return;
  try {
    const raw = JSON.parse(rawJson);
    if (raw.e === 'ACCOUNT_UPDATE' && raw.a) {
      accountRevision++;
      const usdt = (raw.a.B || []).find((item: any) => item.a === 'USDT');
      // cw is cross wallet balance, not available balance.
      if (usdt && account.value && usdt.wb !== undefined) account.value.walletBalance = String(usdt.wb);
      let positionChanged = false;
      for (const item of Array.isArray(raw.a.P) ? raw.a.P : []) {
        if (!item.s || item.pa === undefined || !Number.isFinite(Number(item.pa))) continue;
        const index = positions.value.findIndex(p => p.symbol === item.s && (p.side || 'BOTH') === (item.ps || 'BOTH'));
        const previous = positions.value[index];
        const row = mergeAccountPosition(previous, item);
        positionChanged ||= !previous || row.quantity !== previous.quantity || row.entryPrice !== previous.entryPrice;
        if (Number(row.quantity) === 0) {
          if (index >= 0) positions.value.splice(index, 1);
        } else if (index >= 0) positions.value[index] = row;
        else positions.value.push(row);
      }
      if (positionChanged || usdt) scheduleAccountHydration();
    }
    if (raw.e === 'ORDER_TRADE_UPDATE' && raw.o) {
      accountRevision++;
      const key = `${raw.o.s}:${raw.o.i}`;
      const time = Number(raw.o.T ?? raw.E);
      if (!Number.isFinite(time) || time >= (lastOrderEvents.get(key) || 0)) {
        orders.value = updateOrders(orders.value, raw.o);
        ordersError.value = '';
        if (Number.isFinite(time)) lastOrderEvents.set(key, time);
      }
      if (credentialId.value) {
        const trade = accountTrade(raw.o, credentialId.value, time => parseTime(time) || '');
        if (trade) {
          const isNew =
            !liveTrades.value.some(
              row => row.symbol === trade.symbol && row.exchangeTradeId === trade.exchangeTradeId
            ) &&
            !trades.value.some(row => row.symbol === trade.symbol && row.exchangeTradeId === trade.exchangeTradeId);
          liveTrades.value = mergeTrades(liveTrades.value, [trade]);
          trades.value = liveTradePage(trades.value, trade, tradeQuery.pageNum, tradeQuery.pageSize);
          if (isNew) tradePending.value = true;
        }
      }
    }
    if (raw.e === 'ALGO_UPDATE' && raw.o) {
      const key = `${raw.o.s}:${raw.o.aid}`;
      const time = Number(raw.T ?? raw.E);
      if (!Number.isFinite(time) || time < (lastProtectionEvents.get(key) || 0)) return;
      lastProtectionEvents.set(key, time);
      protectionRevision++;
      protectionOrders.value = updateProtectionOrders(protectionOrders.value, raw.o, time);
      const row = protectionOrders.value.find(item => `${item.symbol}:${item.algoId}` === key);
      protectionChanges.set(key, { revision: protectionRevision, row });
    }
  } catch {
    // 保留 SSE 连接，等待下一条有效事件或 REST 恢复快照。
  }
}

function connectAccountStream() {
  accountStream?.close();
  if (accountRetry) clearTimeout(accountRetry);
  if (!credentialId.value) return;
  lastAccountEvents.clear();
  const generation = dataGeneration;
  const snapshotRevision = accountRevision;
  const q = new URLSearchParams({
    credentialId: String(credentialId.value)
  });
  accountStream = openSse(
    `${import.meta.env.VITE_APP_BASE_API}/quant/account/stream?${q}`,
    'quant.account',
    data => {
      try {
        const event = JSON.parse(data);
        if (generation !== dataGeneration) return;
        if (
          event.type === 'ACCOUNT_UPDATE' ||
          event.type === 'ORDER_TRADE_UPDATE' ||
          event.type === 'ALGO_UPDATE' ||
          event.type === 'CONNECTED' ||
          event.type === 'SNAPSHOT' ||
          event.type === 'DISCONNECTED'
        ) {
          if (String(event.credentialId) !== String(credentialId.value)) return;
          const eventAt = Date.parse(event.eventTime || '');
          if (event.type !== 'SNAPSHOT' && event.type !== 'ORDER_TRADE_UPDATE' && event.type !== 'ALGO_UPDATE') {
            if (Number.isFinite(eventAt) && eventAt < (lastAccountEvents.get(event.type) || 0)) return;
            if (Number.isFinite(eventAt)) lastAccountEvents.set(event.type, eventAt);
          }
          if (event.type === 'SNAPSHOT') void loadProtectionOrders();
          if (event.snapshotAvailable) {
            accountSnapshotAvailable.value = true;
            const changed = snapshotRevision !== accountRevision;
            if (event.account && !changed) account.value = event.account;
            if (Array.isArray(event.positions))
              positions.value = mergePositionSnapshots(positions.value, event.positions, changed);
            if (Array.isArray(event.orders) && !changed) {
              orders.value = event.orders;
              ordersError.value = '';
            }
            if (changed && event.type === 'SNAPSHOT') scheduleAccountHydration();
            applyRawAccountEvent(event.rawJson);
          } else {
            accountSnapshotAvailable.value = false;
            account.value = undefined;
            positions.value = [];
            orders.value = [];
            ordersError.value = '账户数据暂不可用';
            protectionOrders.value = [];
            protectionLoaded.value = false;
            protectionError.value = '账户连接已断开';
            if (event.type !== 'DISCONNECTED') {
              if (accountRetry) clearTimeout(accountRetry);
              accountRetry = setTimeout(connectAccountStream, 10000);
            }
          }
          renderOverlays();
        }
      } catch {
        // 忽略无效的账户事件，连接仍保持。
      }
    },
    () => {
      if (generation !== dataGeneration) return;
      ordersError.value = '账户连接已断开';
      protectionOrders.value = [];
      protectionLoaded.value = false;
      protectionError.value = '账户连接已断开';
      accountSnapshotAvailable.value = false;
      account.value = undefined;
      positions.value = [];
      orders.value = [];
      renderOverlays();
      accountStream?.close();
      accountRetry = setTimeout(connectAccountStream, 3000);
    },
    handleSseUnauthorized
  );
}

function closeSlopeStream() {
  slopeStream?.close();
  slopeStream = undefined;
  if (slopeStreamRetry) clearTimeout(slopeStreamRetry);
  slopeStreamRetry = undefined;
}

function connectSlopeStream() {
  closeSlopeStream();
  if (!slopeStrategyId.value || !credentialId.value) return;
  const query = new URLSearchParams({
    strategyId: String(slopeStrategyId.value),
    credentialId: String(credentialId.value)
  });
  const source = openSse(
    `${import.meta.env.VITE_APP_BASE_API}/quant/strategy/slope/stream?${query}`,
    'quant.strategy.slope',
    data => {
      try {
        const payload = JSON.parse(data);
        if (payload.type === 'CONNECTED') {
          slopeRows.value.forEach(row => (row.status = 'CONNECTED'));
          return;
        }
        const row = slopeRows.value.find(item => item.symbol === payload.symbol);
        if (!row) return;
        row.status = 'CONNECTED';
        row.currentPrice = Number(payload.currentPrice);
        row.referencePrice = Number(payload.referenceOpenPrice);
        row.slopePercent = Number(payload.slopePercent);
        row.degrees = Number(payload.degrees);
      } catch {
        slopeRows.value.forEach(row => (row.status = 'ERROR'));
      }
    },
    () => {
      slopeRows.value.forEach(row => (row.status = 'DISCONNECTED'));
      source.close();
      if (slopePanelVisible.value) {
        slopeStreamRetry = setTimeout(connectSlopeStream, 3000);
      }
    },
    handleSseUnauthorized
  );
  slopeStream = source;
}

function slopeEntryAngle(binding: StrategySymbolBinding): number | undefined {
  try {
    const strategy = strategies.value.find(item => String(item.id) === String(slopeStrategyId.value));
    const params = { ...JSON.parse(strategy?.paramsJson || '{}'), ...JSON.parse(binding.paramsJson || '{}') };
    const raw = params.entryAngleDegrees;
    const threshold = raw === undefined ? 60 : Number(raw);
    return raw !== null && raw !== '' && Number.isFinite(threshold) && threshold > 0 && threshold < 90
      ? threshold
      : undefined;
  } catch {
    return undefined;
  }
}

function slopeRowClassName({ row }: { row: SlopeRow }): string {
  if (row.status !== 'CONNECTED' || !Number.isFinite(row.degrees) || row.entryAngleDegrees === undefined) return '';
  const degrees = Math.abs(row.degrees!);
  if (degrees > row.entryAngleDegrees) return 'slope-row-danger';
  return degrees >= Math.max(0, row.entryAngleDegrees - 10) ? 'slope-row-warning' : '';
}

async function openSlopePanel() {
  if (slopeLoading.value) return;
  slopePanelVisible.value = true;
  slopeStrategyId.value = strategyId.value || strategies.value[0]?.id;
  closeSlopeStream();
  slopeRows.value = [];
  if (!slopeStrategyId.value) return;
  slopeLoading.value = true;
  try {
    const bindings = (await listStrategySymbols(slopeStrategyId.value)).data || [];
    const activeBindings = bindings.filter((item: StrategySymbolBinding) => item.status !== '1');
    const resolved = await Promise.all(
      activeBindings.map(async binding => {
        const item = await getSymbol(binding.symbolId);
        return { binding, symbol: item.data?.symbol };
      })
    );
    const rows = resolved
      .filter(item => item.symbol)
      .map(item => ({
        symbol: item.symbol!,
        interval: item.binding.intervalCode || interval.value,
        entryAngleDegrees: slopeEntryAngle(item.binding),
        status: 'CONNECTING' as const,
        klines: [] as KlineSnapshot[]
      }));
    slopeRows.value = rows;
    connectSlopeStream();
  } finally {
    slopeLoading.value = false;
  }
}

function closeSlopePanel() {
  slopePanelVisible.value = false;
  slopeLoading.value = false;
  closeSlopeStream();
}

async function handleStrategyChange() {
  const selected = strategies.value.find(item => String(item.id) === String(strategyId.value));
  if (selected) {
    const configured = instances.value.filter(item => String(item.strategyId) === String(selected.id));
    if (configured[0]?.symbol) symbol.value = configured[0].symbol;
    if (configured[0]?.credentialId) credentialId.value = configured[0].credentialId;
  }
  await refresh();
}
async function loadData() {
  const generation = ++dataGeneration;
  ++tradeRequest;
  ++protectionRequest;
  tradeQuery.pageNum = 1;
  tradeTotal.value = 0;
  tradePending.value = false;
  liveTrades.value = [];
  tradeLoading.value = false;
  protectionOrders.value = [];
  protectionLoaded.value = false;
  protectionLoading.value = false;
  protectionError.value = '';
  protectionRevision = 0;
  protectionChanges.clear();
  lastProtectionEvents.clear();
  accountStream?.close();
  stream?.close();
  if (accountRetry) clearTimeout(accountRetry);
  if (retry) clearTimeout(retry);
  if (hydrationTimer) clearTimeout(hydrationTimer);
  hydrationTimer = undefined;
  hydrationPending = false;
  accountRevision = 0;
  lastOrderEvents.clear();
  ordersError.value = '';
  tradesError.value = '';
  const id = credentialId.value;
  // 切换交易对时先清理旧快照，避免新请求失败时继续显示上一个交易对的数据。
  klines.value = [];
  symbolInfo.value = undefined;
  price.value = undefined;
  positions.value = [];
  accountSnapshotAvailable.value = false;
  orders.value = [];
  trades.value = [];
  renderOverlays();
  const [k, s, p, i] = await Promise.allSettled([
    listRealtimeKlines(symbol.value, interval.value, 1000),
    listSymbol({ pageNum: 1, pageSize: 1, symbol: symbol.value }),
    id ? listPositions(id) : Promise.resolve({ data: [] as PositionSnapshot[] }),
    id
      ? listStrategyInstances({ pageNum: 1, pageSize: 100, credentialId: id })
      : Promise.resolve({ data: { rows: [] as StrategyInstanceVO[] } } as any)
  ]);
  if (generation !== dataGeneration) return;
  if (k.status === 'fulfilled') {
    klines.value = k.value.data || [];
  } else {
    ElMessage.error(`${symbol.value} K线加载失败，已清理旧图表数据`);
  }
  symbolInfo.value = s.status === 'fulfilled' ? s.value.data?.rows?.[0] : undefined;
  if (symbolInfo.value && !symbolOptions.value.some(item => String(item.id) === String(symbolInfo.value?.id))) {
    symbolOptions.value = [symbolInfo.value, ...symbolOptions.value];
  }
  positions.value = p.status === 'fulfilled' ? p.value.data || [] : [];
  accountSnapshotAvailable.value = p.status === 'fulfilled';
  instances.value = (i.status === 'fulfilled' ? i.value.data?.rows || [] : []).filter(
    item => !strategyId.value || String(item.strategyId) === String(strategyId.value)
  );
  if (id) {
    const [a, o, t] = await Promise.allSettled([
      getAccountSnapshot(id),
      listOrders(id),
      listTrades(id, undefined, { ...tradeQuery })
    ]);
    if (generation !== dataGeneration) return;
    ordersError.value = o.status === 'rejected' ? queryError(o.reason, '委托加载失败') : '';
    tradesError.value = t.status === 'rejected' ? queryError(t.reason, '成交记录加载失败') : '';
    account.value = a.status === 'fulfilled' ? a.value.data : undefined;
    orders.value = o.status === 'fulfilled' ? o.value.data || [] : [];
    trades.value = t.status === 'fulfilled' ? t.value.data?.rows || [] : [];
    tradeTotal.value = t.status === 'fulfilled' ? t.value.data?.total || 0 : 0;
  }
  renderChart();
  renderOverlays();
  connect();
  connectAccountStream();
}
async function refresh() {
  loading.value = true;
  try {
    if (!credentialId.value && credentials.value.length) credentialId.value = credentials.value[0].id;
    await loadData();
  } catch (e: any) {
    streamStatus.value = 'ERROR';
    ElMessage.error(e?.message || '行情或账户数据加载失败');
  } finally {
    loading.value = false;
  }
}
async function confirmAction(title: string, message: string, action: () => Promise<any>) {
  await ElMessageBox.confirm(message, title, {
    type: 'warning',
    confirmButtonText: '确认执行',
    cancelButtonText: '取消'
  });
  await action();
  ElMessage.success('操作已提交');
  await refresh();
}
function toggleStrategy(item: StrategyInstanceVO) {
  if (item.id === undefined) return;
  confirmAction(
    item.status === 'RUNNING' || item.status === '1' ? '停止策略' : '启动策略',
    `${item.accountName || '-'} · ${item.symbol || symbol.value} · ${item.strategyName || '策略实例'}`,
    () =>
      item.status === 'RUNNING' || item.status === '1'
        ? stopStrategy(item.strategyId || item.id)
        : startStrategy(item.strategyId || item.id)
  );
}
async function selectRowSymbol(row: { symbol?: string }) {
  if (!row?.symbol || row.symbol === symbol.value) return;
  const nextSymbol = row.symbol;
  const generation = dataGeneration;
  const [k, s] = await Promise.allSettled([
    listRealtimeKlines(nextSymbol, interval.value, 1000),
    listSymbol({ pageNum: 1, pageSize: 1, symbol: nextSymbol })
  ]);
  if (generation !== dataGeneration) return;
  if (k.status !== 'fulfilled') {
    ElMessage.error(`${nextSymbol} K线加载失败，交易对未切换`);
    return;
  }
  symbol.value = nextSymbol;
  klines.value = k.value.data || [];
  symbolInfo.value = s.status === 'fulfilled' ? s.value.data?.rows?.[0] : undefined;
  if (symbolInfo.value && !symbolOptions.value.some(item => String(item.id) === String(symbolInfo.value?.id))) {
    symbolOptions.value = [symbolInfo.value, ...symbolOptions.value];
  }
  price.value = undefined;
  renderChart();
  renderOverlays();
  connect();
}
function cancel(row: unknown) {
  const order = row as OrderSnapshot;
  if (!credentialId.value) return;
  const data: CancelOrderForm = {
    credentialId: credentialId.value,
    symbol: order.symbol,
    orderId: order.orderId,
    clientOrderId: order.clientOrderId,
    idempotencyKey: idempotency()
  };
  confirmAction('确认撤单', `${order.symbol} ${order.side} ${order.originalQuantity} @ ${order.price}`, () =>
    cancelOrder(data)
  );
}
function close(row: unknown) {
  const position = row as PositionSnapshot;
  if (!credentialId.value) return;
  const quantity = Math.abs(Number(position.quantity));
  if (!Number.isFinite(quantity) || quantity <= 0) return;
  const closeSide =
    position.side === 'SHORT' || (position.side === 'BOTH' && Number(position.quantity) < 0) ? 'BUY' : 'SELL';
  const data: ClosePositionForm = {
    credentialId: credentialId.value,
    symbol: position.symbol,
    side: closeSide,
    positionSide: position.side,
    quantity,
    idempotencyKey: idempotency()
  };
  confirmAction('确认平仓', `${position.symbol} ${directionLabel(position)} ${quantity}`, async () => {
    await closePosition(data);
    await waitForPositionClosed(position.symbol);
  });
}

async function waitForPositionClosed(positionSymbol: string) {
  if (!credentialId.value) return;
  const maxAttempts = 12;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const response = await listPositions(credentialId.value, positionSymbol);
      const remaining = (response.data || []).some(
        item => item.symbol === positionSymbol && Math.abs(Number(item.quantity)) > 0
      );
      if (!remaining) return;
    } catch {
      // 保留当前持仓显示，等待 SSE 或后续刷新确认，避免网络短暂失败导致误清空。
    }
  }
}
let clock: ReturnType<typeof setInterval> | undefined;
onMounted(async () => {
  clock = setInterval(() => (now.value = Date.now()), 1000);
  if (chartRef.value) {
    chart.value = init(chartRef.value);
    resize = new ResizeObserver(() => chart.value?.resize());
    resize.observe(chartRef.value);
  }
  const [c, s] = await Promise.all([
    listCredential({ pageNum: 1, pageSize: 100 }),
    listStrategies({ pageNum: 1, pageSize: 100 })
  ]);
  credentials.value = c.data?.rows || [];
  strategies.value = s.data?.rows || [];
  await searchSymbols('');
  await refresh();
});
onBeforeUnmount(() => {
  dataGeneration++;
  hydrationPending = false;
  if (hydrationTimer) clearTimeout(hydrationTimer);
  stream?.close();
  accountStream?.close();
  closeSlopeStream();
  updateChartBar = undefined;
  if (retry) clearTimeout(retry);
  if (accountRetry) clearTimeout(accountRetry);
  resize?.disconnect();
  if (clock) clearInterval(clock);
  if (chart.value) {
    chart.value.removeOverlay();
    dispose(chart.value);
  }
});
</script>
<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;
@include pageShell.table-crud-page;
.terminal-card,
.table-card {
  margin-bottom: 12px;
}
.section-head,
.terminal-overview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.terminal-overview {
  gap: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.account-control,
.market-overview,
.market-identity,
.market-price {
  display: flex;
  align-items: center;
}
.account-control {
  flex: 0 0 auto;
  //gap: 10px;
}
.account-control .el-select {
  width: 160px;
}
.overview-label,
.section-head span,
.toolbar-label {
  margin-left: 10px;
  color: var(--el-text-color-secondary);
}
.overview-label {
  font-size: 14px;
}
.el-button {
  margin-left: 0;
}
.market-overview {
  flex: 1;
  justify-content: space-between;
  min-width: 0;
  gap: 16px;
}
.market-identity {
  gap: 10px;
  min-width: 0;
}
.market-identity b {
  font-size: 20px;
}
.market-identity span,
.market-price span {
  color: var(--el-text-color-secondary);
}
.market-price {
  gap: 8px;
}
.market-price strong {
  font-size: 18px;
}
.price-positive {
  color: var(--el-color-success);
}
.price-muted {
  color: var(--el-text-color-secondary);
}
.chart-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 0 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.toolbar-control {
  display: flex;
  align-items: center;
  gap: 6px;
}
.toolbar-label {
  margin-right: 2px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
.chart-symbol-select {
  width: 160px;
}
.toolbar-divider {
  width: 1px;
  height: 18px;
  margin: 0 5px;
  background: var(--el-border-color-lighter);
}
.chart-countdown {
  margin-left: auto;
  color: var(--el-color-danger);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.chart-countdown strong {
  color: var(--el-color-danger);
}
.slope-floating-button {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1000;
  width: 52px;
  height: 52px;
  box-shadow: var(--el-box-shadow-light);
}
.slope-strategy-select {
  width: 100%;
  margin-bottom: 12px;
}
.slope-table {
  width: 100%;
  :deep(.slope-row-danger) {
    --el-table-tr-bg-color: var(--el-color-danger-light-9);
    --el-table-row-hover-bg-color: var(--el-color-danger-light-8);
    color: var(--el-color-danger);
  }
  :deep(.slope-row-warning) {
    --el-table-tr-bg-color: var(--el-color-warning-light-9);
    --el-table-row-hover-bg-color: var(--el-color-warning-light-8);
    color: var(--el-color-warning);
  }
  :deep(.slope-row-danger.el-table__row--striped td.el-table__cell),
  :deep(.slope-row-warning.el-table__row--striped td.el-table__cell) {
    background: var(--el-table-tr-bg-color);
  }
}
.strategy-select {
  width: 100%;
  margin-bottom: 12px;
}
.symbol-option.favorite {
  color: var(--el-color-warning);
  font-weight: 600;
}
.period-button {
  min-width: 38px;
}
.chart-head b {
  font-size: 16px;
}
.kline-chart {
  height: 560px;
}
.source-bar {
  padding: 10px 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.chart-layout {
  margin-top: 10px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 12px;
  align-items: stretch;
}
.chart-main {
  min-width: 0;
}
.chart-main :deep(.el-card__body) {
  padding: 12px;
}
.chart-side {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
}
.side-card {
  margin: 0;
}
.account-card {
  overflow: hidden;
  height: 250px;
}
.strategy-side-card {
  //flex: 1;
  min-height: 0;
  overflow: hidden;
  height: 400px;
}
.strategy-side-card :deep(.el-card__body) {
  min-height: 0;
  overflow-y: auto;
}
.fund > strong {
  display: block;
  font-size: 24px;
  margin-bottom: 4px;
}
.fund > span {
  color: var(--el-text-color-secondary);
}
.fund dl {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 18px 0 0;
}
.fund dt {
  color: var(--el-text-color-secondary);
}
.fund dd {
  text-align: right;
  margin: 0;
}
.strategy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 10px;
}
.strategy {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.strategy p,
.strategy small {
  display: block;
  margin: 4px 0;
  color: var(--el-text-color-secondary);
}
@media (max-width: 1100px) {
  .chart-layout {
    grid-template-columns: minmax(0, 1fr) 280px;
  }
}
@media (max-width: 768px) {
  .terminal-overview {
    align-items: flex-start;
    flex-direction: column;
  }
  .market-overview {
    width: 100%;
  }
  .chart-layout {
    grid-template-columns: 1fr;
  }
  .chart-side {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .kline-chart {
    height: 420px;
  }
}
@media (max-width: 560px) {
  .market-overview,
  .market-identity,
  .market-price {
    align-items: flex-start;
    flex-direction: column;
  }
  .symbol-control,
  .period-control,
  .indicator-control {
    width: 100%;
  }
  .chart-symbol-select {
    flex: 1;
  }
  .chart-countdown {
    margin-left: 0;
  }
  .chart-side {
    grid-template-columns: 1fr;
  }
}
</style>
