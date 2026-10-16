<template>
  <div class="p-2 app-container quant-ledger-page">
    <div v-if="filters?.length" class="search-wrap">
      <el-card class="search-panel" shadow="hover">
        <template #header>
          <div class="panel-heading"><h3>筛选条件</h3></div>
        </template>
        <el-form :inline="true" class="query-form" @submit.prevent="handleQuery">
          <el-form-item v-for="filter in filters" :key="filter.key" :label="filter.label">
            <el-select
              v-if="filter.type === 'select'"
              v-model="query[filter.key]"
              clearable
              :placeholder="filter.placeholder || '请选择'"
            >
              <el-option
                v-for="option in filter.options || []"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <el-date-picker
              v-else-if="filter.type === 'daterange'"
              v-model="dateRanges[filter.key]"
              type="datetimerange"
              value-format="YYYY-MM-DD HH:mm:ss"
              start-placeholder="默认最近24小时"
              end-placeholder="当前时间"
              clearable
            />
            <el-input
              v-else
              v-model="query[filter.key]"
              clearable
              :placeholder="filter.placeholder || `请输入${filter.label}`"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item>
            <el-button icon="Search" type="primary" @click="handleQuery">查询</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    <el-card class="table-panel" shadow="hover">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">Quant Ledger</span>
            <h3>{{ title }}</h3>
          </div>
          <el-button :loading="loading" icon="Refresh" plain type="primary" @click="load">刷新</el-button>
        </div>
      </template>
      <el-table v-loading="loading" class="data-table" :data="rows" border>
        <el-table-column
          v-for="column in columns"
          :key="column.prop"
          :label="column.label"
          :min-width="column.width || 140"
          :prop="column.prop"
          show-overflow-tooltip
        >
          <template #default="scope">{{ formatCell(scope.row, column) }}</template>
        </el-table-column>
        <el-table-column v-if="detail" fixed="right" label="详情" width="80">
          <template #default="scope">
            <el-button link type="primary" @click="showDetail(scope.row)">查看</el-button>
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
    <el-dialog v-model="detailVisible" append-to-body title="记录详情" width="760px">
      <pre class="detail-json">{{ detailText }}</pre>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
import type { PageResult } from '@/api/types';

type LedgerRow = Record<string, unknown> & { id?: string | number };
type LedgerColumn = { prop: string; label: string; width?: number; formatter?: (row: LedgerRow) => string };
type LedgerFilter = {
  key: string;
  label: string;
  type?: 'input' | 'select' | 'daterange';
  startKey?: string;
  endKey?: string;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
};

const props = defineProps<{
  title: string;
  columns: LedgerColumn[];
  loadPage: (query: PageQuery & Record<string, string | number | undefined>) => Promise<{ data?: PageResult<unknown> }>;
  filters?: LedgerFilter[];
  detail?: boolean;
}>();
const loading = ref(false);
const rows = ref<LedgerRow[]>([]);
const total = ref(0);
const query = reactive<PageQuery & Record<string, string | number | undefined>>({ pageNum: 1, pageSize: 10 });
const dateRanges = reactive<Record<string, [string, string] | null>>({});
const detailVisible = ref(false);
const detailText = ref('');
const filters = computed(() => props.filters || []);
const load = async () => {
  loading.value = true;
  filters.value
    .filter(filter => filter.type === 'daterange')
    .forEach(filter => {
      query[filter.startKey || 'startTime'] = dateRanges[filter.key]?.[0];
      query[filter.endKey || 'endTime'] = dateRanges[filter.key]?.[1];
    });
  try {
    const result = await props.loadPage(query);
    rows.value = (result.data?.rows || []) as LedgerRow[];
    total.value = result.data?.total || 0;
  } finally {
    loading.value = false;
  }
};
const handleQuery = () => {
  query.pageNum = 1;
  load();
};
const resetQuery = () => {
  filters.value.forEach(filter => {
    delete query[filter.key];
    delete dateRanges[filter.key];
  });
  handleQuery();
};
const formatCell = (row: LedgerRow, column: LedgerColumn) =>
  column.formatter ? column.formatter(row) : String(row[column.prop] ?? '-');
const showDetail = (row: LedgerRow) => {
  detailText.value = JSON.stringify(row, null, 2);
  detailVisible.value = true;
};
onMounted(load);
defineExpose({ load });
</script>
<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;

.detail-json {
  max-height: 55vh;
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
