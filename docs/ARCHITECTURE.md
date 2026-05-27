# 架构说明

最近自查日期：2026-05-26

## 总体架构

Lybris 是一个纯静态资料站模板。运行时由浏览器加载 `index.html`、`style.css`、`script.js` 和 `data/*.json`，不需要 Node 服务、数据库或自建后端。

总体链路：

```text
外部资料源
  -> JSON 索引 URL
  -> GitHub Actions 同步
  -> data/drive-index.json
  -> 浏览器 fetch
  -> script.js 归一化资料树
  -> 目录、卡片、搜索、预览渲染
```

## 模块边界

- 页面结构层：`index.html` 定义 DOM 容器、侧栏、主内容区和预览弹窗。
- 样式层：`style.css` 定义布局、视觉、响应式规则和第三方预览控件覆盖样式。
- 应用逻辑层：`script.js` 直接操作 DOM，不使用前端框架。
- 配置层：`data/site-config.json` 和 `data/subject-config.json` 提供可替换文案、品牌和分类。
- 数据层：`data/drive-index.json` 是前端唯一默认资料索引缓存。
- 外部同步层：`.github/workflows/update-drive-index.yml` 从外部 URL 同步索引；`google-apps-script.js` 是生成 Drive 索引的示例。
- 第三方运行时层：`vendor/` 保存 PDF.js、markdown-it、DOMPurify、Viewer.js 的浏览器构建和许可证。

## 主要数据模型

站点配置来自 `data/site-config.json`，与 `script.js` 中 `fallbackSiteConfig` 合并。关键字段包括：

- `brandName`、`siteTitle`、`subtitle`、`description`
- `avatarUrl`、`avatarAlt`
- `driveFolderUrl`
- `rootLabel`、`openAllLabel`、`searchPlaceholder`
- 各类预览标题、加载文案和失败文案

学科配置来自 `data/subject-config.json`，与 `fallbackSubjectConfig` 合并。关键字段包括：

- `subjectId`
- `subjectName`
- `description`
- `categories[]`，每项包含 `id`、`name`、`description`
- `decorativeChips`，当前极简界面不渲染

资料索引来自 `data/drive-index.json`。前端按树形节点处理：

- `title`：展示名称
- `type`：`folder` 或 `file`，也兼容部分 MIME/type 推断
- `url`：打开原文件或资料源的链接
- `category`：搜索和展示辅助字段
- `updatedAt`：搜索和展示辅助字段
- `children`：文件夹子节点数组
- 可选预览字段：`rawUrl`、`downloadUrl`、`exportUrl`、`contentUrl`、`thumbnailUrl`、`previewUrl`、`embedUrl`、`pdfUrl`、`markdownUrl`、`sourceUrl`、`filePath`、`path`
- 可选类型字段：`mimeType`、`mime`、`contentType`、`sourceType`、`fileType`、`format`、`kind`

## 关键业务链路

### 初始化链路

1. `init()` 调用 `loadConfigs()`。
2. `loadConfigs()` 并发读取 `data/site-config.json` 和 `data/subject-config.json`。
3. 读取失败时使用 `fallbackSiteConfig` 或 `fallbackSubjectConfig`。
4. `applyConfig()` 把配置写入页面标题、meta description、品牌区、搜索 placeholder、预览按钮和分类 pills。
5. `loadTree()` 读取 `data/drive-index.json`。
6. `buildVisibleRoot()` 将外部根节点包装为站点根视图，根标题使用 `rootLabel`。
7. `buildRuntimeTree()` 为每个节点添加 `parent`、`path`、`pathKey`、`depth`，并写入 `nodeMap`。
8. `render()` 渲染目录树、面包屑和当前文件夹内容。

### 导航与搜索链路

- 当前文件夹状态由 `currentFolder` 和 `currentPath` 保存。
- 文件夹树和面包屑通过 `setCurrentFolderByPathKey()` 切换节点。
- `pathKey` 基于标题路径生成；同一父级下重复标题可能导致键冲突，这是当前架构风险。
- 搜索输入写入 `activeSearch`，`searchTree()` 在 `title`、`category`、`updatedAt` 中做大小写不敏感包含匹配。
- 搜索模式下文件夹结果使用进入按钮，文件结果保留打开链接。

### 卡片渲染链路

- `renderFolderView()` 读取当前文件夹 children。
- `sortChildren()` 先排文件夹，再按中文 locale 排标题。
- `renderLibrarySections()` 把 folder 渲染为“资料集”，file 渲染为“资料”。
- `createCard()` 根据节点类型和可预览类型决定 badge、主操作和预览入口。

## 网络、本地存储、状态管理、后台任务

- 网络请求：浏览器端只使用 `fetch()` 读取本仓库相对路径 JSON、PDF/Markdown 候选 URL；图片预览使用图片元素加载候选 URL。
- 本地存储：未发现 `localStorage`、`sessionStorage`、IndexedDB 或 cookie 使用。
- 状态管理：全部是 `script.js` 顶层变量和 DOM 状态，不存在框架 store。
- 后台任务：前端没有后台任务；GitHub Actions 的 `Update Drive Index` 是仓库侧同步任务。
- 定时器：当前前端未使用 `setInterval()` 或 `setTimeout()`。

## 预览机制

PDF：

- `getPreviewKind()` 通过扩展名、MIME、source type 判断 PDF。
- `renderPdfPreview()` 优先使用 PDF.js 渲染 fetchable PDF 候选 URL。
- 对 Google Drive 文件链接，无法直接 fetch 时 fallback 到 `https://drive.google.com/file/d/<FILE_ID>/preview` iframe。
- PDF.js worker 路径固定为 `vendor/pdfjs/pdf.worker.mjs`。

Markdown：

- 通过 markdown-it 渲染，配置 `html: false`、`linkify: true`、`typographer: true`。
- 渲染后使用 DOMPurify 清洗，禁止 `script`、`style`、`iframe`、`object`、`embed`、`form` 等标签。
- 链接会经过 `isSafeDocumentLink()` 过滤，并设置 `target="_blank"` 与 `rel="noopener noreferrer"`。

图片：

- 支持常见图片扩展名和 `image/*` MIME。
- 候选 URL 顺序来自 `rawUrl`、`downloadUrl`、`exportUrl`、`contentUrl`、`thumbnailUrl`、`url`。
- Google Drive 图片会尝试从 URL 提取 file id 并生成可展示候选链接。
- 成功加载后交给 Viewer.js 打开；失败时回退到通用预览弹窗和原文件链接。

## UI 与业务逻辑分层

当前没有组件框架，UI 与业务逻辑集中在 `script.js` 中：

- DOM 查询集中在文件顶部。
- 数据加载、归一化、状态切换、渲染和预览逻辑均为函数式组织。
- `style.css` 只负责视觉和响应式，不包含运行时逻辑。

维护时应避免把数据结构规则散落到样式或 HTML 注释中；数据字段兼容逻辑应集中在 `script.js` 的类型推断、URL 候选和归一化函数附近。

## 平台边界

- 浏览器平台：负责静态页面、资料树展示、搜索和预览。
- GitHub Actions 平台：负责从外部索引 URL 同步 `data/drive-index.json`。
- Google Apps Script 平台：示例性地扫描 Google Drive 文件夹并输出 JSON。

当前不是多端应用，没有 iOS、Android、桌面端、后端服务或 CLI 入口。

## 安全、鉴权、权限、文件访问

- 前端不应接触任何 secret；`DRIVE_INDEX_SOURCE_URL` 只在 GitHub Actions 环境中读取。
- `sanitizeResourceUrl()` 只允许相对 URL 或 `http:`/`https:` URL 进入预览候选。
- Markdown HTML 使用 DOMPurify 清洗，且 markdown-it 禁用原始 HTML。
- 外链均应保持 `rel="noopener noreferrer"`。
- `google-apps-script.js` 示例中存在硬编码 Drive 根文件夹 ID。该值不是前端鉴权机制，维护文档中不要复写具体值；具体学科站应确认是否可公开。

## 当前架构风险或不确定点

- `pathKey` 基于标题路径，重复标题可能覆盖 `nodeMap` 中的节点。
- 没有 JSON schema 或自动测试来约束 `data/drive-index.json`。
- GitHub Actions 对 `contents: write` 并直接 push，适合模板简化链路，但会影响分支保护策略。
- Apps Script 示例只同步 PDF，而前端预览能力已覆盖 PDF、Markdown、图片；真实多类型索引生成方式需要后续确认。
- 打开本地 `index.html` 可能因为浏览器限制无法正常 `fetch` 本地 JSON，应使用静态服务器。
