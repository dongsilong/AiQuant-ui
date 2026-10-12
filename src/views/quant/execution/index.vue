<template>
  <AdminLedgerTable :columns="columns" :detail="true" :filters="filters" :load-page="loadPage" title="执行账本" />
</template>
<script lang="ts" setup>
import { listExecution } from '@/api/quant';
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
