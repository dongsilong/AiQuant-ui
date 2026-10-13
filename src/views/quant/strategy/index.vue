<template>
  <div class="p-2 app-container">
    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h3>策略管理</h3>
            <el-text type="info">演示版：固定 ETHUSDT，15m 周期。仅订阅并打印实时价格，不执行交易。</el-text>
          </div>
          <el-button v-hasPermi="['quant:strategy:add']" type="primary" icon="Plus" @click="openAdd">新增策略</el-button>
        </div>
      </template>
      <el-table v-loading="loading" :data="rows" border>
        <el-table-column prop="strategyName" label="策略名称" min-width="180" />
        <el-table-column prop="pluginCode" label="策略插件" min-width="140" />
        <el-table-column label="交易对" width="120">ETHUSDT</el-table-column>
        <el-table-column label="周期" width="90">15m</el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 'RUNNING' ? 'success' : 'info'">
              {{ row.status === 'RUNNING' ? '运行中' : '已停止' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="220">
          <template #default="{ row }">
            <el-button v-hasPermi="['quant:strategy:edit']" link @click="openEdit(row)">编辑</el-button>
            <el-button v-if="row.status !== 'RUNNING'" v-hasPermi="['quant:strategy:edit']" link type="success" @click="changeStatus(row, true)">启动</el-button>
            <el-button v-else v-hasPermi="['quant:strategy:edit']" link type="warning" @click="changeStatus(row, false)">停止</el-button>
            <el-button v-hasPermi="['quant:strategy:remove']" link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="load" />
    </el-card>
    <el-dialog v-model="visible" :title="form.id ? '编辑策略' : '新增策略'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="100px" :rules="rules">
        <el-form-item label="策略名称" prop="strategyName">
          <el-input v-model="form.strategyName" maxlength="80" placeholder="例如 ETH 实时行情测试" />
        </el-form-item>
        <el-form-item label="策略插件" prop="pluginCode">
          <el-select v-model="form.pluginCode" style="width: 100%">
            <el-option v-for="plugin in plugins" :key="plugin.code" :label="plugin.name" :value="plugin.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="交易对"><el-input model-value="ETHUSDT" disabled /></el-form-item>
        <el-form-item label="K线周期"><el-input model-value="15m" disabled /></el-form-item>
        <el-alert title="此策略仅监听公开行情并打印服务端日志，不会进行真实或模拟下单。" type="info" :closable="false" />
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
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
const visible = ref(false);
const rows = ref<StrategyVO[]>([]);
const total = ref(0);
const plugins = ref<StrategyPluginVO[]>([]);
const formRef = ref<FormInstance>();
const query = reactive({ pageNum: 1, pageSize: 10 });
const form = reactive<StrategyForm>({ strategyName: '', pluginCode: 'price_logger', pluginVersion: '1.0', paramsJson: '{}', defaultInterval: '15m', status: '0' });
const rules: FormRules = { strategyName: [{ required: true, message: '请输入策略名称', trigger: 'blur' }], pluginCode: [{ required: true, message: '请选择策略插件', trigger: 'change' }] };

async function load() {
  loading.value = true;
  try {
    const [strategies, descriptors] = await Promise.all([listStrategies(query), listStrategyPlugins()]);
    rows.value = strategies.data?.rows || [];
    total.value = strategies.data?.total || 0;
    plugins.value = (descriptors.data || []).filter(plugin => plugin.code === 'price_logger');
  } finally {
    loading.value = false;
  }
}
function openAdd() {
  Object.assign(form, { id: undefined, strategyName: '', pluginCode: 'price_logger', pluginVersion: '1.0', paramsJson: '{}', defaultInterval: '15m', status: '0' });
  visible.value = true;
}
function openEdit(row: StrategyVO) {
  Object.assign(form, row, { pluginCode: 'price_logger', defaultInterval: '15m', paramsJson: '{}' });
  visible.value = true;
}
async function submit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    if (form.id) await updateStrategy(form);
    else await addStrategy(form);
    ElMessage.success('保存成功');
    visible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}
async function changeStatus(row: StrategyVO, start: boolean) {
  if (start) await startStrategy(row.id);
  else await stopStrategy(row.id);
  ElMessage.success(start ? '启动请求成功' : '停止成功');
  await load();
}
async function remove(row: StrategyVO) {
  await ElMessageBox.confirm('确认删除策略“' + row.strategyName + '”？', '删除确认', { type: 'warning' });
  await delStrategy(row.id);
  ElMessage.success('删除成功');
  await load();
}
onMounted(load);
</script>
