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

## 3. 依赖、配置与业务页面

未删除 `package.json` 依赖、路由、API、页面、权限指令或构建配置。仅凭静态搜索无引用不足以排除 Vue 自动导入、插件注册、动态路由、组件解析或运行时加载路径。前端依赖需要结合完整源码扫描、锁文件一致性及生产构建验证后再删。

## 4. 验证与限制

- 已远程核验该分支递归文件树；基线 `fix/dev-ui` 未修改。
- 未运行 `pnpm build`、`pnpm lint` 或测试，不能宣称构建/回归通过。
- 未创建 PR，未合并。
- 本轮没有删除任何前端业务代码、依赖或配置。

## 5. 结论

已完成有充分证据的 Graphify 生成物清理，减少工作树文件大小约 5.30 MB。其余源码/依赖删除暂未达到安全删除标准，避免破坏交易终端、权限、路由或动态组件行为。
