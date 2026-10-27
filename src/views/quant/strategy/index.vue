<template>
  <div class="p-2 app-container quant-strategy-page">
    <div class="search-wrap">
      <el-card class="search-panel" shadow="hover">
        <template #header>
          <div class="panel-heading"><h3>筛选条件</h3></div>
        </template>
        <el-form :inline="true" class="query-form" @submit.prevent="handleQuery">
          <el-form-item label="策略名称">
            <el-input v-model="query.strategyName" clearable placeholder="请输入策略名称" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" clearable placeholder="请选择">
              <el-option label="运行中" value="RUNNING" />
              <el-option label="已停止" value="STOPPED" />
            </el-select>
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
            <span class="panel-kicker">Strategy Plugins</span>
            <h3>策略管理</h3>
            <p>查看系统已注册策略插件及版本。策略插件只生成信号，不直接访问交易所。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['quant:strategy:add']" icon="Plus" type="primary" @click="openAdd">
              新增策略
            </el-button>
            <right-toolbar :search="false" @query-table="load"></right-toolbar>
          </div>
        </div>
      </template>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="策略定义" name="definitions">
          <el-table v-loading="loading" class="data-table" :data="strategies" border>
            <el-table-column align="center" label="序号" type="index" width="80">
              <template #default="scope">
                <span>{{ scope.$index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="策略名称" min-width="160" prop="strategyName" show-overflow-tooltip />
            <el-table-column label="插件 Code" min-width="160" prop="pluginCode" align="center" show-overflow-tooltip />
            <el-table-column label="最大开仓数量" min-width="110" prop="maxOpenCount" align="center" />
            <el-table-column label="插件版本" width="110" prop="pluginVersion" align="center" />
            <el-table-column label="插件说明" min-width="180" show-overflow-tooltip>
              <template #default="scope">
                {{ pluginDescription(scope.row.pluginCode) }}
              </template>
            </el-table-column>
            <el-table-column label="策略账户" min-width="180" show-overflow-tooltip>
              <template #default="scope">
                {{ strategyAccountNames[String(scope.row.id)] || '未绑定' }}
              </template>
            </el-table-column>
            <el-table-column label="登录账户授权" min-width="180" show-overflow-tooltip>
              <template #default="scope">
                {{ strategyUserNames[String(scope.row.id)] || '未配置' }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="scope">
                <el-tag :type="strategyStatusType(scope.row.status)" size="small">
                  {{ strategyStatusLabel(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column fixed="right" label="操作" width="220" align="center">
              <template #default="scope">
                <el-button
                  v-hasPermi="['quant:strategy:edit']"
                  link
                  type="primary"
                  @click="openEdit(scope.row as StrategyVO)"
                >
                  编辑
                </el-button>
                <el-button
                  v-if="scope.row.status !== 'RUNNING' && scope.row.status !== '1'"
                  v-hasPermi="['quant:strategy:edit']"
                  link
                  type="success"
                  @click="changeStatus(scope.row as StrategyVO, true)"
                >
                  启动
                </el-button>
                <el-button
                  v-else
                  v-hasPermi="['quant:strategy:edit']"
                  link
                  type="warning"
                  @click="changeStatus(scope.row as StrategyVO, false)"
                >
                  停止
                </el-button>
                <el-button
                  v-hasPermi="['quant:strategy:remove']"
                  link
                  type="danger"
                  @click="remove(scope.row as StrategyVO)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="strategyTotal > 0"
            v-model:limit="query.pageSize"
            v-model:page="query.pageNum"
            :total="strategyTotal"
            @pagination="load"
          />
        </el-tab-pane>
        <el-tab-pane label="运行实例" name="instances">
          <el-table :data="instances" border>
            <el-table-column align="center" label="序号" type="index" width="80" />
            <el-table-column label="策略" prop="strategyName" align="center" min-width="180" show-overflow-tooltip />
            <el-table-column label="账户" prop="accountName" align="center" min-width="100" show-overflow-tooltip />
            <el-table-column label="交易对" prop="symbol" align="center" width="120" show-overflow-tooltip />
            <el-table-column label="状态" prop="status" align="center" width="100" />
            <el-table-column label="最近错误" prop="lastError" align="center" min-width="220" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="持仓状态" name="states">
          <el-table :data="states" border>
            <el-table-column align="center" label="序号" type="index" width="80" />
            <el-table-column label="实例名称" prop="instanceName" align="center" min-width="220" show-overflow-tooltip />
            <el-table-column label="实例编号" prop="instanceId" align="center" min-width="180" show-overflow-tooltip />
            <el-table-column label="方向" align="center" width="100">
              <template #default="scope"><dict-tag :options="quant_position_direction" :value="scope.row.direction" /></template>
            </el-table-column>
            <el-table-column label="数量" align="center" width="140">
              <template #default="scope">{{ formatDecimal(scope.row.positionQty) }}</template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="110">
              <template #default="scope">{{ scope.row.statusLabel || positionStatusLabel(scope.row.status) }}</template>
            </el-table-column>
            <el-table-column label="需恢复" align="center" width="100">
              <template #default="scope">{{ scope.row.recoveryRequiredLabel || (scope.row.recoveryRequired ? '是' : '否') }}</template>
            </el-table-column>
            <el-table-column label="更新时间" prop="updatedAt" align="center" min-width="170" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="插件目录" name="plugins">
          <el-table :data="plugins" border>
            <el-table-column align="center" label="序号" type="index" width="80" />
            <el-table-column label="策略名称" prop="name" align="center" min-width="160" show-overflow-tooltip />
            <el-table-column label="插件 Code" prop="code" align="center" min-width="150" show-overflow-tooltip />
            <el-table-column label="版本" prop="version" align="center" min-width="80" />
            <el-table-column label="参数示例" prop="paramsExample" align="center" min-width="180" show-overflow-tooltip>
              <template #default="scope">
                <el-text class="params-example">{{ JSON.stringify(scope.row.paramsExample || {}, null, 2) }}</el-text>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑策略' : '新增策略'" width="1200px" top="4vh">
      <el-form ref="strategyFormRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="策略名称" prop="strategyName">
          <el-input v-model="form.strategyName" />
        </el-form-item>
        <el-form-item label="插件 Code" prop="pluginCode">
          <el-select v-model="form.pluginCode" filterable @change="handlePluginChange">
            <el-option
              v-for="item in plugins"
              :key="item.code"
              :label="item.name + ' (' + item.code + ')'"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="插件版本" prop="pluginVersion">
          <el-select v-model="form.pluginVersion" :disabled="!form.pluginCode" placeholder="请选择插件版本">
            <el-option v-for="version in availablePluginVersions" :key="version" :label="version" :value="version" />
          </el-select>
        </el-form-item>
        <el-form-item label="插件说明">
          <el-input :model-value="selectedPlugin?.name || ''" readonly />
        </el-form-item>
        <el-form-item label="插件参数 JSON">
          <el-input v-model="form.paramsJson" :rows="3" type="textarea" />
        </el-form-item>
        <el-form-item label="登录账户授权" prop="userIds">
          <el-select
            v-model="userIds"
            multiple
            filterable
            collapse-tags
            placeholder="仅授权用户可查看和使用此策略"
            style="width: 100%"
          >
            <el-option
              v-for="item in users"
              :key="item.userId"
              :label="`${item.nickName}（${item.userName}）`"
              :value="item.userId"
            />
          </el-select>
          <div class="form-tip">授权控制策略可见性和操作权限；交易凭证仍在“策略账户”中配置。</div>
        </el-form-item>
        <StrategyRuntimeConfigPanel
          :form="form"
          :credentials="credentials"
          :credential-ids="credentialIds"
          :symbols="symbols"
          :symbol-ids="selectedSymbolIds"
          :rows="symbolRows"
          @update-credential-ids="updateCredentialIds"
          @sync-symbols="syncSymbolRows"
          @search-symbols="searchSymbols"
          @open-params="openParams"
          @remove-symbol="removeSymbolRow"
        />
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-hasPermi="['quant:strategy:edit']" type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
    <el-drawer v-model="paramsVisible" title="策略参数配置" size="480px">
      <el-form label-width="180px">
        <el-form-item v-for="item in parameterFields" :key="item.key" :label="item.label">
          <el-input-number v-model="parameterValues[item.key]" :min="0" :step="item.rate ? 0.01 : 1" />
        </el-form-item>
      </el-form>
      <el-input v-model="parameterJsonPreview" :rows="8" type="textarea" readonly />
      <template #footer>
        <el-button @click="paramsVisible = false">取消</el-button>
        <el-button v-hasPermi="['quant:strategy:edit']" type="primary" @click="saveParams">确定</el-button>
      </template>
    </el-drawer>
    <el-dialog v-model="preflightVisible" title="启动前配置预检" width="760px">
      <el-alert
        v-if="preflightResult"
        :title="preflightResult.valid ? '预检通过，可以启动' : '预检未通过，请修正配置'"
        :type="preflightResult.valid ? 'success' : 'error'"
        show-icon
      />
      <el-descriptions v-if="preflightResult" :column="2" border class="mt-4">
        <el-descriptions-item label="实例数量">{{ preflightResult.instanceCount }}</el-descriptions-item>
        <el-descriptions-item label="账户数量">{{ preflightResult.accounts.length }}</el-descriptions-item>
      </el-descriptions>
      <el-alert
        v-for="error in preflightResult?.errors || []"
        :key="error"
        class="mt-2"
        :title="error"
        type="error"
        :closable="false"
      />
      <el-table v-if="preflightResult" :data="preflightResult.symbols" border class="mt-4">
        <el-table-column align="center" label="序号" type="index" width="80"/>
        <el-table-column prop="symbol" label="交易对" />
        <el-table-column prop="intervalCode" label="周期" />
        <el-table-column prop="leverage" label="杠杆" />
        <el-table-column prop="marginMode" label="保证金模式" />
      </el-table>
      <template #footer>
        <el-button @click="preflightVisible = false">取消</el-button>
        <el-button v-hasPermi="['quant:strategy:edit']" type="primary" :disabled="!preflightResult?.valid" @click="confirmStart">确认启动</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import type {
  CredentialVO,
  StrategyForm,
  StrategyInstanceVO,
  StrategyPluginVO,
  StrategyPositionStateVO,
  StrategySymbolBinding,
  StrategyPreflightResult,
  StrategyVO,
  SymbolVO
} from '@/api/quant/types';
import type { UserVO } from '@/api/system/user/types';
import {
  addStrategy,
  delStrategy,
  listCredential,
  listStrategies,
  listStrategyInstances,
  listStrategyPlugins,
  listStrategyPositionStates,
  listSymbol,
  getSymbol,
  startStrategy,
  stopStrategy,
  updateStrategy,
  listStrategyAccounts,
  listStrategySymbols,
  replaceStrategyAccounts,
  replaceStrategySymbols,
  preflightStrategy,
  listStrategyUsers,
  replaceStrategyUsers
} from '@/api/quant';
import { listUser } from '@/api/system/user';
import StrategyRuntimeConfigPanel from '@/components/quant/StrategyRuntimeConfigPanel.vue';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';

const { quant_position_direction } = toRefs<any>(useDict('quant_position_direction'));

const loading = ref(false);
const plugins = ref<StrategyPluginVO[]>([]);
const strategies = ref<StrategyVO[]>([]);
const strategyTotal = ref(0);
const query = reactive<PageQuery & { strategyName?: string; status?: string }>({
  pageNum: 1,
  pageSize: 10,
  strategyName: '',
  status: ''
});
const instances = ref<StrategyInstanceVO[]>([]);
const states = ref<StrategyPositionStateVO[]>([]);
const activeTab = ref('definitions');
const dialogVisible = ref(false);
const form = reactive<StrategyForm>({
  strategyName: '',
  pluginCode: '',
  pluginVersion: '',
  paramsJson: '{}',
  status: '0'
});
const credentials = ref<CredentialVO[]>([]);
const symbols = ref<SymbolVO[]>([]);
const users = ref<UserVO[]>([]);
const strategyUserNames = ref<Record<string, string>>({});
const strategyAccountNames = ref<Record<string, string>>({});
const userIds = ref<Array<number | string>>([]);
const credentialIds = ref<Array<number | string>>([]);
const selectedSymbolIds = ref<Array<number | string>>([]);
const symbolRows = ref<StrategySymbolBinding[]>([]);
const paramsVisible = ref(false);
const paramsRow = ref<StrategySymbolBinding>();
const parameterValues = reactive<Record<string, number>>({});
const parameterFields = [
  { key: 'entryAngleDegrees', label: '开仓角度', rate: false },
  { key: 'firstProfitTakingRate', label: '首次止盈率', rate: true },
  { key: 'firstClosePositionRate', label: '首次平仓比例', rate: true },
  { key: 'stepRatio', label: '阶梯比例', rate: true },
  { key: 'localStopLossRate', label: '本地止损率', rate: true }
];
const parameterJsonPreview = computed(() => JSON.stringify(parameterValues, null, 2));
const preflightVisible = ref(false);
const preflightResult = ref<StrategyPreflightResult>();
const pendingStartStrategy = ref<StrategyVO>();
const selectedPlugin = computed(() => plugins.value.find(item => item.code === form.pluginCode));
const defaultParamsJson = computed(() => JSON.stringify(selectedPlugin.value?.paramsExample || {}, null, 2));
const pluginDescription = (pluginCode: string) => plugins.value.find(item => item.code === pluginCode)?.name || '—';
const strategyFormRef = ref<ElFormInstance>();
const availablePluginVersions = computed(() => {
  const versions = [plugins.value.find(item => item.code === form.pluginCode)?.version, form.pluginVersion].filter(
    (version): version is string => Boolean(version)
  );
  return [...new Set(versions)];
});
const rules = {
  strategyName: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
  pluginCode: [{ required: true, message: '请选择插件', trigger: 'change' }]
};
const strategyStatusLabel = (status: unknown) => {
  const value = String(status ?? '').toUpperCase();
  if (value === '1' || value === 'RUNNING') return '运行中';
  if (value === '0' || value === 'STOPPED') return '已停止';
  return '未知';
};
const strategyStatusType = (status: unknown) => {
  const value = String(status ?? '').toUpperCase();
  if (value === '1' || value === 'RUNNING') return 'success';
  if (value === '0' || value === 'STOPPED') return 'info';
  return 'warning';
};
const formatDecimal = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-';
  const text = String(value);
  if (/e/i.test(text)) {
    const number = Number(value);
    if (Number.isFinite(number)) return number.toLocaleString('zh-CN', { useGrouping: false, maximumFractionDigits: 20 });
  }
  return text.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
};
const positionStatusLabel = (status: unknown) => {
  const value = String(status || '').toUpperCase();
  if (value === 'OPEN') return '持仓中';
  if (value === 'OPEN_PENDING') return '开仓中';
  if (value === 'EXIT_PENDING') return '平仓中';
  if (value === 'CLOSED') return '已平仓';
  return status ? String(status) : '-';
};

const load = async () => {
  loading.value = true;
  try {
    const [pluginRes, strategyRes, instanceRes, stateRes, credentialRes, symbolRes, userRes] = await Promise.all([
      listStrategyPlugins(),
      listStrategies(query),
      listStrategyInstances({ pageNum: 1, pageSize: 100 }),
      listStrategyPositionStates({ pageNum: 1, pageSize: 100 }),
      listCredential({ pageNum: 1, pageSize: 100 }),
      listSymbol({ pageNum: 1, pageSize: 100, quoteAsset: 'USDT', favorite: true }),
      listUser({ pageNum: 1, pageSize: 100, status: '0' })
    ]);
    plugins.value = pluginRes.data || [];
    strategies.value = strategyRes.data?.rows || [];
    strategyTotal.value = strategyRes.data?.total || 0;
    instances.value = instanceRes.data?.rows || [];
    states.value = stateRes.data?.rows || [];
    credentials.value = credentialRes.data?.rows || [];
    symbols.value = symbolRes.data?.rows || [];
    users.value = userRes.data?.rows || [];
    const [authorizationEntries, accountEntries] = await Promise.all([
      Promise.all(strategies.value.map(async strategy => {
        try {
          const response = await listStrategyUsers(strategy.id);
          const names = (response.data || [])
            .map(binding => users.value.find(user => String(user.userId) === String(binding.userId)))
            .filter((user): user is UserVO => Boolean(user))
            .map(user => user.nickName || user.userName);
          return [String(strategy.id), names.join('、')] as const;
        } catch {
          return [String(strategy.id), ''] as const;
        }
      })),
      Promise.all(strategies.value.map(async strategy => {
        try {
          const response = await listStrategyAccounts(strategy.id);
          const names = (response.data || [])
            .filter(binding => String(binding.status) === '0')
            .map(binding => {
              const credential = credentials.value.find(item => String(item.id) === String(binding.credentialId));
              return credential?.accountName || `账户 ${binding.credentialId}`;
            });
          return [String(strategy.id), [...new Set(names)].join('、')] as const;
        } catch {
          return [String(strategy.id), '读取失败'] as const;
        }
      }))
    ]);
    strategyUserNames.value = Object.fromEntries(authorizationEntries);
    strategyAccountNames.value = Object.fromEntries(accountEntries);
  } finally {
    loading.value = false;
  }
};

onMounted(load);
const handleQuery = () => {
  query.pageNum = 1;
  load();
};
const resetQuery = () => {
  query.pageNum = 1;
  query.strategyName = '';
  query.status = '';
  load();
};
const handlePluginChange = (pluginCode: string) => {
  const plugin = plugins.value.find(item => item.code === pluginCode);
  form.pluginVersion = plugin?.version || '';
  form.paramsJson = JSON.stringify(plugin?.paramsExample || {}, null, 2);
  for (const row of symbolRows.value) {
    if (!row.paramsJson || row.paramsJson === '{}') row.paramsJson = form.paramsJson;
  }
};
const openAdd = () => {
  Object.assign(form, {
    id: undefined,
    strategyName: '',
    pluginCode: '',
    pluginVersion: '',
    paramsJson: '{}',
    status: '0',
    maxOpenCount: 2,
    defaultInterval: '15m',
    defaultOpenRatio: 0.1,
    defaultStopLossRatio: 0.05,
    defaultLeverage: 10,
    defaultMarginMode: 'ISOLATED'
  });
  credentialIds.value = [];
  userIds.value = [];
  selectedSymbolIds.value = [];
  symbolRows.value = [];
  dialogVisible.value = true;
};
const openEdit = async (row: StrategyVO) => {
  Object.assign(form, row);
  const [accountRes, symbolRes, userRes] = await Promise.all([
    listStrategyAccounts(row.id),
    listStrategySymbols(row.id),
    listStrategyUsers(row.id)
  ]);
  credentialIds.value = (accountRes.data || []).map(item => item.credentialId);
  symbolRows.value = (symbolRes.data || []).map(item => ({
    ...item,
    marginMode: item.marginMode || form.defaultMarginMode || 'ISOLATED'
  }));
  selectedSymbolIds.value = symbolRows.value.map(item => item.symbolId);
  const knownIds = new Set(symbols.value.map(item => String(item.id)));
  const missingIds = selectedSymbolIds.value.filter(id => !knownIds.has(String(id)));
  if (missingIds.length) {
    const selectedSymbols = await Promise.all(missingIds.map(id => getSymbol(id)));
    symbols.value = [...symbols.value, ...selectedSymbols.flatMap(result => (result.data ? [result.data] : []))];
  }
  userIds.value = (userRes.data || []).map(item => item.userId);
  dialogVisible.value = true;
};
const updateCredentialIds = (ids: Array<number | string>) => {
  credentialIds.value = ids;
};
const searchSymbols = async (keyword: string) => {
  const response = await listSymbol({ pageNum: 1, pageSize: 50, quoteAsset: 'USDT', symbol: keyword });
  const known = new Map(symbols.value.map(item => [String(item.id), item]));
  for (const item of response.data?.rows || []) known.set(String(item.id), item);
  symbols.value = [...known.values()];
};
const syncSymbolRows = (value: unknown) => {
  const ids = Array.isArray(value) ? (value as Array<number | string>) : [];
  selectedSymbolIds.value = [...ids];
  const old = new Map(symbolRows.value.map(item => [String(item.symbolId), item]));
  symbolRows.value = ids.map(
    symbolId =>
      old.get(String(symbolId)) || {
        symbolId,
        intervalCode: form.defaultInterval || '15m',
        openRatio: Number(form.defaultOpenRatio || 0.1),
        stopLossRatio: Number(form.defaultStopLossRatio || 0.05),
        leverage: Number(form.defaultLeverage || 10),
        marginMode: form.defaultMarginMode || 'ISOLATED',
        paramsJson: form.paramsJson && form.paramsJson !== '{}' ? form.paramsJson : defaultParamsJson.value,
        status: '0'
      }
  );
};
const removeSymbolRow = (id: number | string) => {
  selectedSymbolIds.value = selectedSymbolIds.value.filter(item => String(item) !== String(id));
  syncSymbolRows(selectedSymbolIds.value);
};
const openParams = (row: unknown) => {
  const typedRow = row as StrategySymbolBinding;
  paramsRow.value = typedRow;
  Object.keys(parameterValues).forEach(key => delete parameterValues[key]);
  try {
    Object.assign(parameterValues, JSON.parse(typedRow.paramsJson || form.paramsJson || '{}'));
  } catch {
    modal.msgError('参数 JSON 无效');
  }
  paramsVisible.value = true;
};
const saveParams = () => {
  if (paramsRow.value) paramsRow.value.paramsJson = parameterJsonPreview.value;
  paramsVisible.value = false;
};
const submit = async () => {
  if (form.id && (form.status === '1' || form.status === 'RUNNING')) {
    modal.msgError('运行中的策略必须先停止，才能修改交易对配置');
    return;
  }
  const valid = await strategyFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (form.id) await updateStrategy(form);
  else {
    const response = await addStrategy(form);
    form.id = response.data?.id;
  }
  if (!form.id) return;
  await replaceStrategyAccounts(form.id, credentialIds.value);
  await replaceStrategyUsers(form.id, userIds.value);
  await replaceStrategySymbols(form.id, symbolRows.value);
  modal.msgSuccess('操作成功');
  dialogVisible.value = false;
  await load();
};
const changeStatus = async (row: StrategyVO, start: boolean) => {
  if (start) {
    const response = await preflightStrategy(row.id);
    preflightResult.value = response.data;
    pendingStartStrategy.value = row;
    preflightVisible.value = true;
    return;
  }
  await modal.confirm(`确认停止策略“${row.strategyName}”吗？`);
  await stopStrategy(row.id);
  modal.msgSuccess('操作成功');
  await load();
};
const confirmStart = async () => {
  const row = pendingStartStrategy.value;
  if (!row) return;
  await modal.confirm(`确认启动策略“${row.strategyName}”吗？`);
  await startStrategy(row.id);
  preflightVisible.value = false;
  modal.msgSuccess('操作成功');
  await load();
};
const remove = async (row: StrategyVO) => {
  await modal.confirm(`确认删除策略“${row.strategyName}”吗？`);
  await delStrategy(row.id);
  await load();
};
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;

.form-tip {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
