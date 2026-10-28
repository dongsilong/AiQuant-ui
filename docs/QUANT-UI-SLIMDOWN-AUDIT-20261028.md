# AiQuant-ui 前端瘦身审计报告（2026-10-28）

## 1. 范围

- 仓库：`dongsilong/AiQuant-ui`
- 审计分支：`chore/quant-system-slimdown-20261028`
- 基线：`fix/dev-ui`

## 2. 已完成且已提交的清理

删除 `graphify-out` 中可再生成的分析缓存/图数据：
- `cache/`
- `graph.json`
- `graph.html`
- `.graphify_analysis.json`
- `.graphify_detect.json`
- `manifest.json`

保留 `GRAPH_REPORT.md` 与 Graphify 标签/标记文件；更新 `.gitignore` 防止生成物再次进入版本控制。

- 提交：[`110f1fcc36caeada8b27b11eb85d6d5ff767cc69`](https://github.com/dongsilong/AiQuant-ui/commit/110f1fcc36caeada8b27b11eb85d6d5ff767cc69)
- 分支：[chore/quant-system-slimdown-20261028](https://github.com/dongsilong/AiQuant-ui/tree/chore/quant-system-slimdown-20261028)
- `graphify-out` 工作树文件大小：5,336,898 → 37,293 bytes，减少 5,299,605 bytes。

## 3. 第二轮源码瘦身（2026-10-28）

- `src/api/quant/index.ts`：移除未使用的 `TradeSnapshot` 类型导入；在该文件内该标识符只有导入处一处引用。未删除类型定义本身，避免影响其他页面/模块的类型兼容。提交：[`55daef7`](https://github.com/dongsilong/AiQuant-ui/commit/55daef76deb25f4d74283d384d71b4f1abfdcba8)。

## 4. 依赖、配置与业务页面

未删除 `package.json` 依赖、路由、API、页面、权限指令或构建配置。仅凭静态搜索无引用不足以排除 Vue 自动导入、插件注册、动态路由、组件解析或运行时加载路径。前端依赖需要结合完整源码扫描、锁文件一致性及生产构建验证后再删。

## 5. 验证与限制

- 已远程核验该分支递归文件树；基线 `fix/dev-ui` 未修改。
- 本轮只移除一个可明确证明在该 API 模块内未使用的类型导入；未运行 `pnpm build`、`pnpm lint` 或测试，不能宣称构建/回归通过。
- 未创建 PR，未合并。
- 本轮没有删除任何前端业务代码、依赖或配置。

## 6. 结论

已完成有充分证据的 Graphify 生成物清理，减少工作树文件大小约 5.30 MB。其余源码/依赖删除暂未达到安全删除标准，避免破坏交易终端、权限、路由或动态组件行为。


## 7. 第三轮目录核查（2026-10-28）

- 对瘦身分支递归文件树共 452 个文件进行名称特征筛查，未发现明显的 `.bak`、`.orig`、`.rej`、`.tmp`、`dist/`、`coverage/` 或 `node_modules/` 遗留文件。
- 命中 `legacy` / `copy` 关键词的文件为现存功能文件（如复制文本指令、工作流任务复制页面、legacy 样式工具），不能仅凭名称认定无用，未删除。
- 本轮没有足够证据安全删除页面、组件、路由、依赖或样式；完整死代码分析及 pnpm 构建/测试仍未执行。
