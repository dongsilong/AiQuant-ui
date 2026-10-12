<template>
  <AdminLedgerTable :columns="columns" :detail="true" :filters="filters" :load-page="loadPage" title="财务事件" />
</template>
<script lang="ts" setup>
import { listFinancial } from '@/api/quant';
import AdminLedgerTable from '../components/AdminLedgerTable.vue';
import { displayDecimal, displayLabel, financialEventTypes, labelOptions } from '../components/ledger-display';
import { useCredentialOptions } from '../components/useCredentialOptions';

const { credentialFilter, accountName } = useCredentialOptions();

const columns = [
  {
    prop: 'accountName',
    label: '账户',
    formatter: (row: Record<string, unknown>) => String(row.accountName || accountName(row.credentialId))
  },
  { prop: 'symbol', label: '交易对' },
  {
    prop: 'eventType',
    label: '事件类型',
    formatter: (row: Record<string, unknown>) => displayLabel(financialEventTypes, row.eventType)
  },
  { prop: 'amount', label: '金额', formatter: (row: Record<string, unknown>) => displayDecimal(row.amount) },
  {
    prop: 'asset',
    label: '资产'
  },
  { prop: 'eventTime', label: '事件时间' }
];
const filters = computed(() => [
  credentialFilter.value,
  { key: 'symbol', label: '交易对', placeholder: '例如 BTCUSDT' },
  { key: 'eventType', label: '事件类型', type: 'select' as const, options: labelOptions(financialEventTypes) }
]);
const loadPage = (query: PageQuery) => listFinancial(query);
</script>
