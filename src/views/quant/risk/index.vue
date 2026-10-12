<template>
  <div class="p-2 app-container quant-risk-page">
    <el-card class="table-panel" shadow="hover">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">Risk Dataset</span>
            <h3>风控配置</h3>
            <p>按账户维护实盘闸门和下单限制。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['quant:risk:add']" icon="Plus" plain type="primary" @click="openAdd">
              新增风控配置
            </el-button>
            <right-toolbar :search="false" @query-table="load" />
          </div>
        </div>
      </template>
      <el-table v-loading="loading" :data="rows" border>
        <el-table-column align="center" label="序号" type="index" width="80">
          <template #default="scope">
            <span>{{ (query.pageNum - 1) * query.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="交易账户" min-width="140" align="center">
          <template #default="scope">
            {{ credentialLabel(scope.row.credentialId) }}
          </template>
        </el-table-column>
        <el-table-column label="是否实盘" min-width="150" prop="liveEnabled" align="center" />
        <el-table-column label="单笔最大名义价值" min-width="150" prop="maxOrderNotional" align="center" />
        <el-table-column label="日亏损上限" min-width="100" prop="dailyLossLimit" align="center" />
        <el-table-column label="最大持仓数" min-width="100" prop="maxOpenPositions"  align="center"/>
        <el-table-column label="每分钟下单数" min-width="120" prop="maxOrdersPerMinute" align="center" />
        <el-table-column label="断线处理" min-width="150" prop="websocketDisconnectAction" align="center">
          <template #default="scope">
            <dict-tag :options="quant_risk_way" :value="scope.row.websocketDisconnectAction" />
          </template>
        </el-table-column>
        <el-table-column label="持仓不一致处理" min-width="150" prop="positionMismatchAction" align="center">
          <template #default="scope">
            <dict-tag :options="quant_risk_way" :value="scope.row.positionMismatchAction" />
          </template>
        </el-table-column>
        <el-table-column label="保护单失败策略" min-width="150" prop="protectionFailureAction" align="center">
          <template #default="scope">
            <dict-tag :options="quant_risk_way" :value="scope.row.protectionFailureAction" />
          </template>
        </el-table-column>
        <el-table-column label="实盘开关" min-width="100" align="center">
          <template #default="scope">
            <el-switch v-model="scope.row.liveEnabled" disabled />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="openEdit(scope.row as RiskVO)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete((scope.row as RiskVO).id)">删除</el-button>
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
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑风控配置' : '新增风控配置'" width="620px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="150px">
        <el-form-item label="交易账户" prop="credentialId">
          <el-select v-model="form.credentialId" filterable placeholder="请选择交易账户">
            <el-option
              v-for="credential in credentials"
              :key="credential.id"
              :label="`${credential.accountName}（${credential.userName || credential.userId}）`"
              :value="credential.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="实盘开关" prop="liveEnabled">
          <el-radio-group v-model="form.liveEnabled">
            <el-radio :value="false">关闭</el-radio>
            <el-radio :value="true">开启</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="单笔最大名义价值" prop="maxOrderNotional">
          <el-input v-model="form.maxOrderNotional" />
        </el-form-item>
        <el-form-item label="日亏损上限" prop="dailyLossLimit">
          <el-input v-model="form.dailyLossLimit" />
        </el-form-item>
        <el-form-item label="最大同时持仓数" prop="maxOpenPositions">
          <el-input-number v-model="form.maxOpenPositions" :min="1" controls-position="right" />
        </el-form-item>
        <el-form-item label="每分钟下单数" prop="maxOrdersPerMinute">
          <el-input-number v-model="form.maxOrdersPerMinute" :min="1" controls-position="right" />
        </el-form-item>
        <el-form-item label="断线处理" prop="websocketDisconnectAction">
          <el-radio-group v-model="form.websocketDisconnectAction">
            <el-radio v-for="way in quant_risk_way" :value="way.value">{{ way.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="持仓不一致处理" prop="positionMismatchAction">
          <el-radio-group v-model="form.positionMismatchAction">
            <el-radio v-for="way in quant_risk_way" :value="way.value">{{ way.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="保护单失败处理" prop="protectionFailureAction">
          <el-radio-group v-model="form.protectionFailureAction">
            <el-radio v-for="way in quant_risk_way" :value="way.value">{{ way.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="实盘白名单" prop="whitelist">
          <el-radio-group v-model="form.whitelist">
            <el-radio :value="false">否</el-radio>
            <el-radio :value="true">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="通知邮箱" prop="notificationEmails">
          <el-input v-model="form.notificationEmails" placeholder="多个邮箱用逗号分隔" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import type { CredentialVO, RiskForm, RiskVO } from '@/api/quant/types';
import { addRisk, delRisk, listCredential, listRisk, updateRisk } from '@/api/quant';
import modal from '@/plugins/modal';
import {useDict} from "@/utils/dict";

const { quant_risk_way } = toRefs<any>(useDict('quant_risk_way'));

const loading = ref(false);
const rows = ref<RiskVO[]>([]);
const credentials = ref<CredentialVO[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const formRef = ref<ElFormInstance>();
const query = reactive<PageQuery>({ pageNum: 1, pageSize: 10 });
const form = reactive<RiskForm>({
  credentialId: undefined,
  liveEnabled: false,
  maxOrderNotional: '',
  dailyLossLimit: '',
  maxOpenPositions: 1,
  maxOrdersPerMinute: 1,
  websocketDisconnectAction: 'HALT',
  positionMismatchAction: 'HALT',
  protectionFailureAction: 'HALT',
  whitelist: false,
  notificationEmails: ''
});
const rules = {
  credentialId: [{ required: true, message: '请选择交易账户', trigger: 'change' }],
  maxOrderNotional: [{ required: true, message: '请输入单笔最大名义价值', trigger: 'blur' }],
  dailyLossLimit: [{ required: true, message: '请输入日亏损上限', trigger: 'blur' }]
};
const load = async () => {
  loading.value = true;
  try {
    const res = await listRisk(query);
    rows.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
};
const loadCredentials = async () => {
  const res = await listCredential({ pageNum: 1, pageSize: 100 });
  credentials.value = res.data?.rows || [];
};
const credentialLabel = (credentialId: number | string | undefined) => {
  const credential = credentials.value.find(item => String(item.id) === String(credentialId));
  return credential?.accountName || '未命名用户';
};
const resetForm = () => {
  Object.assign(form, {
    id: undefined,
    credentialId: undefined,
    liveEnabled: false,
    maxOrderNotional: '',
    dailyLossLimit: '',
    maxOpenPositions: 1,
    maxOrdersPerMinute: 1,
    websocketDisconnectAction: 'HALT',
    positionMismatchAction: 'HALT',
    protectionFailureAction: 'HALT',
    whitelist: false,
    notificationEmails: ''
  });
  nextTick(() => formRef.value?.clearValidate());
};
const openAdd = () => {
  resetForm();
  dialogVisible.value = true;
};
const openEdit = (row: RiskVO) => {
  Object.assign(form, row);
  dialogVisible.value = true;
};
const submit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (form.id) await updateRisk(form);
  else await addRisk(form);
  dialogVisible.value = false;
  modal.msgSuccess('保存成功');
  await load();
};
const handleDelete = async (id: number) => {
  await modal.confirm('确认删除该风控配置吗？');
  await delRisk(id);
  modal.msgSuccess('删除成功');
  await load();
};
onMounted(async () => {
  await Promise.all([load(), loadCredentials()]);
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;
</style>
