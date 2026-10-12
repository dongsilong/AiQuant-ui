<template>
  <AdminLedgerTable :columns="columns" :detail="true" :filters="filters" :load-page="loadPage" title="保护单" />
</template>
<script lang="ts" setup>
import { listProtection } from '@/api/quant';
import AdminLedgerTable from '../components/AdminLedgerTable.vue';
import {
  displayLabel,
  labelOptions,
  protectionTypes,
  orderTypes,
  protectionStatuses,
  displayDecimal
} from '../components/ledger-display';
import { useCredentialOptions } from '../components/useCredentialOptions';

const { credentialFilter } = useCredentialOptions();

const columns = [
  { prop: 'accountName', label: '账户' },
  { prop: 'symbol', label: '交易对' },
  {
    prop: 'protectionType',
    label: '保护类型',
    formatter: (row: Record<string, unknown>) => displayLabel(protectionTypes, row.protectionType)
  },
  {
    prop: 'orderType',
    label: '订单类型',
    formatter: (row: Record<string, unknown>) => displayLabel(orderTypes, row.orderType)
  },
  { prop: 'stopPrice', label: '触发价', formatter: (row: Record<string, unknown>) => displayDecimal(row.stopPrice) },
  {
    prop: 'status',
    label: '状态',
    formatter: (row: Record<string, unknown>) => displayLabel(protectionStatuses, row.status)
  }
];
const filters = computed(() => [
  credentialFilter.value,
  { key: 'symbol', label: '交易对', placeholder: '例如 BTCUSDT' },
  { key: 'status', label: '状态', type: 'select' as const, options: labelOptions(protectionStatuses) }
]);
const loadPage = (query: PageQuery) => listProtection(query);
</script>
