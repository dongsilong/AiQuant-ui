# 量化管理页面规范

量化管理页面沿用 Demo、系统公告等后台 CRUD 页面规范：

- 根节点使用 `p-2 app-container`，页面需要查询时使用 `search-wrap`、`search-panel` 和 `query-form`。
- 列表使用 `el-card.table-panel`，卡片头部使用 `toolbar-shell`、`table-heading` 和 `toolbar-actions`。
- 列表表格使用 `border` 和 `data-table`，底部使用公共 `pagination`。
- 页面样式引入 `@/assets/styles/components/page-shell`，并使用 `@include pageShell.table-crud-page`。
- 操作按钮遵循项目的权限指令、图标按钮和二次确认约定；新增、编辑弹窗使用 Element Plus 表单和项目公共弹窗能力。
- 页面只通过 `@/api/quant` 访问接口，类型集中放在 `@/api/quant/types.ts`。

新增量化页面或调整现有页面时，保持以上结构、间距、卡片层级和按钮位置，不另起一套页面壳层。