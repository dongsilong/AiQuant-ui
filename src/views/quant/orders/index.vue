<template>
  <div class="p-2 app-container quant-market-page">
    <div class="search-wrap">
      <el-card shadow="hover" class="search-panel">
        <template #heade>
          <div class="toolbar-shell">
            <div class="table-heading">
              <span class="panel-kicker">Order Ledger</span>
              <h3>订单管理</h3>
              <p>查询本地订单账本，撤单走统一幂等执行服务。</p>
            </div>
            <el-button :loading="loading" icon="Refresh" plain type="primary" @click="load">刷新</el-button>
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
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">Symbol Dataset</span>
            <h3>订单列表</h3>
            <p>同步 Binance USDⓈ-M 交易所过滤器和交易状态。</p>
          </div>
          <div class="toolbar-actions">
            <right-toolbar :search="false" @query-table="load" />
          </div>
        </div>
      </template>
      <el-table v-loading="loading" :data="rows" border>
        <el-table-column label="交易对" prop="symbol" />
        <el-table-column label="Exchange ID" prop="orderId" />
        <el-table-column label="ClientOrderId" min-width="180" prop="clientOrderId" />
        <el-table-column label="方向" prop="side" />
        <el-table-column label="类型" prop="type" />
        <el-table-column label="价格" prop="price" />
        <el-table-column label="数量" prop="originalQuantity" />
        <el-table-column label="已成交" prop="executedQuantity" />
        <el-table-column label="状态" prop="status" />
        <el-table-column label="更新时间" prop="updateTime" />
        <el-table-column fixed="right" label="操作" width="90">
          <template #default="scope">
            <el-button
              v-if="['NEW', 'PARTIALLY_FILLED'].includes(scope.row.status)"
              v-hasPermi="['quant:order:cancel']"
              link
              type="danger"
              @click="cancel(scope.row as OrderSnapshot)"
            >
              撤单
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
<script lang="ts" setup>
import type { CredentialVO, OrderSnapshot } from '@/api/quant/types';
import { cancelOrder, listCredential, listOrders } from '@/api/quant';
import modal from '@/plugins/modal';

const loading = ref(false);
const credentials = ref<CredentialVO[]>([]);
const rows = ref<OrderSnapshot[]>([]);
const credentialId = ref<number | string>();
const symbol = ref('');
const loadCredentials = async () => {
  credentials.value = (await listCredential({ pageNum: 1, pageSize: 100 })).data?.rows || [];
  if (!credentialId.value) credentialId.value = credentials.value[0]?.id;
};
const load = async () => {
  if (!credentialId.value) {
    rows.value = [];
    return;
  }
  loading.value = true;
  try {
    rows.value = (await listOrders(credentialId.value, symbol.value || undefined)).data || [];
  } finally {
    loading.value = false;
  }
};
const cancel = async (row: OrderSnapshot) => {
  if (!credentialId.value) return;
  await modal.confirm('确认撤销该订单吗？');
  await cancelOrder({
    credentialId: credentialId.value,
    symbol: row.symbol,
    orderId: row.orderId,
    clientOrderId: row.clientOrderId,
    idempotencyKey: crypto.randomUUID()
  });
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
