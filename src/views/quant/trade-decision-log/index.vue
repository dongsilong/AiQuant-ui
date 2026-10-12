<template>
  <div class="p-2 app-container">
    <el-card shadow="hover" class="mb-3">
      <template #header><h3>开平仓日志</h3></template>
      <el-form :inline="true" @submit.prevent="search">
        <el-form-item label="交易账户">
          <el-select
            v-model="query.credentialId"
            clearable
            filterable
            placeholder="请选择交易账户"
            style="width: 220px"
          >
            <el-option
              v-for="option in credentialFilter.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="当前策略"><el-input v-model="query.strategyName" clearable /></el-form-item>
        <el-form-item label="策略实例">
          <el-input v-model="query.strategyInstanceId" clearable placeholder="实例 ID" />
        </el-form-item>
        <el-form-item label="交易对"><el-input v-model="query.symbol" clearable placeholder="BTCUSDT" /></el-form-item>
        <el-form-item label="运行模式">
          <el-select v-model="query.runMode" clearable style="width: 130px">
            <el-option v-for="(label, value) in modes" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作">
          <el-select v-model="query.operation" clearable style="width: 120px">
            <el-option label="开仓" value="OPEN" />
            <el-option label="平仓" value="CLOSE" />
            <el-option label="来源未确认" value="UNKNOWN" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable style="width: 140px">
            <el-option v-for="(label, value) in statuses" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="原因"><el-input v-model="query.reason" clearable /></el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="range"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="默认最近24小时"
            end-placeholder="当前时间"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" :loading="loading" @click="search">查询</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="hover">
      <template #header>
        <div class="flex justify-between items-center">
          <span>策略达标评估与开平仓详情</span>
          <el-button icon="Refresh" :loading="loading" @click="load">刷新</el-button>
        </div>
      </template>
      <el-alert v-if="error" :title="error" type="error" :closable="false" class="mb-3" />
      <el-table v-loading="loading" :data="rows" border empty-text="所选条件下暂无开平仓日志">
        <el-table-column prop="accountName" label="交易账户" min-width="140" show-overflow-tooltip />
        <el-table-column prop="strategyName" label="当前策略" min-width="200" show-overflow-tooltip />
        <el-table-column prop="symbol" label="交易对" min-width="120" />
        <el-table-column label="操作及方向" min-width="120">
          <template #default="{ row }">{{ operationLabel(row) }}</template>
        </el-table-column>
        <el-table-column label="金额（USDT）" min-width="160">
          <template #default="{ row }">
            {{ displayDecimal(row.amount) }}
            <small v-if="row.amount">（{{ kind(row) }}）</small>
          </template>
        </el-table-column>
        <el-table-column label="价格" min-width="160">
          <template #default="{ row }">
            {{ displayDecimal(row.price) }}
            <small v-if="row.price">（{{ row.priceKind === 'ACTUAL' ? '成交均价' : '参考价' }}）</small>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" min-width="260" show-overflow-tooltip />
        <el-table-column label="状态" min-width="140">
          <template #default="{ row }">{{ statusLabel(row) }}</template>
        </el-table-column>
        <el-table-column label="时间" min-width="190">
          <template #default="{ row }">{{ row.tradeTime || row.eventTime }}</template>
        </el-table-column>
        <el-table-column label="详情" fixed="right" width="80">
          <template #default="{ row }">
            <el-button v-hasPermi="['quant:tradeDecisionLog:query']" link type="primary" @click="showDetail(row.id)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="total > 0"
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        :page-sizes="[20, 50, 100]"
        :total="total"
        @pagination="load"
      />
    </el-card>
    <el-dialog v-model="detailVisible" title="开平仓日志详情" width="850px" append-to-body>
      <el-alert v-if="detailError" :title="detailError" type="error" :closable="false" />
      <el-descriptions v-loading="detailLoading" :column="2" border>
        <el-descriptions-item v-for="field in detailFields" :key="field.key" :label="field.label">
          {{ detailValue(field.key) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import type { TradeDecisionLog, TradeDecisionQuery } from '@/api/quant/trade-decision-log';
import { displayDecimal } from '../components/ledger-display';
import { useCredentialOptions } from '../components/useCredentialOptions';

const { credentialFilter } = useCredentialOptions();
import { getTradeDecisionLog, listTradeDecisionLogs } from '@/api/quant/trade-decision-log';

const statuses: Record<string, string> = {
  BLOCKED: '未开仓',
  POSITION_CONFIRMED: '持仓减少已核实',
  REQUESTED: '请求中',
  ACCEPTED: '已受理，成交待核实',
  NEW: '委托中',
  PARTIALLY_FILLED: '部分成交',
  FILLED: '已开仓／已平仓',
  FAILED: '失败',
  UNKNOWN: '待确认',
  CANCELED: '已取消',
  EXPIRED: '已过期',
  REJECTED: '已拒绝'
};
const statusLabel = (row: Partial<TradeDecisionLog>) => {
  if (row.status === 'FILLED')
    return row.operation === 'OPEN' ? '已开仓' : row.operation === 'CLOSE' ? '已平仓' : '已成交';
  if (row.status === 'PARTIALLY_FILLED')
    return row.operation === 'OPEN' ? '部分开仓成交' : row.operation === 'CLOSE' ? '部分平仓成交' : '部分成交';
  return (row.status && statuses[row.status]) || row.status || '-';
};
const modes = { LIVE: '实盘', TESTNET: '测试网', PAPER: '模拟' };
const query = reactive<TradeDecisionQuery>({ pageNum: 1, pageSize: 20 });
// 未选择时间时后端按当前时刻查询最近 24 小时，手动刷新可以看到新日志。
const range = ref<[string, string] | null>(null);
const rows = ref<TradeDecisionLog[]>([]);
const total = ref(0);
const loading = ref(false);
const error = ref('');
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailError = ref('');
const detail = ref<TradeDecisionLog>();
let generation = 0;
const errorText = (e: unknown) => (e instanceof Error ? e.message : '查询失败，请稍后重试');
const load = async () => {
  const current = ++generation;
  loading.value = true;
  error.value = '';
  try {
    const result = await listTradeDecisionLogs({
      ...query,
      symbol: query.symbol?.trim().toUpperCase(),
      from: range.value?.[0],
      to: range.value?.[1]
    });
    if (current !== generation) return;
    rows.value = result.data?.rows || [];
    total.value = result.data?.total || 0;
  } catch (e) {
    if (current !== generation) return;
    rows.value = [];
    total.value = 0;
    error.value = errorText(e);
  } finally {
    if (current === generation) loading.value = false;
  }
};
const search = () => {
  query.pageNum = 1;
  load();
};
const reset = () => {
  Object.keys(query).forEach(key => delete query[key as keyof TradeDecisionQuery]);
  Object.assign(query, { pageNum: 1, pageSize: 20 });
  range.value = null;
  load();
};
const operationLabel = (row: Partial<TradeDecisionLog>) => {
  if (row.operation !== 'OPEN' && row.operation !== 'CLOSE') return '操作未确认';
  if (row.direction !== 'LONG' && row.direction !== 'SHORT')
    return row.operation === 'OPEN' ? '开仓（方向未确认）' : '平仓（方向未确认）';
  return `${row.operation === 'OPEN' ? '开' : '平'}${row.direction === 'LONG' ? '多' : '空'}`;
};
const kind = (row: Partial<TradeDecisionLog>) => (row.priceKind === 'ACTUAL' ? '实际' : '计划');
const showDetail = async (id: string) => {
  detailVisible.value = true;
  detailLoading.value = true;
  detailError.value = '';
  detail.value = undefined;
  try {
    detail.value = (await getTradeDecisionLog(id)).data;
  } catch (e) {
    detailError.value = errorText(e);
  } finally {
    detailLoading.value = false;
  }
};
const detailValue = (key: keyof TradeDecisionLog) => {
  if (key === 'status' && detail.value) return statusLabel(detail.value);
  if (['amount', 'price', 'quantity', 'margin', 'angle', 'threshold'].includes(key))
    return displayDecimal(detail.value?.[key]);
  return detail.value?.[key] ?? '-';
};
const detailFields: Array<{ key: keyof TradeDecisionLog; label: string }> = [
  { key: 'accountName', label: '交易账户' },
  { key: 'credentialId', label: '账户 ID' },
  { key: 'strategyName', label: '当前策略' },
  { key: 'strategyId', label: '策略 ID' },
  { key: 'strategyInstanceId', label: '实例 ID' },
  { key: 'runMode', label: '运行模式' },
  { key: 'symbol', label: '交易对' },
  { key: 'status', label: '状态' },
  { key: 'angle', label: '实际角度' },
  { key: 'threshold', label: '开仓阈值' },
  { key: 'quantity', label: '币数量' },
  { key: 'margin', label: '保证金（USDT）' },
  { key: 'amount', label: '名义金额（USDT）' },
  { key: 'price', label: '价格' },
  { key: 'reasonCode', label: '原因代码' },
  { key: 'reason', label: '原因说明' },
  { key: 'eventTime', label: '首次评估时间' },
  { key: 'lastTime', label: '最后记录时间' },
  { key: 'tradeTime', label: '成交时间' },
  { key: 'klineTime', label: 'K 线时间' },
  { key: 'repeatCount', label: '出现次数' },
  { key: 'orderId', label: '订单 ID' },
  { key: 'clientOrderId', label: '客户端订单号' },
  { key: 'idempotencyKey', label: '执行关联标识' }
];
onMounted(load);
onBeforeUnmount(() => {
  generation++;
});
</script>
