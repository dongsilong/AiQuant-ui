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
            <div v-if="chartProtectionLines.length" class="protection-legend">
              <span v-if="chartProtectionLines.some(line => line.kind === 'takeProfit')" class="take-profit">
                交易所止盈
              </span>
              <span v-if="chartProtectionLines.some(line => line.kind === 'stopLoss')" class="stop-loss">
                交易所止损
              </span>
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
              <strong>{{ formatFixed(account.marginBalance, 2) }} USDT</strong>
              <dl>
                <dt>钱包余额</dt>
                <dd>{{ formatFixed(account.walletBalance, 2) }}</dd>
                <dt>可用余额</dt>
                <dd>{{ formatFixed(account.availableBalance, 2) }}</dd>
                <dt>未实现盈亏</dt>
                <dd>{{ formatFixed(account.unrealizedPnl, 2) }}</dd>
                <dt>当天总收益率</dt>
                <dd>{{ dailyReturnRate === undefined ? '—' : `${formatFixed(dailyReturnRate, 2)}%` }}</dd>
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
                  <!--<div class="strategy-actions">
                    <el-button
                      size="small"
                      :type="item.status === 'RUNNING' || item.status === '1' ? 'danger' : 'primary'"
                      @click="toggleStrategy(item)"
                    >
                      {{ item.status === 'RUNNING' || item.status === '1' ? '停止策略' : '启动策略' }}
                    </el-button>
                  </div>-->
                  <b>{{ item.strategyName || '策略实例' }}</b>
                  <p>
                    {{ item.accountName || '-' }} ·
                    <el-link v-if="item.symbol" type="primary" :underline="'never'" @click.stop="selectRowSymbol(item)">
                      {{ item.symbol }}
                    </el-link>
                    <span v-else>{{ symbol }}</span>
                    <el-switch
                      class="strategy-symbol-toggle"
                      :model-value="item.runtimeEnabled !== false"
                      :loading="strategySymbolToggling.has(strategySymbolToggleKey(item))"
                      :disabled="!item.strategySymbolId || strategySymbolToggling.has(strategySymbolToggleKey(item))"
                      active-text="开"
                      inactive-text="停"
                      inline-prompt
                      @change="enabled => toggleStrategySymbol(item, Boolean(enabled))"
                    />
                  </p>
                  <small>
                    <div>实例：{{ item.status || 'UNKNOWN' }}（{{ item.lastSignalAt || '暂无信号' }}）</div>
                    <div>交易对：{{ item.runtimeEnabled === false ? '已暂停开仓' : '允许评估开仓' }}</div>
                  </small>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无可运行策略" />
          </el-card>
        </div>
      </div>

      <el-card shadow="never" class="table-card">
        <el-tabs v-model="activeTab" @tab-change="handleDataTab">
          <el-tab-pane label="当前持仓" name="positions">
            <el-table
              :data="positionRows"
              :empty-text="accountSnapshotAvailable ? '暂无持仓' : '账户数据暂不可用'"
              border
              @row-dblclick="selectRowSymbol"
            >
              <el-table-column type="index" label="序号" align="center" width="80">
                <template #default="scope">{{ scope.$index + 1 }}</template>
              </el-table-column>
              <el-table-column prop="symbol" label="交易对" min-width="100" />
              <el-table-column label="方向" width="100" align="center">
                <template #default="scope"><dict-tag :options="quant_position_direction" :value="directionCode(scope.row)" /></template>
              </el-table-column>
              <el-table-column label="数量 / 名义价值" min-width="150">
                <template #default="scope">
                  {{ format(scope.row.quantity) }} / {{ formatFixed(scope.row.notional, 2) }} U
                </template>
              </el-table-column>
              <el-table-column label="开仓均价" min-width="100">
                <template #default="scope">{{ formatQuantPrice(scope.row.symbol, scope.row.entryPrice) }}</template>
              </el-table-column>
              <el-table-column label="标记价" min-width="100">
                <template #default="scope">{{ formatQuantPrice(scope.row.symbol, scope.row.markPrice) }}</template>
              </el-table-column>
              <el-table-column label="未实现盈亏" min-width="100">
                <template #default="scope">{{ formatFixed(scope.row.unrealizedPnl, 3) }}</template>
              </el-table-column>
              <el-table-column label="回报率" min-width="100">
                <template #default="scope">
                  {{ scope.row.returnRate === undefined ? '-' : `${formatFixed(scope.row.returnRate, 2)}%` }}
                </template>
              </el-table-column>
              <el-table-column label="最大回报率" min-width="110">
                <template #default="scope">
                  {{
                    scope.row.maximumReturnRate === undefined ? '-' : `${formatFixed(scope.row.maximumReturnRate, 2)}%`
                  }}
                </template>
              </el-table-column>
              <el-table-column label="强平价" min-width="100">
                <template #default="scope">{{ formatQuantPrice(scope.row.symbol, scope.row.liquidationPrice) }}</template>
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
              <el-table-column type="index" label="序号" align="center" width="80">
                <template #default="scope">{{ scope.$index + 1 }}</template>
              </el-table-column>
              <el-table-column prop="symbol" label="交易对" />
              <el-table-column prop="side" label="方向" />
              <el-table-column prop="type" label="类型" />
              <el-table-column prop="source" label="来源" />
              <el-table-column label="价格 / 触发价">
                <template #default="scope">{{ formatQuantPrice(scope.row.symbol, scope.row.price) }}</template>
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
              <el-table-column type="index" label="序号" align="center" width="80">
                <template #default="scope">{{ (tradeQuery.pageNum - 1) * tradeQuery.pageSize + scope.$index + 1 }}</template>
              </el-table-column>
              <el-table-column prop="symbol" label="交易对" />
              <el-table-column prop="side" label="方向" />
              <el-table-column label="数量">
                <template #default="scope">{{ format(scope.row.quantity) }}</template>
              </el-table-column>
              <el-table-column label="价格">
                <template #default="scope">{{ formatQuantPrice(scope.row.symbol, scope.row.price) }}</template>
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
    </el-card>

    <el-button class="slope-floating-button" type="primary" circle @click="openSlopePanel" aria-label="打开实时斜率">
      斜率
    </el-button>
    <el-drawer
      v-model="slopePanelVisible"
      title="实时斜率"
      direction="rtl"
      size="620px"
      :modal="false"
      :modal-penetrable="true"
      :resizable="true"
      :lock-scroll="false"
      @closed="closeSlopePanel"
    >
      <el-select
        v-model="slopeStrategyId"
        class="slope-strategy-select"
        placeholder="选择策略"
        @change="openSlopePanel"
      >
        <el-option v-for="item in strategies" :key="item.id" :label="item.strategyName" :value="item.id" />
      </el-select>
      <div v-if="slopeLoadError || slopeSymbolErrors.length" class="slope-load-error">
        <span>{{ slopeLoadError || `交易对信息加载失败：${slopeSymbolErrors.join('、')}` }}</span>
        <el-button link type="primary" :disabled="slopeLoading" @click="openSlopePanel">重试</el-button>
      </div>
      <el-skeleton v-if="slopeLoading && !slopeRows.length" :rows="5" animated />
      <el-table
        v-else-if="slopeRows.length"
        :data="slopeRows"
        :row-class-name="slopeRowClassName"
        border
        stripe
        class="slope-table"
      >
        <el-table-column type="index" label="序号" align="center" width="60" />
        <el-table-column label="交易对" width="120">
          <template #default="scope">
            <el-link type="primary" :underline="'never'" @click.stop="selectRowSymbol({ symbol: scope.row.symbol })">
              {{ scope.row.symbol }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="interval" label="周期" width="72" />
        <!--<el-table-column label="参考开盘价" min-width="110">
          <template #default="scope">{{ format(scope.row.referencePrice) }}</template>
        </el-table-column>-->
        <el-table-column label="当前价" min-width="110">
          <template #default="scope">{{ formatQuantPrice(scope.row.symbol, scope.row.currentPrice) }}</template>
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
      <el-empty v-else :description="slopeLoadError ? '加载失败，请重试' : '当前策略暂无交易对'" />
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus';
import { nextTick, onActivated } from 'vue';
import { type Chart, dispose, init, type KLineData } from 'klinecharts';
import type {
  AccountSnapshot,
  DailyAccountBaseline,
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
  StrategyPositionStateVO,
  StrategySymbolBinding,
  StrategyVO,
  TradeRecord
} from '@/api/quant/types';
import {
  listCredential,
  listStrategies,
  getAccountSnapshot,
  getDailyAccountBaseline,
  listPositions,
  listOrders,
  listProtectionOrders,
  listTrades,
  listRealtimeKlines,
  listSymbol,
  getSymbol,
  listStrategyInstances,
  listStrategyPositionStates,
  listStrategySymbols,
  startStrategy,
  stopStrategy,
  setStrategySymbolRuntimeEnabled,
  cancelOrder,
  closePosition
} from '@/api/quant';
import { getToken, removeToken } from '@/utils/auth';
import { useDict } from '@/utils/dict';
import { parseTime, selectDictLabel } from '@/utils/ruoyi';
import { cacheQuantSymbolTickSize, ensureQuantSymbolTickSizes, formatQuantPrice, priceScaleFromTickSize } from '../components/price-format';
import {
  accountTrade,
  parseBinanceAccountEvent,
  liveTradePage,
  protectionPrices,
  protectionPriceLines,
  updateProtectionOrders,
  mergeAccountPosition,
  mergePositionSnapshots,
  mergePositionSymbolSnapshot,
  positionSnapshotKey,
  mergeTrades,
  positionMetrics,
  positionMaximumReturnRate,
  terminalMarketSubscriptions,
  chunkSlopeSubscriptions,
  updateOrders,
  exactCloseQuantity,
  calculateRealtimeSlope,
  slopeStreamQuery
} from './terminal-data';
const { quant_kline_period, quant_indicator, quant_position_direction } = toRefs<any>(useDict('quant_kline_period', 'quant_indicator', 'quant_position_direction'));
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
const dailyBaselineDay = ref('');
const currentInterval = interval;
const credentials = ref<CredentialVO[]>([]),
  strategies = ref<StrategyVO[]>([]),
  account = ref<AccountSnapshot>(),
  dailyAccountBaseline = ref<DailyAccountBaseline | null>(),
  positions = ref<PositionSnapshot[]>([]),
  orders = ref<OrderSnapshot[]>([]),
  trades = ref<TradeRecord[]>([]),
  instances = ref<StrategyInstanceVO[]>([]),
  positionHistories = ref<StrategyPositionStateVO[]>([]),
  positionMarketMarks = ref(new Map<string, { price: string; receivedAt: number }>()),
  positionReturnRatePeaks = ref(new Map<string, number>()),
  klines = ref<KlineSnapshot[]>([]),
  price = ref<PriceSnapshot>(),
  symbolInfo = ref<SymbolVO>(),
  symbolOptions = ref<SymbolVO[]>([]),
  symbolLoading = ref(false);
const indicatorOptions = computed(() => quant_indicator.value || []);
const shanghaiDateKey = (timestamp: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(timestamp);
const dailyReturnRate = computed(() => {
  const baseline = Number(dailyAccountBaseline.value?.equity);
  const walletBalance = Number(account.value?.walletBalance);
  const currentUnrealizedPnl = positionRows.value.reduce((sum, row) => sum + Number(row.unrealizedPnl || 0), 0);
  const currentEquity = Number.isFinite(walletBalance) ? walletBalance + currentUnrealizedPnl : Number(account.value?.marginBalance);
  if (!Number.isFinite(baseline) || baseline <= 0 || !Number.isFinite(currentEquity)) return undefined;
  return ((currentEquity - baseline) / baseline) * 100;
});
let dailyBaselineRefreshTimer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => shanghaiDateKey(now.value),
  day => {
    if (!dailyBaselineDay.value || day === dailyBaselineDay.value) return;
    dailyBaselineDay.value = day;
    dailyAccountBaseline.value = null;
    if (dailyBaselineRefreshTimer) clearTimeout(dailyBaselineRefreshTimer);
    dailyBaselineRefreshTimer = setTimeout(async () => {
      const id = credentialId.value;
      const generation = dataGeneration;
      if (!id) return;
      try {
        const result = await getDailyAccountBaseline(id);
        if (generation === dataGeneration && dailyBaselineDay.value === day) dailyAccountBaseline.value = result.data;
      } catch {
        if (generation === dataGeneration && dailyBaselineDay.value === day) dailyAccountBaseline.value = null;
      }
    }, 90_000);
  }
);
type SlopeRow = {
  symbol: string;
  interval: string;
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  currentPrice?: number;
  latestTradePrice?: number;
  referencePrice?: number;
  slopePercent?: number;
  degrees?: number;
  entryAngleDegrees?: number;
};
type SlopeStreamState = {
  klines: KlineSnapshot[];
  latestTradePrice?: number;
  handshakeComplete: boolean;
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
const slopeLoadError = ref('');
const slopeSymbolErrors = ref<string[]>([]);
const strategySymbolToggling = ref(new Set<string>());
const strategySymbolToggleKey = (item: StrategyInstanceVO) =>
  `${String(item.strategyId ?? '')}:${String(item.strategySymbolId ?? '')}`;
type SseConnection = { close: () => void };
let slopeStreams: SseConnection[] = [];
const slopeStreamStates = new Map<string, SlopeStreamState>();
const pendingSlopeRows = new Map<SlopeRow, SlopeStreamState>();
let slopeRenderFrame: number | undefined;
let slopeStreamRetry: ReturnType<typeof setTimeout> | undefined;
let slopeLoadController: AbortController | undefined;
let slopeLoadGeneration = 0;
let symbolSwitchController: AbortController | undefined;
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
  const symbol = (row as PositionSnapshot).symbol;
  return prices[kind].map(value => formatQuantPrice(symbol, value)).join('、') || '未挂载';
};
const positionRows = computed(() =>
  positions.value.map(item => {
    const metrics = positionMetrics(
      item,
      (positionMarketMarks.value.get(item.symbol)?.receivedAt || 0) > now.value - 3000
        ? positionMarketMarks.value.get(item.symbol)?.price
        : item.symbol === symbol.value && streamStatus.value === 'CONNECTED'
          ? price.value?.markPrice
          : undefined
    );
    const peakKey = `${credentialId.value}|${item.symbol.toUpperCase()}|${item.side.toUpperCase()}|${item.entryPrice}`;
    const observedPeak = positionReturnRatePeaks.value.get(peakKey);
    const returnRatePeak = Math.max(metrics.returnRate ?? Number.NEGATIVE_INFINITY, observedPeak ?? Number.NEGATIVE_INFINITY);
    return {
      ...metrics,
      maximumReturnRate: positionMaximumReturnRate(
        item,
        credentialId.value,
        positionHistories.value,
        Number.isFinite(returnRatePeak) ? returnRatePeak : undefined
      )
    };
  })
);
const chartProtectionLines = computed(() =>
  protectionLoaded.value
    ? protectionPriceLines(positions.value, protectionOrders.value, symbol.value)
    : []
);
const ordersError = ref('');
const tradesError = ref('');
let dataGeneration = 0;
let dataRequestController: AbortController | undefined;
let symbolSearchController: AbortController | undefined;
let symbolSearchGeneration = 0;
let symbolRequest = 0;
let accountRevision = 0;
let positionRevision = 0;
const positionEventChanges = new Map<string, { revision: number; row?: PositionSnapshot }>();
let hydrationTimer: ReturnType<typeof setTimeout> | undefined;
let positionHistoryRefreshing = false;
let positionHistoryRefreshPending = false;
let hydrationRunning = false;
let hydrationPending = false;
let hydrationPositionRevisionFloor = Number.MAX_SAFE_INTEGER;
const queryError = (error: any, fallback: string) =>
  typeof error === 'string' ? error : error?.msg || error?.message || fallback;

async function refreshPositionHistories() {
  const id = credentialId.value;
  if (!id) return;
  if (positionHistoryRefreshing) {
    positionHistoryRefreshPending = true;
    return;
  }
  positionHistoryRefreshing = true;
  try {
    const response = await listStrategyPositionStates({ pageNum: 1, pageSize: 100, credentialId: id });
    if (String(credentialId.value) === String(id))
      positionHistories.value = mergePositionHistories(response.data?.rows || []);
  } catch {
    // Keep the last confirmed peak values visible if the history refresh temporarily fails.
  } finally {
    positionHistoryRefreshing = false;
    if (positionHistoryRefreshPending) {
      positionHistoryRefreshPending = false;
      void refreshPositionHistories();
    }
  }
}

function mergePositionHistories(rows: StrategyPositionStateVO[]) {
  const previous = new Map(
    positionHistories.value.map(item => [
      `${item.instanceId}:${item.positionCycleKey || item.positionId || item.id}`,
      item
    ])
  );
  return rows.map(item => {
    const old = previous.get(`${item.instanceId}:${item.positionCycleKey || item.positionId || item.id}`);
    if (!old) return item;
    const short = String(item.direction || old.direction).toUpperCase() === 'SHORT';
    const field = short ? 'lowestPriceSinceEntry' : 'highestPriceSinceEntry';
    const oldPeak = Number(old[field]);
    const newPeak = Number(item[field]);
    const oldReturnPeak = Number(old.maximumReturnRate);
    const newReturnPeak = Number(item.maximumReturnRate);
    return {
      ...item,
      [field]: Number.isFinite(oldPeak) && Number.isFinite(newPeak)
        ? short ? Math.min(oldPeak, newPeak) : Math.max(oldPeak, newPeak)
        : Number.isFinite(oldPeak) ? old[field] : item[field],
      maximumReturnRate: Number.isFinite(oldReturnPeak) && Number.isFinite(newReturnPeak)
        ? Math.max(oldReturnPeak, newReturnPeak)
        : Number.isFinite(oldReturnPeak) ? old.maximumReturnRate : item.maximumReturnRate
    };
  });
}

function applyPositionPerformanceEvent(event: any) {
  if (event.type === 'CONNECTED') {
    void refreshPositionHistories();
    return;
  }
  if (String(event.credentialId) !== String(credentialId.value)) return;
  const index = positionHistories.value.findIndex(
    item =>
      String(item.instanceId) === String(event.instanceId) &&
      String(item.positionCycleKey || '') === String(event.positionCycleKey || '')
  );
  const old = index >= 0 ? positionHistories.value[index] : undefined;
  const short = String(event.direction || old?.direction).toUpperCase() === 'SHORT';
  const field = short ? 'lowestPriceSinceEntry' : 'highestPriceSinceEntry';
  const oldPeak = Number(old?.[field]);
  const incomingPeak = Number(event[field]);
  const peak =
    Number.isFinite(oldPeak) && Number.isFinite(incomingPeak)
      ? short
        ? Math.min(oldPeak, incomingPeak)
        : Math.max(oldPeak, incomingPeak)
      : event[field];
  const row: StrategyPositionStateVO = { ...(old || ({} as StrategyPositionStateVO)), ...event, [field]: peak };
  const oldMaximumReturnRate = Number(old?.maximumReturnRate);
  const eventMaximumReturnRate = Number(event.maximumReturnRate);
  if (Number.isFinite(oldMaximumReturnRate) || Number.isFinite(eventMaximumReturnRate)) {
    row.maximumReturnRate = Number.isFinite(oldMaximumReturnRate) && Number.isFinite(eventMaximumReturnRate)
      ? Math.max(oldMaximumReturnRate, eventMaximumReturnRate)
      : Number.isFinite(eventMaximumReturnRate) ? eventMaximumReturnRate : oldMaximumReturnRate;
  }
  if (index >= 0) positionHistories.value.splice(index, 1, row);
  else positionHistories.value = [...positionHistories.value, row];
}

function closeMarketStream() {
  marketStreams.forEach(connection => connection.close());
  marketStreams = [];
  if (retry) clearTimeout(retry);
  retry = undefined;
}

// Hydrate fields absent from ACCOUNT_UPDATE after a position changes; coalesce bursts without REST polling.
function scheduleAccountHydration(positionRevisionBeforeEvent = positionRevision) {
  hydrationPositionRevisionFloor = Math.min(hydrationPositionRevisionFloor, positionRevisionBeforeEvent);
  hydrationPending = true;
  if (hydrationRunning || hydrationTimer) return;
  hydrationTimer = setTimeout(async () => {
    hydrationTimer = undefined;
    const id = credentialId.value;
    if (!id) return;
    const generation = dataGeneration;
    const revision = accountRevision;
    const snapshotPositionRevision = hydrationPositionRevisionFloor === Number.MAX_SAFE_INTEGER ? positionRevision : hydrationPositionRevisionFloor;
    hydrationPositionRevisionFloor = Number.MAX_SAFE_INTEGER;
    hydrationPending = false;
    hydrationRunning = true;
    try {
      const [a, p] = await Promise.allSettled([getAccountSnapshot(id), listPositions(id)]);
      if (generation !== dataGeneration) return;
      if (a.status === 'fulfilled' && revision === accountRevision) account.value = a.value.data;
      if (p.status === 'fulfilled') {
        positions.value = mergePositionSnapshots(p.value.data || [], positionEventChanges, snapshotPositionRevision);
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
    const result = await listTrades(id, undefined, query, dataRequestController?.signal);
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
    const response = await listProtectionOrders(id, undefined, dataRequestController?.signal);
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
    renderOverlays();
  } catch (error) {
    if (generation === dataGeneration && requestId === protectionRequest) {
      protectionError.value = queryError(error, '条件单查询失败');
      protectionLoaded.value = false;
      protectionOrders.value = [];
      renderOverlays();
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
const directionCode = (item: { side?: string; quantity?: string | number }) => {
  const short = item.side === 'SHORT' || (item.side === 'BOTH' && Number(item.quantity) < 0);
  return short ? 'SHORT' : 'LONG';
};
const directionLabel = (item: { side?: string; quantity?: string | number }) => {
  const label = selectDictLabel(quant_position_direction.value, directionCode(item));
  return label || '方向未知';
};
const chartRef = ref<HTMLElement>(),
  chart = shallowRef<Chart>();
let marketStreams: SseConnection[] = [],
  retry: ReturnType<typeof setTimeout> | undefined,
  accountStream: SseConnection | undefined,
  accountRetry: ReturnType<typeof setTimeout> | undefined,
  marketStreamKey = '',
  resize: ResizeObserver | undefined;
let updateChartBar: ((data: KLineData) => void) | undefined;
let overlayIds: string[] = [];
const lastAccountEvents = new Map<string, number>();
const lastOrderEvents = new Map<string, number>();
const indicatorNames = computed<Record<string, string>>(() =>
  Object.fromEntries(indicatorOptions.value.map((item: any) => [item.value, item.label]))
);
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
// The initial right-side breathing room is applied once. ResizeObserver and route-tab
// activation only recalculate canvas dimensions and must not overwrite the user's viewport.
let initialRightGapApplied = false;

function applyInitialChartRightGap() {
  if (!chart.value || !chartRef.value || initialRightGapApplied) return;
  const rightGap = Math.max(0, chartRef.value.clientWidth / 3);
  chart.value.setMaxOffsetRightDistance(rightGap);
  chart.value.setOffsetRightDistance(rightGap);
  initialRightGapApplied = true;
}

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
  const chartPriceScale = priceScaleFromTickSize(symbolInfo.value?.priceTickSize);
  chart.value.setSymbol({
    ticker: symbol.value,
    ...(chartPriceScale === undefined ? {} : { pricePrecision: chartPriceScale }),
    volumePrecision: symbolInfo.value?.quantityPrecision ?? 8
  });
  chart.value.setPeriod(period());
  chart.value.setMaxOffsetLeftDistance(0);
  chart.value.setLeftMinVisibleBarCount(30);
  chart.value.setLocale('zh-CN');
  renderIndicators();
  applyInitialChartRightGap();
  resizeChartWithRightGap();
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
      { value: Number(item.liquidationPrice), color: '#f56c6c' }
    ]),
    ...chartProtectionLines.value.map(line => ({
      value: line.value,
      color: line.kind === 'takeProfit' ? '#67c23a' : '#e6a23c'
    })),
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
function resizeChartWithRightGap() {
  if (!chart.value || !chartRef.value) return;

  // ResizeObserver and route-tab activation only recalculate layout. Never change
  // offsetRightDistance here, because doing so overwrites the user's current viewport.
  chart.value.resize();
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
  // Remote select can invoke this for every keystroke. Cancel the previous query and
  // prevent a slower response for an older keyword from replacing the latest results.
  symbolSearchController?.abort();
  const controller = new AbortController();
  symbolSearchController = controller;
  const generation = ++symbolSearchGeneration;
  symbolLoading.value = true;
  try {
    const response = await listSymbol(
      {
        pageNum: 1,
        pageSize: 50,
        quoteAsset: 'USDT',
        ...(keyword ? { symbol: keyword } : { favorite: true })
      },
      controller.signal
    );
    if (generation !== symbolSearchGeneration || controller.signal.aborted) return;
    const merged = new Map(symbolOptions.value.map(item => [String(item.id), item]));
    for (const item of response.data?.rows || []) merged.set(String(item.id), item);
    symbolOptions.value = [...merged.values()];
  } catch {
    // The shared request interceptor reports genuine failures; canceled searches are expected.
  } finally {
    if (generation === symbolSearchGeneration) symbolLoading.value = false;
  }
}
async function handleSymbolChange() {
  await refresh();
}
function applyEvent(e: any) {
  const eventSymbol = String(e.symbol || '').toUpperCase();
  if (e.type === 'MARK' && e.price && !e.replay && eventSymbol) {
    // Only position symbols need the per-position mark cache. The selected chart symbol's
    // price is updated below, so unrelated market ticks should not clone reactive Maps.
    const matchingPositions = positions.value.filter(position => position.symbol.toUpperCase() === eventSymbol);
    if (matchingPositions.length) {
      const next = new Map(positionMarketMarks.value);
      next.set(eventSymbol, { price: String(e.price), receivedAt: Date.now() });
      positionMarketMarks.value = next;
      const returnRatePeaks = new Map(positionReturnRatePeaks.value);
      let changed = false;
      for (const position of matchingPositions) {
        const rate = positionMetrics(position, e.price).returnRate;
        const key = `${credentialId.value}|${position.symbol.toUpperCase()}|${position.side.toUpperCase()}|${position.entryPrice}`;
        if (rate !== undefined && rate > (returnRatePeaks.get(key) ?? Number.NEGATIVE_INFINITY)) {
          returnRatePeaks.set(key, rate);
          changed = true;
        }
      }
      if (changed) positionReturnRatePeaks.value = returnRatePeaks;
    }
  }
  if (e.type === 'CONNECTING' && !eventSymbol) streamStatus.value = 'CONNECTING';
  else if (e.type === 'CONNECTED' && eventSymbol === symbol.value.toUpperCase()) streamStatus.value = 'CONNECTED';
  else if (e.type === 'ERROR' && (!eventSymbol || eventSymbol === symbol.value.toUpperCase())) {
    streamStatus.value = 'ERROR';
    ElMessage.error(e.message || '行情订阅失败');
  } else if (e.type === 'DISCONNECTED' && eventSymbol === symbol.value.toUpperCase()) {
    streamStatus.value = 'DISCONNECTED';
    price.value = undefined;
  } else if (eventSymbol !== symbol.value.toUpperCase()) return;
  else if (e.type === 'TRADE' && e.price)
    price.value = { ...(price.value as PriceSnapshot), lastTradePrice: e.price, observedAt: e.eventTime };
  else if (e.type === 'MARK' && e.price) {
    // Mark ticks update live price/PnL only. Price-line overlays depend on positions and orders,
    // not each tick; rebuilding all chart overlays here creates avoidable main-thread work.
    price.value = { ...(price.value as PriceSnapshot), markPrice: e.price, observedAt: e.eventTime };
  } else if (e.type === 'KLINE' && e.kline) {
    const i = klines.value.findIndex(x => x.openTime === e.kline.openTime);
    if (i < 0) klines.value = [...klines.value, e.kline].slice(-1000);
    else klines.value[i] = e.kline;
    const updatedBar = toChart([e.kline])[0];
    if (updatedBar) updateChartBar?.(updatedBar);
  }
}

function clearPositionReturnRatePeak(symbol: string, side: string) {
  const prefix = `${credentialId.value}|${symbol.toUpperCase()}|${side.toUpperCase()}|`;
  const next = new Map(positionReturnRatePeaks.value);
  for (const key of next.keys()) {
    if (key.startsWith(prefix)) next.delete(key);
  }
  positionReturnRatePeaks.value = next;
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
  dailyAccountBaseline.value = null;
  removeToken();
  if (retry) clearTimeout(retry);
  if (accountRetry) clearTimeout(accountRetry);
  if (slopeStreamRetry) clearTimeout(slopeStreamRetry);
  ElMessage.error('登录状态已失效，请重新登录');
}

function connect() {
  const runMode = selectedMarketRunMode();
  const subscriptions = terminalMarketSubscriptions(
    { symbol: symbol.value, interval: interval.value },
    positions.value
  );
  const key = `${runMode}|${subscriptions.map(item => `${item.symbol}:${item.interval}`).join(',')}`;
  if (marketStreamKey === key && marketStreams.length) return;
  closeMarketStream();
  marketStreamKey = key;
  streamStatus.value = 'CONNECTING';
  const generation = dataGeneration;
  const reconnect = () => {
    if (generation !== dataGeneration) return;
    closeMarketStream();
    retry = setTimeout(connect, 3000);
  };
  for (let start = 0; start < subscriptions.length; start += 50) {
    const query = new URLSearchParams({ runMode });
    subscriptions.slice(start, start + 50).forEach(item => {
      query.append('symbol', item.symbol);
      query.append('interval', item.interval);
    });
    marketStreams.push(
      openSse(
        `${import.meta.env.VITE_APP_BASE_API}/quant/market/streams?${query}`,
        'quant.market',
        data => {
          try {
            const event = JSON.parse(data);
            applyEvent(event);
            if (event.type === 'ERROR' || event.type === 'DISCONNECTED') reconnect();
          } catch {
            streamStatus.value = 'ERROR';
          }
        },
        () => {
          streamStatus.value = 'DISCONNECTED';
          reconnect();
        },
        handleSseUnauthorized
      )
    );
  }
}

function selectedMarketRunMode() {
  return credentials.value.find(item => String(item.id) === String(credentialId.value))?.runMode || 'LIVE';
}

watch(
  () => {
    const credential = credentials.value.find(item => String(item.id) === String(credentialId.value));
    const subscriptions = terminalMarketSubscriptions(
      { symbol: symbol.value, interval: interval.value },
      positions.value
    );
    return `${credential?.runMode || 'LIVE'}|${subscriptions.map(item => `${item.symbol}:${item.interval}`).join(',')}`;
  },
  () => connect(),
  { flush: 'post' }
);

watch(
  () => selectedMarketRunMode(),
  () => {
    if (slopePanelVisible.value) connectSlopeStream();
  }
);

function applyRawAccountEvent(rawJson: string | undefined) {
  if (!rawJson) return;
  try {
    const raw = parseBinanceAccountEvent(rawJson);
    if (raw.e === 'ACCOUNT_UPDATE' && raw.a) {
      accountRevision++;
      const eventPositionRevision = ++positionRevision;
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
        const positionKey = positionSnapshotKey(row.symbol, row.side);
        if (Number(row.quantity) === 0) {
          if (index >= 0) positions.value.splice(index, 1);
          clearPositionReturnRatePeak(row.symbol, row.side);
          positionEventChanges.set(positionKey, { revision: eventPositionRevision });
        } else if (index >= 0) positions.value[index] = row;
        else positions.value.push(row);
        if (Number(row.quantity) !== 0) positionEventChanges.set(positionKey, { revision: eventPositionRevision, row });
      }
      if (positionChanged || usdt) scheduleAccountHydration(eventPositionRevision - 1);
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
          scheduleAccountHydration();
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
  const snapshotPositionRevision = positionRevision;
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
        if (event.type === 'POSITION_MAX_RETURN') {
          if (String(event.credentialId) === String(credentialId.value))
            applyPositionPerformanceEvent(event.performance);
          return;
        }
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
          if (event.type === 'SNAPSHOT') {
            if (!protectionLoading.value) void loadProtectionOrders();
            void refreshPositionHistories();
          }
          if (event.type === 'CONNECTED') void refreshPositionHistories();
          if (event.snapshotAvailable) {
            accountSnapshotAvailable.value = true;
            const changed = snapshotRevision !== accountRevision;
            if (event.account && !changed) account.value = event.account;
            if (Array.isArray(event.positions))
              positions.value = mergePositionSnapshots(event.positions, positionEventChanges, snapshotPositionRevision);
            if (Array.isArray(event.orders) && !changed) {
              orders.value = event.orders;
              ordersError.value = '';
            }
            if (changed && event.type === 'SNAPSHOT') scheduleAccountHydration(snapshotPositionRevision);
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
  slopeStreams.forEach(connection => connection.close());
  slopeStreams = [];
  slopeStreamStates.clear();
  pendingSlopeRows.clear();
  if (slopeRenderFrame !== undefined) cancelAnimationFrame(slopeRenderFrame);
  slopeRenderFrame = undefined;
  if (slopeStreamRetry) clearTimeout(slopeStreamRetry);
  slopeStreamRetry = undefined;
}

function flushSlopeRows() {
  slopeRenderFrame = undefined;
  pendingSlopeRows.forEach((state, row) => {
    const latestKline = state.klines[state.klines.length - 1];
    const referenceKline = state.klines[state.klines.length - 2];
    row.latestTradePrice = state.latestTradePrice;
    row.currentPrice = state.latestTradePrice ?? (latestKline ? Number(latestKline.close) : undefined);
    row.referencePrice = referenceKline ? Number(referenceKline.open) : undefined;
    const slope = calculateRealtimeSlope(row.currentPrice, row.referencePrice, row.entryAngleDegrees);
    row.slopePercent = slope?.slopePercent;
    row.degrees = slope?.degrees;
    if (state.handshakeComplete && row.degrees !== undefined) row.status = 'CONNECTED';
  });
  pendingSlopeRows.clear();
}

function scheduleSlopeRowUpdate(row: SlopeRow, state: SlopeStreamState) {
  pendingSlopeRows.set(row, state);
  if (slopeRenderFrame === undefined) slopeRenderFrame = requestAnimationFrame(flushSlopeRows);
}

function clearSlopeRowValues(row: SlopeRow, state: SlopeStreamState, status: SlopeRow['status']) {
  pendingSlopeRows.delete(row);
  state.latestTradePrice = undefined;
  row.status = status;
  row.latestTradePrice = undefined;
  row.currentPrice = undefined;
  row.referencePrice = undefined;
  row.slopePercent = undefined;
  row.degrees = undefined;
}

function connectSlopeStream() {
  closeSlopeStream();
  if (!slopePanelVisible.value || !slopeStrategyId.value || !slopeRows.value.length) return;
  for (const row of slopeRows.value) {
    row.status = 'CONNECTING';
    const state: SlopeStreamState = { klines: [], handshakeComplete: false };
    slopeStreamStates.set(`${row.symbol}:${row.interval}`, state);
    row.latestTradePrice = undefined;
    row.currentPrice = undefined;
    row.referencePrice = undefined;
    row.slopePercent = undefined;
    row.degrees = undefined;
  }
  const scheduleReconnect = () => {
    if (!slopePanelVisible.value || slopeStreamRetry) return;
    slopeStreamRetry = setTimeout(() => {
      slopeStreamRetry = undefined;
      connectSlopeStream();
    }, 3000);
  };
  const onMessage = (data: string) => {
    try {
      const event = JSON.parse(data);
      if (event.type === 'CONNECTING' && !event.symbol) return;
      const key = `${event.symbol}:${event.interval}`;
      const row = slopeRows.value.find(item => `${item.symbol}:${item.interval}` === key);
      const state = slopeStreamStates.get(key);
      if (!row || !state) return;
      if (event.type === 'CONNECTING') {
        clearSlopeRowValues(row, state, 'CONNECTING');
        return;
      }
      if (event.type === 'CONNECTED') {
        state.handshakeComplete = true;
        scheduleSlopeRowUpdate(row, state);
        return;
      }
      if (event.type === 'DISCONNECTED' || event.type === 'ERROR') {
        clearSlopeRowValues(row, state, event.type);
        // MarketStreamHub reconnects the upstream symbol itself; keep this SSE
        // open so the row can recover when the server publishes CONNECTED again.
        return;
      }
      if (event.type === 'TRADE' && Number(event.price) > 0) {
        state.latestTradePrice = Number(event.price);
      } else if (event.type === 'KLINE' && event.kline) {
        const kline = event.kline as KlineSnapshot;
        const index = state.klines.findIndex(item => item.openTime === kline.openTime);
        if (index < 0) state.klines.push(kline);
        else state.klines[index] = kline;
        state.klines.sort((left, right) => Date.parse(left.openTime) - Date.parse(right.openTime));
        state.klines = state.klines.slice(-4);
      }
      scheduleSlopeRowUpdate(row, state);
    } catch {
      slopeRows.value.forEach(row => {
        const state = slopeStreamStates.get(`${row.symbol}:${row.interval}`);
        if (state) clearSlopeRowValues(row, state, 'ERROR');
      });
      scheduleReconnect();
    }
  };
  const onError = () => {
    slopeRows.value.forEach(row => {
      const state = slopeStreamStates.get(`${row.symbol}:${row.interval}`);
      if (state) clearSlopeRowValues(row, state, 'DISCONNECTED');
    });
    slopeStreams.forEach(connection => connection.close());
    slopeStreams = [];
    scheduleReconnect();
  };
  for (const batch of chunkSlopeSubscriptions(slopeRows.value)) {
    const query = slopeStreamQuery(batch, selectedMarketRunMode());
    slopeStreams.push(
      openSse(
        `${import.meta.env.VITE_APP_BASE_API}/quant/market/streams?${query}`,
        'quant.market',
        onMessage,
        onError,
        handleSseUnauthorized
      )
    );
  }
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
  // A strategy change or a repeated open supersedes any earlier binding/detail lookup.
  slopeLoadController?.abort();
  const controller = new AbortController();
  slopeLoadController = controller;
  const generation = ++slopeLoadGeneration;

  slopePanelVisible.value = true;
  // Preserve the drawer's explicit strategy selection; @change invokes this function.
  // Resetting to the terminal strategy here silently subscribes the wrong SSE key.
  slopeStrategyId.value = slopeStrategyId.value || strategyId.value || strategies.value[0]?.id;
  closeSlopeStream();
  slopeRows.value = [];
  slopeLoadError.value = '';
  slopeSymbolErrors.value = [];
  if (!slopeStrategyId.value) {
    slopeLoading.value = false;
    if (slopeLoadController === controller) slopeLoadController = undefined;
    return;
  }
  const strategyIdForLoad = slopeStrategyId.value;
  slopeLoading.value = true;
  try {
    const bindings = (await listStrategySymbols(strategyIdForLoad, controller.signal)).data || [];
    if (controller.signal.aborted || generation !== slopeLoadGeneration || !slopePanelVisible.value) return;
    const activeBindings = bindings.filter((item: StrategySymbolBinding) => item.status !== '1');
    const resolved = await Promise.all(
      activeBindings.map(async binding => {
        try {
          const item = await getSymbol(binding.symbolId, controller.signal);
          return { binding, symbol: item.data?.symbol };
        } catch {
          // An aborted detail lookup is expected when the drawer closes or the strategy changes.
          return { binding, symbol: undefined };
        }
      })
    );
    if (controller.signal.aborted || generation !== slopeLoadGeneration || !slopePanelVisible.value) return;
    slopeSymbolErrors.value = resolved.filter(item => !item.symbol).map(item => String(item.binding.symbolId));
    const rows = resolved
      .filter(item => item.symbol)
      .map(item => ({
        symbol: item.symbol!,
        interval: item.binding.intervalCode || interval.value,
        entryAngleDegrees: slopeEntryAngle(item.binding),
        status: 'CONNECTING' as const
      }));
    slopeRows.value = rows;
    connectSlopeStream();
  } catch {
    if (!controller.signal.aborted && generation === slopeLoadGeneration && slopePanelVisible.value) {
      slopeLoadError.value = '策略交易对列表加载失败';
    }
  } finally {
    if (generation === slopeLoadGeneration) {
      slopeLoading.value = false;
      if (slopeLoadController === controller) slopeLoadController = undefined;
    }
  }
}

function closeSlopePanel() {
  slopePanelVisible.value = false;
  ++slopeLoadGeneration;
  slopeLoadController?.abort();
  slopeLoadController = undefined;
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
  symbolSwitchController?.abort();
  symbolSwitchController = undefined;
  // Cancel stale REST reads from the previous refresh/account/symbol selection.
  // Generation checks below remain the final guard against out-of-order responses.
  dataRequestController?.abort();
  const controller = new AbortController();
  dataRequestController = controller;
  const signal = controller.signal;
  const generation = ++dataGeneration;
  ++symbolRequest;
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
  closeMarketStream();
  marketStreamKey = '';
  if (accountRetry) clearTimeout(accountRetry);
  if (retry) clearTimeout(retry);
  if (hydrationTimer) clearTimeout(hydrationTimer);
  hydrationTimer = undefined;
  hydrationPending = false;
  hydrationPositionRevisionFloor = Number.MAX_SAFE_INTEGER;
  accountRevision = 0;
  positionRevision = 0;
  positionEventChanges.clear();
  lastOrderEvents.clear();
  ordersError.value = '';
  tradesError.value = '';
  const id = credentialId.value;
  const baselineDay = shanghaiDateKey(now.value);
  dailyBaselineDay.value = baselineDay;
  // 切换交易对时先清理旧快照，避免新请求失败时继续显示上一个交易对的数据。
  klines.value = [];
  symbolInfo.value = undefined;
  price.value = undefined;
  positions.value = [];
  positionHistories.value = [];
  positionMarketMarks.value = new Map();
  accountSnapshotAvailable.value = false;
  orders.value = [];
  trades.value = [];
  renderOverlays();
  // Keep chart initialization independent from slower account/history endpoints.
  // A pending position/account request must not hold the chart's loading mask or delay market streams.
  const [k, s] = await Promise.allSettled([
    // Market data is mode-specific. Until a credential is known, render the chart shell but
    // do not silently subscribe to LIVE when the user's first credential may be TESTNET.
    id
      ? listRealtimeKlines(symbol.value, interval.value, 1000, selectedMarketRunMode(), signal)
      : Promise.resolve({ data: [] as KlineSnapshot[] }),
    listSymbol({ pageNum: 1, pageSize: 1, symbol: symbol.value }, signal)
  ]);
  if (generation !== dataGeneration) return;
  if (k.status === 'fulfilled') {
    klines.value = k.value.data || [];
  } else {
    ElMessage.error(`${symbol.value} K线加载失败，已清理旧图表数据`);
  }
  symbolInfo.value = s.status === 'fulfilled' ? s.value.data?.rows?.[0] : undefined;
  cacheQuantSymbolTickSize(symbolInfo.value?.symbol, symbolInfo.value?.priceTickSize);
  if (symbolInfo.value && !symbolOptions.value.some(item => String(item.id) === String(symbolInfo.value?.id))) {
    symbolOptions.value = [symbolInfo.value, ...symbolOptions.value];
  }
  void ensureQuantSymbolTickSizes().catch(() => undefined);
  renderChart();
  renderOverlays();
  // Do not create mode-specific streams until the selected credential establishes LIVE/TESTNET.
  if (!id) return;
  connect();
  connectAccountStream();

  if (id) {
    // Capture stream revisions before each snapshot request so a slow REST response cannot
    // overwrite newer account/position events received after the request began.
    const positionSnapshotRevision = positionRevision;
    const accountSnapshotRevision = accountRevision;
    void Promise.allSettled([
      listPositions(id, undefined, signal),
      listStrategyInstances({ pageNum: 1, pageSize: 100, credentialId: id }, signal),
      listStrategyPositionStates({ pageNum: 1, pageSize: 100, credentialId: id }, signal)
    ]).then(([p, i, h]) => {
      if (generation !== dataGeneration || signal.aborted) return;
      if (p.status === 'fulfilled') {
        positions.value = mergePositionSnapshots(p.value.data || [], positionEventChanges, positionSnapshotRevision);
        accountSnapshotAvailable.value = true;
      } else {
        // A failed snapshot is not proof of an empty account. Preserve any event-derived positions.
        accountSnapshotAvailable.value = false;
      }
      if (i.status === 'fulfilled') {
        instances.value = (i.value.data?.rows || []).filter(
          item => !strategyId.value || String(item.strategyId) === String(strategyId.value)
        );
      }
      if (h.status === 'fulfilled') positionHistories.value = mergePositionHistories(h.value.data?.rows || []);
      renderOverlays();
      // Rebuild market subscriptions only when the confirmed open-position set arrives.
      connect();
      void loadProtectionOrders();
    });

    void Promise.allSettled([
      getAccountSnapshot(id, signal),
      listOrders(id, undefined, signal),
      listTrades(id, undefined, { ...tradeQuery }, signal),
      getDailyAccountBaseline(id, signal)
    ]).then(([a, o, t, baseline]) => {
      if (generation !== dataGeneration || signal.aborted) return;
      ordersError.value = o.status === 'rejected' ? queryError(o.reason, '委托加载失败') : '';
      tradesError.value = t.status === 'rejected' ? queryError(t.reason, '成交记录加载失败') : '';
      if (a.status === 'fulfilled' && accountSnapshotRevision === accountRevision) account.value = a.value.data;
      if (baseline.status === 'fulfilled' && dailyBaselineDay.value === baselineDay) {
        dailyAccountBaseline.value = baseline.value.data;
      }
      if (o.status === 'fulfilled' && accountSnapshotRevision === accountRevision) {
        orders.value = o.value.data || [];
      }
      if (t.status === 'fulfilled') {
        trades.value = mergeTrades(t.value.data?.rows || [], liveTrades.value);
        tradeTotal.value = t.value.data?.total || 0;
      }
      renderOverlays();
    });
  }
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
async function toggleStrategySymbol(item: StrategyInstanceVO, enabled: boolean) {
  if (item.strategyId === undefined || item.strategySymbolId === undefined) {
    ElMessage.error('缺少策略或策略交易对标识，无法切换运行状态');
    return;
  }
  const key = strategySymbolToggleKey(item);
  if (strategySymbolToggling.value.has(key)) return;
  strategySymbolToggling.value.add(key);
  const symbolName = item.symbol || '当前交易对';
  const title = enabled ? '恢复交易对' : '暂停交易对';
  const message = enabled
    ? `确认恢复 ${symbolName} 的开仓信号评估？恢复后仍必须通过现有风控、持仓核验和开仓幂等检查。`
    : `确认暂停 ${symbolName} 的新开仓？策略整体和其他交易对不受影响；该交易对已有持仓不会自动平仓，止盈、止损、保护单、对账和异常恢复仍继续运行。`;
  try {
    await ElMessageBox.confirm(message, title, {
      type: 'warning',
      confirmButtonText: '确认执行',
      cancelButtonText: '取消'
    });
    await setStrategySymbolRuntimeEnabled(item.strategyId, item.strategySymbolId, enabled);
    ElMessage.success(enabled ? '已恢复该交易对的开仓评估' : '已暂停该交易对的新开仓');
    await refresh();
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(queryError(error, '交易对运行状态切换失败'));
      await refresh();
    }
  } finally {
    strategySymbolToggling.value.delete(key);
  }
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
  if (!row?.symbol) return;
  // Cancel the previous switch immediately; request IDs alone only guard state writes,
  // they do not release network requests that are still pending.
  symbolSwitchController?.abort();
  symbolSwitchController = undefined;
  const requestId = ++symbolRequest;
  if (row.symbol === symbol.value) return;
  const controller = new AbortController();
  symbolSwitchController = controller;
  const nextSymbol = row.symbol;
  const generation = dataGeneration;
  const requestedInterval = interval.value;
  const runMode = selectedMarketRunMode();
  try {
    const [k, s] = await Promise.allSettled([
      listRealtimeKlines(nextSymbol, requestedInterval, 1000, runMode, controller.signal),
      listSymbol({ pageNum: 1, pageSize: 1, symbol: nextSymbol }, controller.signal)
    ]);
    if (
      controller.signal.aborted ||
      generation !== dataGeneration ||
      requestId !== symbolRequest ||
      requestedInterval !== interval.value ||
      runMode !== selectedMarketRunMode()
    ) return;
    if (k.status !== 'fulfilled') {
      ElMessage.error(`${nextSymbol} K线加载失败，交易对未切换：${queryError(k.reason, '未知错误')}`);
      return;
    }
    symbol.value = nextSymbol;
    klines.value = k.value.data || [];
    symbolInfo.value = s.status === 'fulfilled' ? s.value.data?.rows?.[0] : undefined;
    cacheQuantSymbolTickSize(symbolInfo.value?.symbol, symbolInfo.value?.priceTickSize);
    if (symbolInfo.value && !symbolOptions.value.some(item => String(item.id) === String(symbolInfo.value?.id))) {
      symbolOptions.value = [symbolInfo.value, ...symbolOptions.value];
    }
    price.value = undefined;
    renderChart();
    renderOverlays();
    connect();
  } finally {
    if (symbolSwitchController === controller) symbolSwitchController = undefined;
  }
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
  confirmAction('确认撤单', `${order.symbol} ${order.side} ${order.originalQuantity} @ ${formatQuantPrice(order.symbol, order.price)}`, () =>
    cancelOrder(data)
  );
}
function close(row: unknown) {
  const position = row as PositionSnapshot;
  if (!credentialId.value) return;
  const quantity = exactCloseQuantity(position.quantity);
  if (!quantity) return;
  const closeSide =
    position.side === 'SHORT' || (position.side === 'BOTH' && position.quantity.trim().startsWith('-'))
      ? 'BUY'
      : 'SELL';
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
      const snapshotPositionRevision = positionRevision;
      const response = await listPositions(credentialId.value, positionSymbol);
      positions.value = mergePositionSymbolSnapshot(
        positions.value,
        response.data || [],
        positionSymbol,
        positionEventChanges,
        snapshotPositionRevision
      );
      renderOverlays();
      const remaining = positions.value.some(
        item => item.symbol.toUpperCase() === positionSymbol.toUpperCase() && Math.abs(Number(item.quantity)) > 0
      );
      if (!remaining) return;
    } catch {
      // 保留当前持仓显示，等待 SSE 或后续刷新确认，避免网络短暂失败导致误清空。
    }
  }
}
let clock: ReturnType<typeof setInterval> | undefined;
onActivated(() => {
  // On route-tab return, only resize. Do not reset data, scroll, or synthesize viewport offsets.
  void nextTick(() => {
    resizeChartWithRightGap();
  });
});

onMounted(() => {
  clock = setInterval(() => (now.value = Date.now()), 1000);
  if (chartRef.value) {
    chart.value = init(chartRef.value);
    resize = new ResizeObserver(resizeChartWithRightGap);
    resize.observe(chartRef.value);
  }

  // Start the chart immediately instead of waiting for credential/strategy/search endpoints.
  // Each auxiliary result hydrates its own panel when ready; refresh() cancels stale snapshots.
  void refresh();
  void listCredential({ pageNum: 1, pageSize: 100 })
    .then(response => {
      credentials.value = response.data?.rows || [];
      if (!credentialId.value && credentials.value.length) {
        credentialId.value = credentials.value[0].id;
        void refresh();
      }
    })
    .catch(() => undefined);
  void listStrategies({ pageNum: 1, pageSize: 100 })
    .then(response => {
      strategies.value = response.data?.rows || [];
    })
    .catch(() => undefined);
  void searchSymbols('').catch(() => undefined);
});
onBeforeUnmount(() => {
  dataGeneration++;
  slopeLoadGeneration++;
  slopeLoadController?.abort();
  slopeLoadController = undefined;
  symbolSwitchController?.abort();
  symbolSwitchController = undefined;
  dataRequestController?.abort();
  dataRequestController = undefined;
  symbolSearchGeneration++;
  symbolSearchController?.abort();
  symbolSearchController = undefined;
  hydrationPending = false;
  if (hydrationTimer) clearTimeout(hydrationTimer);
  marketStreams.forEach(connection => connection.close());
  marketStreams = [];
  accountStream?.close();
  closeSlopeStream();
  updateChartBar = undefined;
  if (retry) clearTimeout(retry);
  if (accountRetry) clearTimeout(accountRetry);
  resize?.disconnect();
  if (clock) clearInterval(clock);
  if (dailyBaselineRefreshTimer) clearTimeout(dailyBaselineRefreshTimer);
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
  margin-top: 12px;
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
.period-control {
  display: flex;
  align-items: center;

  /* 1. 作用在每一个按钮上 */
  :deep(.control-group-item) {

    /* 统一宽度，默认直角 */
    .el-radio-button__inner {
      width: 55px;
      //padding: 8px 0; /* 确保文字居中 */
      border-radius: 0 !important;
    }

    /* 拦截选中状态，防止选中后变成四个圆角 */
    &.is-active .el-radio-button__inner,
    .el-radio-button__original-radio:checked + .el-radio-button__inner {
      border-radius: 0 !important;
    }

    /* 2. 第一个按钮：左侧圆角 */
    &:first-child {
      .el-radio-button__inner {
        border-radius: 5px 0 0 5px !important;
      }
      /* 选中时的左圆角 */
      &.is-active .el-radio-button__inner,
      .el-radio-button__original-radio:checked + .el-radio-button__inner {
        border-radius: 5px 0 0 5px !important;
      }
    }

    /* 3. 最后一个按钮：右侧圆角 */
    &:last-child {
      .el-radio-button__inner {
        border-radius: 0 5px 5px 0 !important;
      }
      /* 选中时的右圆角 */
      &.is-active .el-radio-button__inner,
      .el-radio-button__original-radio:checked + .el-radio-button__inner {
        border-radius: 0 5px 5px 0 !important;
      }
    }
  }
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
.protection-legend {
  display: contents;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  white-space: nowrap;
}
.protection-legend .take-profit {
  color: #67c23a;
}
.protection-legend .stop-loss {
  color: #e6a23c;
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
.slope-load-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  color: var(--el-color-warning);
  font-size: 12px;
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
  height: 260px;
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
.strategy-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.strategy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 10px;
}
.strategy {
  //display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.strategy p {
  display: flex;
  align-items: center;
  margin: 4px 0;
  color: var(--el-text-color-secondary);
}
.strategy p .strategy-symbol-toggle {
  margin-left: auto;
  flex-shrink: 0;
}
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
