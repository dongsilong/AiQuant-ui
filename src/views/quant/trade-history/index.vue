<template>
  <div>
    <el-alert
      class="history-note"
      type="info"
      :closable="false"
      title="一行代表一个持仓周期；开仓金额为实际保证金，盈亏为已实现盈亏（未扣手续费）。历史保证金、杠杆未记录时显示 —；手续费沿用原账本金额，币种未记录。时间为北京时间。"
    />
    <el-alert
      v-if="incompleteCount"
      class="history-note"
      type="warning"
      :closable="false"
      :title="`${incompleteCount} 个账户与交易对的成交链不完整或来源不明确，已排除，避免展示错误开平仓记录。`"
    />
    <AdminLedgerTable title="开平仓记录" :columns="columns" :filters="filters" :load-page="loadPage" />
  </div>
</template>
<script lang="ts" setup>
import { listTradeHistory } from '@/api/quant/trade-history';
import AdminLedgerTable from '../components/AdminLedgerTable.vue';
import { displayDecimal } from '../components/ledger-display';
import { useCredentialOptions } from '../components/useCredentialOptions';

const { credentialFilter } = useCredentialOptions();
const incompleteCount = ref(0);
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
const decimal = (value: unknown) => (value == null ? '—' : displayDecimal(value));
const time = (value: unknown) => (value ? timeFormatter.format(new Date(String(value))) : '—');
const columns = [
  { prop: 'accountName', label: '客户名称' },
  { prop: 'symbol', label: '交易对' },
  {
    prop: 'direction',
    label: '开仓方向',
    formatter: (row: Record<string, unknown>) =>
      row.direction === 'LONG' ? '开多' : row.direction === 'SHORT' ? '开空' : '—'
  },
  { prop: 'entryPrice', label: '开仓价', formatter: (row: Record<string, unknown>) => decimal(row.entryPrice) },
  { prop: 'openingMargin', label: '开仓金额', formatter: (row: Record<string, unknown>) => decimal(row.openingMargin) },
  {
    prop: 'leverage',
    label: '杠杆',
    formatter: (row: Record<string, unknown>) => (row.leverage == null ? '—' : `${row.leverage}x`)
  },
  { prop: 'openedAt', label: '开仓时间', width: 180, formatter: (row: Record<string, unknown>) => time(row.openedAt) },
  { prop: 'closePrice', label: '平仓价', formatter: (row: Record<string, unknown>) => decimal(row.closePrice) },
  { prop: 'realizedPnl', label: '盈亏', formatter: (row: Record<string, unknown>) => decimal(row.realizedPnl) },
  { prop: 'commission', label: '手续费', formatter: (row: Record<string, unknown>) => decimal(row.commission) },
  { prop: 'closedAt', label: '平仓时间', width: 180, formatter: (row: Record<string, unknown>) => time(row.closedAt) }
];
const filters = computed(() => [
  { ...credentialFilter.value, label: '客户名称', placeholder: '全部客户' },
  { key: 'symbol', label: '交易对', placeholder: '例如 BTCUSDT' },
  { key: 'from', label: '开仓开始日期', placeholder: 'yyyy-MM-dd' },
  { key: 'to', label: '开仓结束日期', placeholder: 'yyyy-MM-dd' }
]);
const loadPage = async (query: PageQuery & Record<string, string | number | undefined>) => {
  try {
    const result = await listTradeHistory({ ...query });
    incompleteCount.value = result.data?.incompleteCount || 0;
    return result;
  } catch (error) {
    incompleteCount.value = 0;
    // 请求封装已显示后端错误，不保留上一次筛选的行。
    return { data: { rows: [], total: 0 } };
  }
};
</script>
<style scoped>
.history-note {
  margin: 8px;
}
</style>
