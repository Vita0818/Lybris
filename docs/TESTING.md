# TESTING

## 外部依赖与禁止兜底验证（Vitemis 强制规则）

本项目继承 `/Users/vita/Vitemis/docs/DEPENDENCY_POLICY.md`。涉及外部能力的变更必须验证：

- exact 外部依赖可用时只调用其官方 API/扩展点，不调用第一方重复实现。
- 依赖缺失、版本不兼容或构建/签名/许可证/平台/安全条件不成立时，产生明确、可诊断失败并停止该能力。
- 失败路径不会切换到 legacy、另一 provider/backend、adapter/shim、cache、mock、简化实现或不完整路径。
- 测试 double 只存在于测试 target，不进入 production selection 或 runtime fallback。
- Review 检查新增 wrapper/adapter/facade 是否仅为官方 API 必需的最薄接线；发现核心能力复制、第二实现或静默降级即判定失败。

最近自查日期：2026-06-25

## 环境

- 现代浏览器（支持动态 `import()`/`fetch()`/Canvas/DOM API）。
- 本地静态服务器必需（`file://` 破坏 fetch）。
- 可选 Python 3（静态服务器）；可选 Node.js（`node --check`）。
- GitHub Actions env（工作流）；Apps Script env（示例）。

## 依赖安装

无需安装——运行时库（PDF.js/markdown-it/DOMPurify/Viewer.js）全 vendored。无 `package.json`/lockfile。

## 构建

无构建。预览：`python3 -m http.server 8000` → `http://localhost:8000/`。

## 测试

- 单元测试：无。
- 集成测试：无。索引同步在 GitHub Actions 手动验证（Actions → `Update Drive Index` → 确认下载/格式/commit-on-diff）。不得在本地模拟写 `data/drive-index.json`（除非知真实 secret/URL）。
- UI 测试：无自动化。9 步手动 UI 矩阵（见下）。

## Lint / Format

无配置 lint/format。可用：
- `git diff --check`
- `python3 -m json.tool data/{site-config,subject-config,drive-index}.json`（仅语法，无 schema）
- `node --check script.js`（仅语法）

> 这些非官方测试脚本；若新增真实配置须更新本文档。

## 手动验证矩阵

| 场景 | 步骤 | 预期 | 状态 |
|---|---|---|---|
| 启动 | `python3 -m http.server 8000` → 打开 | 页面加载 | UNKNOWN |
| 标题/品牌/学科/avatar/副标题 | 检查页头 | 来自 site/subject-config | UNKNOWN |
| drive-source 按钮 | `driveFolderUrl` 空时 | 不可用状态 | UNKNOWN |
| 分类 pills | 检查 | 来自 subject-config categories | UNKNOWN |
| 树/面包屑/返回 | 导航 | 同步 | UNKNOWN |
| 搜索 | 按 title/category/updatedAt | 结果正确 | UNKNOWN |
| PDF 预览 | 预览 PDF | PDF.js 渲染 + fallback 文案 | UNKNOWN |
| Markdown 预览 | 预览 Markdown | 净化渲染 | UNKNOWN |
| 图片预览 | 预览图片 | Viewer.js 打开 | UNKNOWN |
| URL `#`/不可 fetch | 预览 | fallback 文案 + "打开原始" | UNKNOWN |
| 移动端宽度 | 缩窄窗口 | 无重叠 | UNKNOWN |

## 验证边界声明

- 文档任务：至少 `git diff --check` + `git status --short`；**未运行构建/测试**（无测试存在），须声明。
- 代码任务：因无测试，必须手动跑上表相关场景。

## 常见失败原因

- `file://` 破坏 fetch。
- JSON 糟糕/类型不符 `script.js` 预期。
- `vendor/` 文件缺失/移动。
- `pdf.worker.mjs` 移动。
- Drive 权限/CORS。
- 缺/无效 `DRIVE_INDEX_SOURCE_URL`。
- Actions 分支无写权限。
- 图片/Markdown URL 用了 `sanitizeResourceUrl` 拒绝的协议。
