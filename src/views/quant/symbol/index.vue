<template>
  <div class="p-2 app-container quant-symbol-page">
    <div class="search-wrap">
      <el-card class="search-panel" shadow="hover">
        <template #header>
          <div class="panel-heading">
            <div>
              <span class="panel-kicker">Search Filters</span>
              <h3>筛选条件</h3>
            </div>
          </div>
        </template>
        <el-form :inline="true" :model="query" class="query-form">
          <el-form-item label="交易对">
            <el-input v-model="query.symbol" clearable placeholder="请输入交易对" @keyup.enter="load" />
          </el-form-item>
          <el-form-item label="计价">
            <el-select v-model="query.quoteAsset" clearable placeholder="请选择">
              <el-option label="USDT" value="USDT" />
            </el-select>
          </el-form-item>
          <el-form-item label="交易状态">
            <el-select v-model="query.exchangeStatus" clearable placeholder="请选择">
              <el-option label="交易中" value="TRADING" />
              <el-option label="暂停" value="BREAK" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" clearable>
              <el-option label="启用" value="0" />
              <el-option label="停用" value="1" />
            </el-select>
          </el-form-item>
          <el-form-item label="只看标星">
            <el-checkbox v-model="query.favorite" />
          </el-form-item>
          <el-form-item>
            <el-button icon="Search" type="primary" @click="load">搜索</el-button>
            <el-button icon="Refresh" @click="reset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    <el-card class="table-panel" shadow="hover">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">Symbol Dataset</span>
            <h3>交易对列表</h3>
            <p>同步 Binance USDⓈ-M 交易所过滤器和交易状态。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['quant:symbol:sync']" :loading="syncing" icon="Refresh" plain type="success" @click="sync">同步 Binance</el-button>
            <right-toolbar :search="false" @query-table="load" />
          </div>
        </div>
      </template>
      <el-table v-loading="loading" :data="rows" border class="data-table">
        <el-table-column align="center" label="序号" type="index" width="80">
          <template #default="scope">
            <span>{{ (query.pageNum - 1) * query.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="交易对" min-width="130" prop="symbol">
          <template #default="scope">
            <strong>{{ scope.row.symbol }}</strong>
          </template>
        </el-table-column>
        <el-table-column align="center" label="计价" prop="quoteAsset" width="100" />
        <el-table-column align="right" label="价格 tick" prop="priceTickSize" min-width="150" />
        <el-table-column align="right" label="数量步长" prop="quantityStep" min-width="150" />
        <el-table-column align="right" label="市价步长" prop="marketQuantityStep" min-width="150" />
        <el-table-column align="right" label="最小名义价值" prop="minNotional" min-width="150" />
        <el-table-column align="right" label="最大杠杆" prop="maxLeverage" width="100" />
        <el-table-column align="center" label="保证金模式" prop="marginMode" width="120" />
        <el-table-column align="center" label="交易所状态" prop="exchangeStatus" width="120" />
        <el-table-column align="center" label="收藏" width="70">
          <template #default="scope">
            <el-button
              v-hasPermi="['quant:symbol:edit']"
              :type="scope.row.favorite ? 'warning' : 'info'"
              link
              @click="toggleFavorite(scope.row as SymbolVO)"
            >
              <el-icon>
                <StarFilled v-if="scope.row.favorite" />
                <Star v-else />
              </el-icon>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column align="center" label="状态" prop="status" width="100">
          <template #default="scope">
            <dict-tag :options="sys_notice_status" :value="scope.row.status" />
          </template>
        </el-table-column>
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
</template>
<script lang="ts" setup>
import type { SymbolQuery, SymbolVO } from '@/api/quant/types';
import { listSymbol, syncSymbol, toggleSymbolFavorite } from '@/api/quant';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';

const { sys_notice_status } = toRefs<any>(useDict('sys_notice_status'));
const loading = ref(false);
const syncing = ref(false);
const rows = ref<SymbolVO[]>([]);
const total = ref(0);
const query = reactive<SymbolQuery>({
  pageNum: 1,
  pageSize: 10,
  symbol: '',
  quoteAsset: 'USDT',
  status: '',
  exchangeStatus: '',
  favorite: false
});
const load = async () => {
  loading.value = true;
  try {
    const r = await listSymbol(query);
    rows.value = r.data?.rows || [];
    total.value = r.data?.total || 0;
  } finally {
    loading.value = false;
  }
};
const reset = () => {
  query.pageNum = 1;
  query.symbol = '';
  query.status = '';
  query.quoteAsset = 'USDT';
  query.exchangeStatus = '';
  query.favorite = false;
  load();
};
const sync = async () => {
  syncing.value = true;
  try {
    const r = await syncSymbol();
    modal.msgSuccess(`同步 ${r.data || 0} 个交易对`);
    await load();
  } finally {
    syncing.value = false;
  }
};
const toggleFavorite = async (row: SymbolVO) => {
  await toggleSymbolFavorite(Number(row.id), !row.favorite);
  row.favorite = !row.favorite;
};
onMounted(load);
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;
</style>
