<template>
  <AdminLedgerTable
    :columns="columns"
    :detail="true"
    :filters="filters"
    :load-page="loadPage"
    :retry="retry"
    title="通知中心"
  />
</template>
<script lang="ts" setup>
import { listNotifications, retryNotification } from '@/api/quant';
import AdminLedgerTable from '../components/AdminLedgerTable.vue';
import { displayLabel, labelOptions, notificationChannels, notificationStatuses } from '../components/ledger-display';
import { useCredentialOptions } from '../components/useCredentialOptions';

const { credentialFilter, accountName } = useCredentialOptions();

const columns = [
  {
    prop: 'credentialId',
    label: '账户',
    formatter: (row: Record<string, unknown>) => String(row.accountName || accountName(row.credentialId))
  },
  {
    prop: 'channel',
    label: '渠道',
    formatter: (row: Record<string, unknown>) => displayLabel(notificationChannels, row.channel)
  },
  { prop: 'subject', label: '主题' },
  {
    prop: 'status',
    label: '状态',
    formatter: (row: Record<string, unknown>) => displayLabel(notificationStatuses, row.status)
  },
  {
    prop: 'retryCount',
    label: '重试次数'
  },
  { prop: 'createdAt', label: '创建时间' }
];
const filters = computed(() => [
  credentialFilter.value,
  { key: 'status', label: '状态', type: 'select' as const, options: labelOptions(notificationStatuses) }
]);
const loadPage = (query: PageQuery) => listNotifications(query);
const retry = async (row: { id: number | string }) => {
  await retryNotification(row.id);
};
</script>
