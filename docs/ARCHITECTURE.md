# ARCHITECTURE

## 外部依赖优先与禁止功能兜底（Vitemis 强制规则）

本项目继承 `/Users/vita/Vitemis/docs/DEPENDENCY_POLICY.md`。本节是强制约束，不是建议。

- 当用户指定、仓库已经采用，或经许可证、provenance、安全与平台审查可采用的外部依赖提供同等能力时，必须直接集成该依赖的官方 API 或官方扩展点。
- 不得自行重写同等能力，不得新增替代 adapter、shim、compatibility layer、wrapper、proxy、facade、协议翻译层、parallel backend、preview backend、shadow implementation 或“先兜底、以后再换”的实现。
- 本地代码只允许保留官方 API 必需的最薄生命周期、类型、权限、配置和 bundle 接线；不得重新实现、解释、扩展或替代依赖的核心能力。
- exact 依赖因版本、构建、签名、许可证、平台、安全或官方 API 限制无法接入时，必须停止该能力、明确失败、报告 blocker 并请求用户决定；不得静默降级、切换 legacy/另一 provider/backend、使用 cache/mock/简化路径或继续交付不完整替代实现。
- 现有 fallback、adapter 或重复实现不构成先例，后续不得扩展。安全 fail-closed 与明确要求的旧数据解码/迁移不是功能兜底，但必须保持最窄范围，不能演化成备用产品实现。
- 只有用户针对 exact 依赖、exact 范围和退出条件作出的新明文决定才能例外。

最近自查日期：2026-06-25

## 总体架构

Lybris 是纯静态资料站模板。运行时由浏览器加载 `index.html`/`style.css`/`script.js`/`data/*.json`，不需要 Node 服务、数据库或自建后端。

```text
外部源 -> JSON 索引 URL -> GitHub Actions -> data/drive-index.json
  -> 浏览器 fetch -> script.js 归一化树 -> 渲染目录/卡片/搜索/预览
```

## 主要链路

### 初始化链路
```text
init() -> loadConfigs() (并行 site+subject fetch, 失败 fallback)
  -> applyConfig() -> loadTree()
  -> buildVisibleRoot() (包裹外部 root, 用 rootLabel)
  -> buildRuntimeTree() (加 parent/path/pathKey/depth, 填 nodeMap)
  -> render()
```

### 导航与搜索链路
```text
状态: currentFolder/currentPath
切换: setCurrentFolderByPathKey()
pathKey: 由 title 路径派生（重复 title 碰撞风险）
搜索: searchTree() 遍历 title/category/updatedAt（不区分大小写 contains）-> activeSearch
```

### 卡片渲染链路
```text
renderFolderView() -> sortChildren() (文件夹优先, 中文 locale title 排序)
  -> renderLibrarySections() (folder->"资料集"/collection, file->"资料"/resource)
  -> createCard() (badge + 主操作 + 按节点类型/可预览性预览入口)
```

## 数据模型

| 类型 | 职责 | 关键字段 |
|---|---|---|
| site-config | 站点配置 | brandName/siteTitle/subtitle/description/avatarUrl/driveFolderUrl/rootLabel/... |
| subject-config | 学科配置 | subjectId/subjectName/description/categories[]/decorativeChips |
| drive-index node | 索引节点 | title/type(folder|file)/url/category/updatedAt/children + 可选预览字段 |

## 网络/存储/状态

- 无 `localStorage`/`sessionStorage`/IndexedDB/cookies；无框架 store；无前端定时器。
- 唯一后台任务：Actions 工作流。
- fetch 用 `cache: "no-store"`。

## 预览机制

- **PDF**：`getPreviewKind()` 检测；`renderPdfPreview()` 用 PDF.js（worker 固定 `vendor/pdfjs/pdf.worker.mjs`）；Drive 文件 fallback 到 `https://drive.google.com/file/d/<FILE_ID>/preview` iframe。
- **Markdown**：markdown-it（`html:false`/`linkify:true`/`typographer:true`）+ DOMPurify（剥 script/style/iframe/object/embed/form）；链接过 `isSafeDocumentLink()` + `target="_blank"` + `rel="noopener noreferrer"`。
- **图片**：常见图片扩展 + `image/*` MIME；候选 URL 顺序 rawUrl→downloadUrl→exportUrl→contentUrl→thumbnailUrl→url；Viewer.js 打开；失败 fallback 通用预览对话框 + 原始文件链接。

## 安全机制

- 前端永不接触 secret；`DRIVE_INDEX_SOURCE_URL` 仅在 Actions env。
- `sanitizeResourceUrl()` 仅允许 relative 或 `http:`/`https:`（拒 `javascript:`/`data:`）。
- Markdown HTML 净化 + raw HTML 禁用。
- 外链 `target="_blank"` + `rel="noopener noreferrer"`。
- `google-apps-script.js` 硬编码 Drive 根文件夹 ID 不是认证机制，不得重新发布。

## 平台边界

浏览器 / GitHub Actions / Google Apps Script。明确**不是**多平台 app（无 iOS/Android/desktop/backend/CLI）。

## 风险

- `pathKey` 碰撞（重复 title）。
- 无 JSON schema/测试。
- Actions `contents: write` + push 影响分支保护。
- Apps Script 仅同步 PDF（前端支持 PDF/Markdown/图片）。
- `file://` 破坏本地 fetch。
