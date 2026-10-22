<template>
  <div class="p-2 app-container quant-symbol-page">
    <div class="search-wrap">
      <el-card class="search-panel" shadow="hover">
        <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">Position Facts</span>
            <h3>持仓管理</h3>
            <p>查询交易所持仓事实，并沿用统一幂等平仓链路。</p>
          </div>
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
        <el-table-column type="index" label="序号" width="80" align="center">
          <template #default="scope">{{ scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column label="交易对" prop="symbol" />
        <el-table-column label="方向">
          <template #default="scope"><dict-tag :options="quant_position_direction" :value="positionDirection(scope.row)" /></template>
        </el-table-column>
        <el-table-column label="数量" prop="quantity" />
        <el-table-column label="开仓均价" prop="entryPrice"><template #default="scope">{{ formatQuantPrice(scope.row.symbol, scope.row.entryPrice) }}</template></el-table-column>
        <el-table-column label="标记价格" prop="markPrice"><template #default="scope">{{ formatQuantPrice(scope.row.symbol, scope.row.markPrice) }}</template></el-table-column>
        <el-table-column label="未实现盈亏" prop="unrealizedPnl" />
        <el-table-column label="杠杆" prop="leverage" />
        <el-table-column label="保证金" prop="margin" />
        <el-table-column label="强平价" prop="liquidationPrice"><template #default="scope">{{ formatQuantPrice(scope.row.symbol, scope.row.liquidationPrice) }}</template></el-table-column>
        <el-table-column fixed="right" label="操作" width="100">
          <template #default="scope">
            <el-button v-hasPermi="['quant:position:close']" link type="danger" @click="close(scope.row as PositionSnapshot)">
              平仓
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
<script lang="ts" setup>
import type { CredentialVO, PositionSnapshot } from '@/api/quant/types';
import { closePosition, listCredential, listPositions } from '@/api/quant';
import { useDict } from '@/utils/dict';
import { ensureQuantSymbolTickSizes, formatQuantPrice } from '../components/price-format';
import modal from '@/plugins/modal';

const { quant_position_direction } = toRefs<any>(useDict('quant_position_direction'));
const positionDirection = (item: { side?: string; quantity?: string | number }) =>
  item.side === 'BOTH' ? (Number(item.quantity) < 0 ? 'SHORT' : 'LONG') : item.side;
const loading = ref(false);
const credentials = ref<CredentialVO[]>([]);
const rows = ref<PositionSnapshot[]>([]);
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
    rows.value = (await listPositions(credentialId.value, symbol.value || undefined)).data || [];
    void ensureQuantSymbolTickSizes().catch(() => undefined);
  } finally {
    loading.value = false;
  }
};
const close = async (row: PositionSnapshot) => {
  if (!credentialId.value) return;
  await modal.confirm('确认提交该持仓的幂等平仓请求吗？');
  await closePosition({
    credentialId: credentialId.value,
    symbol: row.symbol,
    side: row.side,
    positionSide: row.side,
    quantity: Number(row.quantity),
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
