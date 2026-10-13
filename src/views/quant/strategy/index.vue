<template>
  <div class="p-2 app-container">
    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h3>策略管理</h3>
            <p>当前演示策略固定 ETHUSDT / 15m，只打印实时价格和 K 线日志，不会下单。</p>
          </div>
          <el-button v-hasPermi="['quant:strategy:add']" type="primary" @click="openAdd">新增策略</el-button>
        </div>
      </template>
      <el-table v-loading="loading" :data="rows" border>
        <el-table-column prop="strategyName" label="策略名称" min-width="180" />
        <el-table-column prop="pluginCode" label="策略插件" min-width="140" />
        <el-table-column label="交易对" width="110"><template #default>ETHUSDT</template></el-table-column>
        <el-table-column label="周期" width="90"><template #default>15m</template></el-table-column>
        <el-table-column label="运行状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 'RUNNING' ? 'success' : 'info'">{{ row.status === 'RUNNING' ? '运行中' : '已停止' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260">
          <template #default="{ row }">
            <el-button v-hasPermi="['quant:strategy:edit']" link :disabled="row.status === 'RUNNING'" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="row.status !== 'RUNNING'" v-hasPermi="['quant:strategy:edit']" link type="success" @click="toggle(row, true)">启动</el-button>
            <el-button v-else v-hasPermi="['quant:strategy:edit']" link type="warning" @click="toggle(row, false)">停止</el-button>
            <el-button v-hasPermi="['quant:strategy:remove']" link type="danger" :disabled="row.status === 'RUNNING'" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="load" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑策略' : '新增策略'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="策略名称" prop="strategyName">
          <el-input v-model="form.strategyName" maxlength="80" placeholder="例如：ETH 行情监控" />
        </el-form-item>
        <el-form-item label="策略插件" prop="pluginCode">
          <el-select v-model="form.pluginCode" style="width:100%">
            <el-option v-for="item in plugins" :key="item.code" :label="item.name" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="交易对"><el-input model-value="ETHUSDT" disabled /></el-form-item>
        <el-form-item label="K线周期"><el-input model-value="15m" disabled /></el-form-item>
        <el-alert title="仅监听公开行情，打印服务端日志，不发送任何交易订单。" type="info" :closable="false" />
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import type { StrategyVO, StrategyForm, StrategyPluginVO } from '@/api/quant/types';
import { addStrategy, delStrategy, listStrategies, listStrategyPlugins, startStrategy, stopStrategy, updateStrategy } from '@/api/quant';

const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const rows = ref<StrategyVO[]>([]);
const plugins = ref<StrategyPluginVO[]>([]);
const total = ref(0);
const query = reactive({ pageNum: 1, pageSize: 10 });
const form = reactive<StrategyForm>({
  strategyName: '', pluginCode: 'price_logger', pluginVersion: '1.0',
  defaultInterval: '15m', paramsJson: '{}', status: '0'
});
const rules: FormRules = {
  strategyName: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
  pluginCode: [{ required: true, message: '请选择插件', trigger: 'change' }]
};

async function load() {
  loading.value = true;
  try {
    const [list, catalog] = await Promise.all([listStrategies(query), listStrategyPlugins()]);
    rows.value = list.data?.rows || [];
    total.value = list.data?.total || 0;
    plugins.value = (catalog.data || []).filter(item => item.code === 'price_logger');
  } finally {
    loading.value = false;
  }
}
function openAdd() {
  Object.assign(form, { id: undefined, strategyName: '', pluginCode: 'price_logger', pluginVersion: '1.0', defaultInterval: '15m', paramsJson: '{}', status: '0' });
  dialogVisible.value = true;
}
function openEdit(row: StrategyVO) {
  Object.assign(form, row, { pluginCode: 'price_logger', defaultInterval: '15m', paramsJson: '{}' });
  dialogVisible.value = true;
}
async function save() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    if (form.id) await updateStrategy(form);
    else await addStrategy(form);
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}
async function toggle(row: StrategyVO, start: boolean) {
  if (start) await startStrategy(row.id);
  else await stopStrategy(row.id);
  ElMessage.success(start ? '策略已启动（等待行情）' : '策略已停止');
  await load();
}
async function remove(row: StrategyVO) {
  await ElMessageBox.confirm('确定删除“' + row.strategyName + '”？', '删除策略', { type: 'warning' });
  await delStrategy(row.id);
  ElMessage.success('删除成功');
  await load();
}
onMounted(load);
</script>
