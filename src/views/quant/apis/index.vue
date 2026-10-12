<template>
  <div class="p-2 app-container quant-apis-page">
    <el-card class="table-panel" shadow="hover">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">API & Domain</span>
            <h3>接口与领域模型</h3>
            <p>展示当前后端可用的量化管理契约和实时领域统计。</p>
          </div>
          <el-button :loading="loading" icon="Refresh" plain type="primary" @click="load">刷新</el-button>
        </div>
      </template>
      <el-row :gutter="16" class="stats">
        <el-col v-for="item in stats" :key="item.label" :span="6">
          <el-card shadow="never">
            <div class="metric-label">{{ item.label }}</div>
            <div class="metric-value">{{ item.value }}</div>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-card shadow="never">
            <template #header><b>管理接口</b></template>
            <el-table :data="endpoints" border>
              <el-table-column label="方法" prop="method" width="80" />
              <el-table-column label="路径" min-width="280" prop="path" />
              <el-table-column label="说明" prop="description" />
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never">
            <template #header><b>已注册策略插件</b></template>
            <el-table :data="plugins" border>
              <el-table-column label="名称" prop="name" />
              <el-table-column label="Code" prop="code" />
              <el-table-column label="版本" prop="version" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>
<script lang="ts" setup>
import type { DashboardOverview, StrategyPluginVO } from '@/api/quant/types';
import { getDashboardOverview, listCredential, listStrategies, listStrategyPlugins, listSymbol } from '@/api/quant';

const loading = ref(false);
const plugins = ref<StrategyPluginVO[]>([]);
const overview = ref<DashboardOverview>({
  credentialCount: 0,
  positionCount: 0,
  orderCount: 0,
  tradeCount: 0,
  runningInstanceCount: 0,
  unknownExecutionCount: 0,
  pendingNotificationCount: 0
});
const counts = reactive({ symbols: 0, strategies: 0 });
const stats = computed(() => [
  { label: '凭证', value: overview.value.credentialCount },
  { label: '交易对', value: counts.symbols },
  {
    label: '策略定义',
    value: counts.strategies
  },
  { label: '运行实例', value: overview.value.runningInstanceCount }
]);
const endpoints = [
  { method: 'GET', path: '/quant/dashboard/overview', description: '工作台统计' },
  {
    method: 'GET',
    path: '/quant/strategy/instances',
    description: '策略运行实例'
  },
  { method: 'GET', path: '/quant/protection/page', description: '保护单账本' },
  { method: 'GET', path: '/quant/execution/page', description: '执行账本' },
  {
    method: 'POST',
    path: '/quant/reconcile/{credentialId}/run',
    description: '触发对账'
  },
  { method: 'POST', path: '/quant/notification/{id}/retry', description: '通知重试' }
];
const load = async () => {
  loading.value = true;
  try {
    const [dashboard, credentials, symbols, strategies, pluginResult] = await Promise.all([
      getDashboardOverview(),
      listCredential({
        pageNum: 1,
        pageSize: 1
      }),
      listSymbol({ pageNum: 1, pageSize: 1 }),
      listStrategies({ pageNum: 1, pageSize: 1 }),
      listStrategyPlugins()
    ]);
    overview.value = dashboard.data || overview.value;
    counts.symbols = symbols.data?.total || 0;
    counts.strategies = strategies.data?.total || 0;
    if (credentials.data?.total !== undefined) overview.value.credentialCount = credentials.data.total;
    plugins.value = pluginResult.data || [];
  } finally {
    loading.value = false;
  }
};
onMounted(load);
</script>
<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;
.stats {
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
</style>
