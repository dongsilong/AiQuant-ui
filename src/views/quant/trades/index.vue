<template>
  <div class="p-2 app-container quant-trades-page">
    <div class="p-2 app-container quant-symbol-page">
      <div class="search-wrap">
        <el-card class="search-panel" shadow="hover">
          <template #header>
            <div class="toolbar-shell">
              <div class="table-heading">
                <span class="panel-kicker">Trade Facts</span>
                <h3>成交记录</h3>
                <p>按所选时间范围同步历史订单与逐笔成交，并补齐订单来源事实；交易对留空时按当前账户已知交易对同步。注意：超过 3 天的无成交取消/过期订单可能已不再由交易所返回。</p>
              </div>
              <div class="toolbar-actions">
                <el-button
                  v-if="canSyncTradingData"
                  :loading="syncing"
                  icon="Refresh"
                  plain
                  type="primary"
                  @click="openSyncDialog"
                >同步订单与成交</el-button>
              </div>
            </div>
          </template>
          <el-form :inline="true" class="query-form">
            <el-form-item label="交易账户">
              <el-select v-model="credentialId" clearable placeholder="全部交易用户" @change="handleCredentialChange">
                <el-option label="全部交易用户" value="ALL" />
                <el-option v-for="item in credentials" :key="item.id" :label="item.accountName" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="交易对">
              <el-input v-model="symbol" clearable placeholder="BTCUSDT" @keyup.enter="load" />
            </el-form-item>
            <el-form-item>
              <el-button icon="Search" type="primary" @click="load">查询</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
      <el-dialog
        v-model="syncDialogVisible"
        title="同步订单与成交"
        width="520px"
        append-to-body
        :close-on-click-modal="false"
      >
        <el-form label-width="92px">
          <el-form-item label="交易账户" required>
            <el-select v-model="syncCredentialId" filterable placeholder="请选择交易账户" style="width: 100%">
              <el-option
                v-for="item in credentials"
                :key="item.id"
                :label="`${item.accountName}（${item.userName || item.userId}）`"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="历史范围">
            <el-select v-model="syncHistoryRange" style="width: 100%">
              <el-option label="最近 3 天" value="3d" />
              <el-option label="最近 7 天" value="7d" />
              <el-option label="最近 1 个月" value="1m" />
              <el-option label="最近 3 个月" value="3m" />
            </el-select>
          </el-form-item>
          <el-form-item label="交易对范围">
            <span>{{ symbol.trim() ? `仅同步 ${symbol.trim().toUpperCase()}` : '同步该账户所有已知交易对' }}</span>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button :disabled="syncing" @click="syncDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="syncing" @click="sync">开始同步</el-button>
        </template>
      </el-dialog>

      <el-card class="table-panel" shadow="hover">
        <el-table v-loading="loading" :data="rows" border>
          <el-table-column type="index" label="序号" width="80" align="center">
            <template #default="scope">{{ (query.pageNum - 1) * query.pageSize + scope.$index + 1 }}</template>
          </el-table-column>
          <el-table-column label="交易用户" min-width="120" show-overflow-tooltip>
            <template #default="scope">{{ scope.row.customerName || '-' }}</template>
          </el-table-column>
          <el-table-column label="交易对" prop="symbol" min-width="160" />
          <el-table-column label="方向" prop="side" min-width="100" />
          <el-table-column label="价格" min-width="150">
            <template #default="scope">{{ formatQuantTablePrice(scope.row.symbol, scope.row.price) }}</template>
          </el-table-column>
          <el-table-column label="数量" min-width="150">
            <template #default="scope">{{ formatQuantQuantity(scope.row.symbol, scope.row.quantity) }}</template>
          </el-table-column>
          <el-table-column label="手续费" min-width="150">
            <template #default="scope">{{ displayDecimal(scope.row.commission, 8) }}</template>
          </el-table-column>
          <el-table-column label="已实现盈亏" min-width="150">
            <template #default="scope">{{ displayDecimal(scope.row.realizedPnl, 8) }}</template>
          </el-table-column>
          <el-table-column label="Trade ID" prop="exchangeTradeId" min-width="120" />
          <el-table-column label="Order ID" prop="exchangeOrderId" min-width="120" />
          <el-table-column label="成交时间" prop="tradeTime" min-width="160">
            <template #default="scope">{{ formatTime(scope.row.tradeTime) }}</template>
          </el-table-column>
        </el-table>
        <pagination
          v-show="total > 0"
          v-model:limit="query.pageSize"
          v-model:page="query.pageNum"
          :total="total"
          @pagination="load"
        />
      </el-card>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { formatQuantTime } from '@/utils/quant-time';
import type { CredentialVO, TradeRecord } from '@/api/quant/types';
import type { ManualTradingHistoryRange } from '@/api/quant';
import { listAccessibleTrades, listCredential, syncTrades } from '@/api/quant';
import { displayDecimal } from '../components/ledger-display';
import { ensureQuantSymbolTickSizes, formatQuantQuantity, formatQuantTablePrice } from '../components/price-format';
import modal from '@/plugins/modal';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
const canSyncTradingData = computed(() => userStore.permissions.includes('*:*:*')
  || userStore.permissions.includes('quant:order:sync') && userStore.permissions.includes('quant:trade:sync'));
const loading = ref(false);
const syncing = ref(false);
const syncHistoryRange = ref<ManualTradingHistoryRange>('3d');
const syncDialogVisible = ref(false);
const syncCredentialId = ref<number | string>();
const credentials = ref<CredentialVO[]>([]);
const rows = ref<TradeRecord[]>([]);
const total = ref(0);
const credentialId = ref<number | string>('ALL');
const symbol = ref('');
const query = reactive<PageQuery>({ pageNum: 1, pageSize: 10 });
const formatTime = formatQuantTime;
const loadCredentials = async () => {
  const loaded: CredentialVO[] = [];
  let pageNum = 1;
  let total = 0;
  do {
    const result = await listCredential({ pageNum, pageSize: 100 });
    const pageRows = result.data?.rows || [];
    loaded.push(...pageRows);
    total = result.data?.total || 0;
    pageNum += 1;
    if (!pageRows.length) break;
  } while (loaded.length < total);
  credentials.value = loaded;
};
const load = async () => {
  loading.value = true;
  try {
    const [result] = await Promise.all([
      listAccessibleTrades(
        credentialId.value === 'ALL' ? undefined : credentialId.value,
        symbol.value || undefined,
        query
      ),
      ensureQuantSymbolTickSizes().catch(() => undefined)
    ]);
    rows.value = result.data?.rows || [];
    total.value = result.data?.total || 0;
  } finally {
    loading.value = false;
  }
};
const handleCredentialChange = () => {
  query.pageNum = 1;
  load();
};
const openSyncDialog = () => {
  syncCredentialId.value = credentialId.value && credentialId.value !== 'ALL' ? credentialId.value : undefined;
  syncDialogVisible.value = true;
};
const sync = async () => {
  const selectedCredentialId = syncCredentialId.value;
  if (selectedCredentialId == null || selectedCredentialId === '') return modal.msgWarning('请选择需要同步的交易账户');
  if (syncing.value) return;
  syncing.value = true;
  try {
    await syncTrades(selectedCredentialId, symbol.value.trim() || undefined, syncHistoryRange.value);
    syncDialogVisible.value = false;
    modal.msgSuccess('同步任务已提交，完成后将通过右上角系统消息通知；查看最新数据时请手动刷新表格');
  } finally {
    syncing.value = false;
  }
};
onMounted(async () => {
  await loadCredentials();
  await load();
});
</script>
<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;
</style>
