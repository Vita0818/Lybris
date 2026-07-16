# DO_NOT_BREAK

## 外部依赖优先与禁止功能兜底（Vitemis 强制规则）

本项目继承 `/Users/vita/Vitemis/docs/DEPENDENCY_POLICY.md`。本节是强制约束，不是建议。

- 当用户指定、仓库已经采用，或经许可证、provenance、安全与平台审查可采用的外部依赖提供同等能力时，必须直接集成该依赖的官方 API 或官方扩展点。
- 不得自行重写同等能力，不得新增替代 adapter、shim、compatibility layer、wrapper、proxy、facade、协议翻译层、parallel backend、preview backend、shadow implementation 或“先兜底、以后再换”的实现。
- 本地代码只允许保留官方 API 必需的最薄生命周期、类型、权限、配置和 bundle 接线；不得重新实现、解释、扩展或替代依赖的核心能力。
- exact 依赖因版本、构建、签名、许可证、平台、安全或官方 API 限制无法接入时，必须停止该能力、明确失败、报告 blocker 并请求用户决定；不得静默降级、切换 legacy/另一 provider/backend、使用 cache/mock/简化路径或继续交付不完整替代实现。
- 现有 fallback、adapter 或重复实现不构成先例，后续不得扩展。安全 fail-closed 与明确要求的旧数据解码/迁移不是功能兜底，但必须保持最窄范围，不能演化成备用产品实现。
- 只有用户针对 exact 依赖、exact 范围和退出条件作出的新明文决定才能例外。

本文列出不可破坏的工程禁区、数据格式、协议、路径和回归要求。修改前必须确认不违反下列任一条目。

## 工程禁区

- 不执行破坏性 Git 操作；不强制 push；不删除用户未提交文件。
- 未经用户明文要求具体 Git 操作，不 add、不 commit、不 push、不创建 PR；编辑、整理、修复、验证或准备工作都不等于提交请求。
- 若用户要求提交，只提交当前 Git root 中与本任务相关的文件；不得递归进入、暂存、提交或推送子仓库、submodule、nested Git repo 或依赖 checkout。
- 不绕过本地 vendored 前端库改 CDN 依赖。
- 不在前端直接读取 GitHub Secret、Apps Script 私有配置或敏感凭据。

## 数据格式禁区

- `data/site-config.json`/`subject-config.json`/`drive-index.json` 必须保持有效 JSON。
- `categories` 必须是数组（`name`/`id`）。
- `decorativeChips` 是兼容字段（虽不渲染但不得删契约）。
- drive-index folder 节点必须有 `children`；`type` 应显式 `folder`/`file`。
- 核心字段 `title`/`url`/`category`/`updatedAt` 不得改名。
- 所有可选预览 URL 字段（`rawUrl`..`path`）前端兼容，不得复用而不更新前端。

## 协议禁区

- `DRIVE_INDEX_SOURCE_URL` secret 名不得变。
- 外部索引 URL 必须返回 `python -m json.tool` 可校验的 JSON。
- `doGet()` 输出结构变更须同步前端解析。
- 无前端路由器（不得引入 server-rewrite 路由）。
- 不得用 cookie/localStorage/IndexedDB 存敏感资源链接。

## 路径禁区

- `index.html` 必须按序加载：`markdown-it.js` → `purify.min.js` → `viewer.min.js` → `script.js`，并加载 `viewer.min.css`。
- `script.js` 配置路径固定：`data/site-config.json`/`data/subject-config.json`/`data/drive-index.json`。
- PDF.js 路径固定：`vendor/pdfjs/pdf.mjs`/`vendor/pdfjs/pdf.worker.mjs`。
- 默认 avatar 路径 `assets/avatar.png`（经 `avatarUrl`）。
- 工作流写 `data/drive-index.json`。

## 不得绕过的安全机制

- Markdown 必须保持 raw HTML 禁用或同等净化；DOMPurify 不得移除。
- 外链 `target="_blank"` + `rel="noopener noreferrer"`。
- URL 候选限制为 relative/`http:`/`https:`（拒 `javascript:`/`data:`）。
- 前端不得读/暴露 secret/token/凭据。
- 不得把硬编码 Drive 根文件夹 ID / 私有索引 URL / 敏感配置写入维护文档。

## 不得随意重构的核心模块

修改前必读源码：配置加载（`fallbackSiteConfig`/`fallbackSubjectConfig`/`loadConfigs`/`applyConfig`）、树归一化（`inferNodeKind`/`safeNode`/`normalizeTree`/`buildVisibleRoot`/`buildRuntimeTree`）、导航状态（`currentFolder`/`currentPath`/`nodeMap`/`setCurrentFolderByPathKey`）、渲染（`renderFolderTree`/`renderBreadcrumb`/`renderFolderView`/`renderLibrarySections`/`createCard`）、搜索（`searchTree`/`renderSearchResults`）、预览（`getPreviewKind`/`renderPdfPreview`/`renderMarkdownPreview`/`renderImagePreview`/`sanitizeResourceUrl`）、工作流、Apps Script。这些高度耦合（索引字段 ↔ 预览检测 ↔ DOM 渲染）。

## 不得删除或覆盖的资源

- `vendor/` 库 + LICENSE + `vendor/README.md` 版本/许可证记录。
- `assets/avatar.png`（除非配置更新）。
- `data/drive-index.json`（除非任务是索引/同步）。
- 工作流（除非调整同步策略）。
- 用户未提交改动。

## 不得引入的架构倒退

- 无 CDN 运行时依赖。
- 无常驻后端。
- 无浏览器直扫 Drive / 读 secret。
- 不绑定特定学科/课程/私有源。
- 不破坏移动端可读性 / 预览对话框布局。
- 不让索引字段单一源特定。

## 验证要求

- 至少 `git diff --check`。
- 按改动范围手动检查（配置/索引/预览/样式/工作流）。
- 未运行构建/测试时须声明。
