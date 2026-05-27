# 项目地图

最近自查日期：2026-05-26

## 顶层目录树

```text
.
├── .github/
│   └── workflows/
│       └── update-drive-index.yml
├── assets/
│   ├── .gitkeep
│   └── avatar.png
├── data/
│   ├── drive-index.json
│   ├── site-config.json
│   └── subject-config.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CURRENT_STATE.md
│   ├── DO_NOT_BREAK.md
│   ├── PROJECT_MAP.md
│   └── TESTING.md
├── vendor/
│   ├── README.md
│   ├── dompurify/
│   ├── markdown-it/
│   ├── pdfjs/
│   └── viewerjs/
├── AGENTS.md
├── MAINTENANCE.md
├── TEMPLATE.md
├── TEMPLATE_PROMPT.md
├── google-apps-script.js
├── index.html
├── readme.md
├── script.js
└── style.css
```

## 关键目录职责

- `.github/workflows/`：GitHub Actions 自动化。当前只有 `update-drive-index.yml`，负责按小时或手动从外部 JSON URL 同步 `data/drive-index.json`，有变更时由 bot 直接提交并 push。
- `assets/`：静态资源。当前包含默认头像 `avatar.png`，由 `data/site-config.json` 的 `avatarUrl` 引用。
- `data/`：前端运行时配置和资料索引缓存。页面通过 `fetch(..., { cache: "no-store" })` 读取这三个 JSON 文件。
- `docs/`：Codex 常驻上下文文档，仅服务后续维护和审计。
- `vendor/`：本地 vendored 前端库。页面运行时不依赖 CDN；许可证和版本记录在 `vendor/README.md`。

## 关键文件清单

- `index.html`：静态页面骨架，包含侧栏、搜索、分类入口、目录树、主内容区、面包屑和预览弹窗容器。
- `style.css`：页面视觉与响应式布局，覆盖玻璃面板、资料集卡片、资料卡片、预览弹窗、Markdown 阅读样式、PDF canvas、Viewer.js 图片预览覆盖样式。
- `script.js`：核心前端逻辑。负责加载配置、归一化资料树、维护运行时状态、渲染目录/面包屑/卡片、搜索、PDF/Markdown/图片预览和 fallback。
- `data/site-config.json`：站点级文案和资源配置，例如品牌、标题、头像、资料源入口、按钮文案、预览失败文案。
- `data/subject-config.json`：学科级配置，例如 `subjectId`、`subjectName`、说明和分类数组。
- `data/drive-index.json`：资料树缓存。当前是模板示例树，包含一个“示例资料”文件夹和 PDF/Markdown 占位文件。
- `google-apps-script.js`：Google Apps Script 示例，用 `DriveApp` 递归导出某个 Drive 文件夹下的 PDF 文件树为 JSON。文件中存在硬编码根文件夹 ID；文档中不要复写该值。
- `.github/workflows/update-drive-index.yml`：从 `DRIVE_INDEX_SOURCE_URL` secret 指向的外部 JSON 下载、格式化并覆盖 `data/drive-index.json`。
- `readme.md`：面向模板使用者的项目说明。
- `MAINTENANCE.md`：模板仓库与具体学科仓库的维护手册。
- `TEMPLATE.md`：模板复用说明。
- `TEMPLATE_PROMPT.md`：用于让 Codex 搭建具体资料站的通用 prompt。

## 入口文件

- 浏览器入口：`index.html`
- 前端脚本入口：`script.js` 文件末尾的 `init()` 调用
- 样式入口：`style.css`
- 索引同步入口：`.github/workflows/update-drive-index.yml`
- Drive 索引脚本入口：`google-apps-script.js` 中的 `doGet()`

## 配置文件

- `data/site-config.json`：站点级配置，字段被 `script.js` 的 `fallbackSiteConfig` 和 `applyConfig()` 使用。
- `data/subject-config.json`：学科配置，字段被 `fallbackSubjectConfig`、`renderCategoryPills()` 和页面品牌区使用。
- `data/drive-index.json`：资料索引，字段被 `normalizeTree()`、`inferNodeKind()`、预览识别和卡片渲染使用。
- `.github/workflows/update-drive-index.yml`：Actions 配置，依赖仓库 secret `DRIVE_INDEX_SOURCE_URL`。

当前未发现 `package.json`、锁文件、构建配置、测试配置或前端框架配置。

## 测试目录

当前未发现独立测试目录、单元测试文件、集成测试文件或 UI 自动化测试文件。

## 资源目录

- `assets/avatar.png`：默认头像资源。
- `vendor/pdfjs/pdf.mjs`、`vendor/pdfjs/pdf.worker.mjs`：PDF.js 运行时和 worker。
- `vendor/markdown-it/markdown-it.js`：Markdown 渲染器，暴露 `window.markdownit`。
- `vendor/dompurify/purify.min.js`：HTML 清洗库，暴露 `window.DOMPurify`。
- `vendor/viewerjs/viewer.min.js`、`vendor/viewerjs/viewer.min.css`：图片预览库，暴露 `window.Viewer`。

## 生成物/缓存目录说明

项目当前未跟踪 `build/`、`dist/`、`node_modules/`、`.venv/` 等构建产物或依赖缓存。扫描和维护时应继续排除：

- `.git/`
- `node_modules/`
- `.gradle/`
- `.idea/`
- `.build/`
- `build/`
- `dist/`
- `DerivedData/`
- `.dart_tool/`
- `.venv/`
- `venv/`
- `__pycache__/`

## 不确定项

- `google-apps-script.js` 目前只导出 PDF 文件；前端已支持 PDF、Markdown、图片预览。具体学科站是否会使用同一个 Apps Script 生成 Markdown/图片索引，当前仓库无法确认。
- 当前没有自动测试或部署配置说明 GitHub Pages 的具体分支/目录设置，需要在仓库托管平台中人工确认。
- `data/drive-index.json` 是模板示例，不代表真实资料源状态。
