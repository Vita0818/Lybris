# 构建与测试说明

最近自查日期：2026-05-26

## 环境要求

- 现代浏览器，需支持 ES module 动态 `import()`、`fetch()`、Canvas 和标准 DOM API。
- 本地静态服务器。由于页面需要 `fetch` 读取 `data/*.json`，不要直接用 `file://` 打开 `index.html` 作为主要验证方式。
- 可选：Python 3，用于启动本地静态服务器。
- 可选：Node.js，仅用于临时执行 `node --check script.js` 之类语法检查；仓库当前没有 Node 项目配置。
- GitHub Actions 环境用于 `update-drive-index.yml`。
- Google Apps Script 环境用于运行 `google-apps-script.js` 示例。

## 依赖安装方式

当前未发现 `package.json`、锁文件或依赖安装命令。浏览器运行时依赖已 vendored 到 `vendor/`：

- PDF.js
- markdown-it
- DOMPurify
- Viewer.js

因此本仓库本地预览通常不需要安装前端依赖。

## 构建命令

未确认存在构建命令。当前项目是纯静态文件结构，没有发现 `npm run build`、Makefile、Vite、Webpack、Rollup 或其他构建配置。

推荐本地预览命令：

```bash
python3 -m http.server 8000
```

然后打开：

```text
http://localhost:8000/
```

## 单元测试命令

未确认。当前未发现单元测试文件或测试运行器配置。

## 集成测试命令

未确认。当前未发现集成测试脚本。

与外部索引同步相关的手动集成验证在 GitHub Actions 中完成：

- 进入 Actions。
- 运行 `Update Drive Index` workflow。
- 确认 `data/drive-index.json` 被下载、格式化，并且仅在有差异时提交。

本地不要在不了解真实 secret 和外部 URL 的情况下模拟写入 `data/drive-index.json`。

## UI 测试命令

未确认存在自动化 UI 测试。

手动 UI 验证建议：

1. 启动 `python3 -m http.server 8000`。
2. 打开 `http://localhost:8000/`。
3. 确认页面标题、品牌名、学科名、头像和副标题正确。
4. 确认资料源按钮在 `driveFolderUrl` 为空时显示不可用状态。
5. 确认分类 pills 根据 `data/subject-config.json` 渲染。
6. 确认目录树、面包屑、返回按钮和当前文件夹内容能同步切换。
7. 搜索示例资料标题、分类或更新时间，确认结果数量和卡片列表正确。
8. 对 PDF、Markdown、图片样例分别验证预览入口；如果样例 URL 是 `#` 或不可 fetch，应确认 fallback 文案和“打开原文件”入口合理。
9. 在移动宽度下确认侧栏、主内容、卡片和预览弹窗不重叠。

## 静态检查 / lint / format 命令

当前没有配置化 lint 或 format 命令。

可执行的低成本检查：

```bash
git diff --check
```

```bash
python3 -m json.tool data/site-config.json
python3 -m json.tool data/subject-config.json
python3 -m json.tool data/drive-index.json
```

```bash
node --check script.js
```

说明：

- `git diff --check` 可检查尾随空白和补丁格式问题。
- `python3 -m json.tool` 只验证 JSON 语法，不验证业务 schema。
- `node --check script.js` 只验证 JavaScript 语法，不验证浏览器运行时行为。
- 这些命令不是仓库内正式测试脚本；若未来加入正式配置，应以配置文件为准更新本文档。

## 常见失败原因

- 直接用 `file://` 打开页面，导致 `fetch("data/*.json")` 失败。
- `data/*.json` 语法错误或字段类型不符合 `script.js` 预期。
- `vendor/` 文件缺失或路径改变，导致 PDF.js、markdown-it、DOMPurify、Viewer.js 未加载。
- `vendor/pdfjs/pdf.worker.mjs` 路径改变，导致 PDF 渲染失败。
- Google Drive 文件权限或跨域限制导致 PDF/Markdown/图片无法 fetch。
- `DRIVE_INDEX_SOURCE_URL` secret 未配置或外部索引 URL 返回非 JSON。
- Actions 运行分支没有写权限，导致同步后无法 commit/push。
- 图片或 Markdown 使用了不被 `sanitizeResourceUrl()` 接受的协议。

## 本轮是否实际运行了命令

本轮实际运行了项目自查和文档验证命令，包括：

- `pwd`
- `git rev-parse --show-toplevel`
- `git status --short`
- 目录、文件、源码和文档只读扫描命令
- 文档写入后的 `git diff --check`
- 文档写入后的 `git status --short`
- 文档写入后的 `find docs -maxdepth 1 -type f | sort`
- 文档写入后的 `sed -n '1,220p' AGENTS.md`

本轮未运行完整构建或测试。
