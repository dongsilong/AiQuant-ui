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
                <p>查询交易所成交事实，并支持按账户和交易对同步。</p>
              </div>
              <el-button
                v-hasPermi="['quant:trade:sync']"
                :loading="loading"
                icon="Refresh"
                plain
                type="primary"
                @click="sync"
              >
                同步成交
              </el-button>
            </div>
          </template>
          <el-form :inline="true" class="query-form">
            <el-form-item label="交易账户">
              <el-select v-model="credentialId" clearable placeholder="请选择账户" @change="load">
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
      <el-card class="table-panel" shadow="hover">
        <el-table v-loading="loading" :data="rows" border>
          <el-table-column label="成交时间" prop="tradeTime" min-width="160" />
          <el-table-column label="交易对" prop="symbol" min-width="160" />
          <el-table-column label="方向" prop="side" min-width="100" />
          <el-table-column label="价格" min-width="150">
            <template #default="scope">{{ formatDecimal(scope.row.price) }}</template>
          </el-table-column>
          <el-table-column label="数量" min-width="150">
            <template #default="scope">{{ formatDecimal(scope.row.quantity) }}</template>
          </el-table-column>
          <el-table-column label="手续费" min-width="150">
            <template #default="scope">{{ formatDecimal(scope.row.commission) }}</template>
          </el-table-column>
          <el-table-column label="已实现盈亏" min-width="150">
            <template #default="scope">{{ formatDecimal(scope.row.realizedPnl) }}</template>
          </el-table-column>
          <el-table-column label="Trade ID" prop="exchangeTradeId" min-width="120" />
          <el-table-column label="Order ID" prop="exchangeOrderId" min-width="120" />
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
import type { CredentialVO, TradeRecord } from '@/api/quant/types';
import { listCredential, listTrades, syncTrades } from '@/api/quant';
import modal from '@/plugins/modal';

const loading = ref(false);
const credentials = ref<CredentialVO[]>([]);
const rows = ref<TradeRecord[]>([]);
const total = ref(0);
const credentialId = ref<number | string>();
const symbol = ref('');
const query = reactive<PageQuery>({ pageNum: 1, pageSize: 10 });
const formatDecimal = (value: string | number | undefined) => {
  if (value === undefined || value === null || value === '') return '-';
  const text = String(value);
  return text.includes('e') || text.includes('E')
    ? Number(text).toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 })
    : text.replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');
};
const loadCredentials = async () => {
  credentials.value = (await listCredential({ pageNum: 1, pageSize: 100 })).data?.rows || [];
  if (!credentialId.value) credentialId.value = credentials.value[0]?.id;
};
const load = async () => {
  if (!credentialId.value) {
    rows.value = [];
    total.value = 0;
    return;
  }
  loading.value = true;
  try {
    const result = await listTrades(credentialId.value, symbol.value || undefined, query);
    rows.value = result.data?.rows || [];
    total.value = result.data?.total || 0;
  } finally {
    loading.value = false;
  }
};
const sync = async () => {
  if (!credentialId.value || !symbol.value) return modal.msgWarning('请先选择账户并输入交易对');
  await syncTrades(credentialId.value, symbol.value);
  await load();
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
