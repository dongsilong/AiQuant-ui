<template>
  <div class="p-2 app-container">
    <AdminLedgerTable :columns="columns" :detail="true" :filters="filters" :load-page="loadPage" title="执行账本" />
    <el-card v-if="canViewFillAudit" class="mt-3" shadow="never">
      <template #header>
        <div>
          <h3>策略真实成交归属审计（只读）</h3>
          <p class="text-sm text-gray-500">仅统计已匹配 Binance 成交 ID 的策略累计成交、费用与已实现盈亏，不等于当前持仓数量或未实现盈亏。</p>
        </div>
      </template>
      <el-form :model="auditQuery" inline>
        <el-form-item label="账户 ID">
          <el-select v-model="auditQuery.credentialId" placeholder="请选择账户" clearable filterable :loading="auditOptionsLoading">
            <el-option v-for="item in auditCredentialOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="策略 ID">
          <el-select v-model="auditQuery.strategyId" placeholder="请选择策略" clearable filterable :loading="instanceOptionsLoading" :disabled="!auditQuery.credentialId || instanceOptionsLoading">
            <el-option v-for="item in auditStrategyOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="实例 ID">
          <el-select v-model="auditQuery.instanceId" placeholder="请选择实例" clearable filterable :loading="instanceOptionsLoading" :disabled="!auditQuery.strategyId">
            <el-option v-for="item in auditInstanceOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="交易对">
          <el-input v-model="auditQuery.symbol" placeholder="BTCUSDT" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="auditLoading" @click="loadFillAudit">核对成交归属</el-button>
        </el-form-item>
      </el-form>
      <el-alert v-if="fillAudit" type="info" show-icon :closable="false"
        title="以下为策略历史已归属成交的累计汇总。不能用买入减卖数量推导当前 LONG/SHORT 仓位；未匹配成交需在对账中人工复核。" />
      <el-descriptions v-if="fillAudit" class="mt-3" :column="3" border>
        <el-descriptions-item label="交易对">{{ fillAudit.symbol }}</el-descriptions-item>
        <el-descriptions-item label="策略实例">{{ fillAudit.instanceId }}</el-descriptions-item>
        <el-descriptions-item label="已归属成交笔数">{{ fillAudit.fillCount }}</el-descriptions-item>
        <el-descriptions-item label="累计买入数量">{{ fillAudit.boughtQty }}</el-descriptions-item>
        <el-descriptions-item label="累计卖出数量">{{ fillAudit.soldQty }}</el-descriptions-item>
        <el-descriptions-item label="累计手续费（按币种）">
          <div v-if="fillAudit.feeBreakdown?.length">
            <div v-for="fee in fillAudit.feeBreakdown" :key="fee.asset">{{ fee.asset === 'UNKNOWN' ? '未知币种' : fee.asset }}：{{ fee.amount }}</div>
          </div>
          <span v-else>—</span>
        </el-descriptions-item>
        <el-descriptions-item label="累计买入成交金额">{{ fillAudit.boughtNotional }}</el-descriptions-item>
        <el-descriptions-item label="累计卖出成交金额">{{ fillAudit.soldNotional }}</el-descriptions-item>
        <el-descriptions-item label="累计已实现盈亏">{{ fillAudit.realizedPnl }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>
<script lang="ts" setup>
import { getStrategyFillAuditSummary, listCredential, listExecution, listStrategyInstances } from '@/api/quant';
import type { CredentialVO, StrategyFillAuditSummary, StrategyInstanceVO } from '@/api/quant/types';
import { useUserStore } from '@/store/modules/user';
import { ElMessage } from 'element-plus';
import AdminLedgerTable from '../components/AdminLedgerTable.vue';
import {
  displayLabel,
  labelOptions,
  operationTypes,
  executionStatuses,
  protectionStatuses
} from '../components/ledger-display';
import { useCredentialOptions } from '../components/useCredentialOptions';

const { credentialFilter } = useCredentialOptions();

const userStore = useUserStore();
const canViewFillAudit = computed(() =>
  userStore.permissions.includes('*:*:*') || userStore.permissions.includes('quant:allocation:view'));
const auditLoading = ref(false);
const auditOptionsLoading = ref(false);
const instanceOptionsLoading = ref(false);
const fillAudit = ref<StrategyFillAuditSummary | null>(null);
const auditQuery = reactive({ credentialId: '', strategyId: '', instanceId: '', symbol: '' });
const auditCredentials = ref<CredentialVO[]>([]);
const auditInstances = ref<StrategyInstanceVO[]>([]);
const auditCredentialOptions = computed(() => auditCredentials.value.map(item => ({
  label: `${item.accountName}（${item.userName || item.userId}） · ${item.id}`,
  value: String(item.id)
})));
const auditStrategyOptions = computed(() => {
  const strategies = new Map<string, string>();
  auditInstances.value.forEach(item => {
    if (item.strategyId != null) strategies.set(String(item.strategyId), item.strategyName || '未知策略');
  });
  return [...strategies].map(([id, name]) => ({ label: `${name} · ${id}`, value: id }));
});
const auditInstanceOptions = computed(() => auditInstances.value
  .filter(item => String(item.strategyId) === auditQuery.strategyId)
  .map(item => ({
    label: `${item.symbol || '未知交易对'} · ${item.status || '未知状态'} · ${item.id}`,
    value: String(item.id)
  })));

const loadAllPages = async <T,>(fetchPage: (pageNum: number) => Promise<{ data?: { rows?: T[]; total?: number } }>) => {
  const rows: T[] = [];
  let pageNum = 1;
  let total = 0;
  do {
    const result = await fetchPage(pageNum++);
    const pageRows = result.data?.rows || [];
    rows.push(...pageRows);
    total = result.data?.total || 0;
    if (!pageRows.length) break;
  } while (rows.length < total);
  return rows;
};

const loadAuditOptions = async () => {
  auditOptionsLoading.value = true;
  try {
    auditCredentials.value = await loadAllPages(pageNum => listCredential({ pageNum, pageSize: 100 }));
  } catch {
    ElMessage.error('账户或策略选项加载失败，请检查当前用户的数据权限');
  } finally {
    auditOptionsLoading.value = false;
  }
};

const loadAuditInstances = async () => {
  auditInstances.value = [];
  auditQuery.instanceId = '';
  if (!auditQuery.credentialId) return;
  instanceOptionsLoading.value = true;
  try {
    auditInstances.value = await loadAllPages(pageNum =>
      listStrategyInstances({ credentialId: auditQuery.credentialId, pageNum, pageSize: 100 })
    );
  } catch {
    ElMessage.error('策略实例选项加载失败，请检查策略查询权限');
  } finally {
    instanceOptionsLoading.value = false;
  }
};

watch(() => auditQuery.credentialId, () => {
  auditQuery.strategyId = '';
  auditQuery.instanceId = '';
  void loadAuditInstances();
});
watch(() => auditQuery.strategyId, () => {
  auditQuery.instanceId = '';
});
onMounted(loadAuditOptions);

const loadFillAudit = async () => {
  fillAudit.value = null;
  const ids = [auditQuery.credentialId, auditQuery.strategyId, auditQuery.instanceId];
  if (!ids.every(id => /^[1-9][0-9]*$/.test(id))
    || !/^[A-Za-z0-9]{2,32}$/.test(auditQuery.symbol.trim())) {
    ElMessage.warning('请输入完整的账户、策略、实例数字 ID 和有效交易对；不可用 JS Number 转换大整数');
    return;
  }
  auditLoading.value = true;
  try {
    const result = await getStrategyFillAuditSummary({
      credentialId: auditQuery.credentialId,
      strategyId: auditQuery.strategyId,
      instanceId: auditQuery.instanceId,
      symbol: auditQuery.symbol.trim().toUpperCase()
    });
    fillAudit.value = result.data;
  } finally {
    auditLoading.value = false;
  }
};


const columns = [
  { prop: 'accountName', label: '账户' },
  { prop: 'symbol', label: '交易对' },
  {
    prop: 'operationType',
    label: '操作类型',
    formatter: (row: Record<string, unknown>) => displayLabel(operationTypes, row.operationType)
  },
  {
    prop: 'executionStatus',
    label: '执行状态',
    formatter: (row: Record<string, unknown>) => displayLabel(executionStatuses, row.executionStatus)
  },
  {
    prop: 'idempotencyKey',
    label: '幂等键'
  },
  {
    prop: 'exchangeOrderStatus',
    label: '交易所订单状态',
    formatter: (row: Record<string, unknown>) => displayLabel(protectionStatuses, row.exchangeOrderStatus)
  },
  { prop: 'createdAt', label: '创建时间' }
];
const filters = computed(() => [
  credentialFilter.value,
  { key: 'executionStatus', label: '执行状态', type: 'select' as const, options: labelOptions(executionStatuses) },
  { key: 'symbol', label: '交易对', type: 'input' as const },
  { key: 'exchangeOrderStatus', label: '订单状态', type: 'select' as const, options: labelOptions(protectionStatuses) },
  { key: 'timeRange', label: '时间范围', type: 'daterange' as const }
]);
const loadPage = (query: PageQuery) => listExecution(query);
</script>
