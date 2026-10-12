<template>
  <div class="p-2 app-container quant-dashboard-page">
    <el-card class="table-panel" shadow="hover">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">Quant Dashboard</span>
            <h3>工作台</h3>
            <p>统计数据来自量化管理查询接口。</p>
          </div>
          <el-button :loading="loading" icon="Refresh" plain type="primary" @click="load">刷新</el-button>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col v-for="item in cards" :key="item.key" :lg="6" :md="8" :sm="12" :xs="24">
          <el-card class="metric-card" shadow="never" @click="go(item.path)">
            <div class="metric-label">{{ item.label }}</div>
            <div class="metric-value">{{ overview[item.key] ?? 0 }}</div>
            <div class="metric-link">查看详情</div>
          </el-card>
        </el-col>
      </el-row>
      <el-alert
        v-if="overview.unknownExecutionCount > 0 || overview.pendingNotificationCount > 0"
        class="dashboard-alert"
        :closable="false"
        description="存在待处理的执行记录或通知，请及时检查审计页面。"
        show-icon
        title="量化运行需要关注"
        type="warning"
      />
      <el-empty v-if="!loading && !hasData" description="暂无量化统计数据" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import type { DashboardOverview } from '@/api/quant/types';
import { getDashboardOverview } from '@/api/quant';

const router = useRouter();
const loading = ref(false);
const overview = reactive<DashboardOverview>({
  credentialCount: 0,
  positionCount: 0,
  orderCount: 0,
  tradeCount: 0,
  runningInstanceCount: 0,
  unknownExecutionCount: 0,
  pendingNotificationCount: 0
});
const cards = [
  { key: 'credentialCount', label: '账户凭证', path: '/quant/credential/index' },
  { key: 'positionCount', label: '持仓', path: '/quant/positions/index' },
  { key: 'orderCount', label: '订单', path: '/quant/orders/index' },
  { key: 'tradeCount', label: '成交', path: '/quant/trades/index' },
  { key: 'runningInstanceCount', label: '运行实例', path: '/quant/strategy/index' },
  { key: 'unknownExecutionCount', label: '未知执行', path: '/quant/execution/index' },
  { key: 'pendingNotificationCount', label: '待发送通知', path: '/quant/notification/index' }
] as const;
const hasData = computed(() => Object.values(overview).some(value => Number(value) > 0));
const load = async () => {
  loading.value = true;
  try {
    Object.assign(overview, (await getDashboardOverview()).data || {});
  } finally {
    loading.value = false;
  }
};
const go = (path: string) => router.push(path);
onMounted(load);
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;

.metric-card {
  min-height: 120px;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.metric-card:hover {
  transform: translateY(-2px);
}
.metric-label {
  color: var(--el-text-color-secondary);
}
.metric-value {
  margin-top: 14px;
  font-size: 28px;
  font-weight: 600;
}
.metric-link {
  margin-top: 8px;
  color: var(--el-color-primary);
  font-size: 12px;
}
.dashboard-alert {
  margin-top: 16px;
}
</style>
