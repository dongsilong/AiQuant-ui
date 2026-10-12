<template>
  <div class="p-2 app-container quant-dashboard-page">
    <el-card shadow="hover" class="table-panel"><template #header><div class="toolbar-shell"><div class="table-heading"><span class="panel-kicker">Quant Dashboard</span><h3>工作台</h3><p>统计数据来自量化管理查询接口。</p></div><el-button type="primary" plain icon="Refresh" :loading="loading" @click="load">刷新</el-button></div></template>
      <el-row :gutter="16"><el-col v-for="item in cards" :key="item.key" :span="6"><el-card shadow="never" class="metric-card"><div class="metric-label">{{ item.label }}</div><div class="metric-value">{{ overview[item.key] ?? 0 }}</div></el-card></el-col></el-row>
    </el-card>
  </div>
</template>
<script setup lang="ts">
import type { DashboardOverview } from '@/api/quant/types';
import { getDashboardOverview } from '@/api/quant';
const loading = ref(false);
const overview = reactive<DashboardOverview>({ credentialCount: 0, positionCount: 0, orderCount: 0, tradeCount: 0, runningInstanceCount: 0, unknownExecutionCount: 0, pendingNotificationCount: 0 });
const cards = [{ key: 'credentialCount', label: '账户凭证' }, { key: 'positionCount', label: '持仓' }, { key: 'orderCount', label: '订单' }, { key: 'tradeCount', label: '成交' }, { key: 'runningInstanceCount', label: '运行实例' }, { key: 'unknownExecutionCount', label: '未知执行' }, { key: 'pendingNotificationCount', label: '待发送通知' }] as const;
const load = async () => { loading.value = true; try { Object.assign(overview, (await getDashboardOverview()).data || {}); } finally { loading.value = false; } };
onMounted(load);
</script>
<style scoped>
.metric-card { min-height: 110px; margin-bottom: 16px; }
.metric-label { color: var(--el-text-color-secondary); }
.metric-value { margin-top: 14px; font-size: 28px; font-weight: 600; }
</style>

