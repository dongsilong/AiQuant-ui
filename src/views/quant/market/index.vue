<template>
  <div class="p-2 app-container quant-market-page">
    <div class="search-wrap">
      <el-card shadow="hover" class="search-panel">
        <template #header>
          <div class="panel-heading search-panel-toggle">
            <div><h3>筛选条件</h3></div>
          </div>
        </template>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
          <el-form-item label="交易对">
            <el-input v-model="queryParams.symbol" clearable placeholder="BTCUSDT" @keyup.enter="load" />
          </el-form-item>
          <el-form-item label="交易所状态" label-width="90">
            <el-select v-model="queryParams.exchangeStatus" clearable>
              <el-option v-for="status of quant_exchange_status" :label="status.label" :value="status.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="收藏">
            <el-select v-model="queryParams.favorite" clearable>
              <el-option :value="true" label="仅收藏" />
              <el-option :value="false" label="未收藏" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button icon="Search" type="primary" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    <el-card class="table-panel" shadow="hover">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">Market Data</span>
            <h3>行情中心</h3>
            <p>交易对元数据、实时价格和收藏均来自量化行情接口。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['quant:symbol:sync']" :loading="syncing" icon="Refresh" plain type="primary" @click="sync">
              同步交易对
            </el-button>
            <right-toolbar :show-search="false" :search="false" @query-table="load"></right-toolbar>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" class="data-table" :data="rows" border>
        <el-table-column type="index" label="序号" width="80" align="center">
          <template #default="scope">
            <span>{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="交易对" prop="symbol" min-width="180" align="center">
          <template #default="scope">
            <strong>{{ scope.row.symbol }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="价格精度" prop="pricePrecision" min-width="80" align="center" />
        <el-table-column label="数量精度" prop="quantityPrecision" min-width="80" align="center" />
        <el-table-column label="最小变动单位" prop="priceTickSize" min-width="120" align="center">
          <template #default="scope">{{ formatDecimal(scope.row.priceTickSize) }}</template>
        </el-table-column>
        <el-table-column label="数量步长" prop="marketQuantityStep" min-width="80" align="center">
          <template #default="scope">{{ formatDecimal(scope.row.marketQuantityStep) }}</template>
        </el-table-column>
        <el-table-column label="最小名义金额" prop="minNotional" min-width="150" align="center">
          <template #default="scope">{{ formatDecimal(scope.row.minNotional) }}</template>
        </el-table-column>
        <el-table-column label="交易所状态" prop="exchangeStatus" min-width="80" align="center">
          <template #default="scope">
            <dict-tag :options="quant_exchange_status" :value="scope.row.exchangeStatus" />
          </template>
        </el-table-column>
        <el-table-column label="同步时间" prop="syncedAt" min-width="160" align="center" />
        <el-table-column align="center" label="收藏" width="80">
          <template #default="scope">
            <el-button :type="scope.row.favorite ? 'warning' : 'info'" link @click="favorite(scope.row as SymbolVO)">
              {{ scope.row.favorite ? '★' : '☆' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:limit="queryParams.pageSize" v-model:page="queryParams.pageNum" :total="total" @pagination="load" />
    </el-card>
  </div>
</template>
<script lang="ts" setup>
import type { PriceSnapshot, SymbolQuery, SymbolVO } from '@/api/quant/types';
import { getRealtimePrice, listSymbol, syncSymbol, toggleSymbolFavorite } from '@/api/quant';
import {useDict} from "@/utils/dict";

const { quant_exchange_status } = toRefs<any>(useDict('quant_exchange_status'));

const loading = ref(false);
const syncing = ref(false);
const rows = ref<SymbolVO[]>([]);
const total = ref(0);
const prices = ref<Record<string, PriceSnapshot>>({});
const queryParams = reactive<SymbolQuery>({
  pageNum: 1,
  pageSize: 10,
  symbol: '',
  quoteAsset: 'USDT',
  exchangeStatus: '',
  favorite: undefined
});
const formatDecimal = (value: string | number | undefined) => {
  if (value === undefined || value === null || value === '') return '—';
  const text = String(value);
  if (/e/i.test(text)) {
    const expanded = Number(value).toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 16 });
    return expanded.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
  }
  return text.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
};
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  load();
};
const load = async () => {
  loading.value = true;
  try {
    const result = await listSymbol(queryParams);
    rows.value = result.data?.rows || [];
    total.value = result.data?.total || 0;
    /*const entries = await Promise.allSettled(
      rows.value.slice(0, 8).map(async item => [item.symbol, (await getRealtimePrice(item.symbol)).data] as const)
    );
    prices.value = Object.fromEntries(
      entries
        .filter(
          (item): item is PromiseFulfilledResult<readonly [string, PriceSnapshot | undefined]> =>
            item.status === 'fulfilled' && Boolean(item.value[1])
        )
        .map(item => item.value)
    );*/
  } finally {
    loading.value = false;
  }
};
const resetQuery = () => {
  queryParams.pageNum = 1;
  queryParams.symbol = '';
  queryParams.exchangeStatus = '';
  queryParams.favorite = undefined;
  load();
};
const sync = async () => {
  syncing.value = true;
  try {
    await syncSymbol();
    await load();
  } finally {
    syncing.value = false;
  }
};
const favorite = async (row: SymbolVO) => {
  await toggleSymbolFavorite(row.id, !row.favorite);
  await load();
};
onMounted(load);
</script>
<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;
.price-row {
  margin-bottom: 16px;
}

.metric-label {
  color: var(--el-text-color-secondary);
}

.metric-value {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 600;
}

.metric-foot {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
