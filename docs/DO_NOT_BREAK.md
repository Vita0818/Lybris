# 工程禁区

最近自查日期：2026-05-26

## 不得破坏的用户数据格式

`data/site-config.json`：

- 必须保持合法 JSON。
- 站点品牌、标题、说明、头像、资料源入口、按钮文案和预览 fallback 文案都被 `script.js` 读取。
- 删除字段时要确认 `fallbackSiteConfig` 是否覆盖；新增字段要保持向后兼容。

`data/subject-config.json`：

- 必须保持合法 JSON。
- `categories` 应为数组，分类项至少应能提供 `name` 或 `id`。
- `decorativeChips` 当前不渲染，但属于兼容字段，不要无理由删除其约定。

`data/drive-index.json`：

- 必须保持合法 JSON 树。
- 文件夹节点应包含 `children` 数组。
- 节点 `type` 应尽量使用 `folder` 或 `file`；虽然源码会做推断，但外部索引不应依赖模糊类型。
- 常用字段 `title`、`url`、`category`、`updatedAt` 不应随意重命名。
- 预览相关字段如 `rawUrl`、`downloadUrl`、`exportUrl`、`contentUrl`、`thumbnailUrl`、`previewUrl`、`embedUrl`、`pdfUrl`、`markdownUrl`、`sourceUrl`、`filePath`、`path` 已被前端兼容，不要在未更新前端逻辑前改变含义。

## 不得破坏的文件路径约定

- `index.html` 必须能加载 `style.css`。
- `index.html` 必须按运行时依赖顺序加载：
  - `vendor/markdown-it/markdown-it.js`
  - `vendor/dompurify/purify.min.js`
  - `vendor/viewerjs/viewer.min.js`
  - `script.js`
- `index.html` 必须加载 `vendor/viewerjs/viewer.min.css`，否则图片预览控件样式会失效。
- `script.js` 中的配置路径当前固定为：
  - `data/site-config.json`
  - `data/subject-config.json`
  - `data/drive-index.json`
- PDF.js 模块和 worker 路径当前固定为：
  - `vendor/pdfjs/pdf.mjs`
  - `vendor/pdfjs/pdf.worker.mjs`
- 默认头像路径由 `data/site-config.json` 的 `avatarUrl` 指向 `assets/avatar.png`。
- `.github/workflows/update-drive-index.yml` 默认写入 `data/drive-index.json`。

## 不得破坏的 API / 路由 / 协议 / 存储结构

- `DRIVE_INDEX_SOURCE_URL` 是 GitHub Actions secret 名称，不要改名，除非同步更新仓库 secret 和维护文档。
- 外部索引 URL 必须返回可被 `python -m json.tool` 格式化的 JSON。
- `google-apps-script.js` 的 `doGet()` 是 Apps Script Web App 输出入口；修改输出结构时必须同步前端索引解析逻辑。
- 前端没有路由系统，不要引入需要服务器 rewrite 的路由模式，除非同时明确 GitHub Pages 部署策略。
- 当前没有本地持久化存储。不要引入 cookie、localStorage 或 IndexedDB 来保存敏感资料链接，除非任务明确要求并经过安全设计。

## 不得绕过的安全机制

- Markdown 渲染必须继续禁用原始 HTML 或经过同等强度清洗。
- DOMPurify 清洗不能被移除。
- 外链应保持 `target="_blank"` 与 `rel="noopener noreferrer"`。
- URL 候选必须继续限制为相对 URL 或 `http:`/`https:`，不要允许 `javascript:`、`data:` 等危险协议进入可点击或可预览路径。
- 前端不得读取或暴露 GitHub secret、Apps Script 私有配置、token、证书或账号信息。
- 不要把硬编码 Drive 根文件夹 ID、私有索引 URL 或其他敏感配置复制进维护文档。

## 不得随意重构的核心模块

修改前必须先阅读相关源码：

- 配置加载：`script.js` 的 `fallbackSiteConfig`、`fallbackSubjectConfig`、`loadConfigs()`、`applyConfig()`
- 资料树归一化：`inferNodeKind()`、`safeNode()`、`normalizeTree()`、`buildVisibleRoot()`、`buildRuntimeTree()`
- 导航状态：`currentFolder`、`currentPath`、`nodeMap`、`setCurrentFolderByPathKey()`
- 渲染：`renderFolderTree()`、`renderBreadcrumb()`、`renderFolderView()`、`renderLibrarySections()`、`createCard()`
- 搜索：`searchTree()`、`renderSearchResults()`
- 预览：`getPreviewKind()`、`renderPdfPreview()`、`renderMarkdownPreview()`、`renderImagePreview()`、`sanitizeResourceUrl()`
- 自动同步：`.github/workflows/update-drive-index.yml`
- Drive 示例：`google-apps-script.js`

这些模块互相耦合，尤其是索引字段、预览识别和 DOM 渲染。没有测试覆盖时，不要做大范围重排。

## 不得删除或覆盖的资源

- `vendor/` 下的库文件和 LICENSE 文件。
- `vendor/README.md` 中的版本和许可证记录。
- `assets/avatar.png`，除非同步更新 `data/site-config.json`。
- `data/drive-index.json`，除非本轮任务就是更新资料索引或同步链路。
- `.github/workflows/update-drive-index.yml`，除非明确调整同步策略。
- 用户未提交的业务文件改动。

## 不得引入的架构倒退

- 不要把 vendored 运行时依赖改成必须联网的 CDN。
- 不要把纯静态站改成需要常驻后端服务。
- 不要让浏览器直接扫描 Google Drive 或读取 secret。
- 不要把模板仓库绑定到某一具体学科、课程或私有资料源。
- 不要让样式修改破坏移动端可读性和预览弹窗布局。
- 不要把资料索引字段改成只适配单一外部源而失去通用性。

## 修改前必须阅读的关键源码位置

- `index.html`
- `script.js`
- `style.css`
- `data/site-config.json`
- `data/subject-config.json`
- `data/drive-index.json`
- `.github/workflows/update-drive-index.yml`
- `google-apps-script.js`
- `vendor/README.md`

## 回归验证要求

至少执行：

```bash
git diff --check
```

并根据修改范围做手动验证：

- 配置修改：验证页面标题、品牌、头像、资料源按钮、分类 pills。
- 索引修改：验证目录树、面包屑、搜索、空状态、文件夹和文件卡片。
- 预览修改：分别验证 PDF、Markdown、图片和不可预览 fallback。
- 样式修改：验证桌面宽度、平板宽度、手机宽度下无重叠、按钮可点击、弹窗可关闭。
- Workflow 修改：验证 `DRIVE_INDEX_SOURCE_URL` 缺失和成功下载两种路径的日志表现。

如果没有运行完整构建或测试，最终报告必须明确说明。
