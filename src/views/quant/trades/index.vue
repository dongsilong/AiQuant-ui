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
                <p>同步时会一起拉取近 90 天订单与逐笔成交，并补齐订单来源事实；交易对留空时，按当前账户已知交易对同步。超过 3 天的无成交取消/过期订单可能已不再由交易所返回。</p>
              </div>
              <el-button
                v-if="canSyncTradingData"
                :disabled="!credentialId || credentialId === 'ALL'"
                :loading="syncing"
                icon="Refresh"
                plain
                type="primary"
                @click="sync"
              >
                同步订单与成交
              </el-button>
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
      <el-alert
        v-if="syncTask && ['PENDING', 'RUNNING'].includes(syncTask.status)"
        :title="syncProgressText"
        :closable="false"
        show-icon
        type="info"
        class="mb-2"
      />
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
import type { CredentialVO, TradeRecord, TradingSyncTask } from '@/api/quant/types';
import { getTradingSyncTask, listAccessibleTrades, listCredential, syncTrades } from '@/api/quant';
import { displayDecimal } from '../components/ledger-display';
import { ensureQuantSymbolTickSizes, formatQuantQuantity, formatQuantTablePrice } from '../components/price-format';
import modal from '@/plugins/modal';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
const canSyncTradingData = computed(() => userStore.permissions.includes('*:*:*')
  || userStore.permissions.includes('quant:order:sync') && userStore.permissions.includes('quant:trade:sync'));
const loading = ref(false);
const syncing = ref(false);
const syncTask = ref<TradingSyncTask>();
let syncPollTimer: number | undefined;
let activeSyncTaskId: string | undefined;
const syncProgressText = computed(() => {
  const task = syncTask.value;
  if (!task) return '';
  if (task.status === 'PENDING') return `同步任务 ${task.taskId} 排队中，后台即将开始处理。`;
  if (task.totalSymbolCount <= 0) return `同步任务 ${task.taskId} 正在查询 Binance 最近 90 天的历史订单。`;
  const current = task.currentSymbol ? `当前交易对：${task.currentSymbol}` : '正在整理同步结果';
  return `后台同步进度：${task.completedSymbolCount}/${task.totalSymbolCount} 个交易对；已处理 ${task.orderCount} 笔订单、${task.tradeCount} 笔完整成交。${current}`;
});
const credentials = ref<CredentialVO[]>([]);
const rows = ref<TradeRecord[]>([]);
const total = ref(0);
const credentialId = ref<number | string>('ALL');
const symbol = ref('');
const query = reactive<PageQuery>({ pageNum: 1, pageSize: 10 });
const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
});
const formatTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : timeFormatter.format(date);
};
const loadCredentials = async () => {
  credentials.value = (await listCredential({ pageNum: 1, pageSize: 100 })).data?.rows || [];
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
const stopSyncPolling = () => {
  if (syncPollTimer !== undefined) window.clearTimeout(syncPollTimer);
  syncPollTimer = undefined;
  activeSyncTaskId = undefined;
  syncing.value = false;
};
const pollSyncTask = async (taskId: string) => {
  if (activeSyncTaskId !== taskId) return;
  try {
    const response = await getTradingSyncTask(taskId);
    syncTask.value = response.data;
    if (response.data.status === 'SUCCESS') {
      stopSyncPolling();
      if (String(credentialId.value) === String(response.data.credentialId)) await load();
      modal.msgSuccess(`订单与成交同步完成：${response.data.orderCount} 笔订单，${response.data.tradeCount} 笔完整成交`);
      return;
    }
    if (response.data.status === 'FAILED') {
      stopSyncPolling();
      if (String(credentialId.value) === String(response.data.credentialId)) await load();
      modal.msgWarning(response.data.errorMessage || '订单与成交同步失败，请检查系统消息');
      return;
    }
  } catch {
    // 状态查询短暂失败时继续轮询，不影响后台任务。
  }
  if (activeSyncTaskId === taskId) {
    syncPollTimer = window.setTimeout(() => void pollSyncTask(taskId), 2000);
  }
};
const sync = async () => {
  if (!credentialId.value || credentialId.value === 'ALL') return modal.msgWarning('请先选择具体交易账户');
  if (syncing.value) return;
  syncing.value = true;
  syncTask.value = undefined;
  try {
    const response = await syncTrades(credentialId.value, symbol.value.trim() || undefined);
    const task = response.data;
    if (!task?.taskId) throw new Error('后台未返回有效的同步任务编号');
    activeSyncTaskId = String(task.taskId);
    syncTask.value = task;
    modal.msgSuccess('同步任务已提交，后台执行中；可以继续使用页面');
    void pollSyncTask(activeSyncTaskId);
  } catch (error) {
    stopSyncPolling();
    throw error;
  }
};
onBeforeUnmount(() => {
  if (syncPollTimer !== undefined) window.clearTimeout(syncPollTimer);
  activeSyncTaskId = undefined;
});
onMounted(async () => {
  await loadCredentials();
  await load();
});
</script>
<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;
</style>
