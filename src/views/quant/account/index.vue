<template>
  <div class="p-2 app-container quant-account-page">
    <el-card class="search-panel" shadow="hover">
      <template #header>
        <div class="panel-heading">
          <div>
            <span class="panel-kicker">Account Monitor</span>
            <h3>账户资金</h3>
            <p>读取 Binance USDⓈ-M 账户、持仓、委托和成交数据。</p>
          </div>
        </div>
      </template>
      <el-form :inline="true" class="query-form">
        <el-form-item label="交易账户">
          <el-select v-model="credentialId" filterable placeholder="请选择交易账户" @change="refresh">
            <el-option
              v-for="credential in credentials"
              :key="credential.id"
              :label="`${credential.accountName}（${credential.userName || credential.userId}）`"
              :value="credential.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="交易对">
          <el-input v-model="symbol" clearable placeholder="可选，例如 BTCUSDT" @keyup.enter="refresh" />
        </el-form-item>
        <el-form-item v-if="activeTab === 'trades'" label="成交方向">
          <el-select v-model="tradeSide" clearable placeholder="请选择">
            <el-option label="买入" value="BUY" />
            <el-option label="卖出" value="SELL" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="activeTab === 'trades'" label="成交时间">
          <el-date-picker v-model="tradeTimeRange" range-separator="至" type="daterange" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item>
          <el-button :disabled="!credentialId" :loading="loading" icon="Refresh" type="primary" @click="refresh">
            刷新
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="12" class="summary-row">
      <el-col v-for="item in summaryItems" :key="item.label" :lg="6" :sm="12" :xs="24">
        <el-card class="summary-card" shadow="hover">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-panel" shadow="hover">
      <el-tabs v-model="activeTab" @tab-change="loadTab">
        <el-tab-pane label="当前持仓" name="positions">
          <el-table v-loading="loadingTab" :data="positions" border>
            <el-table-column align="center" label="序号" type="index" width="80" />
            <el-table-column label="客户名称" min-width="130">
              <template #default>{{ selectedCredential?.accountName || '-' }}</template>
            </el-table-column>
            <el-table-column label="交易对" min-width="150" prop="symbol" />
            <el-table-column label="方向" min-width="80" prop="side" />
            <el-table-column label="持仓数量" min-width="100" prop="quantity" />
            <el-table-column label="开仓均价" min-width="100" prop="entryPrice" />
            <el-table-column label="标记价" min-width="100" prop="markPrice" />
            <el-table-column label="未实现盈亏" min-width="100" prop="unrealizedPnl">
              <template #default="scope">
                {{ formatDecimal(scope.row.unrealizedPnl) }}
              </template>
            </el-table-column>
            <el-table-column label="收益率" min-width="100">
              <template #default="scope">{{ formatRoi(scope.row.unrealizedPnl, scope.row.margin) }}</template>
            </el-table-column>
            <el-table-column label="杠杆" min-width="80" prop="leverage" />
            <el-table-column label="保证金" min-width="100" prop="margin" />
            <el-table-column label="强平价" min-width="100" prop="liquidationPrice" />
            <el-table-column label="止盈价" min-width="100" prop="takeProfitPrice" />
            <el-table-column label="止损价" min-width="100" prop="stopLossPrice" />
            <el-table-column fixed="right" label="操作" width="100">
              <template #default="scope">
                <el-button link type="danger" @click="openClose(scope.row as PositionSnapshot)">平仓</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="当前委托" name="orders">
          <el-table v-loading="loadingTab" :data="orders" border>
            <el-table-column align="center" label="序号" type="index" width="80" />
            <el-table-column label="客户名称" min-width="130">
              <template #default>{{ selectedCredential?.accountName || '-' }}</template>
            </el-table-column>
            <el-table-column label="交易对" min-width="150" prop="symbol" />
            <el-table-column label="订单 ID" min-width="150" prop="orderId" />
            <el-table-column label="方向" min-width="80" prop="side" />
            <el-table-column label="持仓数量" min-width="100" prop="originalQuantity" />
            <el-table-column label="开仓均价" min-width="100">-</el-table-column>
            <el-table-column label="委托价格" min-width="100" prop="price" />
            <el-table-column align="center" label="委托时间" prop="updateTime" width="220" />
            <el-table-column fixed="right" label="操作" width="100">
              <template #default="scope">
                <el-button link type="danger" @click="submitCancel(scope.row as OrderSnapshot)">取消委托</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="成交记录" name="trades">
          <div class="table-toolbar">
            <el-button
              :disabled="!symbol.trim()"
              :loading="syncLoading"
              icon="Refresh"
              type="primary"
              @click="syncTradeRecords"
            >
              同步成交
            </el-button>
            <span v-if="!symbol.trim()" class="toolbar-tip">请先输入交易对，再同步成交记录</span>
          </div>
          <el-table v-loading="loadingTab" :data="trades" border>
            <el-table-column align="center" label="序号" type="index" width="80">
              <template #default="scope">
                <span>{{ (tradeQuery.pageNum - 1) * tradeQuery.pageSize + scope.$index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="客户名称" min-width="130" prop="customerName" />
            <el-table-column label="交易对" min-width="130" prop="symbol" />
            <el-table-column label="成交方向" min-width="100" prop="side" />
            <el-table-column label="成交数量" min-width="110" prop="quantity" />
            <el-table-column label="成交价" min-width="110">
              <template #default="scope">{{ formatDecimal(scope.row.price) }}</template>
            </el-table-column>
            <el-table-column label="成交金额" min-width="120">
              <template #default="scope">{{ formatAmount(scope.row.quantity, scope.row.price) }}</template>
            </el-table-column>
            <el-table-column label="手续费" min-width="100" prop="commission" />
            <el-table-column label="已实现盈亏" min-width="100" prop="realizedPnl" />
            <el-table-column label="成交时间" min-width="180" prop="tradeTime" />
          </el-table>
          <pagination
            v-show="tradesTotal > 0"
            v-model:limit="tradeQuery.pageSize"
            v-model:page="tradeQuery.pageNum"
            :total="tradesTotal"
            @pagination="loadTab"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
    <el-dialog v-model="closeDialogVisible" title="平仓" width="460px">
      <el-form :model="closeForm" label-width="100px">
        <el-form-item label="交易对">
          <span>{{ closeForm.symbol }}</span>
        </el-form-item>
        <el-form-item label="持仓方向">
          <span>{{ closeForm.positionSide }}</span>
        </el-form-item>
        <el-form-item label="平仓数量">
          <el-input-number
            v-model="closeForm.quantity"
            :max="closeForm.maxQuantity"
            :min="0"
            :precision="12"
            controls-position="right"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialogVisible = false">取消</el-button>
        <el-button :loading="closeLoading" type="danger" @click="submitClose">确认平仓</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import type { AccountSnapshot, CredentialVO, OrderSnapshot, PositionSnapshot, TradeRecord } from '@/api/quant/types';
import {
  cancelOrder,
  closePosition,
  getAccountSnapshot,
  listCredential,
  listOrders,
  listPositions,
  listTrades,
  syncTrades
} from '@/api/quant';

const loading = ref(false);
const loadingTab = ref(false);
const credentials = ref<CredentialVO[]>([]);
const credentialId = ref<string>();
const selectedCredential = computed(() =>
  credentials.value.find(item => String(item.id) === String(credentialId.value))
);
const symbol = ref('');
const activeTab = ref('positions');
const account = ref<AccountSnapshot>();
const positions = ref<PositionSnapshot[]>([]);
const orders = ref<OrderSnapshot[]>([]);
const trades = ref<TradeRecord[]>([]);
const tradesTotal = ref(0);
const tradeQuery = reactive<PageQuery>({ pageNum: 1, pageSize: 10 });
const tradeSide = ref('');
const tradeTimeRange = ref<string[]>([]);
const syncLoading = ref(false);
const closeDialogVisible = ref(false);
const closeLoading = ref(false);
const closeForm = reactive({ symbol: '', positionSide: '', side: '', quantity: 0, maxQuantity: 0 });

const formatDecimal = (value: string | number | undefined) => {
  if (value === undefined || value === null || value === '') return '-';
  const text = String(value);
  return text.includes('E') || text.includes('e')
    ? Number(text).toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 })
    : text.replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');
};

const formatAmount = (quantity: string | number, price: string | number) => {
  const amount = Number(quantity) * Number(price);
  return Number.isFinite(amount) ? formatDecimal(amount) : '-';
};

const formatRoi = (pnl: string | number, margin: string | number) => {
  const denominator = Number(margin);
  if (!Number.isFinite(denominator) || denominator === 0) return '-';
  return `${formatDecimal((Number(pnl) / denominator) * 100)}%`;
};

const summaryItems = computed(() => [
  { label: '总余额', value: formatDecimal(account.value?.walletBalance) },
  { label: '可用余额', value: formatDecimal(account.value?.availableBalance) },
  { label: '保证金余额', value: formatDecimal(account.value?.marginBalance) },
  { label: '未实现盈亏', value: formatDecimal(account.value?.unrealizedPnl) }
]);

const loadCredentials = async () => {
  const res = await listCredential({ pageNum: 1, pageSize: 100 });
  credentials.value = res.data?.rows || [];
  if (!credentialId.value && credentials.value.length > 0) {
    credentialId.value = credentials.value[0].id as string;
  }
};

const loadTab = async () => {
  if (!credentialId.value) return;
  loadingTab.value = true;
  try {
    if (activeTab.value === 'positions')
      positions.value = (await listPositions(credentialId.value, symbol.value)).data || [];
    if (activeTab.value === 'orders') orders.value = (await listOrders(credentialId.value, symbol.value)).data || [];
    if (activeTab.value === 'trades') {
      const result = await listTrades(credentialId.value, symbol.value.trim() || undefined, {
        ...tradeQuery,
        side: tradeSide.value || undefined,
        from: tradeTimeRange.value[0],
        to: tradeTimeRange.value[1]
      });
      trades.value = result.data?.rows || [];
      tradesTotal.value = result.data?.total || 0;
    }
  } finally {
    loadingTab.value = false;
  }
};

const refresh = async () => {
  if (!credentialId.value) return;
  loading.value = true;
  try {
    tradeQuery.pageNum = 1;
    account.value = (await getAccountSnapshot(credentialId.value)).data;
    await loadTab();
  } finally {
    loading.value = false;
  }
};

const syncTradeRecords = async () => {
  if (!credentialId.value || !symbol.value.trim()) return;
  syncLoading.value = true;
  try {
    await syncTrades(credentialId.value, symbol.value.trim());
    tradeQuery.pageNum = 1;
    await loadTab();
  } finally {
    syncLoading.value = false;
  }
};

const submitCancel = async (row: OrderSnapshot) => {
  if (!credentialId.value) return;
  await cancelOrder({
    credentialId: credentialId.value,
    symbol: row.symbol,
    orderId: row.orderId,
    clientOrderId: row.clientOrderId,
    idempotencyKey: crypto.randomUUID()
  });
  await loadTab();
};

const openClose = (row: PositionSnapshot) => {
  const quantity = Number(row.quantity);
  closeForm.symbol = row.symbol;
  closeForm.positionSide = row.side;
  closeForm.side = row.side === 'SHORT' ? 'BUY' : row.side === 'LONG' ? 'SELL' : quantity >= 0 ? 'SELL' : 'BUY';
  closeForm.quantity = Math.abs(quantity);
  closeForm.maxQuantity = Math.abs(quantity);
  closeDialogVisible.value = true;
};

const submitClose = async () => {
  if (!credentialId.value || closeForm.quantity <= 0) return;
  closeLoading.value = true;
  try {
    await closePosition({
      credentialId: String(credentialId.value),
      symbol: closeForm.symbol,
      side: closeForm.side,
      positionSide: closeForm.positionSide,
      quantity: closeForm.quantity,
      idempotencyKey: crypto.randomUUID()
    });
    closeDialogVisible.value = false;
    try {
      await syncTrades(credentialId.value, closeForm.symbol);
    } catch {
      ElMessage.warning('平仓请求已提交，成交记录同步失败，请稍后手动同步');
    }
    await refresh();
  } finally {
    closeLoading.value = false;
  }
};

onMounted(async () => {
  await loadCredentials();
  await refresh();
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;

.summary-row {
  margin: 12px 0;
}

.summary-card {
  span {
    display: block;
    color: var(--el-text-color-secondary);
  }

  strong {
    display: block;
    margin-top: 8px;
    font-size: 22px;
  }
}
</style>
