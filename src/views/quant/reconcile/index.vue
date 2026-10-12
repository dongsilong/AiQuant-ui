<template>
  <div>
    <AdminLedgerTable
      ref="tableRef"
      :columns="columns"
      :detail="true"
      :filters="filters"
      :load-page="loadPage"
      title="对账恢复"
    />
    <div class="reconcile-action">
      <el-select
        v-model="credentialId"
        clearable
        filterable
        :loading="credentialLoading"
        placeholder="请选择凭证用户"
        style="width: 260px"
      >
        <el-option
          v-for="option in credentialOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <el-input-number v-model="historyHours" :min="1" :max="168" placeholder="历史小时" />
      <el-button v-hasPermi="['quant:reconcile:run']" type="primary" @click="run">执行对账</el-button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import type { CredentialVO } from '@/api/quant/types';
import { listCredential, listReconcile, runReconcile } from '@/api/quant';
import modal from '@/plugins/modal';
import AdminLedgerTable from '../components/AdminLedgerTable.vue';
import { displayLabel, reconcileTypes, reconcileResults } from '../components/ledger-display';

const columns = [
  { prop: 'accountName', label: '账户' },
  {
    prop: 'reconcileType',
    label: '类型',
    formatter: (row: Record<string, unknown>) => displayLabel(reconcileTypes, row.reconcileType)
  },
  {
    prop: 'result',
    label: '结果',
    formatter: (row: Record<string, unknown>) => displayLabel(reconcileResults, row.result)
  },
  { prop: 'reconciledAt', label: '对账时间' }
];
const credentials = ref<CredentialVO[]>([]);
const credentialLoading = ref(false);
const credentialOptions = computed(() =>
  credentials.value.map(credential => ({
    label: `${credential.accountName}（${credential.userName || credential.userId}）`,
    value: String(credential.id)
  }))
);
const filters = computed(() => [
  {
    key: 'credentialId',
    label: '凭证用户',
    type: 'select' as const,
    placeholder: '请选择凭证用户',
    options: credentialOptions.value
  }
]);
const loadCredentials = async () => {
  credentialLoading.value = true;
  try {
    const rows: CredentialVO[] = [];
    let pageNum = 1;
    let total = 0;
    do {
      const result = await listCredential({ pageNum, pageSize: 100 });
      const page = result.data?.rows || [];
      rows.push(...page);
      total = result.data?.total || 0;
      pageNum++;
      if (!page.length) break;
    } while (rows.length < total);
    credentials.value = rows;
  } finally {
    credentialLoading.value = false;
  }
};
onMounted(loadCredentials);
const loadPage = (query: PageQuery) => listReconcile(query);
const tableRef = ref<{ load: () => Promise<void> }>();
const credentialId = ref<string>();
const historyHours = ref(24);
const run = async () => {
  if (!credentialId.value) return modal.msgWarning('请选择凭证用户');
  await runReconcile(credentialId.value, historyHours.value);
  await tableRef.value?.load();
};
</script>
<style scoped>
.reconcile-action {
  display: flex;
  gap: 12px;
  padding: 0 12px 12px;
}
</style>
