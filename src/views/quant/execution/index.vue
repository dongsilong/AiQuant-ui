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
          <el-input v-model="auditQuery.credentialId" placeholder="完整账户 ID" clearable />
        </el-form-item>
        <el-form-item label="策略 ID">
          <el-input v-model="auditQuery.strategyId" placeholder="完整策略 ID" clearable />
        </el-form-item>
        <el-form-item label="实例 ID">
          <el-input v-model="auditQuery.instanceId" placeholder="完整实例 ID" clearable />
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
        <el-descriptions-item label="累计手续费">{{ fillAudit.totalFees }}</el-descriptions-item>
        <el-descriptions-item label="累计买入成交金额">{{ fillAudit.boughtNotional }}</el-descriptions-item>
        <el-descriptions-item label="累计卖出成交金额">{{ fillAudit.soldNotional }}</el-descriptions-item>
        <el-descriptions-item label="累计已实现盈亏">{{ fillAudit.realizedPnl }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>
<script lang="ts" setup>
import { getStrategyFillAuditSummary, listExecution } from '@/api/quant';
import type { StrategyFillAuditSummary } from '@/api/quant/types';
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
const fillAudit = ref<StrategyFillAuditSummary | null>(null);
const auditQuery = reactive({ credentialId: '', strategyId: '', instanceId: '', symbol: '' });

const loadFillAudit = async () => {
  fillAudit.value = null;
  const ids = [auditQuery.credentialId, auditQuery.strategyId, auditQuery.instanceId];
  if (!ids.every(id => /^[1-9][0-9]*$/.test(id.trim()))
    || !/^[A-Za-z0-9]{2,32}$/.test(auditQuery.symbol.trim())) {
    ElMessage.warning('请输入完整的账户、策略、实例数字 ID 和有效交易对；不可用 JS Number 转换大整数');
    return;
  }
  auditLoading.value = true;
  try {
    const result = await getStrategyFillAuditSummary({
      credentialId: auditQuery.credentialId.trim(),
      strategyId: auditQuery.strategyId.trim(),
      instanceId: auditQuery.instanceId.trim(),
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
