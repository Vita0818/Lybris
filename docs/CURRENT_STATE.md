# CURRENT_STATE

最近一次自查日期：2026-06-25

## 当前真实状态总览

- Lybris 是纯静态资料站模板（浏览器加载 `index.html`/`style.css`/`script.js`/`data/*.json`，无 Node 服务/数据库/后端）。
- 运行时库全 vendored（PDF.js/markdown-it/DOMPurify/Viewer.js），无 CDN 依赖。
- 无 `package.json`/构建配置/测试 runner。
- 自查时工作区有 6 文件未提交改动（`data/site-config.json`/`data/subject-config.json`/`index.html`/`readme.md`/`script.js`/`style.css`，~666 add/614 del），须保护不得回退。

## 已有能力

| 能力 | 入口 / 关键函数 | 测试覆盖 | 手动验证 | 真机验证 |
|---|---|---|---|---|
| 静态页面骨架 | `index.html`/`style.css` | 无 | UNKNOWN | UNKNOWN |
| 配置加载 + fallback | `loadConfigs()`/`fallbackSiteConfig`/`fallbackSubjectConfig`/`applyConfig()` | 无 | UNKNOWN | UNKNOWN |
| drive-index 加载/归一化 | `normalizeTree()`/`inferNodeKind()` | 无 | UNKNOWN | UNKNOWN |
| 文件夹树 + 面包屑 + 返回 | `renderFolderTree()`/`renderBreadcrumb()`/`setCurrentFolderByPathKey()` | 无 | UNKNOWN | UNKNOWN |
| 资料集/资料卡片 | `renderFolderView()`/`renderLibrarySections()`/`createCard()` | 无 | UNKNOWN | UNKNOWN |
| 标题/分类/updatedAt 搜索 | `searchTree()` | 无 | UNKNOWN | UNKNOWN |
| 打开原始文件链接 | `createCard()` | 无 | UNKNOWN | UNKNOWN |
| PDF 预览（PDF.js + Drive iframe fallback） | `renderPdfPreview()` | 无 | UNKNOWN | UNKNOWN |
| Markdown 预览（markdown-it + DOMPurify） | `renderMarkdownPreview()` | 无 | UNKNOWN | UNKNOWN |
| 图片预览（Viewer.js） | `renderImagePreview()` | 无 | UNKNOWN | UNKNOWN |
| Actions 同步 drive-index | `update-drive-index.yml` | 无 | UNKNOWN | UNKNOWN |
| Apps Script 示例（doGet，仅导出 PDF） | `google-apps-script.js` | 无 | UNKNOWN | UNKNOWN |

## 未完成 / 进行中

- 无自动化测试。
- 无 `package.json`/构建/lint。
- 无 `data/*.json` 的 JSON schema。
- 前端不能直接扫 Drive（依赖预建索引）。
- Apps Script 示例仅导出 PDF（前端支持 PDF/Markdown/图片）。
- 无提交的 GitHub Pages 分支/目录配置。

## 风险

- 自查时 6 文件未提交改动须保护。
- `pathKey` 由 title 路径派生，重复 title 会碰撞。
- 缺 drive-index schema。
- `file://` 协议会破坏 fetch（须用静态服务器）。
- 预览依赖可 fetch 的 URL / Drive 权限 / CORS。
- Actions 用 `contents: write` + 直接 push（分支保护关注）。
- `google-apps-script.js` 硬编码 Drive 根文件夹 ID（不得重新发布）。

## 工作区状态

本轮自查（2026-06-25）为只读分析，未产生仓库改动。注意自查时存在 6 文件未提交改动。

## 文档与源码冲突

无现有 `docs/` 文档与源码冲突（文档为首次标准化创建）。仓内 `AGENTS.md` 已是操作协议型（8 段齐全），本目录版补齐标准 8 报告字段。
